// Unless explicitly stated otherwise all files in this repository are licensed
// under the Apache License Version 2.0.
// This product includes software developed at Datadog (https://www.datadoghq.com/).
// Copyright 2024-present Datadog, Inc.

/**
 * Logs API operations (v2)
 * Handles log search and analysis
 */

import { v2 } from '@datadog/datadog-api-client';
import { getV2Api } from '../../lib/client';
import { ErrorHandler } from '../../lib/error-handler';
import { PermissionManager } from '../../lib/permissions';
import { ResponseFormatter } from '../../lib/formatter';

export interface LogSearchParams {
  query: string;
  from: number;
  to: number;
  limit?: number;
  sort?: string;
}

/**
 * Logs API handler
 */
export class LogsApi {
  private api: v2.LogsApi;

  constructor() {
    this.api = getV2Api(v2.LogsApi);
  }

  /**
   * Search logs
   * @param params Search parameters
   * @returns Formatted log results
   */
  async searchLogs(params: LogSearchParams): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('logs', 'search')
      );

      // Make API call
      const response = await this.api.listLogs({
        body: {
          filter: {
            query: params.query,
            from: new Date(params.from * 1000).toISOString(),
            to: new Date(params.to * 1000).toISOString(),
          },
          page: {
            limit: params.limit || 50,
          },
          sort: params.sort as any || 'timestamp',
        },
      });

      // Format response
      if (response.data && Array.isArray(response.data)) {
        const logs = response.data.map((log: any) => ({
          timestamp: log.attributes?.timestamp || 'N/A',
          message: log.attributes?.message || log.attributes?.attributes?.message || 'No message',
          status: log.attributes?.status || 'N/A',
          service: log.attributes?.service || log.attributes?.tags?.find((t: string) => t.startsWith('service:'))?.split(':')[1] || 'N/A',
        }));

        return ResponseFormatter.formatTable(logs, ['timestamp', 'status', 'service', 'message']);
      }

      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Get log aggregation
   * @param query Log query
   * @param _from Start time
   * @param _to End time
   * @returns Aggregated log data
   */
  async aggregateLogs(query: string, _from: number, _to: number): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('logs', 'aggregate')
      );

      return ResponseFormatter.formatError(
        'Log aggregation not yet fully implemented',
        {
          note: 'Use log search for now. Aggregation features coming in future updates.',
          query,
        }
      );
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }
}

/**
 * Convenience function to create a LogsApi instance
 */
export function createLogsApi(): LogsApi {
  return new LogsApi();
}
