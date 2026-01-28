// Unless explicitly stated otherwise all files in this repository are licensed
// under the Apache License Version 2.0.
// This product includes software developed at Datadog (https://www.datadoghq.com/).
// Copyright 2024-present Datadog, Inc.

/**
 * Security Monitoring API operations (v2)
 * Handles security signals and monitoring
 */

import { v2 } from '@datadog/datadog-api-client';
import { getV2Api } from '../../lib/client';
import { ErrorHandler } from '../../lib/error-handler';
import { PermissionManager } from '../../lib/permissions';
import { ResponseFormatter } from '../../lib/formatter';

export interface SecuritySignalSearchParams {
  query?: string;
  from: number;
  to: number;
  limit?: number;
}

/**
 * Security Monitoring API handler
 */
export class SecurityMonitoringApi {
  private api: v2.SecurityMonitoringApi;

  constructor() {
    this.api = getV2Api(v2.SecurityMonitoringApi);
  }

  /**
   * List security signals
   * @param params Search parameters
   * @returns Formatted security signals
   */
  async listSecuritySignals(params: SecuritySignalSearchParams): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('security', 'signals')
      );

      // Make API call
      const response = await this.api.searchSecurityMonitoringSignals({
        body: {
          filter: {
            query: params.query || '*',
            from: new Date(params.from * 1000),
            to: new Date(params.to * 1000),
          },
          page: {
            limit: params.limit || 50,
          },
        },
      });

      // Format response
      if (response.data && Array.isArray(response.data)) {
        const signals = response.data.map((signal: any) => ({
          id: signal.id,
          message: signal.attributes?.message || 'N/A',
          severity: signal.attributes?.severity || 'N/A',
          status: signal.attributes?.status || 'N/A',
        }));

        return ResponseFormatter.formatTable(signals, ['id', 'severity', 'status', 'message']);
      }

      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * List security monitoring rules
   * @returns Formatted list of rules
   */
  async listSecurityRules(): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('security', 'rules')
      );

      // Make API call
      const response = await this.api.listSecurityMonitoringRules();

      // Format response
      if (response.data && Array.isArray(response.data)) {
        const rules = response.data.map((rule: any) => ({
          id: rule.id,
          name: rule.name,
          isEnabled: rule.isEnabled ? 'Yes' : 'No',
        }));

        return ResponseFormatter.formatTable(rules, ['id', 'name', 'isEnabled']);
      }

      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }
}

/**
 * Convenience function to create a SecurityMonitoringApi instance
 */
export function createSecurityMonitoringApi(): SecurityMonitoringApi {
  return new SecurityMonitoringApi();
}
