// Unless explicitly stated otherwise all files in this repository are licensed
// under the Apache License Version 2.0.
// This product includes software developed at Datadog (https://www.datadoghq.com/).
// Copyright 2024-present Datadog, Inc.

/**
 * Unit tests for permissions module with interactive prompts
 */

import { PermissionManager, OperationType, PermissionError } from '../../src/lib/permissions';
import inquirer from 'inquirer';
import * as ConfigModule from '../../src/lib/config';

// Mock inquirer
jest.mock('inquirer');
const mockedInquirer = inquirer as jest.Mocked<typeof inquirer>;

// Mock ConfigValidator
jest.mock('../../src/lib/config');
const mockedConfigValidator = ConfigModule.ConfigValidator as jest.Mocked<typeof ConfigModule.ConfigValidator>;

describe('PermissionManager', () => {
  // Suppress console output during tests
  let consoleErrorSpy: jest.SpyInstance;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    originalEnv = { ...process.env };

    // Default mock for ConfigValidator
    mockedConfigValidator.validate.mockReturnValue({
      apiKey: 'test-api-key',
      appKey: 'test-app-key',
      site: 'datadoghq.com',
      autoApprove: false,
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('checkPermission()', () => {
    it('should allow READ operations without prompting', async () => {
      const check = {
        operation: OperationType.READ,
        resource: 'metrics',
        requiresConfirmation: false,
      };

      const result = await PermissionManager.checkPermission(check);

      expect(result).toBe(true);
      expect(mockedInquirer.prompt).not.toHaveBeenCalled();
    });

    it('should prompt for WRITE operations and allow when confirmed', async () => {
      mockedInquirer.prompt.mockResolvedValue({ confirmed: true });

      const check = {
        operation: OperationType.WRITE,
        resource: 'monitors',
        identifier: 'test-monitor',
        requiresConfirmation: true,
        warningMessage: 'This will create a new monitor',
      };

      const result = await PermissionManager.checkPermission(check);

      expect(result).toBe(true);
      expect(mockedInquirer.prompt).toHaveBeenCalledWith([
        {
          type: 'confirm',
          name: 'confirmed',
          message: 'Do you want to proceed?',
          default: false,
        },
      ]);
      expect(consoleErrorSpy).toHaveBeenCalledWith('\n⚠️  WRITE OPERATION');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Resource: monitors');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Identifier: test-monitor');
    });

    it('should deny WRITE operations when user declines', async () => {
      mockedInquirer.prompt.mockResolvedValue({ confirmed: false });

      const check = {
        operation: OperationType.WRITE,
        resource: 'monitors',
        requiresConfirmation: true,
      };

      const result = await PermissionManager.checkPermission(check);

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Operation cancelled by user\n');
    });

    it('should prompt for DELETE operations with destructive warning', async () => {
      mockedInquirer.prompt.mockResolvedValue({ confirmed: true });

      const check = {
        operation: OperationType.DELETE,
        resource: 'dashboards',
        identifier: 'dash-123',
        requiresConfirmation: true,
        impactDescription: 'This will permanently delete the dashboard',
        warningMessage: 'This action cannot be undone',
      };

      const result = await PermissionManager.checkPermission(check);

      expect(result).toBe(true);
      expect(mockedInquirer.prompt).toHaveBeenCalledWith([
        {
          type: 'confirm',
          name: 'confirmed',
          message: 'Are you sure you want to DELETE this resource? This action cannot be undone.',
          default: false,
        },
      ]);
      expect(consoleErrorSpy).toHaveBeenCalledWith('\n🚨 DESTRUCTIVE DELETE OPERATION');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Resource: dashboards');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Identifier: dash-123');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Impact: This will permanently delete the dashboard');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Warning: This action cannot be undone');
    });

    it('should deny DELETE operations when user declines', async () => {
      mockedInquirer.prompt.mockResolvedValue({ confirmed: false });

      const check = {
        operation: OperationType.DELETE,
        resource: 'dashboards',
        identifier: 'dash-123',
        requiresConfirmation: true,
        impactDescription: 'This will permanently delete the dashboard',
      };

      const result = await PermissionManager.checkPermission(check);

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Operation cancelled by user\n');
    });
  });

  describe('Auto-approve via DD_AUTO_APPROVE', () => {
    it('should skip prompts when DD_AUTO_APPROVE is true', async () => {
      mockedConfigValidator.validate.mockReturnValue({
        apiKey: 'test-api-key',
        appKey: 'test-app-key',
        site: 'datadoghq.com',
        autoApprove: true,
      });

      const check = {
        operation: OperationType.WRITE,
        resource: 'monitors',
        requiresConfirmation: true,
      };

      const result = await PermissionManager.checkPermission(check);

      expect(result).toBe(true);
      expect(mockedInquirer.prompt).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('✓ WRITE operation auto-approved: monitors');
    });

    it('should skip DELETE prompts when DD_AUTO_APPROVE is true', async () => {
      mockedConfigValidator.validate.mockReturnValue({
        apiKey: 'test-api-key',
        appKey: 'test-app-key',
        site: 'datadoghq.com',
        autoApprove: true,
      });

      const check = {
        operation: OperationType.DELETE,
        resource: 'dashboards',
        identifier: 'dash-123',
        requiresConfirmation: true,
        impactDescription: 'This will permanently delete the dashboard',
      };

      const result = await PermissionManager.checkPermission(check);

      expect(result).toBe(true);
      expect(mockedInquirer.prompt).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('✓ DELETE operation auto-approved: dashboards (dash-123)');
    });
  });

  describe('Auto-approve via DD_CLI_AUTO_APPROVE', () => {
    it('should skip prompts when DD_CLI_AUTO_APPROVE is true', async () => {
      process.env.DD_CLI_AUTO_APPROVE = 'true';

      const check = {
        operation: OperationType.WRITE,
        resource: 'monitors',
        identifier: 'test-monitor',
        requiresConfirmation: true,
      };

      const result = await PermissionManager.checkPermission(check);

      expect(result).toBe(true);
      expect(mockedInquirer.prompt).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('✓ WRITE operation auto-approved: monitors (test-monitor)');
    });

    it('should prompt when DD_CLI_AUTO_APPROVE is not set', async () => {
      mockedInquirer.prompt.mockResolvedValue({ confirmed: true });

      const check = {
        operation: OperationType.WRITE,
        resource: 'monitors',
        requiresConfirmation: true,
      };

      const result = await PermissionManager.checkPermission(check);

      expect(result).toBe(true);
      expect(mockedInquirer.prompt).toHaveBeenCalled();
    });

    it('should prompt when DD_CLI_AUTO_APPROVE is false string', async () => {
      process.env.DD_CLI_AUTO_APPROVE = 'false';
      mockedInquirer.prompt.mockResolvedValue({ confirmed: true });

      const check = {
        operation: OperationType.WRITE,
        resource: 'monitors',
        requiresConfirmation: true,
      };

      const result = await PermissionManager.checkPermission(check);

      expect(result).toBe(true);
      expect(mockedInquirer.prompt).toHaveBeenCalled();
    });
  });

  describe('createReadCheck()', () => {
    it('should create a READ permission check', () => {
      const check = PermissionManager.createReadCheck('metrics', 'cpu.usage');

      expect(check.operation).toBe(OperationType.READ);
      expect(check.resource).toBe('metrics');
      expect(check.identifier).toBe('cpu.usage');
      expect(check.requiresConfirmation).toBe(false);
    });

    it('should create a READ check without identifier', () => {
      const check = PermissionManager.createReadCheck('metrics');

      expect(check.operation).toBe(OperationType.READ);
      expect(check.resource).toBe('metrics');
      expect(check.identifier).toBeUndefined();
      expect(check.requiresConfirmation).toBe(false);
    });
  });

  describe('createWriteCheck()', () => {
    it('should create a WRITE permission check', () => {
      const check = PermissionManager.createWriteCheck(
        'monitors',
        'mon-123',
        'This will update the monitor configuration'
      );

      expect(check.operation).toBe(OperationType.WRITE);
      expect(check.resource).toBe('monitors');
      expect(check.identifier).toBe('mon-123');
      expect(check.requiresConfirmation).toBe(true);
      expect(check.warningMessage).toBe('This will update the monitor configuration');
    });

    it('should create a WRITE check without identifier and warning', () => {
      const check = PermissionManager.createWriteCheck('monitors');

      expect(check.operation).toBe(OperationType.WRITE);
      expect(check.resource).toBe('monitors');
      expect(check.identifier).toBeUndefined();
      expect(check.requiresConfirmation).toBe(true);
      expect(check.warningMessage).toBeUndefined();
    });
  });

  describe('createDeleteCheck()', () => {
    it('should create a DELETE permission check', () => {
      const check = PermissionManager.createDeleteCheck(
        'dashboards',
        'dash-123',
        'This will permanently delete the dashboard',
        'All associated widgets will also be removed'
      );

      expect(check.operation).toBe(OperationType.DELETE);
      expect(check.resource).toBe('dashboards');
      expect(check.identifier).toBe('dash-123');
      expect(check.requiresConfirmation).toBe(true);
      expect(check.impactDescription).toBe('This will permanently delete the dashboard');
      expect(check.warningMessage).toBe('All associated widgets will also be removed');
    });

    it('should create a DELETE check without warning message', () => {
      const check = PermissionManager.createDeleteCheck(
        'monitors',
        'mon-456',
        'This will permanently delete the monitor'
      );

      expect(check.operation).toBe(OperationType.DELETE);
      expect(check.resource).toBe('monitors');
      expect(check.identifier).toBe('mon-456');
      expect(check.requiresConfirmation).toBe(true);
      expect(check.impactDescription).toBe('This will permanently delete the monitor');
      expect(check.warningMessage).toBeUndefined();
    });
  });

  describe('requirePermission()', () => {
    it('should not throw for allowed READ operations', async () => {
      const check = PermissionManager.createReadCheck('metrics');

      await expect(PermissionManager.requirePermission(check)).resolves.not.toThrow();
    });

    it('should not throw for confirmed WRITE operations', async () => {
      mockedInquirer.prompt.mockResolvedValue({ confirmed: true });
      const check = PermissionManager.createWriteCheck('monitors');

      await expect(PermissionManager.requirePermission(check)).resolves.not.toThrow();
    });

    it('should throw PermissionError when user declines WRITE operation', async () => {
      mockedInquirer.prompt.mockResolvedValue({ confirmed: false });
      const check = PermissionManager.createWriteCheck('monitors', 'mon-123');

      await expect(PermissionManager.requirePermission(check)).rejects.toThrow(PermissionError);
      await expect(PermissionManager.requirePermission(check)).rejects.toThrow(/Permission denied/);
    });

    it('should throw PermissionError when user declines DELETE operation', async () => {
      mockedInquirer.prompt.mockResolvedValue({ confirmed: false });
      const check = PermissionManager.createDeleteCheck(
        'dashboards',
        'dash-123',
        'This will permanently delete the dashboard'
      );

      await expect(PermissionManager.requirePermission(check)).rejects.toThrow(PermissionError);
      await expect(PermissionManager.requirePermission(check)).rejects.toThrow(/Permission denied/);
    });

    it('should not throw when auto-approved', async () => {
      mockedConfigValidator.validate.mockReturnValue({
        apiKey: 'test-api-key',
        appKey: 'test-app-key',
        site: 'datadoghq.com',
        autoApprove: true,
      });

      const check = PermissionManager.createDeleteCheck(
        'dashboards',
        'dash-123',
        'This will permanently delete the dashboard'
      );

      await expect(PermissionManager.requirePermission(check)).resolves.not.toThrow();
      expect(mockedInquirer.prompt).not.toHaveBeenCalled();
    });
  });

  describe('PermissionError', () => {
    it('should include check details in error', async () => {
      mockedInquirer.prompt.mockResolvedValue({ confirmed: false });
      const check = PermissionManager.createWriteCheck('monitors', 'mon-123');

      try {
        await PermissionManager.requirePermission(check);
        fail('Should have thrown PermissionError');
      } catch (error) {
        expect(error).toBeInstanceOf(PermissionError);
        if (error instanceof PermissionError) {
          expect(error.check).toEqual(check);
          expect(error.name).toBe('PermissionError');
        }
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle unknown operation type', async () => {
      const check = {
        operation: 'unknown' as any,
        resource: 'test',
        requiresConfirmation: false,
      };

      const result = await PermissionManager.checkPermission(check);

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Unknown operation type: unknown');
    });

    it('should display all warning fields when present', async () => {
      mockedInquirer.prompt.mockResolvedValue({ confirmed: true });

      const check = {
        operation: OperationType.WRITE,
        resource: 'monitors',
        identifier: 'test-123',
        requiresConfirmation: true,
        warningMessage: 'Warning message here',
      };

      await PermissionManager.checkPermission(check);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Action: Warning message here');
    });

    it('should handle missing optional fields gracefully', async () => {
      mockedInquirer.prompt.mockResolvedValue({ confirmed: true });

      const check = {
        operation: OperationType.WRITE,
        resource: 'monitors',
        requiresConfirmation: true,
      };

      const result = await PermissionManager.checkPermission(check);

      expect(result).toBe(true);
    });
  });
});
