// Unless explicitly stated otherwise all files in this repository are licensed
// under the Apache License Version 2.0.
// This product includes software developed at Datadog (https://www.datadoghq.com/).
// Copyright 2024-present Datadog, Inc.

/**
 * CLI command handlers for OAuth authentication
 */

import { exec } from 'child_process';
import {
  OAuthConfig,
  LoginResult,
  DEFAULT_OAUTH_SCOPES,
  DATADOG_CLI_CLIENT_ID,
  DEFAULT_OAUTH_TIMEOUT_MS,
} from './types';
import {
  generatePKCEChallenge,
  generateState,
  buildAuthorizationUrl,
  exchangeCodeForTokens,
  revokeToken,
} from './oauth-client';
import { getTokenStorage, getStorageDescription, isUsingSecureStorage } from './token-storage-factory';
import { CallbackServer } from './callback-server';
import { getTokenRefresher, RefreshTokenExpiredError, NoTokensError } from './token-refresher';
import { performMigrationIfNeeded } from './token-migration';

/**
 * Open a URL in the default browser
 * @param url The URL to open
 * @returns Whether the browser was opened successfully
 */
function openBrowser(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    let command: string;

    switch (process.platform) {
      case 'darwin':
        command = `open "${url}"`;
        break;
      case 'win32':
        command = `start "" "${url}"`;
        break;
      default:
        // Linux and others
        command = `xdg-open "${url}"`;
        break;
    }

    exec(command, (error) => {
      resolve(!error);
    });
  });
}

/**
 * Perform the OAuth login flow
 * @param site The Datadog site to authenticate against
 * @param clientId The OAuth client ID
 * @param scopes The OAuth scopes to request
 * @param timeoutMs Timeout for the OAuth flow
 * @returns The login result
 */
export async function performLogin(
  site: string,
  clientId: string = DATADOG_CLI_CLIENT_ID,
  scopes: string[] = [...DEFAULT_OAUTH_SCOPES],
  timeoutMs: number = DEFAULT_OAUTH_TIMEOUT_MS
): Promise<LoginResult> {
  // Attempt to migrate legacy tokens to keychain before login
  const migrationMessage = performMigrationIfNeeded();
  if (migrationMessage) {
    console.log(migrationMessage);
    console.log();
  }

  const storage = getTokenStorage();
  const callbackServer = new CallbackServer('/oauth/callback', timeoutMs);

  try {
    // Generate PKCE challenge and state
    const pkce = generatePKCEChallenge();
    const state = generateState();

    // Start the callback server
    console.log('Starting local authentication server...');
    await callbackServer.start(state);
    const redirectUri = callbackServer.getRedirectUri();

    // Build the authorization URL
    const config: OAuthConfig = {
      site,
      clientId,
      scopes,
      timeoutMs,
    };
    const authUrl = buildAuthorizationUrl(config, pkce, state, redirectUri);

    // Try to open browser
    console.log('\nOpening browser for authentication...');
    const browserOpened = await openBrowser(authUrl);

    if (!browserOpened) {
      console.log('\nCould not open browser automatically.');
      console.log('Please open the following URL in your browser:\n');
      console.log(authUrl);
      console.log();
    }

    console.log('Waiting for authorization...');

    // Wait for the callback
    const callbackResult = await callbackServer.waitForCallback();

    // Check for errors
    if (callbackResult.error) {
      return {
        success: false,
        error: callbackResult.errorDescription || callbackResult.error,
      };
    }

    if (!callbackResult.code) {
      return {
        success: false,
        error: 'No authorization code received',
      };
    }

    // Exchange the code for tokens
    console.log('Exchanging authorization code for tokens...');
    const tokens = await exchangeCodeForTokens(
      site,
      callbackResult.code,
      pkce.codeVerifier,
      redirectUri,
      clientId
    );

    // Store the tokens
    storage.saveTokens(site, tokens);

    return {
      success: true,
      tokens,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error during login',
    };
  } finally {
    callbackServer.stop();
  }
}

/**
 * Perform logout by revoking tokens and deleting storage
 * @param site The Datadog site
 * @param clientId The OAuth client ID
 * @returns Whether logout was successful
 */
export async function performLogout(
  site: string,
  clientId: string = DATADOG_CLI_CLIENT_ID
): Promise<boolean> {
  const storage = getTokenStorage();
  const tokens = storage.getTokens(site);

  if (!tokens) {
    console.log(`No tokens found for site "${site}".`);
    return true;
  }

  // Try to revoke tokens (best effort)
  console.log('Revoking tokens...');
  try {
    // Revoke refresh token first (more important)
    if (tokens.refreshToken) {
      await revokeToken(site, tokens.refreshToken, 'refresh_token', clientId);
    }
    // Then revoke access token
    if (tokens.accessToken) {
      await revokeToken(site, tokens.accessToken, 'access_token', clientId);
    }
  } catch {
    // Revocation is best effort - continue even if it fails
    console.log('Note: Token revocation may not have completed, but local tokens will be deleted.');
  }

  // Delete local tokens
  storage.deleteTokens(site);
  console.log('Local tokens deleted.');

  return true;
}

/**
 * Show authentication status
 * @param site The Datadog site
 */
