/**
 * Go code generation templates
 * Generates Go code using datadog-api-client-go
 */

export interface CodeGenOptions {
  domain: string;
  operation: string;
  params: Record<string, any>;
}

/**
 * Generate Go code for Datadog API operations
 */
export class GoCodeGenerator {
  /**
   * Generate complete Go code
   */
  generate(options: CodeGenOptions): string {
    const { domain, operation, params } = options;

    const packageDeclaration = 'package main';
    const imports = this.generateImports(domain);
    const mainFunction = this.generateOperation(domain, operation, params);
    const errorHandling = this.generateErrorHandling();

    return `${packageDeclaration}

${imports}

${mainFunction}

${errorHandling}`;
  }

  /**
   * Generate imports for the specified domain
   */
  private generateImports(domain: string): string {
    const v2Domains = ['metrics', 'logs', 'spans', 'rum', 'security', 'incidents', 'users'];
    const version = v2Domains.includes(domain) ? 'v2' : 'v1';

    return `/**
 * Datadog API Client - ${domain.charAt(0).toUpperCase() + domain.slice(1)} Operations
 * Generated code using datadog-api-client-go
 */

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/DataDog/datadog-api-client-go/${version}/datadog"
	"github.com/DataDog/datadog-api-client-go/${version}/api/datadogV${version === 'v2' ? '2' : '1'}"
)`;
  }

