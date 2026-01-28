// Unless explicitly stated otherwise all files in this repository are licensed
// under the Apache License Version 2.0.
// This product includes software developed at Datadog (https://www.datadoghq.com/).
// Copyright 2024-2026 Datadog, Inc.

/**
 * Java code generation templates
 * Generates Java code using datadog-api-client-java
 */

export interface CodeGenOptions {
  domain: string;
  operation: string;
  params: Record<string, any>;
}

/**
 * Generate Java code for Datadog API operations
 */
export class JavaCodeGenerator {
  /**
   * Generate complete Java code
   */
  generate(options: CodeGenOptions): string {
    const { domain, operation, params } = options;

    const packageDeclaration = 'package com.datadog.api.example;';
    const imports = this.generateImports(domain, operation);
    const classDeclaration = this.generateClassDeclaration(domain, operation);
    const mainMethod = this.generateMainMethod(domain, operation, params);
    const operationMethod = this.generateOperationMethod(domain, operation, params);

    return `${packageDeclaration}

${imports}

${classDeclaration} {
${mainMethod}

${operationMethod}
}`;
  }

  /**
   * Generate imports for the specified domain
   */
  private generateImports(domain: string, operation: string): string {
    const v2Domains = ['metrics', 'logs', 'spans', 'rum', 'security', 'incidents', 'users'];
    const version = v2Domains.includes(domain) ? 'v2' : 'v1';

    const baseImports = `/**
 * Datadog API Client - ${domain.charAt(0).toUpperCase() + domain.slice(1)} Operations
 * Generated code using datadog-api-client-java
 */

import com.datadog.api.client.ApiClient;
import com.datadog.api.client.ApiException;`;

    const specificImports = this.generateSpecificImports(domain, operation, version);

    return `${baseImports}
${specificImports}
import java.util.*;`;
  }

  /**
   * Generate specific imports based on domain and operation
   */
  private generateSpecificImports(domain: string, operation: string, version: string): string {
    const versionPackage = version;

    switch (domain) {
      case 'metrics':
        if (operation === 'query') {
          return `import com.datadog.api.client.${versionPackage}.api.MetricsApi;
import com.datadog.api.client.${versionPackage}.model.*;`;
        }
        return `import com.datadog.api.client.${versionPackage}.api.MetricsApi;
import com.datadog.api.client.${versionPackage}.model.*;`;

      case 'monitors':
        return `import com.datadog.api.client.v1.api.MonitorsApi;
import com.datadog.api.client.v1.model.*;`;

      case 'dashboards':
        return `import com.datadog.api.client.v1.api.DashboardsApi;
import com.datadog.api.client.v1.model.*;`;

      case 'logs':
        return `import com.datadog.api.client.v2.api.LogsApi;
import com.datadog.api.client.v2.model.*;
import java.time.OffsetDateTime;`;

      case 'traces':
        return `import com.datadog.api.client.v2.api.SpansApi;
import com.datadog.api.client.v2.model.*;
import java.time.OffsetDateTime;`;

      case 'slos':
        return `import com.datadog.api.client.v1.api.ServiceLevelObjectivesApi;
import com.datadog.api.client.v1.model.*;`;

      case 'incidents':
        return `import com.datadog.api.client.v2.api.IncidentsApi;
import com.datadog.api.client.v2.model.*;`;

      case 'synthetics':
        return `import com.datadog.api.client.v1.api.SyntheticsApi;
import com.datadog.api.client.v1.model.*;`;

      case 'rum':
        return `import com.datadog.api.client.v2.api.RUMApi;
import com.datadog.api.client.v2.model.*;
import java.time.OffsetDateTime;`;

      case 'security':
        return `import com.datadog.api.client.v2.api.SecurityMonitoringApi;
import com.datadog.api.client.v2.model.*;
import java.time.OffsetDateTime;`;

      case 'infrastructure':
        return `import com.datadog.api.client.v1.api.HostsApi;
import com.datadog.api.client.v1.model.*;`;

      case 'admin':
        return `import com.datadog.api.client.v2.api.UsersApi;
import com.datadog.api.client.v2.model.*;`;

      default:
        return `import com.datadog.api.client.${versionPackage}.api.*;
import com.datadog.api.client.${versionPackage}.model.*;`;
    }
  }