export async function showAuthStatus(site: string): Promise<void> {
  const storage = getTokenStorage();
  const tokens = storage.getTokens(site);

  console.log(`\nAuthentication Status for ${site}`);
  console.log('─'.repeat(40));

  if (!tokens) {
    console.log('Status: Not authenticated');
    console.log('\nRun "dd-plugin auth login" to authenticate with OAuth.');
    return;
  }

  const refresher = getTokenRefresher(site);
  const status = refresher.getStatus();

  console.log('Status: Authenticated (OAuth)');
  console.log(`Token storage: ${getStorageDescription()}`);
  if (isUsingSecureStorage()) {
    console.log('Security: Tokens encrypted via OS keychain');
  }

  if (status.expiresAt) {
    const now = new Date();
    const expiresAt = status.expiresAt;

    if (expiresAt > now) {
      const diffSeconds = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);

      let expiresIn: string;
      if (diffHours > 0) {
        expiresIn = `${diffHours}h ${diffMinutes % 60}m`;
      } else if (diffMinutes > 0) {
        expiresIn = `${diffMinutes}m ${diffSeconds % 60}s`;
      } else {
        expiresIn = `${diffSeconds}s`;
      }

      console.log(`Access token expires: ${expiresAt.toLocaleString()} (in ${expiresIn})`);
    } else {
      console.log(`Access token: Expired (will auto-refresh on next use)`);
    }
  }

  if (tokens.scope) {
    console.log(`Scopes: ${tokens.scope.split(' ').length} scopes granted`);
  }
}

/**
 * Force refresh the access token
 * @param site The Datadog site
 * @param clientId The OAuth client ID
 * @returns Whether refresh was successful
 */
export async function forceRefreshToken(
  site: string,
  clientId: string = DATADOG_CLI_CLIENT_ID
): Promise<boolean> {
  const refresher = getTokenRefresher(site, clientId);

  try {
    console.log('Refreshing access token...');
    const newTokens = await refresher.forceRefresh();
    console.log('Token refreshed successfully.');

    // Show new expiration
    const expiresAt = new Date((newTokens.issuedAt + newTokens.expiresIn) * 1000);
    console.log(`New token expires: ${expiresAt.toLocaleString()}`);

    return true;
  } catch (error: any) {
    if (error instanceof RefreshTokenExpiredError) {
      console.error('Refresh token has expired. Please run "dd-plugin auth login" to re-authenticate.');
    } else if (error instanceof NoTokensError) {
      console.error('No tokens found. Please run "dd-plugin auth login" to authenticate.');
    } else {
      console.error(`Token refresh failed: ${error.message}`);
    }
    return false;
  }
}

/**
 * Print auth help
 */
function printAuthHelp(): void {
  console.log(`
OAuth Authentication Commands:

  dd-plugin auth login      Start OAuth login flow (opens browser)
  dd-plugin auth logout     Revoke tokens and delete local storage
  dd-plugin auth status     Show current authentication status
  dd-plugin auth refresh    Force refresh the access token
  dd-plugin auth help       Show this help message

Environment Variables:
  DD_SITE                   Datadog site (default: datadoghq.com)
  DD_USE_OAUTH              Set to "true" to prefer OAuth over API keys
  DD_TOKEN_STORAGE          Token storage backend: 'keychain' or 'file'
                            Default: auto-detect (prefers OS keychain)

Token Storage:
  By default, OAuth tokens are stored in your OS keychain (macOS Keychain,
  Windows Credential Manager, or Linux Secret Service). This provides
  hardware-backed encryption on supported systems.

  If the OS keychain is unavailable (e.g., in CI/CD or Docker), tokens
  fall back to file storage at ~/.datadog/oauth_tokens.json with 0600
  permissions.

  Set DD_TOKEN_STORAGE=file to force file-based storage.

Examples:
  dd-plugin auth login
  DD_SITE=datadoghq.eu dd-plugin auth login
  DD_TOKEN_STORAGE=file dd-plugin auth login
  dd-plugin auth status
  dd-plugin auth logout
`);
}

/**
 * Handle the auth CLI command
 * @param subcommand The auth subcommand
 * @param args Additional arguments
 */
export async function handleAuthCommand(
  subcommand: string | undefined,
  _args: string[]
): Promise<void> {
  const site = process.env.DD_SITE || 'datadoghq.com';

  switch (subcommand) {
    case 'login':
      console.log(`\nLogging in to Datadog (${site})...\n`);
      const loginResult = await performLogin(site);

      if (loginResult.success) {
        console.log('\n✓ Login successful!');
        console.log('\nYou can now use the Datadog API without API keys.');
        console.log('Run "dd-plugin auth status" to see your authentication status.');
      } else {
        console.error(`\n✗ Login failed: ${loginResult.error}`);
        process.exit(1);
      }
      break;

    case 'logout':
      console.log(`\nLogging out from Datadog (${site})...\n`);
      const logoutSuccess = await performLogout(site);

      if (logoutSuccess) {
        console.log('\n✓ Logout successful!');
      } else {
        console.error('\n✗ Logout failed');
        process.exit(1);
      }
      break;

    case 'status':
      await showAuthStatus(site);
      break;

    case 'refresh':
      const refreshSuccess = await forceRefreshToken(site);
      if (!refreshSuccess) {
        process.exit(1);
      }
      break;

    case 'help':
    case undefined:
      printAuthHelp();
      break;

    default:
      console.error(`Unknown auth subcommand: ${subcommand}`);
      printAuthHelp();
      process.exit(1);
  }
}
