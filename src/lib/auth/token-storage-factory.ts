// Unless explicitly stated otherwise all files in this repository are licensed
// under the Apache License Version 2.0.
// This product includes software developed at Datadog (https://www.datadoghq.com/).
// Copyright 2024-present Datadog, Inc.

/**
 * Factory for selecting the appropriate token storage backend
 *
 * Selection priority:
 * 1. DD_TOKEN_STORAGE=file → use file storage
 * 2. DD_TOKEN_STORAGE=keychain → use keychain (fail if unavailable)
 * 3. Auto-detect: try keychain, fall back to file with warning
 */

import { ITokenStorage } from './types';
import { getFileTokenStorage, resetFileTokenStorage } from './token-storage';
import {
  SecureTokenStorage,
  getSecureTokenStorage,
  resetSecureTokenStorage,
} from './secure-token-storage';

/**
 * Storage backend types
 */
export type StorageBackend = 'keychain' | 'file';

/**
 * Options for token storage factory
 */
export interface TokenStorageOptions {
  /** Force a specific storage backend */
  forceBackend?: StorageBackend;
  /** Custom storage directory for file backend */
  storageDir?: string;
}

/**
 * Environment variable to override storage backend selection
 */
const STORAGE_ENV_VAR = 'DD_TOKEN_STORAGE';

/**
 * Current active storage backend (cached after first detection)
 */
let activeBackend: StorageBackend | null = null;

/**
 * Cached storage instance
 */
let cachedStorage: ITokenStorage | null = null;

/**
 * Whether a warning has been shown about falling back to file storage
 */
let fallbackWarningShown = false;

/**
 * Detect which storage backend to use based on environment and availability
 */
function detectBackend(): StorageBackend {
  const envSetting = process.env[STORAGE_ENV_VAR]?.toLowerCase();

  // Explicit environment variable setting
  if (envSetting === 'file') {
    return 'file';
  }

  if (envSetting === 'keychain') {
    // User explicitly requested keychain - verify it's available
    if (!SecureTokenStorage.isAvailable()) {
      throw new Error(
        `DD_TOKEN_STORAGE=keychain specified but OS keychain is not available. ` +
          `This may happen in headless environments, CI/CD, or Docker containers. ` +
          `Remove DD_TOKEN_STORAGE or set it to 'file' to use file-based storage.`
      );
    }
    return 'keychain';
  }

  // Auto-detect: try keychain first
  if (SecureTokenStorage.isAvailable()) {
    return 'keychain';
  }

  // Fall back to file storage
  if (!fallbackWarningShown) {
    console.warn(
      'Warning: OS keychain not available, falling back to file-based token storage. ' +
        'Tokens will be stored in ~/.datadog/oauth_tokens.json with file permissions 0600. ' +
        'Set DD_TOKEN_STORAGE=file to suppress this warning.'
    );
    fallbackWarningShown = true;
  }

  return 'file';
}

/**
 * Get a token storage instance
 *
 * @param options Configuration options
 * @returns A token storage instance
 *
 * @example
 * ```typescript
 * // Auto-detect best storage
 * const storage = getTokenStorage();
 *
 * // Force file storage
 * const fileStorage = getTokenStorage({ forceBackend: 'file' });
 *
 * // Force keychain (throws if unavailable)
 * const keychainStorage = getTokenStorage({ forceBackend: 'keychain' });
 * ```
 */
export function getTokenStorage(options?: TokenStorageOptions): ITokenStorage {
  // If forcing a specific backend, create a new instance
  if (options?.forceBackend) {
    if (options.forceBackend === 'keychain') {
      if (!SecureTokenStorage.isAvailable()) {
        throw new Error('OS keychain is not available');
      }
      return getSecureTokenStorage();
    } else {
      return getFileTokenStorage(options.storageDir);
    }
  }

  // If custom storage dir is specified, always use file storage
  if (options?.storageDir) {
    return getFileTokenStorage(options.storageDir);
  }

  // Return cached storage if backend hasn't changed
  if (cachedStorage && activeBackend === detectBackend()) {
    return cachedStorage;
  }

  // Detect and create appropriate storage
  activeBackend = detectBackend();

  if (activeBackend === 'keychain') {
    cachedStorage = getSecureTokenStorage();
  } else {
    cachedStorage = getFileTokenStorage();
  }

  return cachedStorage;
}

/**
 * Get the currently active storage backend
 * @returns The backend type, or null if not yet determined
 */
export function getActiveStorageBackend(): StorageBackend | null {
  return activeBackend;
}

/**
 * Get a human-readable description of the current storage location
 * @returns Description of where tokens are stored
 */
export function getStorageDescription(): string {
  const storage = getTokenStorage();
  const location = storage.getStorageLocation();
  const backend = storage.getBackendType();

  if (backend === 'keychain') {
    return `${location} (secure)`;
  } else {
    return `${location}`;
  }
}

/**
 * Check if secure (keychain) storage is being used
 * @returns true if keychain storage is active
 */
export function isUsingSecureStorage(): boolean {
  return getTokenStorage().getBackendType() === 'keychain';
}

/**
 * Reset all global storage instances (for testing)
 */
export function resetAllTokenStorage(): void {
  resetFileTokenStorage();
  resetSecureTokenStorage();
  activeBackend = null;
  cachedStorage = null;
  fallbackWarningShown = false;
}
