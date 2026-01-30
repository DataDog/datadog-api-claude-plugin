// Unless explicitly stated otherwise all files in this repository are licensed
// under the Apache License Version 2.0.
// This product includes software developed at Datadog (https://www.datadoghq.com/).
// Copyright 2024-present Datadog, Inc.

/**
 * Token migration from legacy file storage to secure keychain storage
 *
 * Migrates OAuth tokens from ~/.datadog/oauth_tokens.json to the OS keychain
 * on first run with the new version.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { OAuthTokens } from './types';
import { SecureTokenStorage } from './secure-token-storage';

/**
 * Default storage directory for Datadog credentials
 */
const DEFAULT_STORAGE_DIR = path.join(os.homedir(), '.datadog');

/**
 * Legacy token file name
 */
const LEGACY_TOKEN_FILE = 'oauth_tokens.json';

/**
 * Migration result
 */
export interface MigrationResult {
  /** Whether migration was attempted */
  attempted: boolean;
  /** Whether migration succeeded */
  success: boolean;
  /** Number of sites migrated */
  sitesMigrated: number;
  /** Sites that were migrated */
  sites: string[];
  /** Error message if migration failed */
  error?: string;
  /** Whether legacy file was deleted */
  legacyFileDeleted: boolean;
}

/**
 * Check if legacy token file exists
 * @param storageDir Optional custom storage directory
 * @returns true if legacy file exists
 */
export function hasLegacyTokenFile(storageDir?: string): boolean {
  const dir = storageDir || DEFAULT_STORAGE_DIR;
  const legacyPath = path.join(dir, LEGACY_TOKEN_FILE);
  return fs.existsSync(legacyPath);
}

/**
 * Get the path to the legacy token file
 * @param storageDir Optional custom storage directory
 * @returns Path to the legacy token file
 */
export function getLegacyTokenFilePath(storageDir?: string): string {
  const dir = storageDir || DEFAULT_STORAGE_DIR;
  return path.join(dir, LEGACY_TOKEN_FILE);
}

/**
 * Read tokens from legacy file storage
 * @param storageDir Optional custom storage directory
 * @returns Map of site to tokens, or null if file doesn't exist or is invalid
 */
function readLegacyTokens(storageDir?: string): Record<string, OAuthTokens> | null {
  const legacyPath = getLegacyTokenFilePath(storageDir);

  if (!fs.existsSync(legacyPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(legacyPath, 'utf-8');
    return JSON.parse(content) as Record<string, OAuthTokens>;
  } catch {
    // File exists but is corrupted or unreadable
    return null;
  }
}

/**
 * Delete the legacy token file
 * @param storageDir Optional custom storage directory
 * @returns true if file was deleted
 */
function deleteLegacyTokenFile(storageDir?: string): boolean {
  const legacyPath = getLegacyTokenFilePath(storageDir);

  if (!fs.existsSync(legacyPath)) {
    return false;
  }

  try {
    fs.unlinkSync(legacyPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Migrate tokens from legacy file storage to secure keychain storage
 *
 * This function:
 * 1. Checks if legacy file storage exists
 * 2. Reads all tokens from the legacy file
 * 3. Saves each token to the secure keychain
 * 4. Verifies the migration succeeded
 * 5. Deletes the legacy file
 *
 * @param options Migration options
 * @returns Migration result
 */
export function migrateTokensToKeychain(options?: {
  storageDir?: string;
  dryRun?: boolean;
  verbose?: boolean;
}): MigrationResult {
  const { storageDir, dryRun = false, verbose = false } = options || {};

  // Check if keychain is available
  if (!SecureTokenStorage.isAvailable()) {
    return {
      attempted: false,
      success: false,
      sitesMigrated: 0,
      sites: [],
      error: 'OS keychain is not available',
      legacyFileDeleted: false,
    };
  }

  // Check if legacy file exists
  if (!hasLegacyTokenFile(storageDir)) {
    return {
      attempted: false,
      success: true,
      sitesMigrated: 0,
      sites: [],
      legacyFileDeleted: false,
    };
  }

  // Read legacy tokens
  const legacyTokens = readLegacyTokens(storageDir);

  if (!legacyTokens || Object.keys(legacyTokens).length === 0) {
    return {
      attempted: true,
      success: true,
      sitesMigrated: 0,
      sites: [],
      legacyFileDeleted: false,
    };
  }

  const sites = Object.keys(legacyTokens);

  if (verbose) {
    console.log(`Found ${sites.length} site(s) with tokens to migrate: ${sites.join(', ')}`);
  }

  if (dryRun) {
    return {
      attempted: false,
      success: true,
      sitesMigrated: sites.length,
      sites,
      legacyFileDeleted: false,
    };
  }

  // Migrate each site's tokens to keychain
  const secureStorage = new SecureTokenStorage();
  const migratedSites: string[] = [];
  const errors: string[] = [];

  for (const site of sites) {
    try {
      const tokens = legacyTokens[site];
      secureStorage.saveTokens(site, tokens);

      // Verify migration succeeded
      const retrieved = secureStorage.getTokens(site);
      if (retrieved && retrieved.accessToken === tokens.accessToken) {
        migratedSites.push(site);
        if (verbose) {
          console.log(`  Migrated tokens for ${site}`);
        }
      } else {
        errors.push(`Verification failed for ${site}`);
      }
    } catch (error: any) {
      errors.push(`Failed to migrate ${site}: ${error.message}`);
    }
  }

  // Only delete legacy file if all sites migrated successfully
  let legacyFileDeleted = false;
  if (migratedSites.length === sites.length && errors.length === 0) {
    legacyFileDeleted = deleteLegacyTokenFile(storageDir);
    if (verbose && legacyFileDeleted) {
      console.log('  Deleted legacy token file');
    }
  }

  return {
    attempted: true,
    success: migratedSites.length === sites.length && errors.length === 0,
    sitesMigrated: migratedSites.length,
    sites: migratedSites,
    error: errors.length > 0 ? errors.join('; ') : undefined,
    legacyFileDeleted,
  };
}

/**
 * Perform migration if needed and return a user-friendly message
 * @param options Migration options
 * @returns Message to display to user, or null if no migration needed
 */
export function performMigrationIfNeeded(options?: {
  storageDir?: string;
  silent?: boolean;
}): string | null {
  const { storageDir, silent = false } = options || {};

  // Check if keychain is available and legacy file exists
  if (!SecureTokenStorage.isAvailable() || !hasLegacyTokenFile(storageDir)) {
    return null;
  }

  const result = migrateTokensToKeychain({ storageDir, verbose: !silent });

  if (!result.attempted) {
    return null;
  }

  if (result.success && result.sitesMigrated > 0) {
    const storage = new SecureTokenStorage();
    return (
      `Migrated ${result.sitesMigrated} OAuth token(s) to ${storage.getStorageLocation()}. ` +
      `Your tokens are now stored securely in the OS keychain.`
    );
  }

  if (result.error) {
    return (
      `Warning: Failed to migrate some tokens to keychain: ${result.error}. ` +
      `Tokens will continue to be stored in the legacy file.`
    );
  }

  return null;
}
