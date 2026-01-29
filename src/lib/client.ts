// Unless explicitly stated otherwise all files in this repository are licensed
// under the Apache License Version 2.0.
// This product includes software developed at Datadog (https://www.datadoghq.com/).
// Copyright 2024-present Datadog, Inc.

/**
 * Datadog API client wrapper with singleton pattern
 */

import { client, v1, v2 } from '@datadog/datadog-api-client';
import { ConfigValidator } from './config';

// Re-export v1 and v2 for use by API implementations
export { v1, v2 };

/**
 * Custom HttpLibrary implementation that adds agent identification headers
 */
class AgentIdentifyingHttpLibrary implements client.HttpLibrary {
  private wrapped: client.HttpLibrary;
  private agentHeaders: Record<string, string>;

  constructor(wrapped: client.HttpLibrary, agentHeaders: Record<string, string>) {
    this.wrapped = wrapped;
    this.agentHeaders = agentHeaders;
  }

  async send(request: client.RequestContext): Promise<client.ResponseContext> {
    // Add agent identification headers to the request
    for (const [key, value] of Object.entries(this.agentHeaders)) {
      request.setHeaderParam(key, value);
    }
    return this.wrapped.send(request);
  }

  // Forward other properties to the wrapped library
  get enableRetry() { return this.wrapped.enableRetry; }
  set enableRetry(value) { this.wrapped.enableRetry = value; }
  get maxRetries() { return this.wrapped.maxRetries; }
  set maxRetries(value) { this.wrapped.maxRetries = value; }
  get backoffBase() { return this.wrapped.backoffBase; }
  set backoffBase(value) { this.wrapped.backoffBase = value; }
  get backoffMultiplier() { return this.wrapped.backoffMultiplier; }
  set backoffMultiplier(value) { this.wrapped.backoffMultiplier = value; }
  get debug() { return this.wrapped.debug; }
  set debug(value) { this.wrapped.debug = value; }
  get fetch() { return this.wrapped.fetch; }
  set fetch(value) { this.wrapped.fetch = value; }
  get zstdCompressorCallback() { return this.wrapped.zstdCompressorCallback; }
  set zstdCompressorCallback(value) { this.wrapped.zstdCompressorCallback = value; }
}

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

    // Build agent identification headers
    const agentHeaders: Record<string, string> = {
      'DD-Agent-Type': config.agentInfo.type,
    };

    if (config.agentInfo.version) {
      agentHeaders['DD-Agent-Version'] = config.agentInfo.version;
    }

    // Add metadata as JSON in a custom header
    if (config.agentInfo.metadata && Object.keys(config.agentInfo.metadata).length > 0) {
      agentHeaders['DD-Agent-Metadata'] = JSON.stringify(config.agentInfo.metadata);
    }

    // Create User-Agent string with agent information
    const userAgentParts = [
      `datadog-api-claude-plugin/${config.agentInfo.metadata?.plugin_version || 'unknown'}`,
      `agent/${config.agentInfo.type}`,
    ];
    if (config.agentInfo.version) {
      userAgentParts.push(`agent-version/${config.agentInfo.version}`);
    }
    agentHeaders['User-Agent'] = userAgentParts.join(' ');

    // Create base configuration
    const baseConfig = client.createConfiguration({
      authMethods: {
        apiKeyAuth: config.apiKey,
        appKeyAuth: config.appKey,
      },
    });

    // Wrap the HTTP library to add agent headers
    const wrappedHttpApi = new AgentIdentifyingHttpLibrary(
      baseConfig.httpApi,
      agentHeaders
    );

    // Create final configuration with wrapped HTTP library
    this.configuration = client.createConfiguration({
      authMethods: {
        apiKeyAuth: config.apiKey,
        appKeyAuth: config.appKey,
      },
      httpApi: wrappedHttpApi,
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
