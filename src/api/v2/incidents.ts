// Unless explicitly stated otherwise all files in this repository are licensed
// under the Apache License Version 2.0.
// This product includes software developed at Datadog (https://www.datadoghq.com/).
// Copyright 2024-2026 Datadog, Inc.

/**
 * Incidents API operations (v2)
 * Handles incident management
 */

import { v2 } from '@datadog/datadog-api-client';
import { getV2Api } from '../../lib/client';
import { ErrorHandler } from '../../lib/error-handler';
import { PermissionManager } from '../../lib/permissions';
import { ResponseFormatter } from '../../lib/formatter';

/**
 * Incidents API handler
 */
export class IncidentsApi {
  private api: v2.IncidentsApi;

  constructor() {
    this.api = getV2Api(v2.IncidentsApi);
  }

  /**
   * List all incidents with optional filtering
   * @param options Optional filtering options
   * @returns Formatted list of incidents
   */
  async listIncidents(options?: {
    state?: string;
    query?: string;
    pageSize?: number;
    pageOffset?: number;
  }): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('incidents', 'list')
      );

      let response: any;

      // If filtering by state or custom query, use searchIncidents
      if (options?.state || options?.query) {
        // Build query string
        let query = options.query || '';

        // Add state filter if provided
        if (options.state) {
          const stateQuery = `state:${options.state}`;
          query = query ? `${query} ${stateQuery}` : stateQuery;
        }

        // Use search API
        response = await this.api.searchIncidents({
          query: query,
          pageSize: options.pageSize,
          pageOffset: options.pageOffset,
        });
      } else {
        // Use list API (no filtering)
        response = await this.api.listIncidents({
          pageSize: options?.pageSize,
          pageOffset: options?.pageOffset,
        });
      }

      // Format response - handle both list and search API response structures
      let incidentsData: any[] = [];

      // Check if this is a search response (has included field with incidents)
      if (response.included && Array.isArray(response.included)) {
        // Search API returns incidents wrapped in _data property
        incidentsData = response.included
          .filter((item: any) => item._data && item._data.type === 'incidents')
          .map((item: any) => item._data);
      }
      // Otherwise check if it's a list response (direct data array)
      else if (response.data && Array.isArray(response.data)) {
        incidentsData = response.data;
      }

      if (incidentsData.length > 0) {
        const incidents = incidentsData.map((incident: any) => ({
          id: incident.id,
          title: incident.attributes?.title || 'Untitled',
          state: incident.attributes?.state || 'N/A',
          severity: incident.attributes?.severity || 'N/A',
          created: incident.attributes?.created ? new Date(incident.attributes.created).toISOString() : 'N/A',
        }));

        return ResponseFormatter.formatTable(incidents, ['id', 'title', 'state', 'severity']);
      }

      // No incidents found or unexpected format
      if (incidentsData.length === 0 && response.included) {
        return ResponseFormatter.formatSuccess('No incidents found matching the query', {});
      }

      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Get a specific incident
   * @param incidentId The incident ID
   * @returns Incident details
   */
  async getIncident(incidentId: string): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('incidents', incidentId)
      );

      // Make API call
      const response = await this.api.getIncident({
        incidentId: incidentId,
      });

      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }
}

/**
 * Convenience function to create an IncidentsApi instance
 */
export function createIncidentsApi(): IncidentsApi {
  return new IncidentsApi();
}
