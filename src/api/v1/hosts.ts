// Unless explicitly stated otherwise all files in this repository are licensed
// under the Apache License Version 2.0.
// This product includes software developed at Datadog (https://www.datadoghq.com/).
// Copyright 2024-2026 Datadog, Inc.

/**
 * Hosts API operations (v1)
 * Handles infrastructure host management
 */

import { v1 } from '@datadog/datadog-api-client';
import { getV1Api } from '../../lib/client';
import { ErrorHandler } from '../../lib/error-handler';
import { PermissionManager } from '../../lib/permissions';
import { ResponseFormatter } from '../../lib/formatter';

/**
 * Hosts API handler
 */
export class HostsApi {
  private api: v1.HostsApi;

  constructor() {
    this.api = getV1Api(v1.HostsApi);
  }

  /**
   * List all hosts
   * @param filter Optional filter
   * @returns Formatted list of hosts
   */
  async listHosts(filter?: string): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('hosts', 'list')
      );

      // Build query parameters
      const queryParams: any = {};
      if (filter) {
        queryParams.filter = filter;
      }

      // Make API call
      const response = await this.api.listHosts(queryParams);

      // Format response
      if (response.hostList && Array.isArray(response.hostList)) {
        const hosts = response.hostList.map((host: any) => ({
          name: host.name || 'N/A',
          id: host.id?.toString() || 'N/A',
          uptime: host.uptime ? `${Math.floor(host.uptime / 3600)}h` : 'N/A',
          status: host.isMuted ? 'Muted' : 'Active',
        }));

        return ResponseFormatter.formatTable(hosts, ['name', 'id', 'uptime', 'status']);
      }

      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Get host totals
   * @returns Host count and statistics
   */
  async getHostTotals(): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('hosts', 'totals')
      );

      // Make API call
      const response = await this.api.getHostTotals();

      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }
}

/**
 * Convenience function to create a HostsApi instance
 */
export function createHostsApi(): HostsApi {
  return new HostsApi();
}
