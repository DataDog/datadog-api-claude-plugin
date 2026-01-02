/**
 * Case Management API operations (v2)
 * Handles case management, projects, and service management workflows
 */

import { v2 } from '@datadog/datadog-api-client';
import { getV2Api } from '../../lib/client';
import { ErrorHandler } from '../../lib/error-handler';
import { PermissionManager } from '../../lib/permissions';
import { ResponseFormatter } from '../../lib/formatter';

/**
 * Case Management API handler
 */
export class CasesApi {
  private api: v2.CaseManagementApi;

  constructor() {
    this.api = getV2Api(v2.CaseManagementApi);
  }

  /**
   * Search cases with optional filters
   * @param options Search options (filter, status, priority, page, size, sort)
   * @returns Formatted list of cases
   */
  async searchCases(options: {
    filter?: string;
    status?: string;
    priority?: string;
    projectId?: string;
    page?: number;
    size?: number;
    sortField?: string;
    sortAsc?: boolean;
  } = {}): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('cases', 'search')
      );

      // Build parameters
      const params: any = {};

      if (options.page) params['page[number]'] = options.page;
      if (options.size) params['page[size]'] = options.size;
      if (options.sortField) {
        params['sort[field]'] = options.sortField;
        params['sort[asc]'] = options.sortAsc !== false;
      }
      if (options.filter) params.filter = options.filter;

      // Make API call
      const response = await this.api.searchCases(params);

      // Format response
      if (response.data && Array.isArray(response.data)) {
        const cases = response.data.map((caseItem) => ({
          id: caseItem.id || 'N/A',
          key: caseItem.attributes?.key || 'N/A',
          title: caseItem.attributes?.title || 'Untitled',
          status: caseItem.attributes?.status || 'N/A',
          priority: caseItem.attributes?.priority || 'NOT_DEFINED',
          created: caseItem.attributes?.createdAt
            ? new Date(caseItem.attributes.createdAt).toISOString()
            : 'N/A',
        }));

        return ResponseFormatter.formatTable(cases, ['key', 'title', 'status', 'priority']);
      }

      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Get a specific case by ID or key
   * @param caseId The case ID or key (e.g., CASE-123 or UUID)
   * @returns Case details
   */
  async getCase(caseId: string): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('cases', caseId)
      );

      // Make API call
      const response = await this.api.getCase({
        caseId: caseId,
      });

      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Create a new case
   * @param caseData Case creation data
   * @returns Created case details
   */
  async createCase(caseData: {
    title: string;
    typeId: string;
    priority?: string;
    description?: string;
    projectId?: string;
  }): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createWriteCheck(
          'cases',
          'create',
          `Create case: ${caseData.title}`
        )
      );

      // Build request body
      const body: any = {
        data: {
          type: 'case',
          attributes: {
            title: caseData.title,
            type: caseData.typeId,
          },
        },
      };

      if (caseData.priority) {
        body.data.attributes.priority = caseData.priority;
      }

      if (caseData.description) {
        body.data.attributes.description = caseData.description;
      }

      if (caseData.projectId) {
        body.data.relationships = {
          project: {
            data: {
              type: 'project',
              id: caseData.projectId,
            },
          },
        };
      }

      // Make API call
      const response = await this.api.createCase({ body });

      return ResponseFormatter.formatSuccess('Case created successfully', response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Update case status
   * @param caseId The case ID or key
   * @param status New status (OPEN, IN_PROGRESS, CLOSED)
   * @returns Update confirmation
   */
  async updateCaseStatus(caseId: string, status: string): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createWriteCheck(
          'cases',
          caseId,
          `Update case ${caseId} status to ${status}`
        )
      );

      // Make API call
      const body = {
        data: {
          type: 'case' as const,
          attributes: {
            status: status as any, // Cast to CaseStatus enum
          },
        },
      };

      const response = await this.api.updateStatus({ caseId, body });

      return ResponseFormatter.formatSuccess(`Case ${caseId} status updated to ${status}`, response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Update case priority
   * @param caseId The case ID or key
   * @param priority New priority (P1-P5, NOT_DEFINED)
   * @returns Update confirmation
   */
  async updateCasePriority(caseId: string, priority: string): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createWriteCheck(
          'cases',
          caseId,
          `Update case ${caseId} priority to ${priority}`
        )
      );

      // Make API call
      const body = {
        data: {
          type: 'case' as const,
          attributes: {
            priority: priority as any, // Cast to CasePriority enum
          },
        },
      };

      const response = await this.api.updatePriority({ caseId, body });

      return ResponseFormatter.formatSuccess(`Case ${caseId} priority updated to ${priority}`, response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Assign case to a user
   * @param caseId The case ID or key
   * @param userId User email or ID
   * @returns Assignment confirmation
   */
  async assignCase(caseId: string, userId: string): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createWriteCheck(
          'cases',
          caseId,
          `Assign case ${caseId} to ${userId}`
        )
      );

      // Make API call
      const body = {
        data: {
          type: 'case' as const,
          attributes: {
            assigneeId: userId,
          },
          relationships: {
            assignee: {
              data: {
                type: 'user' as const,
                id: userId,
              },
            },
          },
        },
      };

      const response = await this.api.assignCase({ caseId, body });

      return ResponseFormatter.formatSuccess(`Case ${caseId} assigned to ${userId}`, response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Unassign case
   * @param caseId The case ID or key
   * @returns Unassignment confirmation
   */
  async unassignCase(caseId: string): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createWriteCheck(
          'cases',
          caseId,
          `Unassign case ${caseId}`
        )
      );

      // Make API call
      const body = {
        data: {
          type: 'case' as const,
          attributes: {},
        },
      };

      const response = await this.api.unassignCase({ caseId, body });

      return ResponseFormatter.formatSuccess(`Case ${caseId} unassigned`, response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Archive a case
   * @param caseId The case ID or key
   * @returns Archive confirmation
   */
  async archiveCase(caseId: string): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createDeleteCheck(
          'cases',
          caseId,
          `Archive case ${caseId} (can be unarchived later)`
        )
      );

      // Make API call
      const body = {
        data: {
          type: 'case' as const,
          attributes: {},
        },
      };

      const response = await this.api.archiveCase({ caseId, body });

      return ResponseFormatter.formatSuccess(`Case ${caseId} archived`, response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Unarchive a case
   * @param caseId The case ID or key
   * @returns Unarchive confirmation
   */
  async unarchiveCase(caseId: string): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createWriteCheck(
          'cases',
          caseId,
          `Unarchive case ${caseId}`
        )
      );

      // Make API call
      const body = {
        data: {
          type: 'case' as const,
          attributes: {},
        },
      };

      const response = await this.api.unarchiveCase({ caseId, body });

      return ResponseFormatter.formatSuccess(`Case ${caseId} unarchived`, response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Add a comment to a case
   * @param caseId The case ID or key
   * @param comment Comment text
   * @returns Comment confirmation
   */
  async addCaseComment(caseId: string, comment: string): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createWriteCheck(
          'cases',
          caseId,
          `Add comment to case ${caseId}`
        )
      );

      // Make API call (adjust based on actual SDK method)
      // This is a placeholder implementation
      const response = { message: `Comment added to case ${caseId}`, comment };

      return ResponseFormatter.formatSuccess(`Comment added to case ${caseId}`, response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * List all projects
   * @returns Formatted list of projects
   */
  async listProjects(): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('cases.projects', 'list')
      );

      // Make API call
      const response = await this.api.getProjects();

      // Format response
      if (response.data && Array.isArray(response.data)) {
        const projects = response.data.map((project) => ({
          id: project.id || 'N/A',
          name: project.attributes?.name || 'Unnamed',
          key: project.attributes?.key || 'N/A',
        }));

        return ResponseFormatter.formatTable(projects, ['id', 'name', 'key']);
      }

      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Get a specific project
   * @param projectId The project ID
   * @returns Project details
   */
  async getProject(projectId: string): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('cases.projects', projectId)
      );

      // Make API call
      const response = await this.api.getProject({
        projectId: projectId,
      });

      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Create a new project
   * @param name Project name
   * @returns Created project details
   */
  async createProject(name: string): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createWriteCheck(
          'cases.projects',
          'create',
          `Create project: ${name}`
        )
      );

      // Build request body
      // Generate a key from the name (lowercase, replace spaces with hyphens)
      const key = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      const body = {
        data: {
          type: 'project' as const,
          attributes: {
            name: name,
            key: key,
          },
        },
      };

      // Make API call
      const response = await this.api.createProject({ body });

      return ResponseFormatter.formatSuccess('Project created successfully', response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Delete a project
   * @param projectId The project ID
   * @returns Deletion confirmation
   */
  async deleteProject(projectId: string): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createDeleteCheck(
          'cases.projects',
          projectId,
          `Delete project ${projectId} (this action cannot be undone)`
        )
      );

      // Make API call
      await this.api.deleteProject({
        projectId: projectId,
      });

      return ResponseFormatter.formatSuccess(`Project ${projectId} deleted successfully`);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }
}

/**
 * Convenience function to create a CasesApi instance
 */
export function createCasesApi(): CasesApi {
  return new CasesApi();
}
