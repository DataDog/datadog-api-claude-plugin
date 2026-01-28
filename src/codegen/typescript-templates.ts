// Unless explicitly stated otherwise all files in this repository are licensed
// under the Apache License Version 2.0.
// This product includes software developed at Datadog (https://www.datadoghq.com/).
// Copyright 2024-present Datadog, Inc.

/**
 * TypeScript code generation templates
 * Generates TypeScript code using @datadog/datadog-api-client
 */

export interface CodeGenOptions {
  domain: string;
  operation: string;
  params: Record<string, any>;
}

/**
 * Generate TypeScript code for Datadog API operations
 */
export class TypeScriptCodeGenerator {
  /**
   * Generate complete TypeScript code
   */
  generate(options: CodeGenOptions): string {
    const { domain, operation, params } = options;

    const imports = this.generateImports(domain);
    const config = this.generateConfiguration();
    const mainFunction = this.generateOperation(domain, operation, params);
    const errorHandling = this.generateErrorHandling();
    const usage = this.generateUsageExample(domain, operation);

    return `${imports}

${config}

${mainFunction}

${errorHandling}

${usage}`;
  }

  /**
   * Generate imports for the specified domain
   */
  private generateImports(domain: string): string {
    const v2Domains = ['metrics', 'logs', 'spans', 'rum', 'security', 'incidents', 'users'];
    const version = v2Domains.includes(domain) ? 'v2' : 'v1';

    return `/**
 * Datadog API Client - ${domain.charAt(0).toUpperCase() + domain.slice(1)} Operations
 * Generated code using @datadog/datadog-api-client
 */

import { client, ${version} } from '@datadog/datadog-api-client';`;
  }

  /**
   * Generate configuration setup
   */
  private generateConfiguration(): string {
    return `/**
 * Configure Datadog API client
 * Required environment variables:
 * - DD_API_KEY: Your Datadog API key
 * - DD_APP_KEY: Your Datadog Application key
 * - DD_SITE: Your Datadog site (default: datadoghq.com)
 */
const configuration = client.createConfiguration({
  authMethods: {
    apiKeyAuth: process.env.DD_API_KEY || '',
    appKeyAuth: process.env.DD_APP_KEY || '',
  },
});

// Set the Datadog site
if (process.env.DD_SITE) {
  configuration.setServerVariables({
    site: process.env.DD_SITE,
  });
}`;
  }

  /**
   * Generate the main operation function
   */
  private generateOperation(domain: string, operation: string, params: Record<string, any>): string {
    switch (domain) {
      case 'metrics':
        return this.generateMetricsOperation(operation, params);
      case 'monitors':
        return this.generateMonitorsOperation(operation, params);
      case 'dashboards':
        return this.generateDashboardsOperation(operation, params);
      case 'logs':
        return this.generateLogsOperation(operation, params);
      case 'traces':
        return this.generateTracesOperation(operation, params);
      case 'slos':
        return this.generateSLOsOperation(operation, params);
      case 'incidents':
        return this.generateIncidentsOperation(operation, params);
      case 'synthetics':
        return this.generateSyntheticsOperation(operation, params);
      case 'rum':
        return this.generateRUMOperation(operation, params);
      case 'security':
        return this.generateSecurityOperation(operation, params);
      case 'infrastructure':
        return this.generateInfrastructureOperation(operation, params);
      case 'admin':
        return this.generateAdminOperation(operation, params);
      default:
        return this.generateGenericOperation(domain, operation, params);
    }
  }

