// Unless explicitly stated otherwise all files in this repository are licensed
// under the Apache License Version 2.0.
// This product includes software developed at Datadog (https://www.datadoghq.com/).
// Copyright 2024-present Datadog, Inc.

/**
 * Unit tests for token storage factory
 */

// Store mock state outside the mock
let mockIsAvailable = true;
const mockSecureStorage = {
  getBackendType: () => 'keychain' as const,
  getStorageLocation: () => 'macOS Keychain',
  saveTokens: jest.fn(),
  getTokens: jest.fn(),
  deleteTokens: jest.fn(),
  deleteAllTokens: jest.fn(),
  hasValidTokens: jest.fn(),
  listSites: jest.fn(),
};

// Mock SecureTokenStorage before imports
jest.mock('../../../src/lib/auth/secure-token-storage', () => ({
  SecureTokenStorage: {
    isAvailable: () => mockIsAvailable,
  },
  getSecureTokenStorage: () => mockSecureStorage,
  resetSecureTokenStorage: jest.fn(),
}));

import {
  getTokenStorage,
  getActiveStorageBackend,
  getStorageDescription,
  isUsingSecureStorage,
  resetAllTokenStorage,
} from '../../../src/lib/auth/token-storage-factory';
import { FileTokenStorage } from '../../../src/lib/auth/token-storage';

describe('TokenStorageFactory', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.DD_TOKEN_STORAGE;
    mockIsAvailable = true;
    resetAllTokenStorage();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getTokenStorage()', () => {
    it('should return keychain storage when available and no env override', () => {
      mockIsAvailable = true;

      const storage = getTokenStorage();

      expect(storage.getBackendType()).toBe('keychain');
    });

    it('should return file storage when DD_TOKEN_STORAGE=file', () => {
      process.env.DD_TOKEN_STORAGE = 'file';
      resetAllTokenStorage();

      const storage = getTokenStorage();

      expect(storage.getBackendType()).toBe('file');
    });

    it('should throw when DD_TOKEN_STORAGE=keychain but keychain unavailable', () => {
      process.env.DD_TOKEN_STORAGE = 'keychain';
      mockIsAvailable = false;
      resetAllTokenStorage();

      expect(() => getTokenStorage()).toThrow(/keychain is not available/);
    });

    it('should return file storage with custom directory when storageDir specified', () => {
      const storage = getTokenStorage({ storageDir: '/custom/path' });

      expect(storage.getBackendType()).toBe('file');
      expect(storage).toBeInstanceOf(FileTokenStorage);
    });

    it('should return keychain storage when forceBackend=keychain', () => {
      mockIsAvailable = true;

      const storage = getTokenStorage({ forceBackend: 'keychain' });

      expect(storage.getBackendType()).toBe('keychain');
    });

    it('should return file storage when forceBackend=file', () => {
      const storage = getTokenStorage({ forceBackend: 'file' });

      expect(storage.getBackendType()).toBe('file');
    });

    it('should throw when forceBackend=keychain but keychain unavailable', () => {
      mockIsAvailable = false;

      expect(() => getTokenStorage({ forceBackend: 'keychain' })).toThrow(
        /keychain is not available/
      );
    });

    it('should fall back to file when keychain unavailable', () => {
      mockIsAvailable = false;
      resetAllTokenStorage();

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const storage = getTokenStorage();

      expect(storage.getBackendType()).toBe('file');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('keychain not available'));

      consoleSpy.mockRestore();
    });
  });

  describe('getActiveStorageBackend()', () => {
    it('should return null before any storage is requested', () => {
      resetAllTokenStorage();
      expect(getActiveStorageBackend()).toBeNull();
    });

    it('should return active backend after storage is requested', () => {
      mockIsAvailable = true;
      resetAllTokenStorage();

      getTokenStorage();

      expect(getActiveStorageBackend()).toBe('keychain');
    });
  });

  describe('getStorageDescription()', () => {
    it('should return description with (secure) suffix for keychain', () => {
      mockIsAvailable = true;
      resetAllTokenStorage();

      const description = getStorageDescription();

      expect(description).toContain('(secure)');
    });

    it('should return path for file storage', () => {
      process.env.DD_TOKEN_STORAGE = 'file';
      resetAllTokenStorage();

      const description = getStorageDescription();

      expect(description).toContain('oauth_tokens.json');
    });
  });

  describe('isUsingSecureStorage()', () => {
    it('should return true when keychain is active', () => {
      mockIsAvailable = true;
      resetAllTokenStorage();

      getTokenStorage();

      expect(isUsingSecureStorage()).toBe(true);
    });

    it('should return false when file storage is active', () => {
      process.env.DD_TOKEN_STORAGE = 'file';
      resetAllTokenStorage();

      getTokenStorage();

      expect(isUsingSecureStorage()).toBe(false);
    });
  });

  describe('resetAllTokenStorage()', () => {
    it('should reset active backend', () => {
      mockIsAvailable = true;
      resetAllTokenStorage();

      getTokenStorage();
      expect(getActiveStorageBackend()).toBe('keychain');

      resetAllTokenStorage();
      expect(getActiveStorageBackend()).toBeNull();
    });
  });
});
