/**
 * Fleet Automation API operations (v2)
 * Handles agent discovery, configuration deployments, package upgrades, and schedules
 */

import { v2 } from '@datadog/datadog-api-client';
import { getV2Api } from '../../lib/client';
import { ErrorHandler } from '../../lib/error-handler';
import { PermissionManager } from '../../lib/permissions';
import { ResponseFormatter } from '../../lib/formatter';

export interface FleetAgentsListParams {
  pageNumber?: number;
  pageSize?: number;
  sortAttribute?: string;
  sortDescending?: boolean;
  tags?: string;
  filter?: string;
}

export interface FleetDeploymentsListParams {
  pageSize?: number;
  pageOffset?: number;
}

export interface FleetDeploymentGetParams {
  limit?: number;
  page?: number;
}

export interface FleetConfigOperation {
  fileOp: 'merge-patch' | 'delete';
  filePath: string;
  patch?: Record<string, any>;
}

export interface FleetConfigDeploymentParams {
  filterQuery?: string;
  configOperations: FleetConfigOperation[];
}

export interface FleetPackage {
  name: string;
  version: string;
}

export interface FleetUpgradeDeploymentParams {
  filterQuery?: string;
  targetPackages: FleetPackage[];
}

export interface FleetRecurrenceRule {
  daysOfWeek: string[];
  startMaintenanceWindow: string;
  maintenanceWindowDuration: number;
  timezone: string;
}

export interface FleetScheduleCreateParams {
  name: string;
  query: string;
  rule: FleetRecurrenceRule;
  status?: 'active' | 'inactive';
  versionToLatest?: number;
}

export interface FleetScheduleUpdateParams {
  name?: string;
  query?: string;
  rule?: FleetRecurrenceRule;
  status?: 'active' | 'inactive';
  versionToLatest?: number;
}

/**
 * Fleet Automation API handler
 */
export class FleetAutomationApi {
  private api: v2.FleetAutomationApi;

  constructor() {
    this.api = getV2Api(v2.FleetAutomationApi);
  }

