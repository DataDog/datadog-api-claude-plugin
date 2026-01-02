/**
 * RUM API operations (v2)
 * Handles Real User Monitoring queries
 */

import { v2 } from '@datadog/datadog-api-client';
import { getV2Api } from '../../lib/client';
import { ErrorHandler } from '../../lib/error-handler';
import { PermissionManager } from '../../lib/permissions';
import { ResponseFormatter } from '../../lib/formatter';

export interface RUMSearchParams {
  query: string;
  from: number;
  to: number;
  limit?: number;
}

export interface RUMMetricCreateParams {
  id: string;
  eventType: 'session' | 'view' | 'action' | 'error' | 'resource' | 'long_task' | 'vital';
  aggregationType: 'count' | 'distribution';
  path?: string;
  includePercentiles?: boolean;
  filter?: string;
  groupBy?: Array<{ path: string; tagName?: string }>;
  uniqueness?: 'match' | 'end';
}

export interface RUMMetricUpdateParams {
  filter?: string;
  groupBy?: Array<{ path: string; tagName?: string }>;
  includePercentiles?: boolean;
}

export interface RUMRetentionFilterCreateParams {
  name: string;
  eventType: 'session' | 'view' | 'action' | 'error' | 'resource' | 'long_task' | 'vital';
  query?: string;
  sampleRate: number;
  enabled?: boolean;
}

export interface RUMRetentionFilterUpdateParams {
  id: string;
  eventType?: 'session' | 'view' | 'action' | 'error' | 'resource' | 'long_task' | 'vital';
  name?: string;
  query?: string;
  sampleRate?: number;
  enabled?: boolean;
}

/**
 * RUM API handler
 */
export class RUMApi {
  private api: v2.RUMApi;
  private metricsApi: v2.RumMetricsApi;
  private retentionFiltersApi: v2.RumRetentionFiltersApi;

  constructor() {
    this.api = getV2Api(v2.RUMApi);
    this.metricsApi = getV2Api(v2.RumMetricsApi);
    this.retentionFiltersApi = getV2Api(v2.RumRetentionFiltersApi);
  }

