// Unless explicitly stated otherwise all files in this repository are licensed
// under the Apache License Version 2.0.
// This product includes software developed at Datadog (https://www.datadoghq.com/).
// Copyright 2024-present Datadog, Inc.

/**
 * Python code generation templates
 * Generates Python code using datadog-api-client
 */

export interface CodeGenOptions {
  domain: string;
  operation: string;
  params: Record<string, any>;
}

/**
 * Generate Python code for Datadog API operations
 */
export class PythonCodeGenerator {
  /**
   * Generate complete Python code
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

    return `#!/usr/bin/env python3
"""
Datadog API Client - ${domain.charAt(0).toUpperCase() + domain.slice(1)} Operations
Generated code using datadog-api-client
"""

import os
import sys
from datetime import datetime, timedelta
from datadog_api_client import ApiClient, Configuration
from datadog_api_client.${version}.api.${this.getDomainApiName(domain)} import ${this.getApiClassName(domain)}
${this.getAdditionalImports(domain, version)}`;
  }

  /**
   * Get domain API name for import
   */
  private getDomainApiName(domain: string): string {
    const apiNames: Record<string, string> = {
      'metrics': 'metrics_api',
      'monitors': 'monitors_api',
      'dashboards': 'dashboards_api',
      'logs': 'logs_api',
      'traces': 'spans_api',
      'slos': 'service_level_objectives_api',
      'incidents': 'incidents_api',
      'synthetics': 'synthetics_api',
      'rum': 'rum_api',
      'security': 'security_monitoring_api',
      'infrastructure': 'hosts_api',
      'admin': 'users_api',
    };
    return apiNames[domain] || `${domain}_api`;
  }

  /**
   * Get API class name
   */
  private getApiClassName(domain: string): string {
    const classNames: Record<string, string> = {
      'metrics': 'MetricsApi',
      'monitors': 'MonitorsApi',
      'dashboards': 'DashboardsApi',
      'logs': 'LogsApi',
      'traces': 'SpansApi',
      'slos': 'ServiceLevelObjectivesApi',
      'incidents': 'IncidentsApi',
      'synthetics': 'SyntheticsApi',
      'rum': 'RUMApi',
      'security': 'SecurityMonitoringApi',
      'infrastructure': 'HostsApi',
      'admin': 'UsersApi',
    };
    return classNames[domain] || `${domain.charAt(0).toUpperCase() + domain.slice(1)}Api`;
  }

  /**
   * Get additional imports needed for specific operations
   */
  private getAdditionalImports(domain: string, version: string): string {
    const imports: string[] = [];

    // Add model imports based on domain
    if (domain === 'metrics') {
      imports.push(`from datadog_api_client.${version}.model.metrics_timeseries_query import MetricsTimeseriesQuery`);
      imports.push(`from datadog_api_client.${version}.model.metric_payload import MetricPayload`);
    } else if (domain === 'monitors') {
      imports.push(`from datadog_api_client.${version}.model.monitor import Monitor`);
      imports.push(`from datadog_api_client.${version}.model.monitor_type import MonitorType`);
    } else if (domain === 'dashboards') {
      imports.push(`from datadog_api_client.${version}.model.dashboard import Dashboard`);
      imports.push(`from datadog_api_client.${version}.model.dashboard_layout_type import DashboardLayoutType`);
    } else if (domain === 'logs') {
      imports.push(`from datadog_api_client.${version}.model.logs_list_request import LogsListRequest`);
      imports.push(`from datadog_api_client.${version}.model.logs_query_filter import LogsQueryFilter`);
    }

    return imports.length > 0 ? '\n' + imports.join('\n') : '';
  }