  /**
   * Generate the main operation function
   */
  private generateOperation(domain: string, operation: string, params: Record<string, any>): string {
    const operationFunc = this.generateOperationFunction(domain, operation, params);
    const mainFunc = this.generateMainFunction(domain, operation);

    return `${operationFunc}

${mainFunc}`;
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
        return `// queryMetrics queries metrics from Datadog
func queryMetrics(ctx context.Context, apiClient *datadog.APIClient) error {
	api := datadogV2.NewMetricsApi(apiClient)

	// Define time range (Unix timestamps)
	from := ${params.from || 'time.Now().Add(-1 * time.Hour).Unix()'}
	to := ${params.to || 'time.Now().Unix()'}

	body := datadogV2.MetricsTimeseriesQuery{
		Data: datadogV2.MetricsTimeseriesQueryRequest{
			Type: "timeseries_request",
			Attributes: datadogV2.MetricsTimeseriesQueryAttributes{
				Formulas: []datadogV2.QueryFormula{
					{
						Formula: datadog.PtrString("${params.query || 'avg:system.cpu.user{*}'}"),
					},
				},
				From: from,
				To:   to,
			},
		},
	}

	resp, r, err := api.QueryTimeseriesData(ctx, body)
	if err != nil {
		return handleError(err, r)
	}

	jsonResp, _ := json.MarshalIndent(resp, "", "  ")
	fmt.Println("Metrics query result:")
	fmt.Println(string(jsonResp))

	return nil
}`;

      case 'list':
        return `// listMetrics lists available metrics
func listMetrics(ctx context.Context, apiClient *datadog.APIClient) error {
	api := datadogV2.NewMetricsApi(apiClient)

	resp, r, err := api.ListTagsByMetric(ctx, "${params.filter || '*'}")
	if err != nil {
		return handleError(err, r)
	}

	jsonResp, _ := json.MarshalIndent(resp, "", "  ")
	fmt.Println("Available metrics:")
	fmt.Println(string(jsonResp))

	return nil
}`;

      case 'submit':
        return `// submitMetrics submits custom metrics to Datadog
func submitMetrics(ctx context.Context, apiClient *datadog.APIClient) error {
	api := datadogV2.NewMetricsApi(apiClient)

	body := datadogV2.MetricPayload{
		Series: []datadogV2.MetricSeries{
			{
				Metric: "${params.metric || 'custom.metric'}",
				Type:   datadog.PtrInt32(1), // gauge
				Points: []datadogV2.MetricPoint{
					{
						Timestamp: datadog.PtrInt64(time.Now().Unix()),
						Value:     datadog.PtrFloat64(${params.value || 42}),
					},
				},
				Tags: ${JSON.stringify(params.tags || ['env:production'])},
			},
		},
	}

	resp, r, err := api.SubmitMetrics(ctx, body)
	if err != nil {
		return handleError(err, r)
	}

	jsonResp, _ := json.MarshalIndent(resp, "", "  ")
	fmt.Println("Metrics submitted successfully:")
	fmt.Println(string(jsonResp))

	return nil
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
        return `// listMonitors lists all monitors
func listMonitors(ctx context.Context, apiClient *datadog.APIClient) error {
	api := datadogV1.NewMonitorsApi(apiClient)

	resp, r, err := api.ListMonitors(ctx)
	if err != nil {
		return handleError(err, r)
	}

	fmt.Printf("Found %d monitors\\n", len(resp))
	jsonResp, _ := json.MarshalIndent(resp, "", "  ")
	fmt.Println(string(jsonResp))

	return nil
}`;

      case 'get':
        return `// getMonitor gets a specific monitor
func getMonitor(ctx context.Context, apiClient *datadog.APIClient) error {
	api := datadogV1.NewMonitorsApi(apiClient)

	monitorID := int64(${params.monitorId || 123456}) // Replace with your monitor ID

	resp, r, err := api.GetMonitor(ctx, monitorID)
	if err != nil {
		return handleError(err, r)
	}

	jsonResp, _ := json.MarshalIndent(resp, "", "  ")
	fmt.Println("Monitor details:")
	fmt.Println(string(jsonResp))

	return nil
}`;

      case 'create':
        return `// createMonitor creates a new monitor
func createMonitor(ctx context.Context, apiClient *datadog.APIClient) error {
	api := datadogV1.NewMonitorsApi(apiClient)

	body := datadogV1.Monitor{
		Name:    datadog.PtrString("${params.name || 'High CPU Usage'}"),
		Type:    datadogV1.MONITORTYPE_METRIC_ALERT,
		Query:   datadog.PtrString("${params.query || 'avg(last_5m):avg:system.cpu.user{*} > 90'}"),
		Message: datadog.PtrString("${params.message || 'CPU usage is above 90%'}"),
		Tags:    ${JSON.stringify(params.tags || ['env:production'])},
		Options: &datadogV1.MonitorOptions{
			Thresholds: &datadogV1.MonitorThresholds{
				Critical: datadog.PtrFloat64(${params.critical || 90}),
				Warning:  datadog.PtrFloat64(${params.warning || 75}),
			},
			NotifyNoData:    datadog.PtrBool(true),
			NoDataTimeframe: datadog.PtrInt64(10),
		},
	}

	resp, r, err := api.CreateMonitor(ctx, body)
	if err != nil {
		return handleError(err, r)
	}

	jsonResp, _ := json.MarshalIndent(resp, "", "  ")
	fmt.Println("Monitor created successfully:")
	fmt.Println(string(jsonResp))

	return nil
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
        return `// listDashboards lists all dashboards
func listDashboards(ctx context.Context, apiClient *datadog.APIClient) error {
	api := datadogV1.NewDashboardsApi(apiClient)

	resp, r, err := api.ListDashboards(ctx)
	if err != nil {
		return handleError(err, r)
	}

	if resp.Dashboards != nil {
		fmt.Printf("Found %d dashboards\\n", len(*resp.Dashboards))
	}
	jsonResp, _ := json.MarshalIndent(resp, "", "  ")
	fmt.Println(string(jsonResp))

	return nil
}`;

      case 'create':
        return `// createDashboard creates a new dashboard
func createDashboard(ctx context.Context, apiClient *datadog.APIClient) error {
	api := datadogV1.NewDashboardsApi(apiClient)

	body := datadogV1.Dashboard{
		Title:       "${params.title || 'My Dashboard'}",
		Description: datadog.PtrString("${params.description || 'Dashboard created via API'}"),
		Widgets: []datadogV1.Widget{
			{
				Definition: datadogV1.WidgetDefinition{
					TimeseriesWidgetDefinition: &datadogV1.TimeseriesWidgetDefinition{
						Type: datadogV1.TIMESERIESWIDGETDEFINITIONTYPE_TIMESERIES,
						Requests: []datadogV1.TimeseriesWidgetRequest{
							{
								Q:           datadog.PtrString("${params.query || 'avg:system.cpu.user{*}'}"),
								DisplayType: datadogV1.WIDGETDISPLAYTYPE_LINE.Ptr(),
							},
						},
						Title: datadog.PtrString("${params.widgetTitle || 'CPU Usage'}"),
					},
				},
			},
		},
		LayoutType: datadogV1.DASHBOARDLAYOUTTYPE_ORDERED,
	}

	resp, r, err := api.CreateDashboard(ctx, body)
	if err != nil {
		return handleError(err, r)
	}

	jsonResp, _ := json.MarshalIndent(resp, "", "  ")
	fmt.Println("Dashboard created successfully:")
	fmt.Println(string(jsonResp))

	return nil
}`;

      default:
        return this.generateGenericOperation('dashboards', operation, params);
    }
  }