  /**
   * Generate class declaration
   */
  private generateClassDeclaration(domain: string, operation: string): string {
    const className = this.toClassName(`${domain}_${operation}_example`);
    return `public class ${className}`;
  }

  /**
   * Generate main method
   */
  private generateMainMethod(domain: string, operation: string, _params: Record<string, any>): string {
    const methodName = this.toMethodName(`${operation}_${domain}`);

    return `  public static void main(String[] args) {
    // Validate environment variables
    String apiKey = System.getenv("DD_API_KEY");
    String appKey = System.getenv("DD_APP_KEY");
    String site = System.getenv("DD_SITE");

    if (apiKey == null || apiKey.isEmpty() || appKey == null || appKey.isEmpty()) {
      System.err.println("Error: DD_API_KEY and DD_APP_KEY environment variables are required");
      System.err.println("Set them with: export DD_API_KEY='...' DD_APP_KEY='...'");
      System.exit(1);
    }

    // Configure Datadog client
    ApiClient defaultClient = ApiClient.getDefaultApiClient();

    // Configure authentication
    HashMap<String, String> secrets = new HashMap<>();
    secrets.put("apiKeyAuth", apiKey);
    secrets.put("appKeyAuth", appKey);
    defaultClient.configureApiKeys(secrets);

    // Set Datadog site if specified
    if (site != null && !site.isEmpty()) {
      HashMap<String, String> serverVariables = new HashMap<>();
      serverVariables.put("site", site);
      defaultClient.setServerVariables(serverVariables);
    }

    try {
      ${methodName}(defaultClient);
    } catch (ApiException e) {
      System.err.println("Exception when calling Datadog API");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
      System.exit(1);
    }
  }`;
  }

