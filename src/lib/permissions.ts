// Unless explicitly stated otherwise all files in this repository are licensed
// under the Apache License Version 2.0.
// This product includes software developed at Datadog (https://www.datadoghq.com/).
// Copyright 2024-present Datadog, Inc.

/**
 * Permission system for Datadog API operations
 * Implements a three-tier model: READ, WRITE, DELETE
 */

import inquirer from 'inquirer';
import { ConfigValidator } from './config.js';

export enum OperationType {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
}

export interface PermissionCheck {
  operation: OperationType;
  resource: string;
  identifier?: string;
  requiresConfirmation: boolean;
  warningMessage?: string;
  impactDescription?: string;
}

export class PermissionError extends Error {
  constructor(message: string, public check: PermissionCheck) {
    super(message);
    this.name = 'PermissionError';
  }
}

/**
 * Permission manager for controlling access to Datadog operations
 */
export class PermissionManager {
  /**
   * Checks if prompts should be skipped (auto-approve mode)
   */
  private static shouldSkipPrompt(): boolean {
    // Check environment variable
    const config = ConfigValidator.validate();
    if (config.autoApprove) {
      return true;
    }

    // Check CLI flag (will be passed via process.env by CLI)
    if (process.env.DD_CLI_AUTO_APPROVE === 'true') {
      return true;
    }

    return false;
  }

  /**
   * Checks if an operation should be allowed
   * @param check The permission check to perform
   * @returns true if the operation is allowed, false otherwise
   */
  static async checkPermission(check: PermissionCheck): Promise<boolean> {
    switch (check.operation) {
      case OperationType.READ:
        return this.handleReadOperation(check);
      case OperationType.WRITE:
        return await this.handleWriteOperation(check);
      case OperationType.DELETE:
        return await this.handleDeleteOperation(check);
      default:
        console.error(`Unknown operation type: ${check.operation}`);
        return false;
    }
  }

  /**
   * Handles READ operations (always allowed)
   */
  private static handleReadOperation(_check: PermissionCheck): boolean {
    return true;
  }

  /**
   * Handles WRITE operations (requires interactive confirmation)
   */
  private static async handleWriteOperation(check: PermissionCheck): Promise<boolean> {
    // If auto-approve is enabled, skip prompt
    if (this.shouldSkipPrompt()) {
      console.error(
        `✓ WRITE operation auto-approved: ${check.resource}${
          check.identifier ? ` (${check.identifier})` : ''
        }`
      );
      return true;
    }

    // Display warning message
    console.error(`\n⚠️  WRITE OPERATION`);
    console.error(`Resource: ${check.resource}`);
    if (check.identifier) {
      console.error(`Identifier: ${check.identifier}`);
    }
    if (check.warningMessage) {
      console.error(`Action: ${check.warningMessage}`);
    }
    console.error('');

    // Prompt user for confirmation
    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: 'Do you want to proceed?',
        default: false,
      },
    ]);

    if (!answers.confirmed) {
      console.error('❌ Operation cancelled by user\n');
      return false;
    }

    console.error('✓ Operation confirmed\n');
    return true;
  }

  /**
   * Handles DELETE operations (requires explicit confirmation with impact warning)
   */
  private static async handleDeleteOperation(check: PermissionCheck): Promise<boolean> {
    // If auto-approve is enabled, skip prompt
    if (this.shouldSkipPrompt()) {
      console.error(
        `✓ DELETE operation auto-approved: ${check.resource}${
          check.identifier ? ` (${check.identifier})` : ''
        }`
      );
      return true;
    }

    // Display destructive warning
    console.error(`\n🚨 DESTRUCTIVE DELETE OPERATION`);
    console.error(`Resource: ${check.resource}`);
    if (check.identifier) {
      console.error(`Identifier: ${check.identifier}`);
    }
    if (check.impactDescription) {
      console.error(`Impact: ${check.impactDescription}`);
    }
    if (check.warningMessage) {
      console.error(`Warning: ${check.warningMessage}`);
    }
    console.error('');

    // Prompt user for confirmation with emphasis
    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: 'Are you sure you want to DELETE this resource? This action cannot be undone.',
        default: false,
      },
    ]);

    if (!answers.confirmed) {
      console.error('❌ Operation cancelled by user\n');
      return false;
    }

    console.error('✓ Delete operation confirmed\n');
    return true;
  }

  /**
   * Creates a permission check for a READ operation
   */
  static createReadCheck(resource: string, identifier?: string): PermissionCheck {
    return {
      operation: OperationType.READ,
      resource,
      identifier,
      requiresConfirmation: false,
    };
  }

  /**
   * Creates a permission check for a WRITE operation
   */
  static createWriteCheck(
    resource: string,
    identifier?: string,
    warningMessage?: string
  ): PermissionCheck {
    return {
      operation: OperationType.WRITE,
      resource,
      identifier,
      requiresConfirmation: true,
      warningMessage,
    };
  }

  /**
   * Creates a permission check for a DELETE operation
   */
  static createDeleteCheck(
    resource: string,
    identifier: string,
    impactDescription: string,
    warningMessage?: string
  ): PermissionCheck {
    return {
      operation: OperationType.DELETE,
      resource,
      identifier,
      requiresConfirmation: true,
      impactDescription,
      warningMessage,
    };
  }

  /**
   * Validates that a permission check passes, throwing an error if not
   * @throws {PermissionError} If the permission check fails
   */
  static async requirePermission(check: PermissionCheck): Promise<void> {
    const allowed = await this.checkPermission(check);
    if (!allowed) {
      throw new PermissionError(
        `Permission denied for ${check.operation} operation on ${check.resource}`,
        check
      );
    }
  }
}