  /**
   * Generate logs operations
   */
  private generateLogsOperation(_operation: string, params: Record<string, any>): string {
    return `// searchLogs searches logs
func searchLogs(ctx context.Context, apiClient *datadog.APIClient) error {
	api := datadogV2.NewLogsApi(apiClient)

	fromTime := time.Now().Add(-1 * time.Hour)
	toTime := time.Now()

	body := datadogV2.LogsListRequest{
		Filter: &datadogV2.LogsQueryFilter{
			Query: datadog.PtrString("${params.query || 'status:error'}"),
			From:  datadog.PtrString(fromTime.Format(time.RFC3339)),
			To:    datadog.PtrString(toTime.Format(time.RFC3339)),
		},
		Page: &datadogV2.LogsListRequestPage{
			Limit: datadog.PtrInt32(${params.limit || 50}),
		},
		Sort: datadogV2.LOGSSORT_TIMESTAMP_ASCENDING.Ptr(),
	}

	resp, r, err := api.ListLogs(ctx, *datadogV2.NewListLogsOptionalParameters().WithBody(body))
	if err != nil {
		return handleError(err, r)
	}

	if resp.Data != nil {
		fmt.Printf("Found %d log entries\\n", len(*resp.Data))
	}
	jsonResp, _ := json.MarshalIndent(resp, "", "  ")
	fmt.Println(string(jsonResp))

	return nil
}`;
  }

  /**
   * Generate traces operations
   */
  private generateTracesOperation(_operation: string, params: Record<string, any>): string {
    return `// searchTraces searches traces/spans
func searchTraces(ctx context.Context, apiClient *datadog.APIClient) error {
	api := datadogV2.NewSpansApi(apiClient)

	fromTime := time.Now().Add(-1 * time.Hour)
	toTime := time.Now()

	body := datadogV2.SpansListRequest{
		Filter: &datadogV2.SpansQueryFilter{
			Query: datadog.PtrString("${params.query || 'service:web-app'}"),
			From:  datadog.PtrString(fromTime.Format(time.RFC3339)),
			To:    datadog.PtrString(toTime.Format(time.RFC3339)),
		},
		Page: &datadogV2.SpansListRequestPage{
			Limit: datadog.PtrInt32(${params.limit || 50}),
		},
		Sort: datadogV2.SPANSSORT_TIMESTAMP_ASCENDING.Ptr(),
	}

	resp, r, err := api.ListSpans(ctx, *datadogV2.NewListSpansOptionalParameters().WithBody(body))
	if err != nil {
		return handleError(err, r)
	}

	if resp.Data != nil {
		fmt.Printf("Found %d spans\\n", len(*resp.Data))
	}
	jsonResp, _ := json.MarshalIndent(resp, "", "  ")
	fmt.Println(string(jsonResp))

	return nil
}`;
  }

  /**
   * Generate SLOs operations
   */
  private generateSLOsOperation(_operation: string, _params: Record<string, any>): string {
    return `// listSLOs lists SLOs
func listSLOs(ctx context.Context, apiClient *datadog.APIClient) error {
	api := datadogV1.NewServiceLevelObjectivesApi(apiClient)

	resp, r, err := api.ListSLOs(ctx)
	if err != nil {
		return handleError(err, r)
	}

	if resp.Data != nil {
		fmt.Printf("Found %d SLOs\\n", len(*resp.Data))
	}
	jsonResp, _ := json.MarshalIndent(resp, "", "  ")
	fmt.Println(string(jsonResp))

	return nil
}`;
  }