  /**
   * Generate metrics operations
   */
  private generateMetricsOperation(operation: string, params: Record<string, any>): string {
    switch (operation) {
      case 'query':
        return `/**
 * Query metrics from Datadog
 */
async function queryMetrics() {
  const apiInstance = new v2.MetricsApi(configuration);

  const body: v2.MetricsTimeseriesQuery = {
    data: {
      type: 'timeseries_request',
      attributes: {
        formulas: [{ formula: '${params.query || 'avg:system.cpu.user{*}'}' }],
        from: ${params.from || 'Math.floor(Date.now() / 1000) - 3600'}, // Unix timestamp
        to: ${params.to || 'Math.floor(Date.now() / 1000)'}, // Unix timestamp
        queries: [],
      },
    },
  };

  try {
    const result = await apiInstance.queryTimeseriesData({ body });
    console.log('Metrics query result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    handleError(error);
  }
}`;

      case 'list':
        return `/**
 * List available metrics
 */
async function listMetrics() {
  const apiInstance = new v2.MetricsApi(configuration);

  const params: v2.MetricsApiListTagsByMetricRequest = {
    metricName: '${params.filter || '*'}',
  };

  try {
    const result = await apiInstance.listTagsByMetric(params);
    console.log('Available metrics:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    handleError(error);
  }
}`;

      case 'submit':
        return `/**
 * Submit custom metrics to Datadog
 */
async function submitMetrics() {
  const apiInstance = new v2.MetricsApi(configuration);

  const body: v2.MetricPayload = {
    series: [
      {
        metric: '${params.metric || 'custom.metric'}',
        type: 1, // gauge
        points: [
          {
            timestamp: Math.floor(Date.now() / 1000),
            value: ${params.value || 42},
          },
        ],
        tags: ${JSON.stringify(params.tags || ['env:production'])},
      },
    ],
  };

  try {
    const result = await apiInstance.submitMetrics({ body });
    console.log('Metrics submitted successfully:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    handleError(error);
  }
}`;

      default:
        return this.generateGenericOperation('metrics', operation, params);
    }
  }

  /**
   * Generate monitors operations
   */
  private generateMonitorsOperation(operation: string, params: Record<string, any>): string {
    switch (operation) {
      case 'list':
        return `/**
 * List all monitors
 */
async function listMonitors() {
  const apiInstance = new v1.MonitorsApi(configuration);

  try {
    const result = await apiInstance.listMonitors();
    console.log(\`Found \${result.length} monitors\`);
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    handleError(error);
  }
}`;

      case 'get':
        return `/**
 * Get a specific monitor
 */
async function getMonitor() {
  const apiInstance = new v1.MonitorsApi(configuration);

  const monitorId = ${params.monitorId || 123456}; // Replace with your monitor ID

  try {
    const result = await apiInstance.getMonitor({ monitorId });
    console.log('Monitor details:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    handleError(error);
  }
}`;

      case 'create':
        return `/**
 * Create a new monitor
 */
async function createMonitor() {
  const apiInstance = new v1.MonitorsApi(configuration);

  const body: v1.Monitor = {
    name: '${params.name || 'High CPU Usage'}',
    type: v1.MonitorType.METRIC_ALERT,
    query: '${params.query || 'avg(last_5m):avg:system.cpu.user{*} > 90'}',
    message: '${params.message || 'CPU usage is above 90%'}',
    tags: ${JSON.stringify(params.tags || ['env:production'])},
    options: {
      thresholds: {
        critical: ${params.critical || 90},
        warning: ${params.warning || 75},
      },
      notifyNoData: true,
      noDataTimeframe: 10,
    },
  };

  try {
    const result = await apiInstance.createMonitor({ body });
    console.log('Monitor created successfully:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    handleError(error);
  }
}`;

      default:
        return this.generateGenericOperation('monitors', operation, params);
    }
  }

  /**
   * Generate dashboards operations
   */
  private generateDashboardsOperation(operation: string, params: Record<string, any>): string {
    switch (operation) {
      case 'list':
        return `/**
 * List all dashboards
 */
async function listDashboards() {
  const apiInstance = new v1.DashboardsApi(configuration);

  try {
    const result = await apiInstance.listDashboards();
    console.log(\`Found \${result.dashboards?.length || 0} dashboards\`);
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    handleError(error);
  }
}`;

      case 'create':
        return `/**
 * Create a new dashboard
 */
async function createDashboard() {
  const apiInstance = new v1.DashboardsApi(configuration);

  const body: v1.Dashboard = {
    title: '${params.title || 'My Dashboard'}',
    description: '${params.description || 'Dashboard created via API'}',
    widgets: [
      {
        definition: {
          type: 'timeseries',
          requests: [
            {
              q: '${params.query || 'avg:system.cpu.user{*}'}',
              displayType: 'line',
            },
          ],
          title: '${params.widgetTitle || 'CPU Usage'}',
        },
      },
    ],
    layoutType: v1.DashboardLayoutType.ORDERED,
  };

  try {
    const result = await apiInstance.createDashboard({ body });
    console.log('Dashboard created successfully:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    handleError(error);
  }
}`;

      default:
        return this.generateGenericOperation('dashboards', operation, params);
    }
  }

