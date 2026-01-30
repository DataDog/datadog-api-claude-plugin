// Unless explicitly stated otherwise all files in this repository are licensed
// under the Apache License Version 2.0.
// This product includes software developed at Datadog (https://www.datadoghq.com/).
// Copyright 2024-present Datadog, Inc.

/**
 * Unit tests for secure token storage module (OS keychain)
 */

import {
  SecureTokenStorage,
  KeychainError,
  resetSecureTokenStorage,
} from '../../../src/lib/auth/secure-token-storage';
import { OAuthTokens } from '../../../src/lib/auth/types';

// Mock @napi-rs/keyring
jest.mock('@napi-rs/keyring', () => {
  const passwords: Map<string, string> = new Map();

  return {
    Entry: jest.fn().mockImplementation((service: string, account: string) => {
      const key = `${service}:${account}`;
      return {
        setPassword: jest.fn((password: string) => {
          passwords.set(key, password);
        }),
        getPassword: jest.fn(() => {
          const password = passwords.get(key);
          if (!password) {
            throw new Error('No password found');
          }
          return password;
        }),
        deletePassword: jest.fn(() => {
          passwords.delete(key);
        }),
      };
    }),
    __passwords: passwords, // For test access
    __reset: () => passwords.clear(),
  };
});

describe('SecureTokenStorage', () => {
  let storage: SecureTokenStorage;

  const createTestTokens = (site: string = 'datadoghq.com'): OAuthTokens => ({
    accessToken: `access-token-${site}`,
    refreshToken: `refresh-token-${site}`,
    tokenType: 'Bearer',
    expiresIn: 3600,
    issuedAt: Math.floor(Date.now() / 1000),
    scope: 'dashboards_read monitors_read',
  });

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { __reset } = require('@napi-rs/keyring');
    __reset();
    storage = new SecureTokenStorage();
    resetSecureTokenStorage();
  });

  describe('getBackendType()', () => {
    it('should return "keychain"', () => {
      expect(storage.getBackendType()).toBe('keychain');
    });
  });

  describe('getStorageLocation()', () => {
    it('should return OS-specific description', () => {
      const location = storage.getStorageLocation();
      expect(location).toMatch(/Keychain|Credential Manager|Secret Service/);
    });
  });

  describe('saveTokens()', () => {
    it('should save tokens to keychain', () => {
      const tokens = createTestTokens();
      storage.saveTokens('datadoghq.com', tokens);

      const retrieved = storage.getTokens('datadoghq.com');
      expect(retrieved).toEqual(tokens);
    });

    it('should support multiple sites', () => {
      const tokensUS = createTestTokens('datadoghq.com');
      const tokensEU = createTestTokens('datadoghq.eu');

      storage.saveTokens('datadoghq.com', tokensUS);
      storage.saveTokens('datadoghq.eu', tokensEU);

      expect(storage.getTokens('datadoghq.com')).toEqual(tokensUS);
      expect(storage.getTokens('datadoghq.eu')).toEqual(tokensEU);
    });

    it('should overwrite existing tokens', () => {
      const tokens1 = createTestTokens();
      storage.saveTokens('datadoghq.com', tokens1);

      const tokens2 = { ...createTestTokens(), accessToken: 'new-access-token' };
      storage.saveTokens('datadoghq.com', tokens2);

      const retrieved = storage.getTokens('datadoghq.com');
      expect(retrieved?.accessToken).toBe('new-access-token');
    });
  });

  describe('getTokens()', () => {
    it('should return null for non-existent site', () => {
      const tokens = storage.getTokens('nonexistent.site');
      expect(tokens).toBeNull();
    });

    it('should return stored tokens', () => {
      const tokens = createTestTokens();
      storage.saveTokens('datadoghq.com', tokens);

      const retrieved = storage.getTokens('datadoghq.com');
      expect(retrieved).toEqual(tokens);
    });
  });

  describe('deleteTokens()', () => {
    it('should delete tokens for a site', () => {
      const tokens = createTestTokens();
      storage.saveTokens('datadoghq.com', tokens);

      const deleted = storage.deleteTokens('datadoghq.com');

      expect(deleted).toBe(true);
      expect(storage.getTokens('datadoghq.com')).toBeNull();
    });

    it('should return false when no tokens exist', () => {
      const deleted = storage.deleteTokens('nonexistent.site');
      expect(deleted).toBe(false);
    });

    it('should not affect other sites', () => {
      const tokensUS = createTestTokens('datadoghq.com');
      const tokensEU = createTestTokens('datadoghq.eu');

      storage.saveTokens('datadoghq.com', tokensUS);
      storage.saveTokens('datadoghq.eu', tokensEU);

      storage.deleteTokens('datadoghq.com');

      expect(storage.getTokens('datadoghq.com')).toBeNull();
      expect(storage.getTokens('datadoghq.eu')).toEqual(tokensEU);
    });
  });

  describe('deleteAllTokens()', () => {
    it('should delete tokens for known sites', () => {
      const tokensUS = createTestTokens('datadoghq.com');
      const tokensEU = createTestTokens('datadoghq.eu');

      storage.saveTokens('datadoghq.com', tokensUS);
      storage.saveTokens('datadoghq.eu', tokensEU);

      storage.deleteAllTokens();

      expect(storage.getTokens('datadoghq.com')).toBeNull();
      expect(storage.getTokens('datadoghq.eu')).toBeNull();
    });
  });

  describe('hasValidTokens()', () => {
    it('should return false when no tokens exist', () => {
      expect(storage.hasValidTokens('datadoghq.com')).toBe(false);
    });

    it('should return true for valid non-expired tokens', () => {
      const tokens = createTestTokens();
      storage.saveTokens('datadoghq.com', tokens);

      expect(storage.hasValidTokens('datadoghq.com')).toBe(true);
    });

    it('should return true for expired tokens with refresh token (refreshable)', () => {
      const tokens = {
        ...createTestTokens(),
        issuedAt: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
        expiresIn: 3600, // Expired 1 hour ago
      };
      storage.saveTokens('datadoghq.com', tokens);

      expect(storage.hasValidTokens('datadoghq.com', true)).toBe(true);
    });

    it('should return false for expired tokens when not checking refreshable', () => {
      const tokens = {
        ...createTestTokens(),
        issuedAt: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
        expiresIn: 3600, // Expired 1 hour ago
      };
      storage.saveTokens('datadoghq.com', tokens);

      expect(storage.hasValidTokens('datadoghq.com', false)).toBe(false);
    });
  });

  describe('listSites()', () => {
    it('should return empty array when no tokens stored', () => {
      expect(storage.listSites()).toEqual([]);
    });

    it('should return list of known sites with stored tokens', () => {
      storage.saveTokens('datadoghq.com', createTestTokens('datadoghq.com'));
      storage.saveTokens('datadoghq.eu', createTestTokens('datadoghq.eu'));

      const sites = storage.listSites();
      expect(sites).toContain('datadoghq.com');
      expect(sites).toContain('datadoghq.eu');
    });
  });

  describe('getTokenExpiration()', () => {
    it('should return null when no tokens exist', () => {
      expect(storage.getTokenExpiration('datadoghq.com')).toBeNull();
    });

    it('should return expiration info for valid tokens', () => {
      const tokens = createTestTokens();
      storage.saveTokens('datadoghq.com', tokens);

      const expiration = storage.getTokenExpiration('datadoghq.com');

      expect(expiration).not.toBeNull();
      expect(expiration?.accessTokenExpiresAt).toBeInstanceOf(Date);
      expect(expiration?.isAccessTokenExpired).toBe(false);
      expect(expiration?.expiresInSeconds).toBeGreaterThan(0);
    });

    it('should correctly identify expired tokens', () => {
      const tokens = {
        ...createTestTokens(),
        issuedAt: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
        expiresIn: 3600, // Expired 1 hour ago
      };
      storage.saveTokens('datadoghq.com', tokens);

      const expiration = storage.getTokenExpiration('datadoghq.com');

      expect(expiration?.isAccessTokenExpired).toBe(true);
      expect(expiration?.expiresInSeconds).toBe(0);
    });
  });

  describe('isAvailable()', () => {
    it('should return true when keychain operations work', () => {
      expect(SecureTokenStorage.isAvailable()).toBe(true);
    });
  });
});

describe('KeychainError', () => {
  it('should have correct properties', () => {
    const cause = new Error('Original error');
    const error = new KeychainError('Test message', 'save', cause);

    expect(error.name).toBe('KeychainError');
    expect(error.message).toBe('Test message');
    expect(error.operation).toBe('save');
    expect(error.cause).toBe(cause);
  });
});