  /**
   * Generate incidents operations
   */
  private generateIncidentsOperation(_operation: string, _params: Record<string, any>): string {
    return `// listIncidents lists incidents
func listIncidents(ctx context.Context, apiClient *datadog.APIClient) error {
	api := datadogV2.NewIncidentsApi(apiClient)

	resp, r, err := api.ListIncidents(ctx)
	if err != nil {
		return handleError(err, r)
	}

	if resp.Data != nil {
		fmt.Printf("Found %d incidents\\n", len(resp.Data))
	}
	jsonResp, _ := json.MarshalIndent(resp, "", "  ")
	fmt.Println(string(jsonResp))

	return nil
}`;
  }

  /**
   * Generate synthetics operations
   */
  private generateSyntheticsOperation(_operation: string, _params: Record<string, any>): string {
    return `// listSyntheticTests lists synthetic tests
func listSyntheticTests(ctx context.Context, apiClient *datadog.APIClient) error {
	api := datadogV1.NewSyntheticsApi(apiClient)

	resp, r, err := api.ListTests(ctx)
	if err != nil {
		return handleError(err, r)
	}

	if resp.Tests != nil {
		fmt.Printf("Found %d tests\\n", len(*resp.Tests))
	}
	jsonResp, _ := json.MarshalIndent(resp, "", "  ")
	fmt.Println(string(jsonResp))

	return nil
}`;
  }

  /**
   * Generate RUM operations
   */
  private generateRUMOperation(_operation: string, params: Record<string, any>): string {
    return `// searchRUMEvents searches RUM events
func searchRUMEvents(ctx context.Context, apiClient *datadog.APIClient) error {
	api := datadogV2.NewRUMApi(apiClient)

	fromTime := time.Now().Add(-1 * time.Hour)
	toTime := time.Now()

	body := datadogV2.RUMSearchEventsRequest{
		Filter: &datadogV2.RUMQueryFilter{
			Query: datadog.PtrString("${params.query || '@type:view'}"),
			From:  datadog.PtrString(fromTime.Format(time.RFC3339)),
			To:    datadog.PtrString(toTime.Format(time.RFC3339)),
		},
		Page: &datadogV2.RUMQueryPageOptions{
			Limit: datadog.PtrInt32(${params.limit || 50}),
		},
	}

	resp, r, err := api.ListRUMEvents(ctx, *datadogV2.NewListRUMEventsOptionalParameters().WithBody(body))
	if err != nil {
		return handleError(err, r)
	}

	if resp.Data != nil {
		fmt.Printf("Found %d RUM events\\n", len(*resp.Data))
	}
	jsonResp, _ := json.MarshalIndent(resp, "", "  ")
	fmt.Println(string(jsonResp))

	return nil
}`;
  }

  /**
   * Generate security operations
   */
  private generateSecurityOperation(_operation: string, params: Record<string, any>): string {
    return `// searchSecuritySignals searches security signals
func searchSecuritySignals(ctx context.Context, apiClient *datadog.APIClient) error {
	api := datadogV2.NewSecurityMonitoringApi(apiClient)

	fromTime := time.Now().Add(-1 * time.Hour)
	toTime := time.Now()

	body := datadogV2.SecurityMonitoringSignalListRequest{
		Filter: &datadogV2.SecurityMonitoringSignalListRequestFilter{
			Query: datadog.PtrString("${params.query || '*'}"),
			From:  &fromTime,
			To:    &toTime,
		},
		Page: &datadogV2.SecurityMonitoringSignalListRequestPage{
			Limit: datadog.PtrInt32(${params.limit || 50}),
		},
	}

	resp, r, err := api.SearchSecurityMonitoringSignals(ctx, *datadogV2.NewSearchSecurityMonitoringSignalsOptionalParameters().WithBody(body))
	if err != nil {
		return handleError(err, r)
	}

	if resp.Data != nil {
		fmt.Printf("Found %d security signals\\n", len(*resp.Data))
	}
	jsonResp, _ := json.MarshalIndent(resp, "", "  ")
	fmt.Println(string(jsonResp))

	return nil
}`;
  }

