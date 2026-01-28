// Unless explicitly stated otherwise all files in this repository are licensed
// under the Apache License Version 2.0.
// This product includes software developed at Datadog (https://www.datadoghq.com/).
// Copyright 2024-present Datadog, Inc.

/**
 * Unit tests for config module
 */

import { ConfigValidator, ConfigError } from '../../src/lib/config';

describe('ConfigValidator', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset the singleton instance before each test
    ConfigValidator.reset();
    // Create a clean copy of environment variables
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('validate()', () => {
    it('should return valid config when all environment variables are set', () => {
      process.env.DD_API_KEY = 'a'.repeat(32);
      process.env.DD_APP_KEY = 'b'.repeat(32);
      process.env.DD_SITE = 'datadoghq.com';

      const config = ConfigValidator.validate();

      expect(config.apiKey).toBe('a'.repeat(32));
      expect(config.appKey).toBe('b'.repeat(32));
      expect(config.site).toBe('datadoghq.com');
    });

    it('should use default site if DD_SITE is not set', () => {
      process.env.DD_API_KEY = 'a'.repeat(32);
      process.env.DD_APP_KEY = 'b'.repeat(32);
      delete process.env.DD_SITE;

      const config = ConfigValidator.validate();

      expect(config.site).toBe('datadoghq.com');
    });

    it('should throw ConfigError when DD_API_KEY is missing', () => {
      delete process.env.DD_API_KEY;
      process.env.DD_APP_KEY = 'b'.repeat(32);

      expect(() => ConfigValidator.validate()).toThrow(ConfigError);
      expect(() => ConfigValidator.validate()).toThrow(/DD_API_KEY/);
    });

    it('should throw ConfigError when DD_APP_KEY is missing', () => {
      process.env.DD_API_KEY = 'a'.repeat(32);
      delete process.env.DD_APP_KEY;

      expect(() => ConfigValidator.validate()).toThrow(ConfigError);
      expect(() => ConfigValidator.validate()).toThrow(/DD_APP_KEY/);
    });

    it('should throw ConfigError when DD_API_KEY is too short', () => {
      process.env.DD_API_KEY = 'short';
      process.env.DD_APP_KEY = 'b'.repeat(32);

      expect(() => ConfigValidator.validate()).toThrow(ConfigError);
      expect(() => ConfigValidator.validate()).toThrow(/invalid.*too short/);
    });

    it('should throw ConfigError when DD_APP_KEY is too short', () => {
      process.env.DD_API_KEY = 'a'.repeat(32);
      process.env.DD_APP_KEY = 'short';

      expect(() => ConfigValidator.validate()).toThrow(ConfigError);
      expect(() => ConfigValidator.validate()).toThrow(/invalid.*too short/);
    });

    it('should accept valid Datadog sites', () => {
      const validSites = [
        'datadoghq.com',
        'us3.datadoghq.com',
        'us5.datadoghq.com',
        'datadoghq.eu',
        'ddog-gov.com',
        'ap1.datadoghq.com',
      ];

      process.env.DD_API_KEY = 'a'.repeat(32);
      process.env.DD_APP_KEY = 'b'.repeat(32);

      validSites.forEach((site) => {
        ConfigValidator.reset();
        process.env.DD_SITE = site;
        const config = ConfigValidator.validate();
        expect(config.site).toBe(site);
      });
    });

    it('should cache configuration after first validation', () => {
      process.env.DD_API_KEY = 'a'.repeat(32);
      process.env.DD_APP_KEY = 'b'.repeat(32);
      process.env.DD_SITE = 'datadoghq.com';

      const config1 = ConfigValidator.validate();
      const config2 = ConfigValidator.validate();

      expect(config1).toBe(config2); // Same object reference
    });
  });

  describe('reset()', () => {
    it('should clear cached configuration', () => {
      process.env.DD_API_KEY = 'a'.repeat(32);
      process.env.DD_APP_KEY = 'b'.repeat(32);

      const config1 = ConfigValidator.validate();
      ConfigValidator.reset();
      const config2 = ConfigValidator.validate();

      expect(config1).not.toBe(config2); // Different object references
    });
  });

  describe('getCurrent()', () => {
    it('should return null before validation', () => {
      expect(ConfigValidator.getCurrent()).toBeNull();
    });

    it('should return cached config after validation', () => {
      process.env.DD_API_KEY = 'a'.repeat(32);
      process.env.DD_APP_KEY = 'b'.repeat(32);

      const config = ConfigValidator.validate();
      const current = ConfigValidator.getCurrent();

      expect(current).toBe(config);
    });
  });
});
