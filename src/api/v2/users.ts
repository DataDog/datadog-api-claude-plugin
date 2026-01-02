/**
 * Users API operations (v2)
 * Handles user and organization administration
 */

import { v2 } from '@datadog/datadog-api-client';
import { getV2Api } from '../../lib/client';
import { ErrorHandler } from '../../lib/error-handler';
import { PermissionManager } from '../../lib/permissions';
import { ResponseFormatter } from '../../lib/formatter';

/**
 * Users API handler
 */
export class UsersApi {
  private api: v2.UsersApi;

  constructor() {
    this.api = getV2Api(v2.UsersApi);
  }

  /**
   * List all users
   * @returns Formatted list of users
   */
  async listUsers(): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('users', 'list')
      );

      // Make API call
      const response = await this.api.listUsers();

      // Format response
      if (response.data && Array.isArray(response.data)) {
        const users = response.data.map((user) => ({
          id: user.id,
          email: user.attributes?.email || 'N/A',
          name: user.attributes?.name || 'N/A',
          status: user.attributes?.status || 'N/A',
        }));

        return ResponseFormatter.formatTable(users, ['id', 'email', 'name', 'status']);
      }

      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Get a specific user
   * @param userId The user ID
   * @returns User details
   */
  async getUser(userId: string): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('users', userId)
      );

      // Make API call
      const response = await this.api.getUser({
        userId: userId,
      });

      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }
}

/**
 * Convenience function to create a UsersApi instance
 */
export function createUsersApi(): UsersApi {
  return new UsersApi();
}