  /**
   * Generate the operation method
   */
  private generateOperationMethod(domain: string, operation: string, params: Record<string, any>): string {
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
        return `  /**
   * Query metrics from Datadog
   */
  private static void queryMetrics(ApiClient apiClient) throws ApiException {
    MetricsApi apiInstance = new MetricsApi(apiClient);

    // Define time range (Unix timestamps in milliseconds)
    long from = ${params.from || 'System.currentTimeMillis() - 3600000'};
    long to = ${params.to || 'System.currentTimeMillis()'};

    TimeseriesFormulaQueryRequest body = new TimeseriesFormulaQueryRequest()
        .data(new TimeseriesFormulaRequest()
            .attributes(new TimeseriesFormulaRequestAttributes()
                .formulas(Collections.singletonList(
                    new QueryFormula()
                        .formula("${params.query || 'avg:system.cpu.user{*}'}")))
                .from(from)
                .to(to)
                .interval(300000L))
            .type(TimeseriesFormulaRequestType.TIMESERIES_REQUEST));

    TimeseriesFormulaQueryResponse result = apiInstance.queryTimeseriesData(body);
    System.out.println("Metrics query result:");
    System.out.println(result);
  }`;

      case 'list':
        return `  /**
   * List available metrics
   */
  private static void listMetrics(ApiClient apiClient) throws ApiException {
    MetricsApi apiInstance = new MetricsApi(apiClient);

    String filter = "${params.filter || '*'}";

    // Note: List metrics endpoint may vary based on API version
    // This is a placeholder - adjust based on actual API endpoint available
    System.out.println("Listing metrics matching filter: " + filter);
    System.out.println("Use metrics query endpoint to get specific metric data");
  }`;

      case 'submit':
        return `  /**
   * Submit custom metrics to Datadog
   */
  private static void submitMetrics(ApiClient apiClient) throws ApiException {
    MetricsApi apiInstance = new MetricsApi(apiClient);

    MetricPayload body = new MetricPayload()
        .series(Collections.singletonList(
            new MetricSeries()
                .metric("${params.metric || 'custom.metric'}")
                .type(MetricIntakeType.GAUGE)
                .points(Collections.singletonList(
                    new MetricPoint()
                        .timestamp(System.currentTimeMillis() / 1000)
                        .value(${params.value || 42.0})))
                .tags(${this.formatJavaArray(params.tags || ['env:production'])})));

    MetricPayloadResponse result = apiInstance.submitMetrics(body);
    System.out.println("Metrics submitted successfully:");
    System.out.println(result);
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
        return `  /**
   * List all monitors
   */
  private static void listMonitors(ApiClient apiClient) throws ApiException {
    MonitorsApi apiInstance = new MonitorsApi(apiClient);

    List<Monitor> result = apiInstance.listMonitors();
    System.out.println("Found " + result.size() + " monitors");
    for (Monitor monitor : result) {
      System.out.println(monitor);
    }
  }`;

      case 'get':
        return `  /**
   * Get a specific monitor
   */
  private static void getMonitor(ApiClient apiClient) throws ApiException {
    MonitorsApi apiInstance = new MonitorsApi(apiClient);

    Long monitorId = ${params.monitorId || '123456L'}; // Replace with your monitor ID

    Monitor result = apiInstance.getMonitor(monitorId);
    System.out.println("Monitor details:");
    System.out.println(result);
  }`;

      case 'create':
        return `  /**
   * Create a new monitor
   */
  private static void createMonitor(ApiClient apiClient) throws ApiException {
    MonitorsApi apiInstance = new MonitorsApi(apiClient);

    Monitor body = new Monitor()
        .name("${params.name || 'High CPU Usage'}")
        .type(MonitorType.METRIC_ALERT)
        .query("${params.query || 'avg(last_5m):avg:system.cpu.user{*} > 90'}")
        .message("${params.message || 'CPU usage is above 90%'}")
        .tags(${this.formatJavaArray(params.tags || ['env:production'])})
        .options(new MonitorOptions()
            .thresholds(new MonitorThresholds()
                .critical(${params.critical || 90.0})
                .warning(${params.warning || 75.0}))
            .notifyNoData(true)
            .noDataTimeframe(10L));

    Monitor result = apiInstance.createMonitor(body);
    System.out.println("Monitor created successfully:");
    System.out.println(result);
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
        return `  /**
   * List all dashboards
   */
  private static void listDashboards(ApiClient apiClient) throws ApiException {
    DashboardsApi apiInstance = new DashboardsApi(apiClient);

    DashboardSummaryList result = apiInstance.listDashboards();
    if (result.getDashboards() != null) {
      System.out.println("Found " + result.getDashboards().size() + " dashboards");
      System.out.println(result);
    }
  }`;

      case 'create':
        return `  /**
   * Create a new dashboard
   */
  private static void createDashboard(ApiClient apiClient) throws ApiException {
    DashboardsApi apiInstance = new DashboardsApi(apiClient);

    Dashboard body = new Dashboard()
        .title("${params.title || 'My Dashboard'}")
        .description("${params.description || 'Dashboard created via API'}")
        .widgets(Collections.singletonList(
            new Widget()
                .definition(new TimeseriesWidgetDefinition()
                    .type(TimeseriesWidgetDefinitionType.TIMESERIES)
                    .requests(Collections.singletonList(
                        new TimeseriesWidgetRequest()
                            .q("${params.query || 'avg:system.cpu.user{*}'}")
                            .displayType(WidgetDisplayType.LINE)))
                    .title("${params.widgetTitle || 'CPU Usage'}"))))
        .layoutType(DashboardLayoutType.ORDERED);

    Dashboard result = apiInstance.createDashboard(body);
    System.out.println("Dashboard created successfully:");
    System.out.println(result);
  }`;

      default:
        return this.generateGenericOperation('dashboards', operation, params);
    }
  }