  /**
   * List all available Agent versions
   * @returns Formatted list of agent versions
   */
  async listAgentVersions(): Promise<string> {
    try {
      PermissionManager.requirePermission(
        PermissionManager.createReadCheck('fleet', 'list agent versions')
      );

      const response = await this.api.listFleetAgentVersions();
      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * List all Datadog Agents
   * @param params List parameters
   * @returns Formatted list of agents
   */
  async listAgents(params?: FleetAgentsListParams): Promise<string> {
    try {
      PermissionManager.requirePermission(
        PermissionManager.createReadCheck('fleet', 'list agents')
      );

      const response = await this.api.listFleetAgents(params || {});
      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Get detailed information about a specific agent
   * @param agentKey The agent key identifier
   * @returns Formatted agent details
   */
  async getAgentInfo(agentKey: string): Promise<string> {
    try {
      PermissionManager.requirePermission(
        PermissionManager.createReadCheck('fleet', 'get agent info')
      );

      const response = await this.api.getFleetAgentInfo({ agentKey });
      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * List all deployments
   * @param params List parameters
   * @returns Formatted list of deployments
   */
  async listDeployments(params?: FleetDeploymentsListParams): Promise<string> {
    try {
      PermissionManager.requirePermission(
        PermissionManager.createReadCheck('fleet', 'list deployments')
      );

      const response = await this.api.listFleetDeployments(params || {});
      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Get detailed information about a specific deployment
   * @param deploymentId The deployment ID
   * @param params Pagination parameters for hosts
   * @returns Formatted deployment details
   */
  async getDeployment(
    deploymentId: string,
    params?: FleetDeploymentGetParams
  ): Promise<string> {
    try {
      PermissionManager.requirePermission(
        PermissionManager.createReadCheck('fleet', 'get deployment')
      );

      const response = await this.api.getFleetDeployment({
        deploymentId,
        ...params,
      });
      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Create a configuration deployment
   * @param params Configuration deployment parameters
   * @returns Formatted created deployment
   */
  async createConfigDeployment(params: FleetConfigDeploymentParams): Promise<string> {
    try {
      PermissionManager.requirePermission(
        PermissionManager.createWriteCheck(
          'fleet',
          'create configuration deployment',
          `Query: ${params.filterQuery || 'all'}, Operations: ${params.configOperations.length}`
        )
      );

      const body: any = {
        data: {
          type: 'deployment',
          attributes: {
            config_operations: params.configOperations.map((op) => ({
              file_op: op.fileOp,
              file_path: op.filePath,
              ...(op.patch && { patch: op.patch }),
            })),
          },
        },
      };

      if (params.filterQuery) {
        body.data.attributes.filter_query = params.filterQuery;
      }

      const response = await this.api.createFleetDeploymentConfigure({ body });
      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Create a package upgrade deployment
   * @param params Package upgrade deployment parameters
   * @returns Formatted created deployment
   */
  async createUpgradeDeployment(params: FleetUpgradeDeploymentParams): Promise<string> {
    try {
      const packagesDesc = params.targetPackages
        .map((p) => `${p.name}:${p.version}`)
        .join(', ');
      PermissionManager.requirePermission(
        PermissionManager.createWriteCheck(
          'fleet',
          'create package upgrade deployment',
          `Query: ${params.filterQuery || 'all'}, Packages: ${packagesDesc}`
        )
      );

      const body: any = {
        data: {
          type: 'deployment',
          attributes: {
            target_packages: params.targetPackages,
          },
        },
      };

      if (params.filterQuery) {
        body.data.attributes.filter_query = params.filterQuery;
      }

      const response = await this.api.createFleetDeploymentUpgrade({ body });
      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Cancel a deployment
   * @param deploymentId The deployment ID
   * @returns Confirmation message
   */
  async cancelDeployment(deploymentId: string): Promise<string> {
    try {
      PermissionManager.requirePermission(
        PermissionManager.createDeleteCheck('fleet', 'deployment', deploymentId)
      );

      await this.api.cancelFleetDeployment({ deploymentId });
      return ResponseFormatter.formatSuccess('Deployment cancelled successfully', {
        deploymentId,
      });
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * List all schedules
   * @returns Formatted list of schedules
   */
  async listSchedules(): Promise<string> {
    try {
      PermissionManager.requirePermission(
        PermissionManager.createReadCheck('fleet', 'list schedules')
      );

      const response = await this.api.listFleetSchedules();
      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Get detailed information about a specific schedule
   * @param scheduleId The schedule ID
   * @returns Formatted schedule details
   */
  async getSchedule(scheduleId: string): Promise<string> {
    try {
      PermissionManager.requirePermission(
        PermissionManager.createReadCheck('fleet', 'get schedule')
      );

      const response = await this.api.getFleetSchedule({ id: scheduleId });
      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Create a schedule
   * @param params Schedule creation parameters
   * @returns Formatted created schedule
   */
  async createSchedule(params: FleetScheduleCreateParams): Promise<string> {
    try {
      PermissionManager.requirePermission(
        PermissionManager.createWriteCheck(
          'fleet',
          'create schedule',
          `Name: ${params.name}, Query: ${params.query}`
        )
      );

      const body: any = {
        data: {
          type: 'schedule',
          attributes: {
            name: params.name,
            query: params.query,
            rule: {
              days_of_week: params.rule.daysOfWeek,
              start_maintenance_window: params.rule.startMaintenanceWindow,
              maintenance_window_duration: params.rule.maintenanceWindowDuration,
              timezone: params.rule.timezone,
            },
          },
        },
      };

      if (params.status) {
        body.data.attributes.status = params.status;
      }

      if (params.versionToLatest !== undefined) {
        body.data.attributes.version_to_latest = params.versionToLatest;
      }

      const response = await this.api.createFleetSchedule({ body });
      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Update a schedule
   * @param scheduleId The schedule ID
   * @param params Schedule update parameters
   * @returns Formatted updated schedule
   */
  async updateSchedule(scheduleId: string, params: FleetScheduleUpdateParams): Promise<string> {
    try {
      PermissionManager.requirePermission(
        PermissionManager.createWriteCheck('fleet', 'update schedule', `ID: ${scheduleId}`)
      );

      const body: any = {
        data: {
          type: 'schedule',
          attributes: {},
        },
      };

      if (params.name) {
        body.data.attributes.name = params.name;
      }

      if (params.query) {
        body.data.attributes.query = params.query;
      }

      if (params.status) {
        body.data.attributes.status = params.status;
      }

      if (params.versionToLatest !== undefined) {
        body.data.attributes.version_to_latest = params.versionToLatest;
      }

      if (params.rule) {
        body.data.attributes.rule = {
          days_of_week: params.rule.daysOfWeek,
          start_maintenance_window: params.rule.startMaintenanceWindow,
          maintenance_window_duration: params.rule.maintenanceWindowDuration,
          timezone: params.rule.timezone,
        };
      }

      const response = await this.api.updateFleetSchedule({ id: scheduleId, body });
      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Delete a schedule
   * @param scheduleId The schedule ID
   * @returns Confirmation message
   */
  async deleteSchedule(scheduleId: string): Promise<string> {
    try {
      PermissionManager.requirePermission(
        PermissionManager.createDeleteCheck('fleet', 'schedule', scheduleId)
      );

      await this.api.deleteFleetSchedule({ id: scheduleId });
      return ResponseFormatter.formatSuccess('Schedule deleted successfully', {
        scheduleId,
      });
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Manually trigger a schedule to create a deployment
   * @param scheduleId The schedule ID
   * @returns Formatted created deployment
   */
  async triggerSchedule(scheduleId: string): Promise<string> {
    try {
      PermissionManager.requirePermission(
        PermissionManager.createWriteCheck('fleet', 'trigger schedule', `ID: ${scheduleId}`)
      );

      const response = await this.api.triggerFleetSchedule({ id: scheduleId });
      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }
}

/**
 * Convenience function to create a FleetAutomationApi instance
 */
export function createFleetAutomationApi(): FleetAutomationApi {
  return new FleetAutomationApi();
}
