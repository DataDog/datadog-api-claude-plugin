// Unless explicitly stated otherwise all files in this repository are licensed
// under the Apache License Version 2.0.
// This product includes software developed at Datadog (https://www.datadoghq.com/).
// Copyright 2024-2026 Datadog, Inc.

/**
 * Spans/Traces API operations (v2)
 * Handles APM trace and span queries
 */

import { v2 } from '@datadog/datadog-api-client';
import { getV2Api } from '../../lib/client';
import { ErrorHandler } from '../../lib/error-handler';
import { PermissionManager } from '../../lib/permissions';
import { ResponseFormatter } from '../../lib/formatter';

export interface SpanSearchParams {
  query: string;
  from: number;
  to: number;
  limit?: number;
}

/**
 * Spans API handler
 */
export class SpansApi {
  private api: v2.SpansApi;

  constructor() {
    this.api = getV2Api(v2.SpansApi);
  }

  /**
   * Search spans/traces
   * @param params Search parameters
   * @returns Formatted span results
   */
  async searchSpans(params: SpanSearchParams): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('spans', 'search')
      );

      // Make API call
      const response = await this.api.listSpans({
        body: {
          filter: {
            query: params.query,
            from: new Date(params.from * 1000).toISOString(),
            to: new Date(params.to * 1000).toISOString(),
          },
          page: {
            limit: params.limit || 50,
          },
          sort: 'timestamp',
        },
      } as any);

      // Format response
      if (response.data && Array.isArray(response.data)) {
        const spans = response.data.map((span: any) => ({
          traceId: span.attributes?.['trace_id'] || 'N/A',
          spanId: span.attributes?.['span_id'] || span.id || 'N/A',
          service: span.attributes?.['service'] || 'N/A',
          resource: span.attributes?.['resource'] || 'N/A',
          duration: span.attributes?.['duration'] ? `${span.attributes['duration']}ns` : 'N/A',
        }));

        return ResponseFormatter.formatTable(spans, ['traceId', 'service', 'resource', 'duration']);
      }

      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Aggregate spans
   * @param query Span query
   * @param _from Start time
   * @param _to End time
   * @returns Aggregated span data
   */
  async aggregateSpans(query: string, _from: number, _to: number): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('spans', 'aggregate')
      );

      return ResponseFormatter.formatError(
        'Span aggregation not yet fully implemented',
        {
          note: 'Use span search for now. Aggregation features coming in future updates.',
          query,
        }
      );
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }
}

/**
 * Convenience function to create a SpansApi instance
 */
export function createSpansApi(): SpansApi {
  return new SpansApi();
}
