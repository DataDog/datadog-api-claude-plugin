// Unless explicitly stated otherwise all files in this repository are licensed
// under the Apache License Version 2.0.
// This product includes software developed at Datadog (https://www.datadoghq.com/).
// Copyright 2024-present Datadog, Inc.

/**
 * Unit tests for token migration module
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { OAuthTokens } from '../../../src/lib/auth/types';

// Store mock state outside the mock
let mockIsAvailable = true;
const savedTokens = new Map<string, OAuthTokens>();

// Create a mock class that can be instantiated
class MockSecureTokenStorage {
  static isAvailable = () => mockIsAvailable;

  getBackendType() {
    return 'keychain' as const;
  }

  getStorageLocation() {
    return 'Mock Keychain';
  }

  saveTokens(site: string, tokens: OAuthTokens) {
    savedTokens.set(site, tokens);
  }

  getTokens(site: string) {
    return savedTokens.get(site) || null;
  }
}

// Mock SecureTokenStorage before imports
jest.mock('../../../src/lib/auth/secure-token-storage', () => ({
  SecureTokenStorage: MockSecureTokenStorage,
  getSecureTokenStorage: () => new MockSecureTokenStorage(),
  resetSecureTokenStorage: jest.fn(),
}));

import {
  migrateTokensToKeychain,
  hasLegacyTokenFile,
  getLegacyTokenFilePath,
  performMigrationIfNeeded,
} from '../../../src/lib/auth/token-migration';

describe('TokenMigration', () => {
  let testDir: string;

  const createTestTokens = (site: string = 'datadoghq.com'): OAuthTokens => ({
    accessToken: `access-token-${site}`,
    refreshToken: `refresh-token-${site}`,
    tokenType: 'Bearer',
    expiresIn: 3600,
    issuedAt: Math.floor(Date.now() / 1000),
    scope: 'dashboards_read monitors_read',
  });

  beforeEach(() => {
    // Create a temporary test directory
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-migration-test-'));

    // Reset mocks
    mockIsAvailable = true;
    savedTokens.clear();
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('hasLegacyTokenFile()', () => {
    it('should return false when no legacy file exists', () => {
      expect(hasLegacyTokenFile(testDir)).toBe(false);
    });

    it('should return true when legacy file exists', () => {
      const legacyPath = path.join(testDir, 'oauth_tokens.json');
      fs.writeFileSync(legacyPath, '{}');

      expect(hasLegacyTokenFile(testDir)).toBe(true);
    });
  });

  describe('getLegacyTokenFilePath()', () => {
    it('should return path to legacy file', () => {
      const filePath = getLegacyTokenFilePath(testDir);
      expect(filePath).toBe(path.join(testDir, 'oauth_tokens.json'));
    });
  });

  describe('migrateTokensToKeychain()', () => {
    it('should not attempt migration when keychain unavailable', () => {
      mockIsAvailable = false;

      const result = migrateTokensToKeychain({ storageDir: testDir });

      expect(result.attempted).toBe(false);
      expect(result.error).toContain('keychain is not available');
    });

    it('should not attempt migration when no legacy file exists', () => {
      const result = migrateTokensToKeychain({ storageDir: testDir });

      expect(result.attempted).toBe(false);
      expect(result.success).toBe(true);
    });

    it('should migrate tokens from legacy file to keychain', () => {
      // Create legacy token file
      const legacyPath = path.join(testDir, 'oauth_tokens.json');
      const tokens = {
        'datadoghq.com': createTestTokens('datadoghq.com'),
        'datadoghq.eu': createTestTokens('datadoghq.eu'),
      };
      fs.writeFileSync(legacyPath, JSON.stringify(tokens));

      const result = migrateTokensToKeychain({ storageDir: testDir });

      expect(result.attempted).toBe(true);
      expect(result.success).toBe(true);
      expect(result.sitesMigrated).toBe(2);
      expect(result.sites).toContain('datadoghq.com');
      expect(result.sites).toContain('datadoghq.eu');
      expect(result.legacyFileDeleted).toBe(true);
    });

    it('should delete legacy file after successful migration', () => {
      const legacyPath = path.join(testDir, 'oauth_tokens.json');
      fs.writeFileSync(legacyPath, JSON.stringify({ 'datadoghq.com': createTestTokens() }));

      migrateTokensToKeychain({ storageDir: testDir });

      expect(fs.existsSync(legacyPath)).toBe(false);
    });

    it('should not delete legacy file in dry run mode', () => {
      const legacyPath = path.join(testDir, 'oauth_tokens.json');
      fs.writeFileSync(legacyPath, JSON.stringify({ 'datadoghq.com': createTestTokens() }));

      const result = migrateTokensToKeychain({ storageDir: testDir, dryRun: true });

      expect(result.attempted).toBe(false); // dry run doesn't actually attempt
      expect(fs.existsSync(legacyPath)).toBe(true);
    });

    it('should handle empty legacy file', () => {
      const legacyPath = path.join(testDir, 'oauth_tokens.json');
      fs.writeFileSync(legacyPath, '{}');

      const result = migrateTokensToKeychain({ storageDir: testDir });

      expect(result.attempted).toBe(true);
      expect(result.success).toBe(true);
      expect(result.sitesMigrated).toBe(0);
    });

    it('should handle corrupted legacy file', () => {
      const legacyPath = path.join(testDir, 'oauth_tokens.json');
      fs.writeFileSync(legacyPath, 'not valid json');

      const result = migrateTokensToKeychain({ storageDir: testDir });

      expect(result.attempted).toBe(true);
      expect(result.success).toBe(true);
      expect(result.sitesMigrated).toBe(0);
    });
  });

  describe('performMigrationIfNeeded()', () => {
    it('should return null when keychain unavailable', () => {
      mockIsAvailable = false;

      const message = performMigrationIfNeeded({ storageDir: testDir });

      expect(message).toBeNull();
    });

    it('should return null when no legacy file exists', () => {
      const message = performMigrationIfNeeded({ storageDir: testDir });

      expect(message).toBeNull();
    });

    it('should return success message after migration', () => {
      const legacyPath = path.join(testDir, 'oauth_tokens.json');
      fs.writeFileSync(legacyPath, JSON.stringify({ 'datadoghq.com': createTestTokens() }));

      const message = performMigrationIfNeeded({ storageDir: testDir, silent: true });

      expect(message).toContain('Migrated 1 OAuth token');
      expect(message).toContain('Mock Keychain');
    });
  });
});
