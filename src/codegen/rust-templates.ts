/**
 * Rust code generation templates
 * Generates Rust code using datadog-api-client
 */

export interface CodeGenOptions {
  domain: string;
  operation: string;
  params: Record<string, any>;
}

/**
 * Generate Rust code for Datadog API operations
 */
export class RustCodeGenerator {
  /**
   * Generate complete Rust code
   */
  generate(options: CodeGenOptions): string {
    const { domain, operation, params } = options;

    const imports = this.generateImports(domain);
    const mainFunction = this.generateOperation(domain, operation, params);

    return `${imports}

${mainFunction}`;
  }

  /**
   * Generate imports for the specified domain
   */
  private generateImports(domain: string): string {
    const v2Domains = ['metrics', 'logs', 'spans', 'rum', 'security', 'incidents', 'users'];
    const version = v2Domains.includes(domain) ? 'V2' : 'V1';

    return `// Datadog API Client - ${domain.charAt(0).toUpperCase() + domain.slice(1)} Operations
// Generated code using datadog-api-client
//
// Add to your Cargo.toml:
// [dependencies]
// datadog-api-client = "0"
// tokio = { version = "1", features = ["full"] }
// serde_json = "1"

use datadog_api_client::datadog;
use datadog_api_client::datadog${version}::api_${this.getApiModule(domain)}::${this.getApiStruct(domain)};
${this.generateDomainSpecificImports(domain, version)}`;
  }

  /**
   * Generate domain-specific imports
   */
  private generateDomainSpecificImports(domain: string, version: string): string {
    switch (domain) {
      case 'metrics':
        return version === 'V2'
          ? `use datadog_api_client::datadogV2::api_metrics::QueryScalarDataOptionalParams;
use datadog_api_client::datadogV2::model::*;`
          : `use datadog_api_client::datadogV1::api_metrics::*;
use datadog_api_client::datadogV1::model::*;`;

      case 'monitors':
        return `use datadog_api_client::datadogV1::api_monitors::*;
use datadog_api_client::datadogV1::model::*;`;

      case 'dashboards':
        return `use datadog_api_client::datadogV1::api_dashboards::*;
use datadog_api_client::datadogV1::model::*;`;

      case 'logs':
        return version === 'V2'
          ? `use datadog_api_client::datadogV2::api_logs::ListLogsOptionalParams;
use datadog_api_client::datadogV2::model::*;`
          : `use datadog_api_client::datadogV1::api_logs::*;
use datadog_api_client::datadogV1::model::*;`;

      case 'traces':
      case 'spans':
        return `use datadog_api_client::datadogV2::api_spans::ListSpansOptionalParams;
use datadog_api_client::datadogV2::model::*;`;

      case 'slos':
        return `use datadog_api_client::datadogV1::api_service_level_objectives::*;
use datadog_api_client::datadogV1::model::*;`;

      case 'incidents':
        return `use datadog_api_client::datadogV2::api_incidents::ListIncidentsOptionalParams;
use datadog_api_client::datadogV2::model::*;`;

      case 'synthetics':
        return `use datadog_api_client::datadogV1::api_synthetics::*;
use datadog_api_client::datadogV1::model::*;`;

      case 'rum':
        return `use datadog_api_client::datadogV2::api_rum::ListRUMEventsOptionalParams;
use datadog_api_client::datadogV2::model::*;`;

      case 'security':
        return `use datadog_api_client::datadogV2::api_security_monitoring::SearchSecurityMonitoringSignalsOptionalParams;
use datadog_api_client::datadogV2::model::*;`;

      case 'infrastructure':
        return `use datadog_api_client::datadogV1::api_hosts::*;
use datadog_api_client::datadogV1::model::*;`;

      case 'admin':
        return `use datadog_api_client::datadogV2::api_users::ListUsersOptionalParams;
use datadog_api_client::datadogV2::model::*;`;

      default:
        return `use datadog_api_client::datadog${version}::model::*;`;
    }
  }

  /**
   * Get API module name for domain
   */
  private getApiModule(domain: string): string {
    const moduleMap: Record<string, string> = {
      'traces': 'spans',
      'admin': 'users',
      'infrastructure': 'hosts',
      'slos': 'service_level_objectives',
      'security': 'security_monitoring',
    };
    return moduleMap[domain] || domain;
  }