  /**
   * Generate configuration setup
   */
  private generateConfiguration(): string {
    return `
def configure_datadog():
    """
    Configure Datadog API client

    Required environment variables:
    - DD_API_KEY: Your Datadog API key
    - DD_APP_KEY: Your Datadog Application key
    - DD_SITE: Your Datadog site (default: datadoghq.com)

    Returns:
        Configuration: Configured Datadog client
    """
    configuration = Configuration()

    # Set API keys from environment
    configuration.api_key["apiKeyAuth"] = os.getenv("DD_API_KEY", "")
    configuration.api_key["appKeyAuth"] = os.getenv("DD_APP_KEY", "")

    # Set Datadog site
    dd_site = os.getenv("DD_SITE", "datadoghq.com")
    configuration.server_variables["site"] = dd_site

    return configuration`;
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
        return `
def query_metrics(configuration):
    """
    Query metrics from Datadog

    Args:
        configuration: Datadog API configuration

    Returns:
        Query results
    """
    with ApiClient(configuration) as api_client:
        api_instance = MetricsApi(api_client)

        # Define time range (Unix timestamps)
        from_time = ${params.from || 'int((datetime.now() - timedelta(hours=1)).timestamp())'}
        to_time = ${params.to || 'int(datetime.now().timestamp())'}

        # Create query body
        body = MetricsTimeseriesQuery(
            data={
                "type": "timeseries_request",
                "attributes": {
                    "formulas": [{"formula": "${params.query || 'avg:system.cpu.user{*}'}"}],
                    "from": from_time,
                    "to": to_time,
                    "queries": [],
                },
            }
        )

        try:
            result = api_instance.query_timeseries_data(body=body)
            print(f"Metrics query successful")
            print(result)
            return result
        except Exception as e:
            handle_error(e)`;

      case 'list':
        return `
def list_metrics(configuration):
    """
    List available metrics

    Args:
        configuration: Datadog API configuration

    Returns:
        List of metrics
    """
    with ApiClient(configuration) as api_client:
        api_instance = MetricsApi(api_client)

        try:
            result = api_instance.list_tag_by_metric(metric_name="${params.filter || '*'}")
            print(f"Found metrics")
            print(result)
            return result
        except Exception as e:
            handle_error(e)`;

      case 'submit':
        return `
def submit_metrics(configuration):
    """
    Submit custom metrics to Datadog

    Args:
        configuration: Datadog API configuration

    Returns:
        Submission result
    """
    with ApiClient(configuration) as api_client:
        api_instance = MetricsApi(api_client)

        # Create metric payload
        body = MetricPayload(
            series=[
                {
                    "metric": "${params.metric || 'custom.metric'}",
                    "type": 1,  # gauge
                    "points": [
                        {
                            "timestamp": int(datetime.now().timestamp()),
                            "value": ${params.value || 42},
                        }
                    ],
                    "tags": ${JSON.stringify(params.tags || ['env:production'])},
                }
            ]
        )

        try:
            result = api_instance.submit_metrics(body=body)
            print(f"Metrics submitted successfully")
            print(result)
            return result
        except Exception as e:
            handle_error(e)`;

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
        return `
def list_monitors(configuration):
    """
    List all monitors

    Args:
        configuration: Datadog API configuration

    Returns:
        List of monitors
    """
    with ApiClient(configuration) as api_client:
        api_instance = MonitorsApi(api_client)

        try:
            result = api_instance.list_monitors()
            print(f"Found {len(result)} monitors")
            for monitor in result:
                print(f"- {monitor['name']} (ID: {monitor['id']})")
            return result
        except Exception as e:
            handle_error(e)`;

      case 'get':
        return `
def get_monitor(configuration):
    """
    Get a specific monitor

    Args:
        configuration: Datadog API configuration

    Returns:
        Monitor details
    """
    with ApiClient(configuration) as api_client:
        api_instance = MonitorsApi(api_client)

        monitor_id = ${params.monitorId || 123456}  # Replace with your monitor ID

        try:
            result = api_instance.get_monitor(monitor_id=monitor_id)
            print(f"Monitor details:")
            print(result)
            return result
        except Exception as e:
            handle_error(e)`;

      case 'create':
        return `
def create_monitor(configuration):
    """
    Create a new monitor

    Args:
        configuration: Datadog API configuration

    Returns:
        Created monitor
    """
    with ApiClient(configuration) as api_client:
        api_instance = MonitorsApi(api_client)

        # Define monitor
        body = Monitor(
            name="${params.name || 'High CPU Usage'}",
            type=MonitorType.METRIC_ALERT,
            query="${params.query || 'avg(last_5m):avg:system.cpu.user{*} > 90'}",
            message="${params.message || 'CPU usage is above 90%'}",
            tags=${JSON.stringify(params.tags || ['env:production'])},
            options={
                "thresholds": {
                    "critical": ${params.critical || 90},
                    "warning": ${params.warning || 75},
                },
                "notify_no_data": True,
                "no_data_timeframe": 10,
            },
        )

        try:
            result = api_instance.create_monitor(body=body)
            print(f"Monitor created successfully:")
            print(result)
            return result
        except Exception as e:
            handle_error(e)`;

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
        return `
def list_dashboards(configuration):
    """
    List all dashboards

    Args:
        configuration: Datadog API configuration

    Returns:
        List of dashboards
    """
    with ApiClient(configuration) as api_client:
        api_instance = DashboardsApi(api_client)

        try:
            result = api_instance.list_dashboards()
            dashboards = result.get('dashboards', [])
            print(f"Found {len(dashboards)} dashboards")
            for dashboard in dashboards:
                print(f"- {dashboard['title']} (ID: {dashboard['id']})")
            return result
        except Exception as e:
            handle_error(e)`;

      case 'create':
        return `
def create_dashboard(configuration):
    """
    Create a new dashboard

    Args:
        configuration: Datadog API configuration

    Returns:
        Created dashboard
    """
    with ApiClient(configuration) as api_client:
        api_instance = DashboardsApi(api_client)

        # Define dashboard
        body = Dashboard(
            title="${params.title || 'My Dashboard'}",
            description="${params.description || 'Dashboard created via API'}",
            widgets=[
                {
                    "definition": {
                        "type": "timeseries",
                        "requests": [
                            {
                                "q": "${params.query || 'avg:system.cpu.user{*}'}",
                                "display_type": "line",
                            }
                        ],
                        "title": "${params.widgetTitle || 'CPU Usage'}",
                    }
                }
            ],
            layout_type=DashboardLayoutType.ORDERED,
        )

        try:
            result = api_instance.create_dashboard(body=body)
            print(f"Dashboard created successfully:")
            print(f"Dashboard ID: {result['id']}")
            print(f"Dashboard URL: https://app.datadoghq.com/dashboard/{result['id']}")
            return result
        except Exception as e:
            handle_error(e)`;

      default:
        return this.generateGenericOperation('dashboards', operation, params);
    }
  }

  /**
   * Generate logs operations
   */
  private generateLogsOperation(_operation: string, params: Record<string, any>): string {
    return `
def search_logs(configuration):
    """
    Search logs

    Args:
        configuration: Datadog API configuration

    Returns:
        Log search results
    """
    with ApiClient(configuration) as api_client:
        api_instance = LogsApi(api_client)

        # Define time range
        from_time = datetime.now() - timedelta(hours=1)
        to_time = datetime.now()

        # Create search request
        body = LogsListRequest(
            filter=LogsQueryFilter(
                query="${params.query || 'status:error'}",
                _from=from_time.isoformat() + "Z",
                to=to_time.isoformat() + "Z",
            ),
            page={"limit": ${params.limit || 50}},
            sort="timestamp",
        )

        try:
            result = api_instance.list_logs(body=body)
            logs = result.get('data', [])
            print(f"Found {len(logs)} log entries")
            return result
        except Exception as e:
            handle_error(e)`;
  }

  /**
   * Generate traces operations
   */
  private generateTracesOperation(_operation: string, params: Record<string, any>): string {
    return `
def search_traces(configuration):
    """
    Search traces/spans

    Args:
        configuration: Datadog API configuration

    Returns:
        Trace search results
    """
    with ApiClient(configuration) as api_client:
        api_instance = SpansApi(api_client)

        # Define time range
        from_time = datetime.now() - timedelta(hours=1)
        to_time = datetime.now()

        # Create search request
        body = {
            "filter": {
                "query": "${params.query || 'service:web-app'}",
                "from": from_time.isoformat() + "Z",
                "to": to_time.isoformat() + "Z",
            },
            "page": {"limit": ${params.limit || 50}},
            "sort": "timestamp",
        }

        try:
            result = api_instance.list_spans(body=body)
            spans = result.get('data', [])
            print(f"Found {len(spans)} spans")
            return result
        except Exception as e:
            handle_error(e)`;
  }

  /**
   * Generate SLOs operations
   */
  private generateSLOsOperation(_operation: string, _params: Record<string, any>): string {
    return `
def list_slos(configuration):
    """
    List SLOs

    Args:
        configuration: Datadog API configuration

    Returns:
        List of SLOs
    """
    with ApiClient(configuration) as api_client:
        api_instance = ServiceLevelObjectivesApi(api_client)

        try:
            result = api_instance.list_slos()
            slos = result.get('data', [])
            print(f"Found {len(slos)} SLOs")
            for slo in slos:
                print(f"- {slo.get('name', 'N/A')} (ID: {slo.get('id', 'N/A')})")
            return result
        except Exception as e:
            handle_error(e)`;
  }

  /**
   * Generate incidents operations
   */
  private generateIncidentsOperation(_operation: string, _params: Record<string, any>): string {
    return `
def list_incidents(configuration):
    """
    List incidents

    Args:
        configuration: Datadog API configuration

    Returns:
        List of incidents
    """
    with ApiClient(configuration) as api_client:
        api_instance = IncidentsApi(api_client)

        try:
            result = api_instance.list_incidents()
            incidents = result.get('data', [])
            print(f"Found {len(incidents)} incidents")
            for incident in incidents:
                attrs = incident.get('attributes', {})
                print(f"- {attrs.get('title', 'N/A')} (Status: {attrs.get('state', 'N/A')})")
            return result
        except Exception as e:
            handle_error(e)`;
  }

  /**
   * Generate synthetics operations
   */
  private generateSyntheticsOperation(_operation: string, _params: Record<string, any>): string {
    return `
def list_synthetic_tests(configuration):
    """
    List synthetic tests

    Args:
        configuration: Datadog API configuration

    Returns:
        List of synthetic tests
    """
    with ApiClient(configuration) as api_client:
        api_instance = SyntheticsApi(api_client)

        try:
            result = api_instance.list_tests()
            tests = result.get('tests', [])
            print(f"Found {len(tests)} synthetic tests")
            for test in tests:
                print(f"- {test.get('name', 'N/A')} (Type: {test.get('type', 'N/A')})")
            return result
        except Exception as e:
            handle_error(e)`;
  }

  /**
   * Generate RUM operations
   */
  private generateRUMOperation(_operation: string, params: Record<string, any>): string {
    return `
def search_rum_events(configuration):
    """
    Search RUM events

    Args:
        configuration: Datadog API configuration

    Returns:
        RUM event search results
    """
    with ApiClient(configuration) as api_client:
        api_instance = RUMApi(api_client)

        # Define time range
        from_time = datetime.now() - timedelta(hours=1)
        to_time = datetime.now()

        # Create search request
        body = {
            "filter": {
                "query": "${params.query || '@type:view'}",
                "from": from_time.isoformat() + "Z",
                "to": to_time.isoformat() + "Z",
            },
            "page": {"limit": ${params.limit || 50}},
        }

        try:
            result = api_instance.list_rum_events(body=body)
            events = result.get('data', [])
            print(f"Found {len(events)} RUM events")
            return result
        except Exception as e:
            handle_error(e)`;
  }

  /**
   * Generate security operations
   */
  private generateSecurityOperation(_operation: string, params: Record<string, any>): string {
    return `
def search_security_signals(configuration):
    """
    Search security signals

    Args:
        configuration: Datadog API configuration

    Returns:
        Security signal search results
    """
    with ApiClient(configuration) as api_client:
        api_instance = SecurityMonitoringApi(api_client)

        # Define time range
        from_time = datetime.now() - timedelta(hours=1)
        to_time = datetime.now()

        # Create search request
        body = {
            "filter": {
                "query": "${params.query || '*'}",
                "from": from_time,
                "to": to_time,
            },
            "page": {"limit": ${params.limit || 50}},
        }

        try:
            result = api_instance.search_security_monitoring_signals(body=body)
            signals = result.get('data', [])
            print(f"Found {len(signals)} security signals")
            return result
        except Exception as e:
            handle_error(e)`;
  }

  /**
   * Generate infrastructure operations
   */
  private generateInfrastructureOperation(_operation: string, params: Record<string, any>): string {
    return `
def list_hosts(configuration):
    """
    List infrastructure hosts

    Args:
        configuration: Datadog API configuration

    Returns:
        List of hosts
    """
    with ApiClient(configuration) as api_client:
        api_instance = HostsApi(api_client)

        query_params = {}
        if "${params.filter || ''}":
            query_params["filter"] = "${params.filter}"

        try:
            result = api_instance.list_hosts(**query_params)
            hosts = result.get('host_list', [])
            print(f"Found {len(hosts)} hosts")
            for host in hosts:
                print(f"- {host.get('name', 'N/A')}")
            return result
        except Exception as e:
            handle_error(e)`;
  }

  /**
   * Generate admin operations
   */
  private generateAdminOperation(_operation: string, _params: Record<string, any>): string {
    return `
def list_users(configuration):
    """
    List users

    Args:
        configuration: Datadog API configuration

    Returns:
        List of users
    """
    with ApiClient(configuration) as api_client:
        api_instance = UsersApi(api_client)

        try:
            result = api_instance.list_users()
            users = result.get('data', [])
            print(f"Found {len(users)} users")
            for user in users:
                attrs = user.get('attributes', {})
                print(f"- {attrs.get('email', 'N/A')} ({attrs.get('name', 'N/A')})")
            return result
        except Exception as e:
            handle_error(e)`;
  }

  /**
   * Generate generic operation (fallback)
   */
  private generateGenericOperation(domain: string, operation: string, params: Record<string, any>): string {
    return `
def perform_${operation}(configuration):
    """
    ${operation} operation for ${domain}
    Note: This is a generic template. Customize as needed.

    Args:
        configuration: Datadog API configuration
    """
    # TODO: Implement ${operation} for ${domain}
    # Parameters: ${JSON.stringify(params)}
    print("Operation not yet implemented")`;
  }

  /**
   * Generate error handling
   */
  private generateErrorHandling(): string {
    return `

def handle_error(error):
    """
    Handle API errors

    Args:
        error: Exception object
    """
    print(f"API Error: {error}", file=sys.stderr)
    if hasattr(error, 'status'):
        print(f"Status: {error.status}", file=sys.stderr)
    if hasattr(error, 'reason'):
        print(f"Reason: {error.reason}", file=sys.stderr)
    if hasattr(error, 'body'):
        print(f"Body: {error.body}", file=sys.stderr)
    sys.exit(1)`;
  }

  /**
   * Generate usage example
   */
  private generateUsageExample(domain: string, operation: string): string {
    const functionName = this.getFunctionName(domain, operation);

    return `


def main():
    """
    Main execution
    """
    # Validate environment variables
    if not os.getenv("DD_API_KEY") or not os.getenv("DD_APP_KEY"):
        print("Error: DD_API_KEY and DD_APP_KEY environment variables are required", file=sys.stderr)
        print("Set them with: export DD_API_KEY='...' DD_APP_KEY='...'", file=sys.stderr)
        sys.exit(1)

    # Configure Datadog client
    configuration = configure_datadog()

    # Execute operation
    ${functionName}(configuration)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Unexpected error: {error}", file=sys.stderr)
        sys.exit(1)`;
  }

  /**
   * Get function name for domain and operation
   */
  private getFunctionName(domain: string, operation: string): string {
    const operationMap: Record<string, string> = {
      'metrics-query': 'query_metrics',
      'metrics-list': 'list_metrics',
      'metrics-submit': 'submit_metrics',
      'monitors-list': 'list_monitors',
      'monitors-get': 'get_monitor',
      'monitors-create': 'create_monitor',
      'dashboards-list': 'list_dashboards',
      'dashboards-create': 'create_dashboard',
      'logs-search': 'search_logs',
      'traces-search': 'search_traces',
      'slos-list': 'list_slos',
      'incidents-list': 'list_incidents',
      'synthetics-list': 'list_synthetic_tests',
      'rum-search': 'search_rum_events',
      'security-signals': 'search_security_signals',
      'infrastructure-hosts': 'list_hosts',
      'admin-users': 'list_users',
    };

    return operationMap[`${domain}-${operation}`] || `perform_${operation}`;
  }
}

/**
 * Export convenience function
 */
export function generatePythonCode(options: CodeGenOptions): string {
  const generator = new PythonCodeGenerator();
  return generator.generate(options);
}
