// Unless explicitly stated otherwise all files in this repository are licensed
// under the Apache License Version 2.0.
// This product includes software developed at Datadog (https://www.datadoghq.com/).
// Copyright 2024-present Datadog, Inc.

/**
 * Dashboards API operations (v1)
 * Handles CRUD operations for Datadog dashboards
 */

import { v1 } from '@datadog/datadog-api-client';
import { getV1Api } from '../../lib/client';
import { ErrorHandler } from '../../lib/error-handler';
import { PermissionManager } from '../../lib/permissions';
import { ResponseFormatter } from '../../lib/formatter';

export interface DashboardListParams {
  filterShared?: boolean;
  filterDeleted?: boolean;
  count?: number;
}

export interface DashboardCreateParams {
  title: string;
  description?: string;
  widgets: any[];
  layoutType: string;
  isReadOnly?: boolean;
  notifyList?: string[];
  templateVariables?: any[];
  tags?: string[];
}

export interface DashboardUpdateParams {
  title?: string;
  description?: string;
  widgets?: any[];
  layoutType?: string;
  isReadOnly?: boolean;
  notifyList?: string[];
  templateVariables?: any[];
  tags?: string[];
}

/**
 * Dashboards API handler
 */
export class DashboardsApi {
  private api: v1.DashboardsApi;

  constructor() {
    this.api = getV1Api(v1.DashboardsApi);
  }

  /**
   * List all dashboards
   * @param params List parameters
   * @returns Formatted list of dashboards
   */
  async listDashboards(params: DashboardListParams = {}): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('dashboards', 'list')
      );

      // Build query parameters
      const queryParams: any = {};
      if (params.filterShared !== undefined) queryParams.filterShared = params.filterShared;
      if (params.filterDeleted !== undefined) queryParams.filterDeleted = params.filterDeleted;
      if (params.count) queryParams.count = params.count;

      // Make API call
      const response = await this.api.listDashboards(queryParams);

      // Format response
      if (response.dashboards && Array.isArray(response.dashboards)) {
        const dashboards = response.dashboards.map((d) => ({
          id: d.id,
          title: d.title || 'Untitled',
          description: d.description || '',
          isReadOnly: d.isReadOnly ? 'Yes' : 'No',
        }));

        return ResponseFormatter.formatTable(dashboards, ['id', 'title', 'isReadOnly']);
      }

      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Get a specific dashboard by ID
   * @param dashboardId The dashboard ID
   * @returns Dashboard details
   */
  async getDashboard(dashboardId: string): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('dashboards', dashboardId)
      );

      // Make API call
      const response = await this.api.getDashboard({
        dashboardId: dashboardId,
      });

      // Format response
      return ResponseFormatter.formatDashboard(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Create a new dashboard
   * @param params Dashboard creation parameters
   * @returns Created dashboard details
   */
  async createDashboard(params: DashboardCreateParams): Promise<string> {
    try {
      // Check permissions - WRITE operation
      await PermissionManager.requirePermission(
        PermissionManager.createWriteCheck(
          'dashboards',
          params.title,
          `This will create a new dashboard: "${params.title}"`
        )
      );

      // Build dashboard configuration
      const dashboardConfig: any = {
        title: params.title,
        widgets: params.widgets,
        layoutType: params.layoutType,
      };

      if (params.description) dashboardConfig.description = params.description;
      if (params.isReadOnly !== undefined) dashboardConfig.isReadOnly = params.isReadOnly;
      if (params.notifyList) dashboardConfig.notifyList = params.notifyList;
      if (params.templateVariables) dashboardConfig.templateVariables = params.templateVariables;
      if (params.tags) dashboardConfig.tags = params.tags;

      // Make API call
      const response = await this.api.createDashboard({
        body: dashboardConfig,
      });

      return ResponseFormatter.formatSuccess('Dashboard created successfully', {
        id: response.id,
        title: response.title,
        url: response.url,
      });
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Update an existing dashboard
   * @param dashboardId The dashboard ID
   * @param params Dashboard update parameters
   * @returns Updated dashboard details
   */
  async updateDashboard(dashboardId: string, params: DashboardUpdateParams): Promise<string> {
    try {
      // Check permissions - WRITE operation
      await PermissionManager.requirePermission(
        PermissionManager.createWriteCheck(
          'dashboards',
          dashboardId,
          `This will update dashboard ${dashboardId}`
        )
      );

      // First, get the current dashboard to merge with updates
      const current = await this.api.getDashboard({ dashboardId });

      // Build dashboard configuration
      const dashboardConfig: any = {
        title: params.title || current.title,
        widgets: params.widgets || current.widgets,
        layoutType: params.layoutType || current.layoutType,
      };

      if (params.description !== undefined) dashboardConfig.description = params.description;
      if (params.isReadOnly !== undefined) dashboardConfig.isReadOnly = params.isReadOnly;
      if (params.notifyList) dashboardConfig.notifyList = params.notifyList;
      if (params.templateVariables) dashboardConfig.templateVariables = params.templateVariables;
      if (params.tags) dashboardConfig.tags = params.tags;

      // Make API call
      const response = await this.api.updateDashboard({
        dashboardId: dashboardId,
        body: dashboardConfig,
      });

      return ResponseFormatter.formatSuccess('Dashboard updated successfully', {
        id: response.id,
        title: response.title,
        url: response.url,
      });
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Delete a dashboard
   * @param dashboardId The dashboard ID
   * @returns Success message
   */
  async deleteDashboard(dashboardId: string): Promise<string> {
    try {
      // Check permissions - DELETE operation
      await PermissionManager.requirePermission(
        PermissionManager.createDeleteCheck(
          'dashboards',
          dashboardId,
          'This will permanently delete the dashboard and all its widgets',
          'This action cannot be undone'
        )
      );

      // Make API call
      await this.api.deleteDashboard({
        dashboardId: dashboardId,
      });

      return ResponseFormatter.formatSuccess('Dashboard deleted successfully', {
        id: dashboardId,
      });
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Get public URL for a dashboard
   * @param dashboardId The dashboard ID
   * @returns Public URL information
   */
  async getDashboardPublicUrl(dashboardId: string): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('dashboards', dashboardId)
      );

      // Get dashboard details which includes the URL
      const response = await this.api.getDashboard({
        dashboardId: dashboardId,
      });

      return ResponseFormatter.formatSuccess('Dashboard URL retrieved', {
        id: response.id,
        title: response.title,
        url: response.url,
      });
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }
}

/**
 * Convenience function to create a DashboardsApi instance
 */
export function createDashboardsApi(): DashboardsApi {
  return new DashboardsApi();
}
