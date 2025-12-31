# Datadog API Claude Plugin

## Overview

The Datadog API Claude Plugin enables Claude to directly interact with Datadog APIs without requiring an MCP (Model Context Protocol) server. This plugin provides seamless integration with Datadog's comprehensive monitoring and observability platform, allowing users to query, read, and write data through natural language interactions.

## Agent Organization

The plugin provides two categories of specialized agents that work together to provide comprehensive Datadog functionality:

### Data Agents (Query & Analysis)

Data agents enable you to **query and analyze** observability data. These agents provide read-only access to your telemetry data for investigation and troubleshooting.

**When to use**:
- Investigating production issues
- Searching for errors or anomalies
- Analyzing application performance
- Troubleshooting distributed systems
- Viewing historical data

**Available Data Agents**:
- **logs.md**: Search and analyze log data with flexible queries, time ranges, and tag-based filtering
- **traces.md**: Query APM traces and spans for distributed tracing analysis and performance monitoring
- **metrics.md**: Query and analyze time-series metrics data
- **rum.md**: Access Real User Monitoring data for frontend performance analysis
- **security.md**: Query security signals and findings
- **events.md**: Search and analyze event data from across your infrastructure

**Example queries**:
```
"Show me error logs from the API service in the last hour"
"Find slow traces for the checkout endpoint"
"What database queries are taking more than 1 second?"
"Show metrics for CPU usage on production hosts"
"What security signals fired in the last 24 hours?"
```

### Configuration Agents (Setup & Management)

Configuration agents enable you to **configure and manage** how Datadog collects, processes, stores, and forwards your telemetry data. These agents provide both read and write access to your Datadog configuration.

**When to use**:
- Setting up log archival to S3/GCS/Azure
- Creating log processing pipelines
- Configuring retention policies
- Managing data forwarding to external systems
- Controlling APM span indexing
- Creating custom metrics from traces

**Available Configuration Agents**:
- **observability-pipelines.md**: Manage infrastructure-level data pipelines that collect, transform, and route observability data from various sources to multiple destinations (Datadog, S3, Splunk, etc.)
- **log-configuration.md**: Manage Datadog backend log configuration including archives, processing pipelines, indexes, custom destinations, and RBAC restriction queries
- **apm-configuration.md**: Manage APM retention filters (span indexing) and span-based metrics generation
- **rum-metrics-retention.md**: Configure RUM data retention and custom metrics generation from RUM events

**Example configurations**:
```
"Create a pipeline to collect logs from Kafka and send to both Datadog and S3"
"Set up PII redaction before logs leave my infrastructure"
"Create an S3 archive for production logs"
"Set up a pipeline to parse Nginx logs in Datadog"
"Configure retention filters to sample staging traces at 10%"
"Create a metric for API endpoint latency by status code"
"Set up RUM session replay retention for production environment"
```

#### Understanding Pipeline Types

The plugin provides two distinct types of pipelines that serve different purposes:

**Observability Pipelines** (observability-pipelines.md):
- **Where**: Run in YOUR infrastructure (deployed and managed by you)
- **When**: Process data BEFORE it reaches Datadog or other destinations
- **Purpose**: Centralized data collection, transformation, and multi-destination routing
- **Use cases**:
  - Collect logs from diverse sources (Kafka, Splunk, S3, syslog, etc.)
  - Apply transformations (parsing, filtering, enrichment) before ingestion
  - Route data to multiple destinations (Datadog + S3 + Splunk simultaneously)
  - Redact PII before data leaves your infrastructure
  - Control costs with sampling and quota management at the source
- **API**: `/api/v2/remote_config/products/obs_pipelines/pipelines` (Preview)

**Log Pipelines** (log-configuration.md):
- **Where**: Run in DATADOG's infrastructure (managed by Datadog)
- **When**: Process logs AFTER they've been ingested by Datadog
- **Purpose**: Parse, enrich, and structure logs for better searchability in Datadog
- **Use cases**:
  - Parse unstructured log messages with Grok patterns
  - Extract and remap attributes for standardization
  - Define official timestamp, status, and service fields
  - Categorize and enrich logs for better filtering
  - Link logs to APM traces
- **API**: `/api/v1/logs/config/pipelines`

**When to use each**:
- Use **Observability Pipelines** when you need to:
  - Collect data from non-Datadog sources
  - Send data to multiple destinations
  - Process/filter data before it enters any system
  - Keep PII handling within your infrastructure
  - Reduce ingestion costs through pre-filtering

- Use **Log Pipelines** when you need to:
  - Parse logs already in Datadog
  - Standardize log attributes for searching
  - Enrich logs with Datadog-specific features
  - Link logs to traces and other Datadog data

**They work together**:
1. Observability Pipelines collect and route data to Datadog
2. Log Pipelines then parse and enrich that data within Datadog
3. Log Indexes organize the processed logs for searching
4. Log Archives store logs long-term for compliance

### How They Work Together

Data and configuration agents complement each other in a typical workflow:

1. **Configuration Phase**: Use configuration agents to set up how data is collected and processed
   - Example: Create log pipelines to parse and enrich logs
   - Example: Configure APM retention filters to control indexing costs