  /**
   * Generate infrastructure operations
   */
  private generateInfrastructureOperation(_operation: string, params: Record<string, any>): string {
    return `// listHosts lists infrastructure hosts
func listHosts(ctx context.Context, apiClient *datadog.APIClient) error {
	api := datadogV1.NewHostsApi(apiClient)

	optionalParams := datadogV1.NewListHostsOptionalParameters()
	${params.filter ? `optionalParams.WithFilter("${params.filter}")` : ''}

	resp, r, err := api.ListHosts(ctx, *optionalParams)
	if err != nil {
		return handleError(err, r)
	}

	if resp.HostList != nil {
		fmt.Printf("Found %d hosts\\n", len(*resp.HostList))
	}
	jsonResp, _ := json.MarshalIndent(resp, "", "  ")
	fmt.Println(string(jsonResp))

	return nil
}`;
  }

  /**
   * Generate admin operations
   */
  private generateAdminOperation(_operation: string, _params: Record<string, any>): string {
    return `// listUsers lists users
func listUsers(ctx context.Context, apiClient *datadog.APIClient) error {
	api := datadogV2.NewUsersApi(apiClient)

	resp, r, err := api.ListUsers(ctx)
	if err != nil {
		return handleError(err, r)
	}

	if resp.Data != nil {
		fmt.Printf("Found %d users\\n", len(resp.Data))
	}
	jsonResp, _ := json.MarshalIndent(resp, "", "  ")
	fmt.Println(string(jsonResp))

	return nil
}`;
  }

  /**
   * Generate generic operation (fallback)
   */
  private generateGenericOperation(domain: string, operation: string, params: Record<string, any>): string {
    const funcName = this.toCamelCase(`${operation}_${domain}`);
    return `// ${funcName} performs ${operation} operation for ${domain}
// Note: This is a generic template. Customize as needed.
func ${funcName}(ctx context.Context, apiClient *datadog.APIClient) error {
	// TODO: Implement ${operation} for ${domain}
	// Parameters: ${JSON.stringify(params)}
	fmt.Println("Operation not yet implemented")
	return nil
}`;
  }

  /**
   * Generate error handling
   */
  private generateErrorHandling(): string {
    return `// handleError handles API errors
func handleError(err error, r *http.Response) error {
	fmt.Fprintf(os.Stderr, "Error: %v\\n", err)
	if r != nil {
		fmt.Fprintf(os.Stderr, "HTTP Status: %d\\n", r.StatusCode)
		body, _ := io.ReadAll(r.Body)
		fmt.Fprintf(os.Stderr, "Response Body: %s\\n", string(body))
	}
	return err
}`;
  }

  /**
   * Generate main function
   */
  private generateMainFunction(domain: string, operation: string): string {
    const funcName = this.getFunctionName(domain, operation);

    return `func main() {
	// Validate environment variables
	if os.Getenv("DD_API_KEY") == "" || os.Getenv("DD_APP_KEY") == "" {
		fmt.Fprintln(os.Stderr, "Error: DD_API_KEY and DD_APP_KEY environment variables are required")
		fmt.Fprintln(os.Stderr, "Set them with: export DD_API_KEY='...' DD_APP_KEY='...'")
		os.Exit(1)
	}

	// Configure Datadog client
	configuration := datadog.NewConfiguration()
	configuration.SetUnstableOperationEnabled("v2.QueryTimeseriesData", true)
	apiClient := datadog.NewAPIClient(configuration)

	ctx := context.WithValue(
		context.Background(),
		datadog.ContextAPIKeys,
		map[string]datadog.APIKey{
			"apiKeyAuth": {
				Key: os.Getenv("DD_API_KEY"),
			},
			"appKeyAuth": {
				Key: os.Getenv("DD_APP_KEY"),
			},
		},
	)

	// Set Datadog site if specified
	if site := os.Getenv("DD_SITE"); site != "" {
		ctx = context.WithValue(ctx, datadog.ContextServerVariables, map[string]string{
			"site": site,
		})
	}

	// Execute operation
	if err := ${funcName}(ctx, apiClient); err != nil {
		fmt.Fprintf(os.Stderr, "Operation failed: %v\\n", err)
		os.Exit(1)
	}
}`;
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

    return operationMap[`${domain}-${operation}`] || this.toCamelCase(`${operation}_${domain}`);
  }

  /**
   * Convert string to camelCase
   */
  private toCamelCase(str: string): string {
    return str.replace(/[-_](.)/g, (_, c) => c.toUpperCase());
  }
}

/**
 * Export convenience function
 */
export function generateGoCode(options: CodeGenOptions): string {
  const generator = new GoCodeGenerator();
  return generator.generate(options);
}
