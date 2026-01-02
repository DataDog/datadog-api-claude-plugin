/**
 * Metrics API operations (v2)
 * Handles querying, submitting, and listing metrics
 */

import { v2 } from '@datadog/datadog-api-client';
import { getV2Api } from '../../lib/client';
import { ErrorHandler } from '../../lib/error-handler';
import { PermissionManager } from '../../lib/permissions';
import { ResponseFormatter } from '../../lib/formatter';

export interface MetricQueryParams {
  query: string;
  from: number;
  to: number;
}

export interface MetricSubmitParams {
  series: Array<{
    metric: string;
    type?: number;
    points: Array<{
      timestamp: number;
      value: number;
    }>;
    tags?: string[];
  }>;
}

export interface MetricListParams {
  filter?: string;
  limit?: number;
}

/**
 * Metrics API handler
 */
export class MetricsApi {
  private api: v2.MetricsApi;

  constructor() {
    this.api = getV2Api(v2.MetricsApi);
  }

  /**
   * Query metric time-series data
   * @param params Query parameters
   * @returns Formatted metric data
   */
  async queryMetrics(params: MetricQueryParams): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('metrics', params.query)
      );

      // Make API call
      const response = await this.api.queryTimeseriesData({
        body: {
          data: {
            type: 'timeseries_request',
            attributes: {
              formulas: [{ formula: params.query }],
              queries: [],
              from: params.from,
              to: params.to,
            },
          },
        },
      });

      // Format response
      if (response.data && response.data.attributes) {
        return ResponseFormatter.formatJSON({
          query: params.query,
          from: params.from,
          to: params.to,
          series: response.data.attributes.series || [],
          times: response.data.attributes.times || [],
          values: response.data.attributes.values || [],
        });
      }

      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Submit custom metrics
   * @param params Metric submission parameters
   * @returns Success message
   */
  async submitMetrics(params: MetricSubmitParams): Promise<string> {
    try {
      // Check permissions - WRITE operation
      const metricNames = params.series.map((s) => s.metric).join(', ');
      await PermissionManager.requirePermission(
        PermissionManager.createWriteCheck(
          'metrics',
          metricNames,
          'This will submit custom metric data to Datadog'
        )
      );

      // Make API call
      const response = await this.api.submitMetrics({
        body: {
          series: params.series.map((s) => ({
            metric: s.metric,
            type: (s.type as any) || 0, // 0 = gauge, using any to handle type compatibility
            points: s.points.map((p) => ({
              timestamp: p.timestamp,
              value: p.value,
            })),
            tags: s.tags || [],
          })),
        },
      });

      return ResponseFormatter.formatSuccess(
        'Metrics submitted successfully',
        {
          submitted: params.series.length,
          metrics: metricNames,
          response: response.errors || [],
        }
      );
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * List available metrics
   * @param params List parameters
   * @returns Formatted list of metrics
   */
  async listMetrics(params: MetricListParams = {}): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('metrics', 'list')
      );

      // For v2 API, we'll use a simplified approach
      // Note: Full metric listing may require v1 API or different approach
      return ResponseFormatter.formatError(
        'Metric listing is not yet fully implemented',
        {
          note: 'Use the Datadog UI or v1 API to list metrics. Query specific metrics with the query command.',
          filter: params.filter || 'none',
          limit: params.limit || 'none'
        }
      );
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Get metadata for a specific metric
   * @param metricName The metric name
   * @returns Metric metadata
   */
  async getMetricMetadata(metricName: string): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('metrics', metricName)
      );

      // Note: Metric metadata retrieval requires different approach
      return ResponseFormatter.formatError(
        'Metric metadata retrieval is not yet fully implemented',
        {
          note: 'Use the Datadog UI or query the metric directly with the query command.',
          metric: metricName
        }
      );
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }
}

/**
 * Convenience function to create a MetricsApi instance
 */
export function createMetricsApi(): MetricsApi {
  return new MetricsApi();
}
