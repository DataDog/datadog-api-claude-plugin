// Unless explicitly stated otherwise all files in this repository are licensed
// under the Apache License Version 2.0.
// This product includes software developed at Datadog (https://www.datadoghq.com/).
// Copyright 2024-2026 Datadog, Inc.

/**
 * Datadog API client wrapper with singleton pattern
 */

import { client, v1, v2 } from '@datadog/datadog-api-client';
import { ConfigValidator } from './config';

// Re-export v1 and v2 for use by API implementations
export { v1, v2 };

/**
 * Singleton wrapper for Datadog API client
 * Provides access to both v1 and v2 APIs
 */
export class DatadogClient {
  private static instance: DatadogClient | null = null;
  private configuration: client.Configuration;

  private constructor() {
    // Validate configuration and get credentials
    const config = ConfigValidator.validate();

    // Create Datadog client configuration
    this.configuration = client.createConfiguration({
      authMethods: {
        apiKeyAuth: config.apiKey,
        appKeyAuth: config.appKey,
      },
    });

    // Set the Datadog site
    this.configuration.setServerVariables({
      site: config.site,
    });

    // Enable unstable operations for incidents API
    this.configuration.unstableOperations = {
      'v2.listIncidents': true,
      'v2.getIncident': true,
      'v2.createIncident': true,
      'v2.updateIncident': true,
      'v2.deleteIncident': true,
      'v2.searchIncidents': true,
    };
  }

  /**
   * Gets the singleton instance of DatadogClient
   * @returns The DatadogClient instance
   * @throws {ConfigError} If configuration validation fails
   */
  static getInstance(): DatadogClient {
    if (!DatadogClient.instance) {
      DatadogClient.instance = new DatadogClient();
    }
    return DatadogClient.instance;
  }

  /**
   * Resets the singleton instance (useful for testing or reconfiguration)
   */
  static reset(): void {
    DatadogClient.instance = null;
    ConfigValidator.reset();
  }

  /**
   * Gets a v1 API instance
   * @param ApiClass The v1 API class to instantiate
   * @returns An instance of the specified v1 API class
   *
   * @example
   * const monitorsApi = client.getV1Api(v1.MonitorsApi);
   * const dashboardsApi = client.getV1Api(v1.DashboardsApi);
   */
  getV1Api<T>(ApiClass: new (config: client.Configuration) => T): T {
    return new ApiClass(this.configuration);
  }

  /**
   * Gets a v2 API instance
   * @param ApiClass The v2 API class to instantiate
   * @returns An instance of the specified v2 API class
   *
   * @example
   * const metricsApi = client.getV2Api(v2.MetricsApi);
   * const incidentsApi = client.getV2Api(v2.IncidentsApi);
   */
  getV2Api<T>(ApiClass: new (config: client.Configuration) => T): T {
    return new ApiClass(this.configuration);
  }

  /**
   * Gets the underlying configuration (for advanced usage)
   * @returns The Datadog client configuration
   */
  getConfiguration(): client.Configuration {
    return this.configuration;
  }
}

/**
 * Convenience function to get the Datadog client instance
 * @returns The DatadogClient singleton instance
 */
export function getClient(): DatadogClient {
  return DatadogClient.getInstance();
}

/**
 * Convenience function to get a v1 API instance
 * @param ApiClass The v1 API class to instantiate
 * @returns An instance of the specified v1 API class
 */
export function getV1Api<T>(ApiClass: new (config: client.Configuration) => T): T {
  return DatadogClient.getInstance().getV1Api(ApiClass);
}

/**
 * Convenience function to get a v2 API instance
 * @param ApiClass The v2 API class to instantiate
 * @returns An instance of the specified v2 API class
 */
export function getV2Api<T>(ApiClass: new (config: client.Configuration) => T): T {
  return DatadogClient.getInstance().getV2Api(ApiClass);
}
