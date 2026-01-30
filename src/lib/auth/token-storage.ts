// Unless explicitly stated otherwise all files in this repository are licensed
// under the Apache License Version 2.0.
// This product includes software developed at Datadog (https://www.datadoghq.com/).
// Copyright 2024-present Datadog, Inc.

/**
 * Secure token storage for OAuth tokens
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { OAuthTokens, StoredTokens, ITokenStorage } from './types';
import { isTokenExpired } from './oauth-client';

/**
 * Default storage directory for Datadog credentials
 */
const DEFAULT_STORAGE_DIR = path.join(os.homedir(), '.datadog');

/**
 * Default token file name
 */
const TOKEN_FILE_NAME = 'oauth_tokens.json';

/**
 * File permissions for secure token storage (owner read/write only)
 */
const SECURE_FILE_MODE = 0o600;

/**
 * Directory permissions for secure storage (owner only)
 */
const SECURE_DIR_MODE = 0o700;

/**
 * FileTokenStorage provides file-based persistence for OAuth tokens
 * Tokens are stored as JSON in ~/.datadog/oauth_tokens.json with 0600 permissions
 */
export class FileTokenStorage implements ITokenStorage {
  private storageDir: string;
  private tokenFilePath: string;

  /**
   * Create a new FileTokenStorage instance
   * @param storageDir Custom storage directory (default: ~/.datadog)
   */
  constructor(storageDir?: string) {
    this.storageDir = storageDir || DEFAULT_STORAGE_DIR;
    this.tokenFilePath = path.join(this.storageDir, TOKEN_FILE_NAME);
  }

  /**
   * Get the storage backend type
   * @returns 'file'
   */
  getBackendType(): 'keychain' | 'file' {
    return 'file';
  }

  /**
   * Get storage location description
   * @returns The path to the token storage file
   */
  getStorageLocation(): string {
    return this.tokenFilePath;
  }

  /**
   * Ensure the storage directory exists with secure permissions
   */
  private ensureStorageDir(): void {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true, mode: SECURE_DIR_MODE });
    } else {
      // Ensure directory has correct permissions
      try {
        fs.chmodSync(this.storageDir, SECURE_DIR_MODE);
      } catch {
        // May fail on some systems, continue anyway
      }
    }
  }

  /**
   * Read all stored tokens
   * @returns All stored tokens, keyed by site
   */
  private readAllTokens(): StoredTokens {
    try {
      if (!fs.existsSync(this.tokenFilePath)) {
        return {};
      }

      const content = fs.readFileSync(this.tokenFilePath, 'utf-8');
      return JSON.parse(content) as StoredTokens;
    } catch {
      // If file is corrupted or unreadable, return empty
      return {};
    }
  }

  /**
   * Write all tokens to storage
   * @param tokens The tokens to store
   */
  private writeAllTokens(tokens: StoredTokens): void {
    this.ensureStorageDir();

    const content = JSON.stringify(tokens, null, 2);
    fs.writeFileSync(this.tokenFilePath, content, { mode: SECURE_FILE_MODE });

    // Ensure file permissions are correct (writeFile mode doesn't work on existing files)
    try {
      fs.chmodSync(this.tokenFilePath, SECURE_FILE_MODE);
    } catch {
      // May fail on some systems, continue anyway
    }
  }

  /**
   * Save tokens for a specific Datadog site
   * @param site The Datadog site (e.g., 'datadoghq.com')
   * @param tokens The OAuth tokens to save
   */
  saveTokens(site: string, tokens: OAuthTokens): void {
    const allTokens = this.readAllTokens();
    allTokens[site] = tokens;
    this.writeAllTokens(allTokens);
  }

  /**
   * Get tokens for a specific Datadog site
   * @param site The Datadog site (e.g., 'datadoghq.com')
   * @returns The stored tokens, or null if none exist
   */
  getTokens(site: string): OAuthTokens | null {
    const allTokens = this.readAllTokens();
    return allTokens[site] || null;
  }

  /**
   * Delete tokens for a specific Datadog site
   * @param site The Datadog site (e.g., 'datadoghq.com')
   * @returns Whether tokens were deleted
   */
  deleteTokens(site: string): boolean {
    const allTokens = this.readAllTokens();

    if (!allTokens[site]) {
      return false;
    }

    delete allTokens[site];
    this.writeAllTokens(allTokens);
    return true;
  }

  /**
   * Delete all stored tokens
   */
  deleteAllTokens(): void {
    if (fs.existsSync(this.tokenFilePath)) {
      fs.unlinkSync(this.tokenFilePath);
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
      // Refresh tokens typically last 90 days
      // We consider them valid if they exist (the refresh will fail if truly expired)
      return true;
    }

    return false;
  }

  /**
   * Get all sites with stored tokens
   * @returns Array of site names
   */
  listSites(): string[] {
    const allTokens = this.readAllTokens();
    return Object.keys(allTokens);
  }

  /**
   * Get storage file path (for display/debugging)
   * @returns The path to the token storage file
   */
  getStoragePath(): string {
    return this.tokenFilePath;
  }

  /**
   * Check if the storage file exists
   * @returns Whether the storage file exists
   */
  exists(): boolean {
    return fs.existsSync(this.tokenFilePath);
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
}

/**
 * Global file token storage instance
 */
let globalFileTokenStorage: FileTokenStorage | null = null;

/**
 * Get the global file token storage instance
 * @param storageDir Optional custom storage directory
 * @returns The file token storage instance
 */
export function getFileTokenStorage(storageDir?: string): FileTokenStorage {
  if (!globalFileTokenStorage || storageDir) {
    globalFileTokenStorage = new FileTokenStorage(storageDir);
  }
  return globalFileTokenStorage;
}

/**
 * Reset the global file token storage instance (for testing)
 */
export function resetFileTokenStorage(): void {
  globalFileTokenStorage = null;
}

// Legacy aliases for backward compatibility
export { FileTokenStorage as TokenStorage };
export const getTokenStorage = getFileTokenStorage;
export const resetTokenStorage = resetFileTokenStorage;
