// Unless explicitly stated otherwise all files in this repository are licensed
// under the Apache License Version 2.0.
// This product includes software developed at Datadog (https://www.datadoghq.com/).
// Copyright 2024-present Datadog, Inc.

/**
 * Secure token storage using OS keychain
 *
 * Uses @napi-rs/keyring to store OAuth tokens in the operating system's
 * secure credential storage:
 * - macOS: Keychain
 * - Windows: Credential Manager
 * - Linux: Secret Service (libsecret)
 */

import { Entry } from '@napi-rs/keyring';
import { OAuthTokens, ITokenStorage } from './types';
import { isTokenExpired } from './oauth-client';

/**
 * Service name for keychain storage
 */
const KEYCHAIN_SERVICE = 'datadog-cli';

/**
 * Prefix for account names in keychain
 */
const ACCOUNT_PREFIX = 'oauth:';

/**
 * Error thrown when keychain operations fail
 */
export class KeychainError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'KeychainError';
  }
}

/**
 * SecureTokenStorage stores OAuth tokens in the OS keychain
 *
 * Tokens are stored as JSON strings with:
 * - Service: "datadog-cli"
 * - Account: "oauth:{site}" (e.g., "oauth:datadoghq.com")
 */
export class SecureTokenStorage implements ITokenStorage {
  private service: string;

  /**
   * Create a new SecureTokenStorage instance
   * @param service Optional custom service name (default: 'datadog-cli')
   */
  constructor(service: string = KEYCHAIN_SERVICE) {
    this.service = service;
  }

  /**
   * Get the storage backend type
   * @returns 'keychain'
   */
  getBackendType(): 'keychain' | 'file' {
    return 'keychain';
  }

  /**
   * Get storage location description
   * @returns Description of keychain storage
   */
  getStorageLocation(): string {
    switch (process.platform) {
      case 'darwin':
        return 'macOS Keychain';
      case 'win32':
        return 'Windows Credential Manager';
      default:
        return 'System Keychain (Secret Service)';
    }
  }

  /**
   * Get the keychain account name for a site
   */
  private getAccountName(site: string): string {
    return `${ACCOUNT_PREFIX}${site}`;
  }

  /**
   * Get or create a keyring entry for a site
   */
  private getEntry(site: string): Entry {
    return new Entry(this.service, this.getAccountName(site));
  }

  /**
   * Save tokens for a specific Datadog site
   * @param site The Datadog site (e.g., 'datadoghq.com')
   * @param tokens The OAuth tokens to save
   */
  saveTokens(site: string, tokens: OAuthTokens): void {
    try {
      const entry = this.getEntry(site);
      const serialized = JSON.stringify(tokens);
      entry.setPassword(serialized);
    } catch (error: any) {
      throw new KeychainError(
        `Failed to save tokens for site "${site}": ${error.message}`,
        'save',
        error
      );
    }
  }

  /**
   * Get tokens for a specific Datadog site
   * @param site The Datadog site (e.g., 'datadoghq.com')
   * @returns The stored tokens, or null if none exist
   */
  getTokens(site: string): OAuthTokens | null {
    try {
      const entry = this.getEntry(site);
      const password = entry.getPassword();

      if (!password) {
        return null;
      }

      return JSON.parse(password) as OAuthTokens;
    } catch (error: any) {
      // Entry not found or invalid JSON - return null
      if (error.message?.includes('No password found') || error instanceof SyntaxError) {
        return null;
      }
      throw new KeychainError(
        `Failed to get tokens for site "${site}": ${error.message}`,
        'get',
        error
      );
    }
  }

  /**
   * Delete tokens for a specific Datadog site
   * @param site The Datadog site (e.g., 'datadoghq.com')
   * @returns Whether tokens were deleted
   */
  deleteTokens(site: string): boolean {
    try {
      const entry = this.getEntry(site);
      // Check if password exists first
      const existing = entry.getPassword();
      if (!existing) {
        return false;
      }
      entry.deletePassword();
      return true;
    } catch (error: any) {
      // If no password found, return false (nothing to delete)
      if (error.message?.includes('No password found')) {
        return false;
      }
      throw new KeychainError(
        `Failed to delete tokens for site "${site}": ${error.message}`,
        'delete',
        error
      );
    }
  }