  /**
   * Generate logs operations
   */
  private generateLogsOperation(_operation: string, params: Record<string, any>): string {
    return `/**
 * Search logs
 */
async function searchLogs() {
  const apiInstance = new v2.LogsApi(configuration);

  const body: v2.LogsListRequest = {
    filter: {
      query: '${params.query || 'status:error'}',
      from: new Date(${params.from || 'Date.now() - 3600000'}).toISOString(),
      to: new Date(${params.to || 'Date.now()'}).toISOString(),
    },
    page: {
      limit: ${params.limit || 50},
    },
    sort: v2.LogsSort.TIMESTAMP_ASCENDING,
  };

  try {
    const result = await apiInstance.listLogs({ body });
    console.log(\`Found \${result.data?.length || 0} log entries\`);
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    handleError(error);
  }
}`;
  }

  /**
   * Generate traces operations
   */
  private generateTracesOperation(_operation: string, params: Record<string, any>): string {
    return `/**
 * Search traces/spans
 */
async function searchTraces() {
  const apiInstance = new v2.SpansApi(configuration);

  const body: v2.SpansListRequest = {
    filter: {
      query: '${params.query || 'service:web-app'}',
      from: new Date(${params.from || 'Date.now() - 3600000'}).toISOString(),
      to: new Date(${params.to || 'Date.now()'}).toISOString(),
    },
    page: {
      limit: ${params.limit || 50},
    },
    sort: 'timestamp',
  };

  try {
    const result = await apiInstance.listSpans({ body } as any);
    console.log(\`Found \${result.data?.length || 0} spans\`);
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    handleError(error);
  }
}`;
  }

  /**
   * Generate SLOs operations
   */
  private generateSLOsOperation(_operation: string, _params: Record<string, any>): string {
    return `/**
 * List SLOs
 */
async function listSLOs() {
  const apiInstance = new v1.ServiceLevelObjectivesApi(configuration);

  try {
    const result = await apiInstance.listSLOs();
    console.log(\`Found \${result.data?.length || 0} SLOs\`);
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    handleError(error);
  }
}`;
  }

  /**
   * Generate incidents operations
   */
  private generateIncidentsOperation(_operation: string, _params: Record<string, any>): string {
    return `/**
 * List incidents
 */
async function listIncidents() {
  const apiInstance = new v2.IncidentsApi(configuration);

  try {
    const result = await apiInstance.listIncidents();
    console.log(\`Found \${result.data?.length || 0} incidents\`);
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    handleError(error);
  }
}`;
  }

  /**
   * Generate synthetics operations
   */
  private generateSyntheticsOperation(_operation: string, _params: Record<string, any>): string {
    return `/**
 * List synthetic tests
 */
async function listSyntheticTests() {
  const apiInstance = new v1.SyntheticsApi(configuration);

  try {
    const result = await apiInstance.listTests();
    console.log(\`Found \${result.tests?.length || 0} tests\`);
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    handleError(error);
  }
}`;
  }

  /**
   * Generate RUM operations
   */
  private generateRUMOperation(_operation: string, params: Record<string, any>): string {
    return `/**
 * Search RUM events
 */
async function searchRUMEvents() {
  const apiInstance = new v2.RUMApi(configuration);

  const body = {
    filter: {
      query: '${params.query || '@type:view'}',
      from: new Date(${params.from || 'Date.now() - 3600000'}).toISOString(),
      to: new Date(${params.to || 'Date.now()'}).toISOString(),
    },
    page: {
      limit: ${params.limit || 50},
    },
  };

  try {
    const result = await apiInstance.listRUMEvents({ body } as any);
    console.log(\`Found \${result.data?.length || 0} RUM events\`);
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    handleError(error);
  }
}`;
  }