  /**
   * Get API struct name for domain
   */
  private getApiStruct(domain: string): string {
    const structMap: Record<string, string> = {
      'metrics': 'MetricsAPI',
      'monitors': 'MonitorsAPI',
      'dashboards': 'DashboardsAPI',
      'logs': 'LogsAPI',
      'traces': 'SpansAPI',
      'spans': 'SpansAPI',
      'slos': 'ServiceLevelObjectivesAPI',
      'incidents': 'IncidentsAPI',
      'synthetics': 'SyntheticsAPI',
      'rum': 'RUMAPI',
      'security': 'SecurityMonitoringAPI',
      'infrastructure': 'HostsAPI',
      'admin': 'UsersAPI',
    };
    return structMap[domain] || `${this.toPascalCase(domain)}API`;
  }

  /**
   * Generate the main operation function
   */
  private generateOperation(domain: string, operation: string, params: Record<string, any>): string {
    const operationFunc = this.generateOperationFunction(domain, operation, params);
    return operationFunc;
  }

  /**
   * Generate the specific operation function
   */
  private generateOperationFunction(domain: string, operation: string, params: Record<string, any>): string {
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
        return `#[tokio::main]
async fn main() {
    // Initialize Datadog configuration
    // Reads DD_API_KEY and DD_APP_KEY from environment variables
    let configuration = datadog::Configuration::new();
    let api = MetricsAPI::with_config(configuration);

    // Configure time range (milliseconds since epoch)
    let from = ${params.from || 'chrono::Utc::now().timestamp_millis() - 3600000'};
    let to = ${params.to || 'chrono::Utc::now().timestamp_millis()'};

    // Build metrics query request
    let body = MetricsScalarQuery {
        data: ScalarFormulaQueryRequest {
            type_: "scalar_request".to_string(),
            attributes: ScalarFormulaRequestAttributes {
                formulas: Some(vec![QueryFormula {
                    formula: "${params.query || 'avg:system.cpu.user{*}'}".to_string(),
                    ..Default::default()
                }]),
                from,
                to,
                queries: vec![
                    MetricsTimeseriesQuery {
                        data_source: MetricsDataSource::METRICS,
                        name: Some("query1".to_string()),
                        query: "${params.query || 'avg:system.cpu.user{*}'}".to_string(),
                        ..Default::default()
                    },
                ],
                ..Default::default()
            },
        },
    };

    // Execute query
    match api.query_scalar_data(QueryScalarDataOptionalParams::default().body(body)).await {
        Ok(resp) => {
            println!("Metrics query result:");
            println!("{:#?}", resp);
        }
        Err(err) => {
            eprintln!("Error querying metrics: {:#?}", err);
            std::process::exit(1);
        }
    }
}`;

      case 'list':
        return `#[tokio::main]
async fn main() {
    let configuration = datadog::Configuration::new();
    let api = MetricsAPI::with_config(configuration);

    // List active metrics with optional filter
    let params = ListActiveMetricsOptionalParams::default()${params.filter ? `.filter("${params.filter}")` : ''};

    match api.list_active_metrics(${params.from || 'chrono::Utc::now().timestamp() - 3600'}, params).await {
        Ok(resp) => {
            println!("Available metrics:");
            println!("{:#?}", resp);
        }
        Err(err) => {
            eprintln!("Error listing metrics: {:#?}", err);
            std::process::exit(1);
        }
    }
}`;

      case 'submit':
        return `#[tokio::main]
async fn main() {
    let configuration = datadog::Configuration::new();
    let api = MetricsAPI::with_config(configuration);

    // Build metric payload
    let body = MetricPayload {
        series: vec![MetricSeries {
            metric: "${params.metric || 'custom.metric'}".to_string(),
            type_: Some(MetricIntakeType::GAUGE),
            points: vec![MetricPoint {
                timestamp: Some(chrono::Utc::now().timestamp()),
                value: ${params.value || 42.0},
            }],
            tags: Some(vec![${JSON.stringify(params.tags || ['env:production']).slice(1, -1).split(',').map((t: string) => `${t.trim()}.to_string()`).join(', ')}]),
            ..Default::default()
        }],
    };

    match api.submit_metrics(body).await {
        Ok(resp) => {
            println!("Metrics submitted successfully:");
            println!("{:#?}", resp);
        }
        Err(err) => {
            eprintln!("Error submitting metrics: {:#?}", err);
            std::process::exit(1);
        }
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
        return `#[tokio::main]
async fn main() {
    let configuration = datadog::Configuration::new();
    let api = MonitorsAPI::with_config(configuration);

    match api.list_monitors(ListMonitorsOptionalParams::default()).await {
        Ok(monitors) => {
            println!("Found {} monitors", monitors.len());
            println!("{:#?}", monitors);
        }
        Err(err) => {
            eprintln!("Error listing monitors: {:#?}", err);
            std::process::exit(1);
        }
    }
}`;

      case 'get':
        return `#[tokio::main]
async fn main() {
    let configuration = datadog::Configuration::new();
    let api = MonitorsAPI::with_config(configuration);

    let monitor_id = ${params.monitorId || 123456}; // Replace with your monitor ID

    match api.get_monitor(monitor_id, GetMonitorOptionalParams::default()).await {
        Ok(monitor) => {
            println!("Monitor details:");
            println!("{:#?}", monitor);
        }
        Err(err) => {
            eprintln!("Error getting monitor: {:#?}", err);
            std::process::exit(1);
        }
    }
}`;

      case 'create':
        return `#[tokio::main]
async fn main() {
    let configuration = datadog::Configuration::new();
    let api = MonitorsAPI::with_config(configuration);

    // Build monitor configuration
    let body = Monitor {
        name: Some("${params.name || 'High CPU Usage'}".to_string()),
        type_: MonitorType::METRIC_ALERT,
        query: Some("${params.query || 'avg(last_5m):avg:system.cpu.user{*} > 90'}".to_string()),
        message: Some("${params.message || 'CPU usage is above 90%'}".to_string()),
        tags: Some(vec![${JSON.stringify(params.tags || ['env:production']).slice(1, -1).split(',').map((t: string) => `${t.trim()}.to_string()`).join(', ')}]),
        options: Some(Box::new(MonitorOptions {
            thresholds: Some(Box::new(MonitorThresholds {
                critical: Some(${params.critical || 90.0}),
                warning: Some(${params.warning || 75.0}),
                ..Default::default()
            })),
            notify_no_data: Some(true),
            no_data_timeframe: Some(10),
            ..Default::default()
        })),
        ..Default::default()
    };

    match api.create_monitor(body).await {
        Ok(monitor) => {
            println!("Monitor created successfully:");
            println!("{:#?}", monitor);
        }
        Err(err) => {
            eprintln!("Error creating monitor: {:#?}", err);
            std::process::exit(1);
        }
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
        return `#[tokio::main]
async fn main() {
    let configuration = datadog::Configuration::new();
    let api = DashboardsAPI::with_config(configuration);

    match api.list_dashboards(ListDashboardsOptionalParams::default()).await {
        Ok(resp) => {
            if let Some(dashboards) = &resp.dashboards {
                println!("Found {} dashboards", dashboards.len());
            }
            println!("{:#?}", resp);
        }
        Err(err) => {
            eprintln!("Error listing dashboards: {:#?}", err);
            std::process::exit(1);
        }
    }
}`;

      case 'create':
        return `#[tokio::main]
async fn main() {
    let configuration = datadog::Configuration::new();
    let api = DashboardsAPI::with_config(configuration);

    // Build dashboard configuration
    let body = Dashboard {
        title: "${params.title || 'My Dashboard'}".to_string(),
        description: Some("${params.description || 'Dashboard created via API'}".to_string()),
        widgets: vec![Widget {
            definition: WidgetDefinition::TimeseriesWidgetDefinition(Box::new(
                TimeseriesWidgetDefinition {
                    type_: TimeseriesWidgetDefinitionType::TIMESERIES,
                    requests: vec![TimeseriesWidgetRequest {
                        q: Some("${params.query || 'avg:system.cpu.user{*}'}".to_string()),
                        display_type: Some(WidgetDisplayType::LINE),
                        ..Default::default()
                    }],
                    title: Some("${params.widgetTitle || 'CPU Usage'}".to_string()),
                    ..Default::default()
                },
            )),
            ..Default::default()
        }],
        layout_type: DashboardLayoutType::ORDERED,
        ..Default::default()
    };

    match api.create_dashboard(body).await {
        Ok(dashboard) => {
            println!("Dashboard created successfully:");
            println!("{:#?}", dashboard);
        }
        Err(err) => {
            eprintln!("Error creating dashboard: {:#?}", err);
            std::process::exit(1);
        }
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
    return `#[tokio::main]
async fn main() {
    let configuration = datadog::Configuration::new();
    let api = LogsAPI::with_config(configuration);

    // Build logs search request
    let body = LogsListRequest {
        filter: Some(Box::new(LogsQueryFilter {
            query: Some("${params.query || 'status:error'}".to_string()),
            from: Some("now-1h".to_string()),
            to: Some("now".to_string()),
            indexes: Some(vec!["main".to_string()]),
            ..Default::default()
        })),
        page: Some(Box::new(LogsListRequestPage {
            limit: Some(${params.limit || 50}),
            ..Default::default()
        })),
        sort: Some(LogsSort::TIMESTAMP_ASCENDING),
        ..Default::default()
    };

    match api.list_logs(ListLogsOptionalParams::default().body(body)).await {
        Ok(resp) => {
            if let Some(data) = &resp.data {
                println!("Found {} log entries", data.len());
            }
            println!("{:#?}", resp);
        }
        Err(err) => {
            eprintln!("Error searching logs: {:#?}", err);
            std::process::exit(1);
        }
    }
}`;
  }

  /**
   * Generate traces operations
   */
  private generateTracesOperation(_operation: string, params: Record<string, any>): string {
    return `#[tokio::main]
async fn main() {
    let configuration = datadog::Configuration::new();
    let api = SpansAPI::with_config(configuration);

    // Build spans search request
    let body = SpansListRequest {
        filter: Some(Box::new(SpansQueryFilter {
            query: Some("${params.query || 'service:web-app'}".to_string()),
            from: Some("now-1h".to_string()),
            to: Some("now".to_string()),
            ..Default::default()
        })),
        page: Some(Box::new(SpansListRequestPage {
            limit: Some(${params.limit || 50}),
            ..Default::default()
        })),
        sort: Some(SpansSort::TIMESTAMP_ASCENDING),
        ..Default::default()
    };

    match api.list_spans(ListSpansOptionalParams::default().body(body)).await {
        Ok(resp) => {
            if let Some(data) = &resp.data {
                println!("Found {} spans", data.len());
            }
            println!("{:#?}", resp);
        }
        Err(err) => {
            eprintln!("Error searching traces: {:#?}", err);
            std::process::exit(1);
        }
    }
}`;
  }

  /**
   * Generate SLOs operations
   */
  private generateSLOsOperation(_operation: string, _params: Record<string, any>): string {
    return `#[tokio::main]
async fn main() {
    let configuration = datadog::Configuration::new();
    let api = ServiceLevelObjectivesAPI::with_config(configuration);

    match api.list_slos(ListSLOsOptionalParams::default()).await {
        Ok(resp) => {
            if let Some(data) = &resp.data {
                println!("Found {} SLOs", data.len());
            }
            println!("{:#?}", resp);
        }
        Err(err) => {
            eprintln!("Error listing SLOs: {:#?}", err);
            std::process::exit(1);
        }
    }
}`;
  }

  /**
   * Generate incidents operations
   */
  private generateIncidentsOperation(_operation: string, _params: Record<string, any>): string {
    return `#[tokio::main]
async fn main() {
    let configuration = datadog::Configuration::new();
    let api = IncidentsAPI::with_config(configuration);

    match api.list_incidents(ListIncidentsOptionalParams::default()).await {
        Ok(resp) => {
            println!("Found {} incidents", resp.data.len());
            println!("{:#?}", resp);
        }
        Err(err) => {
            eprintln!("Error listing incidents: {:#?}", err);
            std::process::exit(1);
        }
    }
}`;
  }

  /**
   * Generate synthetics operations
   */
  private generateSyntheticsOperation(_operation: string, _params: Record<string, any>): string {
    return `#[tokio::main]
async fn main() {
    let configuration = datadog::Configuration::new();
    let api = SyntheticsAPI::with_config(configuration);

    match api.list_tests(ListTestsOptionalParams::default()).await {
        Ok(resp) => {
            if let Some(tests) = &resp.tests {
                println!("Found {} tests", tests.len());
            }
            println!("{:#?}", resp);
        }
        Err(err) => {
            eprintln!("Error listing synthetic tests: {:#?}", err);
            std::process::exit(1);
        }
    }
}`;
  }

  /**
   * Generate RUM operations
   */
  private generateRUMOperation(_operation: string, params: Record<string, any>): string {
    return `#[tokio::main]
async fn main() {
    let configuration = datadog::Configuration::new();
    let api = RUMAPI::with_config(configuration);

    // Build RUM events search request
    let body = RUMSearchEventsRequest {
        filter: Some(Box::new(RUMQueryFilter {
            query: Some("${params.query || '@type:view'}".to_string()),
            from: Some("now-1h".to_string()),
            to: Some("now".to_string()),
            ..Default::default()
        })),
        page: Some(Box::new(RUMQueryPageOptions {
            limit: Some(${params.limit || 50}),
            ..Default::default()
        })),
        ..Default::default()
    };

    match api.list_rum_events(ListRUMEventsOptionalParams::default().body(body)).await {
        Ok(resp) => {
            if let Some(data) = &resp.data {
                println!("Found {} RUM events", data.len());
            }
            println!("{:#?}", resp);
        }
        Err(err) => {
            eprintln!("Error searching RUM events: {:#?}", err);
            std::process::exit(1);
        }
    }
}`;
  }

  /**
   * Generate security operations
   */
  private generateSecurityOperation(_operation: string, params: Record<string, any>): string {
    return `#[tokio::main]
async fn main() {
    let configuration = datadog::Configuration::new();
    let api = SecurityMonitoringAPI::with_config(configuration);

    // Build security signals search request
    let body = SecurityMonitoringSignalListRequest {
        filter: Some(Box::new(SecurityMonitoringSignalListRequestFilter {
            query: Some("${params.query || '*'}".to_string()),
            from: Some(chrono::Utc::now() - chrono::Duration::hours(1)),
            to: Some(chrono::Utc::now()),
            ..Default::default()
        })),
        page: Some(Box::new(SecurityMonitoringSignalListRequestPage {
            limit: Some(${params.limit || 50}),
            ..Default::default()
        })),
        ..Default::default()
    };

    match api.search_security_monitoring_signals(
        SearchSecurityMonitoringSignalsOptionalParams::default().body(body)
    ).await {
        Ok(resp) => {
            if let Some(data) = &resp.data {
                println!("Found {} security signals", data.len());
            }
            println!("{:#?}", resp);
        }
        Err(err) => {
            eprintln!("Error searching security signals: {:#?}", err);
            std::process::exit(1);
        }
    }
}`;
  }

  /**
   * Generate infrastructure operations
   */
  private generateInfrastructureOperation(_operation: string, params: Record<string, any>): string {
    return `#[tokio::main]
async fn main() {
    let configuration = datadog::Configuration::new();
    let api = HostsAPI::with_config(configuration);

    let params = ListHostsOptionalParams::default()${params.filter ? `.filter("${params.filter}")` : ''};

    match api.list_hosts(params).await {
        Ok(resp) => {
            if let Some(hosts) = &resp.host_list {
                println!("Found {} hosts", hosts.len());
            }
            println!("{:#?}", resp);
        }
        Err(err) => {
            eprintln!("Error listing hosts: {:#?}", err);
            std::process::exit(1);
        }
    }
}`;
  }

  /**
   * Generate admin operations
   */
  private generateAdminOperation(_operation: string, _params: Record<string, any>): string {
    return `#[tokio::main]
async fn main() {
    let configuration = datadog::Configuration::new();
    let api = UsersAPI::with_config(configuration);

    match api.list_users(ListUsersOptionalParams::default()).await {
        Ok(resp) => {
            println!("Found {} users", resp.data.len());
            println!("{:#?}", resp);
        }
        Err(err) => {
            eprintln!("Error listing users: {:#?}", err);
            std::process::exit(1);
        }
    }
}`;
  }

  /**
   * Generate generic operation (fallback)
   */
  private generateGenericOperation(domain: string, operation: string, params: Record<string, any>): string {
    const funcName = this.toSnakeCase(`${operation}_${domain}`);
    return `// ${funcName} - ${operation} operation for ${domain}
// Note: This is a generic template. Customize as needed.
// Parameters: ${JSON.stringify(params)}

#[tokio::main]
async fn main() {
    let configuration = datadog::Configuration::new();
    // TODO: Initialize appropriate API client for ${domain}

    println!("Operation not yet implemented: ${operation} for ${domain}");
    println!("Please refer to the Datadog Rust API client documentation:");
    println!("https://docs.rs/datadog-api-client/latest/datadog_api_client/");
}`;
  }

  /**
   * Convert string to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split(/[-_]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }

  /**
   * Convert string to snake_case
   */
  private toSnakeCase(str: string): string {
    return str.replace(/[-\s]/g, '_').toLowerCase();
  }
}

/**
 * Export convenience function
 */
export function generateRustCode(options: CodeGenOptions): string {
  const generator = new RustCodeGenerator();
  return generator.generate(options);
}
