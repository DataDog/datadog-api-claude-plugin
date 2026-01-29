// Unless explicitly stated otherwise all files in this repository are licensed
// under the Apache License Version 2.0.
// This product includes software developed at Datadog (https://www.datadoghq.com/).
// Copyright 2024-present Datadog, Inc.

/**
 * Configuration and credential validation for Datadog API
 */

export interface AgentInfo {
  type: string;
  version?: string;
  metadata?: Record<string, string>;
}

export interface DatadogConfig {
  apiKey: string;
  appKey: string;
  site: string;
  autoApprove: boolean;
  agentInfo: AgentInfo;
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

/**
 * Validates and retrieves Datadog configuration from environment variables
 */
export class ConfigValidator {
  private static instance: DatadogConfig | null = null;

  /**
   * Detects agent information from environment variables and process context
   * @returns AgentInfo object with detected agent details
   */
  private static detectAgentInfo(): AgentInfo {
    // Check for explicit agent identification via environment variables
    const agentType = process.env.DD_AGENT_TYPE;
    const agentVersion = process.env.DD_AGENT_VERSION;

    // Auto-detect agent type from common environment variables
    let detectedType = agentType || 'unknown';
    const metadata: Record<string, string> = {};

    // Claude detection
    if (!agentType) {
      if (process.env.CLAUDE_MODEL || process.env.ANTHROPIC_API_KEY) {
        detectedType = 'claude';
        if (process.env.CLAUDE_MODEL) {
          metadata.model = process.env.CLAUDE_MODEL;
        }
      }
      // Letta detection
      else if (process.env.LETTA_API_KEY || process.env.LETTA_BASE_URL) {
        detectedType = 'letta';
        if (process.env.LETTA_VERSION) {
          metadata.version = process.env.LETTA_VERSION;
        }
      }
      // ChatGPT/OpenAI detection
      else if (process.env.OPENAI_API_KEY || process.env.OPENAI_MODEL) {
        detectedType = 'chatgpt';
        if (process.env.OPENAI_MODEL) {
          metadata.model = process.env.OPENAI_MODEL;
        }
      }
      // Generic AI assistant detection
      else if (process.env.AI_ASSISTANT_TYPE) {
        detectedType = process.env.AI_ASSISTANT_TYPE;
      }
    }

    // Add runtime information
    metadata.runtime = 'nodejs';
    metadata.node_version = process.version;

    // Add plugin version from package.json if available
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const packageJson = require('../../package.json');
      metadata.plugin_version = packageJson.version;
    } catch {
      // Ignore if package.json is not available
    }

    return {
      type: detectedType,
      version: agentVersion,
      metadata,
    };
  }

  /**
   * Validates and returns Datadog configuration
   * @throws {ConfigError} If required environment variables are missing
   */
  static validate(): DatadogConfig {
    if (this.instance) {
      return this.instance;
    }

    const apiKey = process.env.DD_API_KEY;
    const appKey = process.env.DD_APP_KEY;
    const site = process.env.DD_SITE || 'datadoghq.com';
    const autoApprove = process.env.DD_AUTO_APPROVE === 'true';
    const agentInfo = this.detectAgentInfo();

    if (!apiKey) {
      throw new ConfigError(
        'DD_API_KEY environment variable is required. ' +
        'Set it with: export DD_API_KEY="your-api-key"'
      );
    }

    if (!appKey) {
      throw new ConfigError(
        'DD_APP_KEY environment variable is required. ' +
        'Set it with: export DD_APP_KEY="your-app-key"'
      );
    }

    // Basic validation for API key format
    if (apiKey.length < 32) {
      throw new ConfigError(
        'DD_API_KEY appears to be invalid (too short). ' +
        'Please check your API key at https://app.datadoghq.com/account/settings#api'
      );
    }

    // Basic validation for App key format
    if (appKey.length < 32) {
      throw new ConfigError(
        'DD_APP_KEY appears to be invalid (too short). ' +
        'Please check your Application key at https://app.datadoghq.com/account/settings#api'
      );
    }

    // Validate site format
    const validSites = [
      'datadoghq.com',       // US1
      'us3.datadoghq.com',   // US3
      'us5.datadoghq.com',   // US5
      'datadoghq.eu',        // EU1
      'ddog-gov.com',        // US1-FED
      'ap1.datadoghq.com',   // AP1
    ];

    if (!validSites.includes(site)) {
      console.warn(
        `Warning: DD_SITE "${site}" is not a standard Datadog site. ` +
        `Valid sites are: ${validSites.join(', ')}`
      );
    }

    this.instance = { apiKey, appKey, site, autoApprove, agentInfo };
    return this.instance;
  }

  /**
   * Clears the cached configuration (useful for testing)
   */
  static reset(): void {
    this.instance = null;
  }

  /**
   * Gets the current configuration without validation
   * @returns The cached configuration or null if not yet validated
   */
  static getCurrent(): DatadogConfig | null {
    return this.instance;
  }
}
