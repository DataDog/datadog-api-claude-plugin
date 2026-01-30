// Unless explicitly stated otherwise all files in this repository are licensed
// under the Apache License Version 2.0.
// This product includes software developed at Datadog (https://www.datadoghq.com/).
// Copyright 2024-present Datadog, Inc.

/**
 * OAuth2 Authentication Module for Datadog API
 *
 * This module provides OAuth2 authentication with PKCE support for the Datadog API.
 * It handles the complete OAuth flow including:
 * - PKCE challenge generation
 * - Authorization URL building
 * - Local callback server for receiving the authorization code
 * - Token exchange, storage, and automatic refresh
 *
 * @example
 * ```typescript
 * import { performLogin, getTokenRefresher } from './lib/auth';
 *
 * // Perform OAuth login
 * const result = await performLogin('datadoghq.com');
 * if (result.success) {
 *   console.log('Logged in successfully');
 * }
 *
 * // Get a valid access token (auto-refreshes if needed)
 * const refresher = getTokenRefresher('datadoghq.com');
 * const token = await refresher.getValidAccessToken();
 * ```
 */

// Export types
export {
  PKCEChallenge,
  OAuthTokens,
  TokenResponse,
  AuthState,
  StoredTokens,
  OAuthConfig,
  LoginResult,
  OAuthEndpoints,
  ITokenStorage,
  DEFAULT_OAUTH_SCOPES,
  DATADOG_CLI_CLIENT_ID,
  DEFAULT_OAUTH_TIMEOUT_MS,
  TOKEN_REFRESH_BUFFER_SECONDS,
} from './types';

// Export OAuth client functions
export {
  generateCodeVerifier,
  generateCodeChallenge,
  generatePKCEChallenge,
  generateState,
  getOAuthEndpoints,
  buildAuthorizationUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  revokeToken,
  isTokenExpired,
} from './oauth-client';

// Export token storage (file-based)
export {
  FileTokenStorage,
  TokenStorage,
  getFileTokenStorage,
  getTokenStorage as getFileTokenStorageAlias,
  resetFileTokenStorage,
  resetTokenStorage,
} from './token-storage';

// Export secure token storage (OS keychain)
export {
  SecureTokenStorage,
  KeychainError,
  getSecureTokenStorage,
  resetSecureTokenStorage,
} from './secure-token-storage';

// Export token storage factory
export {
  getTokenStorage,
  getActiveStorageBackend,
  getStorageDescription,
  isUsingSecureStorage,
  resetAllTokenStorage,
  StorageBackend,
  TokenStorageOptions,
} from './token-storage-factory';

// Export token migration
export {
  migrateTokensToKeychain,
  performMigrationIfNeeded,
  hasLegacyTokenFile,
  getLegacyTokenFilePath,
  MigrationResult,
} from './token-migration';

// Export callback server
export { CallbackServer, CallbackResult, findAvailablePort } from './callback-server';

// Export token refresher
export {
  TokenRefresher,
  getTokenRefresher,
  resetTokenRefreshers,
  RefreshTokenExpiredError,
  NoTokensError,
} from './token-refresher';

// Export auth commands
export { handleAuthCommand, performLogin, performLogout, showAuthStatus } from './commands';