  /**
   * Search RUM events
   * @param params Search parameters
   * @returns Formatted RUM results
   */
  async searchRUMEvents(params: RUMSearchParams): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('rum', 'search')
      );

      // Make API call
      const response = await this.api.listRUMEvents({
        body: {
          filter: {
            query: params.query,
            from: new Date(params.from * 1000).toISOString(),
            to: new Date(params.to * 1000).toISOString(),
          },
          page: {
            limit: params.limit || 50,
          },
        },
      } as any);

      // Format response
      if (response.data && Array.isArray(response.data)) {
        return ResponseFormatter.formatJSON(response.data);
      }

      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * List all RUM metrics
   * @returns Formatted list of RUM metrics
   */
  async listRumMetrics(): Promise<string> {
    try {
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('rum', 'list metrics')
      );

      const response = await this.metricsApi.listRumMetrics();
      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Get a specific RUM metric
   * @param metricId The metric ID
   * @returns Formatted RUM metric details
   */
  async getRumMetric(metricId: string): Promise<string> {
    try {
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('rum', 'get metric')
      );

      const response = await this.metricsApi.getRumMetric({ metricId });
      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Create a RUM metric
   * @param params Metric creation parameters
   * @returns Formatted created metric
   */
  async createRumMetric(params: RUMMetricCreateParams): Promise<string> {
    try {
      await PermissionManager.requirePermission(
        PermissionManager.createWriteCheck(
          'rum',
          'create metric',
          `ID: ${params.id}, Type: ${params.eventType}, Aggregation: ${params.aggregationType}`
        )
      );

      const body: any = {
        data: {
          id: params.id,
          type: 'rum_metrics',
          attributes: {
            event_type: params.eventType,
            compute: {
              aggregation_type: params.aggregationType,
            },
          },
        },
      };

      // Add optional compute fields
      if (params.path) {
        body.data.attributes.compute.path = params.path;
      }
      if (params.includePercentiles !== undefined) {
        body.data.attributes.compute.include_percentiles = params.includePercentiles;
      }

      // Add optional filter
      if (params.filter) {
        body.data.attributes.filter = { query: params.filter };
      }

      // Add optional group by
      if (params.groupBy && params.groupBy.length > 0) {
        body.data.attributes.group_by = params.groupBy.map((g) => ({
          path: g.path,
          tag_name: g.tagName || g.path.replace('@', '').replace(/\./g, '_'),
        }));
      }

      // Add optional uniqueness (for session/view events only)
      if (params.uniqueness && ['session', 'view'].includes(params.eventType)) {
        body.data.attributes.uniqueness = { when: params.uniqueness };
      }

      const response = await this.metricsApi.createRumMetric({ body });
      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Update a RUM metric
   * @param metricId The metric ID
   * @param params Metric update parameters
   * @returns Formatted updated metric
   */
  async updateRumMetric(metricId: string, params: RUMMetricUpdateParams): Promise<string> {
    try {
      await PermissionManager.requirePermission(
        PermissionManager.createWriteCheck('rum', 'update metric', `ID: ${metricId}`)
      );

      const body: any = {
        data: {
          type: 'rum_metrics',
          attributes: {},
        },
      };

      // Add optional filter
      if (params.filter) {
        body.data.attributes.filter = { query: params.filter };
      }

      // Add optional group by
      if (params.groupBy) {
        body.data.attributes.group_by = params.groupBy.map((g) => ({
          path: g.path,
          tag_name: g.tagName || g.path.replace('@', '').replace(/\./g, '_'),
        }));
      }

      // Add optional compute updates
      if (params.includePercentiles !== undefined) {
        body.data.attributes.compute = { include_percentiles: params.includePercentiles };
      }

      const response = await this.metricsApi.updateRumMetric({ metricId, body });
      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Delete a RUM metric
   * @param metricId The metric ID
   * @returns Confirmation message
   */
  async deleteRumMetric(metricId: string): Promise<string> {
    try {
      await PermissionManager.requirePermission(
        PermissionManager.createDeleteCheck('rum', 'metric', metricId)
      );

      await this.metricsApi.deleteRumMetric({ metricId });
      return ResponseFormatter.formatSuccess('RUM metric deleted successfully', { id: metricId });
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * List retention filters for a RUM application
   * @param appId RUM application ID
   * @returns Formatted list of retention filters
   */
  async listRetentionFilters(appId: string): Promise<string> {
    try {
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('rum', 'list retention filters')
      );

      const response = await this.retentionFiltersApi.listRetentionFilters({ appId });
      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Get a specific retention filter
   * @param appId RUM application ID
   * @param rfId Retention filter ID
   * @returns Formatted retention filter details
   */
  async getRetentionFilter(appId: string, rfId: string): Promise<string> {
    try {
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('rum', 'get retention filter')
      );

      const response = await this.retentionFiltersApi.getRetentionFilter({ appId, rfId });
      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Create a retention filter
   * @param appId RUM application ID
   * @param params Retention filter creation parameters
   * @returns Formatted created retention filter
   */
  async createRetentionFilter(
    appId: string,
    params: RUMRetentionFilterCreateParams
  ): Promise<string> {
    try {
      await PermissionManager.requirePermission(
        PermissionManager.createWriteCheck(
          'rum',
          'create retention filter',
          `Name: ${params.name}, Type: ${params.eventType}, Sample Rate: ${params.sampleRate}%`
        )
      );

      const body: any = {
        data: {
          type: 'retention_filters',
          attributes: {
            event_type: params.eventType,
            name: params.name,
            sample_rate: params.sampleRate,
          },
        },
      };

      if (params.query) {
        body.data.attributes.query = params.query;
      }

      if (params.enabled !== undefined) {
        body.data.attributes.enabled = params.enabled;
      }

      const response = await this.retentionFiltersApi.createRetentionFilter({ appId, body });
      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Update a retention filter
   * @param appId RUM application ID
   * @param rfId Retention filter ID
   * @param params Retention filter update parameters
   * @returns Formatted updated retention filter
   */
  async updateRetentionFilter(
    appId: string,
    rfId: string,
    params: RUMRetentionFilterUpdateParams
  ): Promise<string> {
    try {
      await PermissionManager.requirePermission(
        PermissionManager.createWriteCheck(
          'rum',
          'update retention filter',
          `Filter ID: ${rfId}`
        )
      );

      const body: any = {
        data: {
          id: params.id,
          type: 'retention_filters',
          attributes: {},
        },
      };

      if (params.eventType) {
        body.data.attributes.event_type = params.eventType;
      }

      if (params.name) {
        body.data.attributes.name = params.name;
      }

      if (params.query !== undefined) {
        body.data.attributes.query = params.query;
      }

      if (params.sampleRate !== undefined) {
        body.data.attributes.sample_rate = params.sampleRate;
      }

      if (params.enabled !== undefined) {
        body.data.attributes.enabled = params.enabled;
      }

      const response = await this.retentionFiltersApi.updateRetentionFilter({ appId, rfId, body });
      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Delete a retention filter
   * @param appId RUM application ID
   * @param rfId Retention filter ID
   * @returns Confirmation message
   */
  async deleteRetentionFilter(appId: string, rfId: string): Promise<string> {
    try {
      await PermissionManager.requirePermission(
        PermissionManager.createDeleteCheck('rum', 'retention filter', rfId)
      );

      await this.retentionFiltersApi.deleteRetentionFilter({ appId, rfId });
      return ResponseFormatter.formatSuccess('Retention filter deleted successfully', {
        appId,
        rfId,
      });
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Order retention filters
   * @param appId RUM application ID
   * @param filterIds Array of filter IDs in desired order
   * @returns Formatted response
   */
  async orderRetentionFilters(appId: string, filterIds: string[]): Promise<string> {
    try {
      await PermissionManager.requirePermission(
        PermissionManager.createWriteCheck(
          'rum',
          'order retention filters',
          `${filterIds.length} filters`
        )
      );

      const body: any = {
        data: filterIds.map((id) => ({
          id,
          type: 'retention_filters',
        })),
      };

      await this.retentionFiltersApi.orderRetentionFilters({ appId, body });
      return ResponseFormatter.formatSuccess('Retention filters reordered successfully', {
        appId,
        filterCount: filterIds.length,
      });
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }
}

/**
 * Convenience function to create a RUMApi instance
 */
export function createRUMApi(): RUMApi {
  return new RUMApi();
}
