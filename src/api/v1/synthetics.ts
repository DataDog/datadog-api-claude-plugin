// Unless explicitly stated otherwise all files in this repository are licensed
// under the Apache License Version 2.0.
// This product includes software developed at Datadog (https://www.datadoghq.com/).
// Copyright 2024-present Datadog, Inc.

/**
 * Synthetics API operations (v1)
 * Handles synthetic test management
 */

import { v1 } from '@datadog/datadog-api-client';
import { getV1Api } from '../../lib/client';
import { ErrorHandler } from '../../lib/error-handler';
import { PermissionManager } from '../../lib/permissions';
import { ResponseFormatter } from '../../lib/formatter';

/**
 * Synthetics API handler
 */
export class SyntheticsApi {
  private api: v1.SyntheticsApi;

  constructor() {
    this.api = getV1Api(v1.SyntheticsApi);
  }

  /**
   * List all synthetic tests
   * @returns Formatted list of tests
   */
  async listTests(): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('synthetics', 'list')
      );

      // Make API call
      const response = await this.api.listTests();

      // Format response
      if (response.tests && Array.isArray(response.tests)) {
        const tests = response.tests.map((test) => ({
          publicId: test.publicId,
          name: test.name,
          type: test.type,
          status: test.status,
        }));

        return ResponseFormatter.formatTable(tests, ['publicId', 'name', 'type', 'status']);
      }

      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Get a specific synthetic test
   * @param publicId The test public ID
   * @returns Test details
   */
  async getTest(publicId: string): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('synthetics', publicId)
      );

      // Make API call
      const response = await this.api.getTest({
        publicId: publicId,
      });

      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }
}

/**
 * Convenience function to create a SyntheticsApi instance
 */
export function createSyntheticsApi(): SyntheticsApi {
  return new SyntheticsApi();
}
