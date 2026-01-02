/**
 * Key Management API operations (v2)
 * Handles API keys and Application keys management
 */

import { v2 } from '@datadog/datadog-api-client';
import { getV2Api } from '../../lib/client';
import { ErrorHandler } from '../../lib/error-handler';
import { PermissionManager } from '../../lib/permissions';
import { ResponseFormatter } from '../../lib/formatter';

/**
 * Key Management API handler
 */
export class KeyManagementApi {
  private apiKeysApi: v2.KeyManagementApi;

  constructor() {
    this.apiKeysApi = getV2Api(v2.KeyManagementApi);
  }

  /**
   * List all API keys
   * @param options Filter and pagination options
   * @returns Formatted list of API keys
   */
  async listApiKeys(options?: {
    filter?: string;
    pageSize?: number;
    pageNumber?: number;
    sort?: string;
  }): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('api-keys', 'list')
      );

      // Build API parameters
      const params: any = {};
      if (options?.filter) {
        params.filter = options.filter;
      }
      if (options?.pageSize) {
        params.pageSize = options.pageSize;
      }
      if (options?.pageNumber) {
        params.pageNumber = options.pageNumber;
      }
      if (options?.sort) {
        params.sort = options.sort;
      }

      // Make API call
      const response = await this.apiKeysApi.listAPIKeys(params);

      // Format response
      if (response.data && Array.isArray(response.data)) {
        const keys = response.data.map((key) => ({
          id: key.id,
          name: key.attributes?.name || 'N/A',
          created: key.attributes?.createdAt || 'N/A',
          category: key.attributes?.category || 'N/A',
        }));

        return ResponseFormatter.formatTable(keys, ['id', 'name', 'created', 'category']);
      }

      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Get a specific API key
   * @param keyId The API key ID
   * @returns API key details
   */
  async getApiKey(keyId: string): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('api-keys', keyId)
      );

      // Make API call
      const response = await this.apiKeysApi.getAPIKey({
        apiKeyId: keyId,
      });

      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Create a new API key
   * @param name The name for the new API key
   * @returns Created API key details
   */
  async createApiKey(name: string): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createWriteCheck('api-keys', 'create', `Creating API key: ${name}`)
      );

      // Make API call
      const response = await this.apiKeysApi.createAPIKey({
        body: {
          data: {
            type: 'api_keys',
            attributes: {
              name: name,
            },
          },
        },
      });

      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Update an API key
   * @param keyId The API key ID
   * @param name The new name for the API key
   * @returns Updated API key details
   */
  async updateApiKey(keyId: string, name: string): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createWriteCheck('api-keys', keyId, `Updating API key ${keyId} to name: ${name}`)
      );

      // Make API call
      const response = await this.apiKeysApi.updateAPIKey({
        apiKeyId: keyId,
        body: {
          data: {
            type: 'api_keys',
            id: keyId,
            attributes: {
              name: name,
            },
          },
        },
      });

      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Delete an API key
   * @param keyId The API key ID
   * @returns Deletion confirmation
   */
  async deleteApiKey(keyId: string): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createDeleteCheck(
          'api-keys',
          keyId,
          'This API key will be permanently deleted and any applications using it will lose access.'
        )
      );

      // Make API call
      await this.apiKeysApi.deleteAPIKey({
        apiKeyId: keyId,
      });

      return ResponseFormatter.formatSuccess('API key deleted successfully', { id: keyId });
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * List all application keys
   * @param options Filter and pagination options
   * @returns Formatted list of application keys
   */
  async listApplicationKeys(options?: {
    filter?: string;
    pageSize?: number;
    pageNumber?: number;
    sort?: string;
  }): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('application-keys', 'list')
      );

      // Build API parameters
      const params: any = {};
      if (options?.filter) {
        params.filter = options.filter;
      }
      if (options?.pageSize) {
        params.pageSize = options.pageSize;
      }
      if (options?.pageNumber) {
        params.pageNumber = options.pageNumber;
      }
      if (options?.sort) {
        params.sort = options.sort;
      }

      // Make API call
      const response = await this.apiKeysApi.listApplicationKeys(params);

      // Format response
      if (response.data && Array.isArray(response.data)) {
        const keys = response.data.map((key) => ({
          id: key.id,
          name: key.attributes?.name || 'N/A',
          owner: key.relationships?.ownedBy?.data?.id || 'N/A',
          created: key.attributes?.createdAt || 'N/A',
        }));

        return ResponseFormatter.formatTable(keys, ['id', 'name', 'owner', 'created']);
      }

      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Get a specific application key
   * @param keyId The application key ID
   * @returns Application key details
   */
  async getApplicationKey(keyId: string): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('application-keys', keyId)
      );

      // Make API call
      const response = await this.apiKeysApi.getApplicationKey({
        appKeyId: keyId,
      });

      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Update an application key
   * @param keyId The application key ID
   * @param name The new name for the application key
   * @returns Updated application key details
   */
  async updateApplicationKey(keyId: string, name: string): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createWriteCheck('application-keys', keyId, `Updating application key ${keyId} to name: ${name}`)
      );

      // Make API call
      const response = await this.apiKeysApi.updateApplicationKey({
        appKeyId: keyId,
        body: {
          data: {
            type: 'application_keys',
            id: keyId,
            attributes: {
              name: name,
            },
          },
        },
      });

      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Delete an application key
   * @param keyId The application key ID
   * @returns Deletion confirmation
   */
  async deleteApplicationKey(keyId: string): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createDeleteCheck(
          'application-keys',
          keyId,
          'This application key will be permanently deleted and any applications using it will lose access.'
        )
      );

      // Make API call
      await this.apiKeysApi.deleteApplicationKey({
        appKeyId: keyId,
      });

      return ResponseFormatter.formatSuccess('Application key deleted successfully', { id: keyId });
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * List current user's application keys
   * @param options Filter and pagination options
   * @returns Formatted list of current user's application keys
   */
  async listCurrentUserApplicationKeys(options?: {
    filter?: string;
    pageSize?: number;
    pageNumber?: number;
    sort?: string;
  }): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createReadCheck('current-user-application-keys', 'list')
      );

      // Build API parameters
      const params: any = {};
      if (options?.filter) {
        params.filter = options.filter;
      }
      if (options?.pageSize) {
        params.pageSize = options.pageSize;
      }
      if (options?.pageNumber) {
        params.pageNumber = options.pageNumber;
      }
      if (options?.sort) {
        params.sort = options.sort;
      }

      // Make API call
      const response = await this.apiKeysApi.listCurrentUserApplicationKeys(params);

      // Format response
      if (response.data && Array.isArray(response.data)) {
        const keys = response.data.map((key) => ({
          id: key.id,
          name: key.attributes?.name || 'N/A',
          created: key.attributes?.createdAt || 'N/A',
          scopes: key.attributes?.scopes?.join(', ') || 'N/A',
        }));

        return ResponseFormatter.formatTable(keys, ['id', 'name', 'created', 'scopes']);
      }

      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Create an application key for current user
   * @param name The name for the new application key
   * @param scopes Optional scopes for the application key
   * @returns Created application key details
   */
  async createCurrentUserApplicationKey(name: string, scopes?: string[]): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createWriteCheck('current-user-application-keys', 'create', `Creating application key for current user: ${name}`)
      );

      // Build body
      const body: any = {
        data: {
          type: 'application_keys',
          attributes: {
            name: name,
          },
        },
      };

      if (scopes && scopes.length > 0) {
        body.data.attributes.scopes = scopes;
      }

      // Make API call
      const response = await this.apiKeysApi.createCurrentUserApplicationKey({
        body: body,
      });

      return ResponseFormatter.formatJSON(response);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  /**
   * Delete current user's application key
   * @param keyId The application key ID
   * @returns Deletion confirmation
   */
  async deleteCurrentUserApplicationKey(keyId: string): Promise<string> {
    try {
      // Check permissions
      await PermissionManager.requirePermission(
        PermissionManager.createDeleteCheck(
          'current-user-application-keys',
          keyId,
          'This application key will be permanently deleted.'
        )
      );

      // Make API call
      await this.apiKeysApi.deleteCurrentUserApplicationKey({
        appKeyId: keyId,
      });

      return ResponseFormatter.formatSuccess('Application key deleted successfully', { id: keyId });
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }
}

/**
 * Convenience function to create a KeyManagementApi instance
 */
export function createKeyManagementApi(): KeyManagementApi {
  return new KeyManagementApi();
}
