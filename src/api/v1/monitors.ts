// Unless explicitly stated otherwise all files in this repository are licensed
// under the Apache License Version 2.0.
// This product includes software developed at Datadog (https://www.datadoghq.com/).
// Copyright 2024-present Datadog, Inc.

/**
 * Monitors API operations (v1)
 * Handles CRUD operations for Datadog monitors
 */

import { v1 } from '@datadog/datadog-api-client';
import { getV1Api } from '../../lib/client';
import { ErrorHandler } from '../../lib/error-handler';
import { PermissionManager } from '../../lib/permissions';
import { ResponseFormatter } from '../../lib/formatter';

export interface MonitorListParams {
  groupStates?: string;
  name?: string;
  tags?: string[];
  monitorTags?: string[];
  withDowntimes?: boolean;
  pageSize?: number;
}

export interface MonitorCreateParams {
  type: string;
  query: string;
  name: string;
  message?: string;
  tags?: string[];
  priority?: number;
  options?: Record<string, any>;
}

export interface MonitorUpdateParams {
  type?: string;
  query?: string;
  name?: string;
  message?: string;
  tags?: string[];
  priority?: number;
  options?: Record<string, any>;
}

/**
 * Monitors API handler
 */
export class MonitorsApi {
  private api: v1.MonitorsApi;

  constructor() {
    this.api = getV1Api(v1.MonitorsApi);
  }

  /**
   * List all monitors
   * @param params List parameters
   * @returns Formatted list of monitors
   */
  async listMonitors(params: MonitorListParams = {}): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('monitors', 'list')
      );

      // Build query parameters
      const queryParams: any = {};
      if (params.groupStates) queryParams.groupStates = params.groupStates;
      if (params.name) queryParams.name = params.name;
      if (params.tags) queryParams.tags = params.tags.join(',');
      if (params.monitorTags) queryParams.monitorTags = params.monitorTags.join(',');
      if (params.withDowntimes !== undefined) queryParams.withDowntimes = params.withDowntimes;
      if (params.pageSize) queryParams.pageSize = params.pageSize;

      // Make API call
      const response = await this.api.listMonitors(queryParams);

      // Format response
      if (Array.isArray(response)) {
        const monitors = response.map((m) => ({
          id: m.id,
          name: m.name,
          type: m.type,
          status: m.overallState,
          tags: m.tags?.join(', ') || '',
        }));

        return ResponseFormatter.formatTable(monitors, ['id', 'name', 'type', 'status']);
      }

      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Get a specific monitor by ID
   * @param monitorId The monitor ID
   * @returns Monitor details
   */
  async getMonitor(monitorId: number): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('monitors', String(monitorId))
      );

      // Make API call
      const response = await this.api.getMonitor({
        monitorId: monitorId,
      });

      // Format response
      return ResponseFormatter.formatMonitor(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Create a new monitor
   * @param params Monitor creation parameters
   * @returns Created monitor details
   */
  async createMonitor(params: MonitorCreateParams): Promise<string> {
    try {
      // Check permissions - WRITE operation
      await PermissionManager.requirePermission(
        PermissionManager.createWriteCheck(
          'monitors',
          params.name,
          `This will create a new monitor: "${params.name}"`
        )
      );

      // Build monitor configuration
      const monitorConfig: any = {
        type: params.type,
        query: params.query,
        name: params.name,
      };

      if (params.message) monitorConfig.message = params.message;
      if (params.tags) monitorConfig.tags = params.tags;
      if (params.priority) monitorConfig.priority = params.priority;
      if (params.options) monitorConfig.options = params.options;

      // Make API call
      const response = await this.api.createMonitor({
        body: monitorConfig,
      });

      return ResponseFormatter.formatSuccess('Monitor created successfully', {
        id: response.id,
        name: response.name,
        type: response.type,
      });
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Update an existing monitor
   * @param monitorId The monitor ID
   * @param params Monitor update parameters
   * @returns Updated monitor details
   */
  async updateMonitor(monitorId: number, params: MonitorUpdateParams): Promise<string> {
    try {
      // Check permissions - WRITE operation
      await PermissionManager.requirePermission(
        PermissionManager.createWriteCheck(
          'monitors',
          String(monitorId),
          `This will update monitor ${monitorId}`
        )
      );

      // Build monitor configuration
      const monitorConfig: any = {};
      if (params.type) monitorConfig.type = params.type;
      if (params.query) monitorConfig.query = params.query;
      if (params.name) monitorConfig.name = params.name;
      if (params.message) monitorConfig.message = params.message;
      if (params.tags) monitorConfig.tags = params.tags;
      if (params.priority) monitorConfig.priority = params.priority;
      if (params.options) monitorConfig.options = params.options;

      // Make API call
      const response = await this.api.updateMonitor({
        monitorId: monitorId,
        body: monitorConfig,
      });

      return ResponseFormatter.formatSuccess('Monitor updated successfully', {
        id: response.id,
        name: response.name,
        type: response.type,
      });
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Delete a monitor
   * @param monitorId The monitor ID
   * @returns Success message
   */
  async deleteMonitor(monitorId: number): Promise<string> {
    try {
      // Check permissions - DELETE operation
      await PermissionManager.requirePermission(
        PermissionManager.createDeleteCheck(
          'monitors',
          String(monitorId),
          'This will permanently delete the monitor and all its alert history',
          'This action cannot be undone'
        )
      );

      // Make API call
      await this.api.deleteMonitor({
        monitorId: monitorId,
      });

      return ResponseFormatter.formatSuccess('Monitor deleted successfully', {
        id: monitorId,
      });
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Search monitors by query
   * @param query Search query
   * @returns Matching monitors
   */
  async searchMonitors(query: string): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('monitors', 'search')
      );

      // Make API call - using listMonitors with name filter
      const response = await this.api.listMonitors({
        name: query,
      });

      // Format response
      if (Array.isArray(response)) {
        const monitors = response.map((m) => ({
          id: m.id,
          name: m.name,
          type: m.type,
          status: m.overallState,
        }));

        return ResponseFormatter.formatTable(monitors);
      }

      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }
}

/**
 * Convenience function to create a MonitorsApi instance
 */
export function createMonitorsApi(): MonitorsApi {
  return new MonitorsApi();
}