  /**
   * Generate logs operations
   */
  private generateLogsOperation(_operation: string, params: Record<string, any>): string {
    return `  /**
   * Search logs
   */
  private static void searchLogs(ApiClient apiClient) throws ApiException {
    LogsApi apiInstance = new LogsApi(apiClient);

    OffsetDateTime from = OffsetDateTime.now().minusHours(1);
    OffsetDateTime to = OffsetDateTime.now();

    LogsListRequest body = new LogsListRequest()
        .filter(new LogsQueryFilter()
            .query("${params.query || 'status:error'}")
            .from(from.toString())
            .to(to.toString()))
        .page(new LogsListRequestPage()
            .limit(${params.limit || 50}))
        .sort(LogsSort.TIMESTAMP_ASCENDING);

    LogsListResponse result = apiInstance.listLogs(new LogsApi.ListLogsOptionalParameters().body(body));
    if (result.getData() != null) {
      System.out.println("Found " + result.getData().size() + " log entries");
      System.out.println(result);
    }
  }`;
  }

  /**
   * Generate traces operations
   */
  private generateTracesOperation(_operation: string, params: Record<string, any>): string {
    return `  /**
   * Search traces/spans
   */
  private static void searchTraces(ApiClient apiClient) throws ApiException {
    SpansApi apiInstance = new SpansApi(apiClient);

    OffsetDateTime from = OffsetDateTime.now().minusHours(1);
    OffsetDateTime to = OffsetDateTime.now();

    SpansListRequest body = new SpansListRequest()
        .filter(new SpansQueryFilter()
            .query("${params.query || 'service:web-app'}")
            .from(from.toString())
            .to(to.toString()))
        .page(new SpansListRequestPage()
            .limit(${params.limit || 50}))
        .sort(SpansSort.TIMESTAMP_ASCENDING);

    SpansListResponse result = apiInstance.listSpans(new SpansApi.ListSpansOptionalParameters().body(body));
    if (result.getData() != null) {
      System.out.println("Found " + result.getData().size() + " spans");
      System.out.println(result);
    }
  }`;
  }

  /**
   * Generate SLOs operations
   */
  private generateSLOsOperation(_operation: string, _params: Record<string, any>): string {
    return `  /**
   * List SLOs
   */
  private static void listSlos(ApiClient apiClient) throws ApiException {
    ServiceLevelObjectivesApi apiInstance = new ServiceLevelObjectivesApi(apiClient);

    SLOListResponse result = apiInstance.listSLOs();
    if (result.getData() != null) {
      System.out.println("Found " + result.getData().size() + " SLOs");
      System.out.println(result);
    }
  }`;
  }

  /**
   * Generate incidents operations
   */
  private generateIncidentsOperation(_operation: string, _params: Record<string, any>): string {
    return `  /**
   * List incidents
   */
  private static void listIncidents(ApiClient apiClient) throws ApiException {
    IncidentsApi apiInstance = new IncidentsApi(apiClient);

    IncidentsResponse result = apiInstance.listIncidents();
    if (result.getData() != null) {
      System.out.println("Found " + result.getData().size() + " incidents");
      System.out.println(result);
    }
  }`;
  }

  /**
   * Generate synthetics operations
   */
  private generateSyntheticsOperation(_operation: string, _params: Record<string, any>): string {
    return `  /**
   * List synthetic tests
   */
  private static void listSyntheticTests(ApiClient apiClient) throws ApiException {
    SyntheticsApi apiInstance = new SyntheticsApi(apiClient);

    SyntheticsListTestsResponse result = apiInstance.listTests();
    if (result.getTests() != null) {
      System.out.println("Found " + result.getTests().size() + " tests");
      System.out.println(result);
    }
  }`;
  }

  /**
   * Generate RUM operations
   */
  private generateRUMOperation(_operation: string, params: Record<string, any>): string {
    return `  /**
   * Search RUM events
   */
  private static void searchRumEvents(ApiClient apiClient) throws ApiException {
    RUMApi apiInstance = new RUMApi(apiClient);

    OffsetDateTime from = OffsetDateTime.now().minusHours(1);
    OffsetDateTime to = OffsetDateTime.now();

    RUMSearchEventsRequest body = new RUMSearchEventsRequest()
        .filter(new RUMQueryFilter()
            .query("${params.query || '@type:view'}")
            .from(from.toString())
            .to(to.toString()))
        .page(new RUMQueryPageOptions()
            .limit(${params.limit || 50}));

    RUMEventsResponse result = apiInstance.listRUMEvents(new RUMApi.ListRUMEventsOptionalParameters().body(body));
    if (result.getData() != null) {
      System.out.println("Found " + result.getData().size() + " RUM events");
      System.out.println(result);
    }
  }`;
  }

