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
   * List all incidents
   * @returns Formatted list of incidents
   */
  async listIncidents(): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('incidents', 'list')
      );

      // Make API call
      const response = await this.api.listIncidents();

      // Format response
      if (response.data && Array.isArray(response.data)) {
        const incidents = response.data.map((incident) => ({
          id: incident.id,
          title: incident.attributes?.title || 'Untitled',
          state: incident.attributes?.state || 'N/A',
          severity: incident.attributes?.severity || 'N/A',
          created: incident.attributes?.created ? new Date(incident.attributes.created).toISOString() : 'N/A',
        }));

        return ResponseFormatter.formatTable(incidents, ['id', 'title', 'state', 'severity']);
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