2. **Analysis Phase**: Use data agents to query and analyze the data
   - Example: Search parsed logs to investigate errors
   - Example: Query indexed traces to analyze performance

3. **Optimization Phase**: Use configuration agents to refine based on insights
   - Example: Adjust retention filters based on which traces are most valuable
   - Example: Create span-based metrics for key performance indicators

**Key Distinction**:
- **Data agents answer "What happened?"** - They query existing data
- **Configuration agents answer "How should we handle data?"** - They set up infrastructure

## Complete Agent Reference

The plugin provides 41 specialized agents organized into functional categories. Each agent focuses on a specific area of Datadog functionality.

### Monitoring & Observability

Agents for setting up monitoring, alerting, visualization, and observability workflows:

- **monitoring-alerting.md**: Complete monitoring lifecycle including monitors, templates, notification routing, and downtimes
- **dashboards.md**: Create and manage visualization dashboards
- **slos.md**: Define and track Service Level Objectives
- **synthetics.md**: Configure synthetic monitoring tests
- **notebooks.md**: Create collaborative investigation notebooks
- **powerpacks.md**: Manage reusable dashboard widget templates

### Infrastructure & Performance

Agents for monitoring infrastructure, containers, databases, and network performance:

- **infrastructure.md**: View and manage infrastructure host inventory (VMs, cloud instances, physical servers)
- **container-monitoring.md**: Monitor container and Kubernetes performance metrics
- **database-monitoring.md**: Database query performance and monitoring
- **network-performance.md**: Network flow and performance analysis

### Security & Compliance

Agents for security monitoring, posture management, and threat detection:

- **security-posture-management.md**: CSPM, vulnerability management, security findings, and SBOM analysis
- **application-security.md**: Application Security Monitoring (ASM) for runtime threat detection
- **cloud-workload-security.md**: Cloud Workload Security (CWS) for runtime security monitoring
- **agentless-scanning.md**: Agentless vulnerability scanning for cloud resources

### Development & Quality

Agents for CI/CD integration, code quality, and developer workflows:

- **cicd.md**: CI/CD pipeline visibility and testing
- **error-tracking.md**: Track and manage application errors
- **static-analysis.md**: Static code analysis and security scanning
- **scorecards.md**: Service quality scorecards and best practices
- **service-catalog.md**: Service registry and ownership tracking

### Organization & Access

Agents for user management, access control, and governance:

- **user-access-management.md**: Comprehensive user, service account, team management, memberships, SCIM, and authentication mappings
- **organization-management.md**: Multi-org settings, accounts, and billing management
- **data-governance.md**: Data access controls, reference tables, sensitive data scanning, IP/domain allowlists
- **audit-logs.md**: Audit trail for organizational changes and access
- **api-management.md**: API key and application key management

### Operations & Automation

Agents for incident response, automation, and operational workflows:

- **incident-response.md**: Complete incident workflow including on-call management, incident tracking, and case management
- **workflows.md**: Automated workflows and orchestration
- **fleet-automation.md**: Manage agent deployments and configurations at scale
- **app-builder.md**: Build custom internal applications with Datadog data

### Cost & Usage

Agents for cost monitoring, usage tracking, and data management:

- **cloud-cost.md**: Cloud cost monitoring and optimization
- **usage-metering.md**: Track Datadog usage and attribution
- **data-deletion.md**: Manage data retention and deletion policies

### Quick Selection Guide

**For investigating issues**: Start with data agents (logs, traces, metrics, rum, security, events)

**For setting up infrastructure**: Use observability-pipelines, log-configuration, apm-configuration

**For monitoring and alerting**: Use monitoring-alerting, dashboards, slos, synthetics

**For security**: Use security-posture-management, application-security, cloud-workload-security

**For team management**: Use user-access-management, organization-management, data-governance

**For incidents**: Use incident-response for the complete workflow

**For automation**: Use workflows, fleet-automation, app-builder

## Architecture

### Direct API Integration

Unlike traditional MCP-based approaches, this plugin leverages Datadog's official API clients directly:

