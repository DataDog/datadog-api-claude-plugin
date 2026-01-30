// Unless explicitly stated otherwise all files in this repository are licensed
// under the Apache License Version 2.0.
// This product includes software developed at Datadog (https://www.datadoghq.com/).
// Copyright 2024-present Datadog, Inc.

/**
 * Automatic token refresh management
 */

import { OAuthTokens, ITokenStorage, TOKEN_REFRESH_BUFFER_SECONDS, DATADOG_CLI_CLIENT_ID } from './types';
import { isTokenExpired, refreshAccessToken } from './oauth-client';
import { getTokenStorage } from './token-storage-factory';

/**
 * Error thrown when refresh token is expired and re-authentication is required
 */
export class RefreshTokenExpiredError extends Error {
  constructor() {
    super('Refresh token has expired. Please run "dd-plugin auth login" to re-authenticate.');
    this.name = 'RefreshTokenExpiredError';
  }
}

/**
 * Error thrown when no tokens are available
 */
export class NoTokensError extends Error {
  constructor(site: string) {
    super(`No OAuth tokens found for site "${site}". Please run "dd-plugin auth login" to authenticate.`);
    this.name = 'NoTokensError';
  }
}

/**
 * TokenRefresher manages automatic token refresh with deduplication
 */
export class TokenRefresher {
  private storage: ITokenStorage;
  private site: string;
  private clientId: string;
  private refreshPromise: Promise<OAuthTokens> | null = null;
  private bufferSeconds: number;

  /**
   * Create a new TokenRefresher
   * @param site The Datadog site
   * @param clientId The OAuth client ID
   * @param storage Optional custom token storage
   * @param bufferSeconds Seconds before expiration to refresh (default: 300)
   */
  constructor(
    site: string,
    clientId: string = DATADOG_CLI_CLIENT_ID,
    storage?: ITokenStorage,
    bufferSeconds: number = TOKEN_REFRESH_BUFFER_SECONDS
  ) {
    this.site = site;
    this.clientId = clientId;
    this.storage = storage || getTokenStorage();
    this.bufferSeconds = bufferSeconds;
  }

  /**
   * Get a valid access token, refreshing if necessary
   * @returns A valid access token
   * @throws {NoTokensError} If no tokens are stored
   * @throws {RefreshTokenExpiredError} If refresh token is expired
   */
  async getValidAccessToken(): Promise<string> {
    const tokens = this.storage.getTokens(this.site);

    if (!tokens) {
      throw new NoTokensError(this.site);
    }

    // If access token is still valid, return it
    if (!isTokenExpired(tokens, this.bufferSeconds)) {
      return tokens.accessToken;
    }

    // Access token is expired or will expire soon, need to refresh
    return this.refreshAndGetToken();
  }

  /**
   * Get current tokens without refreshing
   * @returns The current tokens, or null if none exist
   */
  getCurrentTokens(): OAuthTokens | null {
    return this.storage.getTokens(this.site);
  }

  /**
   * Force a token refresh
   * @returns The new tokens
   * @throws {NoTokensError} If no tokens are stored
   * @throws {RefreshTokenExpiredError} If refresh token is expired
   */
  async forceRefresh(): Promise<OAuthTokens> {
    const tokens = this.storage.getTokens(this.site);

    if (!tokens) {
      throw new NoTokensError(this.site);
    }

    return this.performRefresh(tokens.refreshToken);
  }

  /**
   * Refresh tokens and return the new access token
   * Uses deduplication to prevent concurrent refresh requests
   */
  private async refreshAndGetToken(): Promise<string> {
    const tokens = this.storage.getTokens(this.site);

    if (!tokens) {
      throw new NoTokensError(this.site);
    }

    // Deduplicate concurrent refresh requests
    if (this.refreshPromise) {
      const newTokens = await this.refreshPromise;
      return newTokens.accessToken;
    }

    try {
      this.refreshPromise = this.performRefresh(tokens.refreshToken);
      const newTokens = await this.refreshPromise;
      return newTokens.accessToken;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual token refresh
   */
  private async performRefresh(refreshToken: string): Promise<OAuthTokens> {
    try {
      const newTokens = await refreshAccessToken(this.site, refreshToken, this.clientId);

      // Save the new tokens
      this.storage.saveTokens(this.site, newTokens);

      return newTokens;
    } catch (error: any) {
      // Check if this is an expired refresh token error
      if (
        error.statusCode === 400 ||
        error.statusCode === 401 ||
        error.message?.includes('invalid_grant') ||
        error.response?.error === 'invalid_grant'
      ) {
        throw new RefreshTokenExpiredError();
      }

      throw error;
    }
  }

  /**
   * Check if tokens need refresh
   * @returns Whether the access token is expired or will expire soon
   */
  needsRefresh(): boolean {
    const tokens = this.storage.getTokens(this.site);

    if (!tokens) {
      return false; // No tokens to refresh
    }

    return isTokenExpired(tokens, this.bufferSeconds);
  }

  /**
   * Check if we have any tokens (even if expired)
   * @returns Whether tokens exist
   */
  hasTokens(): boolean {
    return this.storage.getTokens(this.site) !== null;
  }

  /**
   * Get token status for display
   */
  getStatus(): {
    hasTokens: boolean;
    needsRefresh: boolean;
    expiresAt?: Date;
    expiresInSeconds?: number;
  } {
    const tokens = this.storage.getTokens(this.site);

    if (!tokens) {
      return { hasTokens: false, needsRefresh: false };
    }

    // Calculate expiration info from tokens directly
    const expiresAt = tokens.issuedAt + tokens.expiresIn;
    const now = Math.floor(Date.now() / 1000);

    return {
      hasTokens: true,
      needsRefresh: isTokenExpired(tokens, this.bufferSeconds),
      expiresAt: new Date(expiresAt * 1000),
      expiresInSeconds: Math.max(0, expiresAt - now),
    };
  }
}

/**
 * Global token refresher instances, keyed by site
 */
const globalRefreshers: Map<string, TokenRefresher> = new Map();

/**
 * Get a TokenRefresher for a specific site
 * @param site The Datadog site
 * @param clientId The OAuth client ID
 * @returns The TokenRefresher instance
 */
export function getTokenRefresher(
  site: string,
  clientId: string = DATADOG_CLI_CLIENT_ID
): TokenRefresher {
  const key = `${site}:${clientId}`;

  if (!globalRefreshers.has(key)) {
    globalRefreshers.set(key, new TokenRefresher(site, clientId));
  }

  return globalRefreshers.get(key)!;
}

/**
 * Reset all global token refreshers (for testing)
 */
export function resetTokenRefreshers(): void {
  globalRefreshers.clear();
}
