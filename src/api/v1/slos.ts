/**
 * SLOs API operations (v1)
 * Handles Service Level Objectives management
 */

import { v1 } from '@datadog/datadog-api-client';
import { getV1Api } from '../../lib/client';
import { ErrorHandler } from '../../lib/error-handler';
import { PermissionManager } from '../../lib/permissions';
import { ResponseFormatter } from '../../lib/formatter';

/**
 * SLOs API handler
 */
export class SLOsApi {
  private api: v1.ServiceLevelObjectivesApi;

  constructor() {
    this.api = getV1Api(v1.ServiceLevelObjectivesApi);
  }

  /**
   * List all SLOs
   * @returns Formatted list of SLOs
   */
  async listSLOs(): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('slos', 'list')
      );

      // Make API call
      const response = await this.api.listSLOs();

      // Format response
      if (response.data && Array.isArray(response.data)) {
        const slos = response.data.map((slo: any) => ({
          id: slo.id,
          name: slo.name,
          type: slo.type,
          target: `${slo.thresholds?.[0]?.target || 'N/A'}%`,
          status: slo.sliValue !== undefined ? `${slo.sliValue.toFixed(2)}%` : 'N/A',
        }));

        return ResponseFormatter.formatTable(slos, ['id', 'name', 'type', 'target', 'status']);
      }

      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Get a specific SLO
   * @param sloId The SLO ID
   * @returns SLO details
   */
  async getSLO(sloId: string): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('slos', sloId)
      );

      // Make API call
      const response = await this.api.getSLO({
        sloId: sloId,
      });

      // Format response
      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Delete an SLO
   * @param sloId The SLO ID
   * @returns Success message
   */
  async deleteSLO(sloId: string): Promise<string> {
    try {
      // Check permissions - DELETE operation
      await PermissionManager.requirePermission(
        PermissionManager.createDeleteCheck(
          'slos',
          sloId,
          'This will permanently delete the SLO and all its historical data',
          'This action cannot be undone'
        )
      );

      // Make API call
      await this.api.deleteSLO({
        sloId: sloId,
      });

      return ResponseFormatter.formatSuccess('SLO deleted successfully', {
        id: sloId,
      });
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Get SLO history
   * @param sloId The SLO ID
   * @param from Start time
   * @param to End time
   * @returns SLO history
   */
  async getSLOHistory(sloId: string, from: number, to: number): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('slos', sloId)
      );

      // Make API call
      const response = await this.api.getSLOHistory({
        sloId: sloId,
        fromTs: from,
        toTs: to,
      });

      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }
}

/**
 * Convenience function to create an SLOsApi instance
 */
export function createSLOsApi(): SLOsApi {
  return new SLOsApi();
}