  /**
   * Delete all stored tokens
   * Note: This deletes tokens for known Datadog sites.
   * Keychain doesn't support listing entries by service, so we try common sites.
   */
  deleteAllTokens(): void {
    // List of known Datadog sites
    const knownSites = [
      'datadoghq.com',
      'us3.datadoghq.com',
      'us5.datadoghq.com',
      'datadoghq.eu',
      'ap1.datadoghq.com',
      'ddog-gov.com',
    ];

    for (const site of knownSites) {
      try {
        this.deleteTokens(site);
      } catch {
        // Ignore errors when deleting individual sites
      }
    }
  }

  /**
   * Check if valid (non-expired) tokens exist for a site
   * @param site The Datadog site (e.g., 'datadoghq.com')
   * @param includeRefreshable If true, consider tokens valid if they can be refreshed
   * @returns Whether valid tokens exist
   */
  hasValidTokens(site: string, includeRefreshable: boolean = true): boolean {
    const tokens = this.getTokens(site);

    if (!tokens) {
      return false;
    }

    // Check if access token is still valid
    if (!isTokenExpired(tokens)) {
      return true;
    }

    // If access token is expired, check if we can refresh
    if (includeRefreshable && tokens.refreshToken) {
      return true;
    }

    return false;
  }

  /**
   * Get all sites with stored tokens
   * Note: Keychain doesn't support listing entries by service.
   * We check known Datadog sites for stored tokens.
   * @returns Array of site names with stored tokens
   */
  listSites(): string[] {
    const knownSites = [
      'datadoghq.com',
      'us3.datadoghq.com',
      'us5.datadoghq.com',
      'datadoghq.eu',
      'ap1.datadoghq.com',
      'ddog-gov.com',
    ];

    const sitesWithTokens: string[] = [];

    for (const site of knownSites) {
      try {
        const tokens = this.getTokens(site);
        if (tokens) {
          sitesWithTokens.push(site);
        }
      } catch {
        // Ignore errors when listing sites
      }
    }

    return sitesWithTokens;
  }

  /**
   * Get token expiration info
   * @param site The Datadog site
   * @returns Object with expiration details, or null if no tokens
   */
  getTokenExpiration(site: string): {
    accessTokenExpiresAt: Date;
    isAccessTokenExpired: boolean;
    expiresInSeconds: number;
  } | null {
    const tokens = this.getTokens(site);

    if (!tokens) {
      return null;
    }

    const expiresAt = tokens.issuedAt + tokens.expiresIn;
    const now = Math.floor(Date.now() / 1000);

    return {
      accessTokenExpiresAt: new Date(expiresAt * 1000),
      isAccessTokenExpired: now >= expiresAt,
      expiresInSeconds: Math.max(0, expiresAt - now),
    };
  }

  /**
   * Check if keychain is available on this system
   * @returns true if keychain operations work
   */
  static isAvailable(): boolean {
    try {
      // Try a simple operation to see if keychain is accessible
      const testEntry = new Entry('datadog-cli-test', 'availability-check');
      // Try to get a non-existent password - should not throw on a working keychain
      testEntry.getPassword();
      return true;
    } catch (error: any) {
      // Check for specific errors that indicate keychain is unavailable
      // vs errors that just mean the entry doesn't exist
      const message = error.message?.toLowerCase() || '';
      if (
        message.includes('no password found') ||
        message.includes('not found') ||
        message.includes('item not found')
      ) {
        // This is expected - keychain is available but entry doesn't exist
        return true;
      }
      // Other errors indicate keychain is not available
      return false;
    }
  }
}

/**
 * Global secure token storage instance
 */
let globalSecureTokenStorage: SecureTokenStorage | null = null;

/**
 * Get the global secure token storage instance
 * @returns The secure token storage instance
 */
export function getSecureTokenStorage(): SecureTokenStorage {
  if (!globalSecureTokenStorage) {
    globalSecureTokenStorage = new SecureTokenStorage();
  }
  return globalSecureTokenStorage;
}

/**
 * Reset the global secure token storage instance (for testing)
 */
export function resetSecureTokenStorage(): void {
  globalSecureTokenStorage = null;
}