  /**
   * Generate security operations
   */
  private generateSecurityOperation(_operation: string, params: Record<string, any>): string {
    return `  /**
   * Search security signals
   */
  private static void searchSecuritySignals(ApiClient apiClient) throws ApiException {
    SecurityMonitoringApi apiInstance = new SecurityMonitoringApi(apiClient);

    OffsetDateTime from = OffsetDateTime.now().minusHours(1);
    OffsetDateTime to = OffsetDateTime.now();

    SecurityMonitoringSignalListRequest body = new SecurityMonitoringSignalListRequest()
        .filter(new SecurityMonitoringSignalListRequestFilter()
            .query("${params.query || '*'}")
            .from(from)
            .to(to))
        .page(new SecurityMonitoringSignalListRequestPage()
            .limit(${params.limit || 50}));

    SecurityMonitoringSignalsListResponse result = apiInstance.searchSecurityMonitoringSignals(
        new SecurityMonitoringApi.SearchSecurityMonitoringSignalsOptionalParameters().body(body));

    if (result.getData() != null) {
      System.out.println("Found " + result.getData().size() + " security signals");
      System.out.println(result);
    }
  }`;
  }

  /**
   * Generate infrastructure operations
   */
  private generateInfrastructureOperation(_operation: string, params: Record<string, any>): string {
    return `  /**
   * List infrastructure hosts
   */
  private static void listHosts(ApiClient apiClient) throws ApiException {
    HostsApi apiInstance = new HostsApi(apiClient);

    HostsApi.ListHostsOptionalParameters optionalParams = new HostsApi.ListHostsOptionalParameters();
    ${params.filter ? `optionalParams.filter("${params.filter}");` : ''}

    HostListResponse result = apiInstance.listHosts(optionalParams);
    if (result.getHostList() != null) {
      System.out.println("Found " + result.getHostList().size() + " hosts");
      System.out.println(result);
    }
  }`;
  }

  /**
   * Generate admin operations
   */
  private generateAdminOperation(_operation: string, _params: Record<string, any>): string {
    return `  /**
   * List users
   */
  private static void listUsers(ApiClient apiClient) throws ApiException {
    UsersApi apiInstance = new UsersApi(apiClient);

    UsersResponse result = apiInstance.listUsers();
    if (result.getData() != null) {
      System.out.println("Found " + result.getData().size() + " users");
      System.out.println(result);
    }
  }`;
  }

  /**
   * Generate generic operation (fallback)
   */
  private generateGenericOperation(domain: string, operation: string, params: Record<string, any>): string {
    const methodName = this.toMethodName(`${operation}_${domain}`);
    return `  /**
   * Perform ${operation} operation for ${domain}
   * Note: This is a generic template. Customize as needed.
   */
  private static void ${methodName}(ApiClient apiClient) throws ApiException {
    // TODO: Implement ${operation} for ${domain}
    // Parameters: ${JSON.stringify(params)}
    System.out.println("Operation not yet implemented");
  }`;
  }

  /**
   * Format Java array from JavaScript array
   */
  private formatJavaArray(arr: any[]): string {
    if (!Array.isArray(arr)) return 'Collections.emptyList()';

    const elements = arr.map(item => {
      if (typeof item === 'string') return `"${item}"`;
      return String(item);
    }).join(', ');

    return `Arrays.asList(${elements})`;
  }

  /**
   * Convert string to ClassName format
   */
  private toClassName(str: string): string {
    return str
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  /**
   * Convert string to methodName format (camelCase)
   */
  private toMethodName(str: string): string {
    const words = str.split(/[-_]/);
    return words[0].toLowerCase() + words.slice(1)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }
}

/**
 * Export convenience function
 */
export function generateJavaCode(options: CodeGenOptions): string {
  const generator = new JavaCodeGenerator();
  return generator.generate(options);
}