  /**
   * Generate security operations
   */
  private generateSecurityOperation(_operation: string, params: Record<string, any>): string {
    return `/**
 * Search security signals
 */
async function searchSecuritySignals() {
  const apiInstance = new v2.SecurityMonitoringApi(configuration);

  const body: v2.SecurityMonitoringSignalListRequest = {
    filter: {
      query: '${params.query || '*'}',
      from: new Date(${params.from || 'Date.now() - 3600000'}),
      to: new Date(${params.to || 'Date.now()'}),
    },
    page: {
      limit: ${params.limit || 50},
    },
  };

  try {
    const result = await apiInstance.searchSecurityMonitoringSignals({ body });
    console.log(\`Found \${result.data?.length || 0} security signals\`);
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    handleError(error);
  }
}`;
  }

  /**
   * Generate infrastructure operations
   */
  private generateInfrastructureOperation(_operation: string, params: Record<string, any>): string {
    return `/**
 * List infrastructure hosts
 */
async function listHosts() {
  const apiInstance = new v1.HostsApi(configuration);

  const queryParams: any = {};
  if ('${params.filter || ''}') {
    queryParams.filter = '${params.filter}';
  }

  try {
    const result = await apiInstance.listHosts(queryParams);
    console.log(\`Found \${result.hostList?.length || 0} hosts\`);
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    handleError(error);
  }
}`;
  }

  /**
   * Generate admin operations
   */
  private generateAdminOperation(_operation: string, _params: Record<string, any>): string {
    return `/**
 * List users
 */
async function listUsers() {
  const apiInstance = new v2.UsersApi(configuration);

  try {
    const result = await apiInstance.listUsers();
    console.log(\`Found \${result.data?.length || 0} users\`);
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    handleError(error);
  }
}`;
  }

  /**
   * Generate generic operation (fallback)
   */
  private generateGenericOperation(domain: string, operation: string, params: Record<string, any>): string {
    return `/**
 * ${operation} operation for ${domain}
 * Note: This is a generic template. Customize as needed.
 */
async function perform${operation.charAt(0).toUpperCase() + operation.slice(1)}() {
  // TODO: Implement ${operation} for ${domain}
  // Parameters: ${JSON.stringify(params)}
  console.log('Operation not yet implemented');
}`;
  }

  /**
   * Generate error handling
   */
  private generateErrorHandling(): string {
    return `/**
 * Handle API errors
 */
function handleError(error: any): never {
  if (error.response) {
    console.error('API Error:', {
      status: error.response.status,
      statusText: error.response.statusText,
      body: error.response.body,
    });
  } else {
    console.error('Error:', error.message);
  }
  process.exit(1);
}`;
  }

  /**
   * Generate usage example
   */
  private generateUsageExample(domain: string, operation: string): string {
    const functionName = this.getFunctionName(domain, operation);

    return `/**
 * Main execution
 */
async function main() {
  // Validate environment variables
  if (!process.env.DD_API_KEY || !process.env.DD_APP_KEY) {
    console.error('Error: DD_API_KEY and DD_APP_KEY environment variables are required');
    console.error('Set them with: export DD_API_KEY="..." DD_APP_KEY="..."');
    process.exit(1);
  }

  await ${functionName}();
}

// Run the script
main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});`;
  }

  /**
   * Get function name for domain and operation
   */
  private getFunctionName(domain: string, operation: string): string {
    const operationMap: Record<string, string> = {
      'metrics-query': 'queryMetrics',
      'metrics-list': 'listMetrics',
      'metrics-submit': 'submitMetrics',
      'monitors-list': 'listMonitors',
      'monitors-get': 'getMonitor',
      'monitors-create': 'createMonitor',
      'dashboards-list': 'listDashboards',
      'dashboards-create': 'createDashboard',
      'logs-search': 'searchLogs',
      'traces-search': 'searchTraces',
      'slos-list': 'listSLOs',
      'incidents-list': 'listIncidents',
      'synthetics-list': 'listSyntheticTests',
      'rum-search': 'searchRUMEvents',
      'security-signals': 'searchSecuritySignals',
      'infrastructure-hosts': 'listHosts',
      'admin-users': 'listUsers',
    };

    return operationMap[`${domain}-${operation}`] || `perform${operation.charAt(0).toUpperCase() + operation.slice(1)}`;
  }
}

/**
 * Export convenience function
 */
export function generateTypeScriptCode(options: CodeGenOptions): string {
  const generator = new TypeScriptCodeGenerator();
  return generator.generate(options);
}