- **TypeScript Client**: [datadog-api-client-typescript](https://github.com/DataDog/datadog-api-client-typescript)
- **Python Client**: [datadog-api-client-python](https://github.com/DataDog/datadog-api-client-python)
- **API Documentation**: [Datadog API Reference](https://docs.datadoghq.com/api/latest/?tab=typescript)
- **OpenAPI Specifications**: Available in the private `datadog-api-spec` repository (locally ../datadog-api-spec, or https://github.com/DataDog/datadog-api-spec on github)

This direct integration approach offers several advantages:
- Lower latency by eliminating the MCP server layer
- Direct access to all Datadog API endpoints
- Automatic updates with API client library releases
- Native support for multiple programming languages

## Use Cases

### 1. Interactive Queries

Users can ask natural language questions that translate into Datadog API calls:

```
"Show me the CPU usage for my production hosts in the last hour"
"What monitors are currently alerting?"
"List all custom metrics starting with 'app.'"
```

### 2. Data Operations

The plugin supports both read and write operations with appropriate permission prompting:

- **Read**: Query metrics, logs, traces, monitors, dashboards, and other Datadog resources
- **Write**: Create, update, or delete monitors, dashboards, SLOs, and other configurations

### 3. Application Development

Users can build complete applications or enhance existing ones with Datadog integration:

- Generate monitoring dashboards programmatically
- Automate incident response workflows
- Build custom observability tools
- Integrate Datadog data into internal platforms

When building applications, the plugin uses the appropriate language-specific client library to generate idiomatic code for the target environment.

### 4. Infrastructure as Code

- Generate Terraform or other IaC configurations for Datadog resources
- Validate existing configurations against best practices
- Migrate configurations between Datadog accounts

## Permission Model

The plugin implements a permission-aware interaction model:

1. **Read Operations**: Generally allowed with minimal prompting for non-sensitive data
2. **Write Operations**: Require explicit user confirmation before execution
3. **Destructive Operations**: Require additional confirmation with clear impact statements
4. **Credential Management**: Securely handles API keys and application keys

## Multi-Language Support

The plugin intelligently selects the appropriate Datadog API client based on the user's context:

- **TypeScript/JavaScript**: Uses `datadog-api-client-typescript` for Node.js applications
- **Python**: Uses `datadog-api-client-python` for Python applications
- **Other Languages**: Provides HTTP API guidance with examples

When generating code, the plugin ensures:
- Proper error handling
- Appropriate authentication configuration
- Best practices for the target language
- Clear documentation and comments

## Getting Started

### Prerequisites

- Claude Code CLI or Claude plugin-enabled environment
- Datadog API key and Application key
- Access to a Datadog organization

### Installation

```bash
# Clone the repository
git clone https://github.com/DataDog/datadog-api-claude-plugin.git
cd datadog-api-claude-plugin

# Install the plugin (instructions vary by Claude environment)
```

### Configuration

Set up your Datadog credentials as environment variables:

```bash
export DD_API_KEY="your-api-key"
export DD_APP_KEY="your-app-key"
export DD_SITE="datadoghq.com"  # or your specific Datadog site
```

## Example Interactions

### Query Metrics

```
User: "What's the average response time for my API service?"
Claude: [Queries metrics API and returns formatted results]
```

### Create a Monitor

```
User: "Create a monitor that alerts when error rate exceeds 5% for my web service"
Claude: [Generates monitor configuration and asks for confirmation before creating]
```

### Build an Application

```
User: "Help me build a Python script that exports all my monitors to JSON files"
Claude: [Generates complete Python application using datadog-api-client-python]
```

### Dashboard Management

```
User: "Clone my production dashboard and modify it for staging"
Claude: [Retrieves dashboard, modifies configuration, and creates new dashboard]
```

## API Coverage

The plugin provides access to all Datadog API endpoints, including:

- **Metrics**: Query, submit, and manage custom metrics
- **Logs**: Search and analyze log data
- **Traces**: Query APM traces and spans
- **Monitors**: Create, update, and manage alerting monitors
- **Dashboards**: Build and modify dashboards programmatically
- **SLOs**: Define and track service level objectives
- **Incidents**: Manage incident response workflows
- **Synthetics**: Configure synthetic monitoring tests
- **RUM**: Access Real User Monitoring data
- **Security**: Query security signals and findings

## Development

### Project Structure

```
.
├── .claude-plugin/
│   └── plugin.json          # Plugin metadata and configuration
├── src/                     # Plugin implementation (TBD)
├── tests/                   # Test suite (TBD)
└── AGENTS.md               # This file
```

### Contributing

Contributions are welcome! Please refer to the main repository for contribution guidelines.

## Security Considerations

- **API Key Protection**: Never commit API keys or application keys to version control
- **Permission Scoping**: Use API keys with minimal required permissions
- **Audit Logging**: All write operations are logged for audit purposes
- **Data Privacy**: Be mindful of sensitive data when querying logs or traces

## Support

- **Documentation**: [Datadog API Documentation](https://docs.datadoghq.com/api/latest/)
- **Client Libraries**: See official Datadog client repositories
- **Issues**: Report issues on the [GitHub repository](https://github.com/DataDog/datadog-api-claude-plugin/issues)

## License

MIT License - See LICENSE file for details

## Related Resources

- [Datadog Documentation](https://docs.datadoghq.com/)
- [Datadog API Client TypeScript](https://github.com/DataDog/datadog-api-client-typescript)
- [Datadog API Client Python](https://github.com/DataDog/datadog-api-client-python)
- [Datadog OpenAPI Specification](https://github.com/DataDog/datadog-api-spec) (Private)

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **Create a branch for isolating work** - Creating a new branch is important for isolating work. This will be managed in github PRs.
2. **File issues for remaining work** - Create issues for anything that needs follow-up
3. **Run quality gates** (if code changed) - Tests, linters, builds
4. **Update issue status** - Close finished work, update in-progress items
5. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
6. **Clean up** - Clear stashes, prune remote branches
7. **Verify** - All changes committed AND pushed
8. **Manage PR** - use the `gh` tool to create a PR, and update the description appropriately with information for a human or another AI code review bot.
9. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
