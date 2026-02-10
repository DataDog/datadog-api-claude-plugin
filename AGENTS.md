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
- **audience-management.md**: Query and segment RUM users and accounts, analyze audience attributes and behavior patterns
- **security.md**: Query security signals and findings
- **events.md**: Search and analyze event data from across your infrastructure

**Example queries**:
```
"Show me error logs from the API service in the last hour"
"Find slow traces for the checkout endpoint"
"What database queries are taking more than 1 second?"
"Show metrics for CPU usage on production hosts"
"What security signals fired in the last 24 hours?"
"Find all enterprise users in the US who haven't logged in for 30 days"
"Show me the browser distribution for users experiencing errors"
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
- **audience-management.md**: Manage data connections to enrich RUM user and account data with external sources (CRM, reference tables)

**Example configurations**:
```
"Create a pipeline to collect logs from Kafka and send to both Datadog and S3"
"Set up PII redaction before logs leave my infrastructure"
"Create an S3 archive for production logs"
"Set up a pipeline to parse Nginx logs in Datadog"
"Configure retention filters to sample staging traces at 10%"
"Create a metric for API endpoint latency by status code"
"Set up RUM session replay retention for production environment"
"Connect our CRM to enrich user profiles with subscription tier and lifetime value"
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

The plugin provides 46 specialized agents organized into functional categories. Each agent focuses on a specific area of Datadog functionality.

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
- **audience-management.md**: RUM user and account segmentation, audience analytics, and data enrichment

### Organization & Access

Agents for user management, access control, and governance:

- **user-access-management.md**: Comprehensive user, service account, team management, memberships, SCIM, and authentication mappings
- **saml-configuration.md**: Configure SAML Single Sign-On (SSO) by uploading Identity Provider metadata
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
- **spark-pod-autosizing.md**: Optimize Spark pod resource allocation based on workload analysis

### Cost & Usage

Agents for cost monitoring, usage tracking, and data management:

- **cloud-cost.md**: Cloud cost monitoring and optimization
- **usage-metering.md**: Track Datadog usage and attribution
- **data-deletion.md**: Manage data retention and deletion policies

### Cloud & Third-Party Integrations

Agents for integrating with cloud providers and external services:

- **aws-integration.md**: Configure AWS account integration for monitoring, log collection, metrics, traces, and security (CSPM)
- **gcp-integration.md**: Configure GCP project integration for monitoring, metrics collection, and security (CSPM, Security Command Center)
- **azure-integration.md**: Configure Azure subscription integration for monitoring, metrics collection, and security (CSPM)
- **third-party-integrations.md**: Manage integrations with PagerDuty, Slack, OpsGenie, Microsoft Teams, Fastly, Confluent Cloud, Cloudflare, and Okta

## Agent Selection Guide

This comprehensive guide helps you select the right agent(s) for your needs through decision trees, role-based guidance, and scenario-based examples.

### Decision Tree: Finding Your Agent

Start here to quickly identify which agent(s) you need:

```
What do you want to do?
│
├─ 📊 INVESTIGATE/ANALYZE (Read-only queries)
│  │
│  ├─ Logs & Events
│  │  ├─ Search log messages → logs
│  │  └─ Query infrastructure events → events
│  │
│  ├─ Application Performance
│  │  ├─ Trace distributed requests → traces
│  │  ├─ Query custom metrics → metrics
│  │  ├─ Frontend performance → rum
│  │  ├─ User & audience segmentation → audience-management
│  │  └─ Error analysis → error-tracking
│  │
│  ├─ Infrastructure & Resources
│  │  ├─ Host inventory & metrics → infrastructure
│  │  ├─ Container/Kubernetes metrics → container-monitoring
│  │  ├─ Database performance → database-monitoring
│  │  └─ Network traffic analysis → network-performance
│  │
│  └─ Security & Compliance
│     ├─ Security signals & threats → security
│     ├─ Vulnerability findings → security-posture-management
│     ├─ Runtime threats → application-security, cloud-workload-security
│     └─ Audit trail → audit-logs
│
├─ ⚙️  CONFIGURE/SETUP (Read/write configuration)
│  │
│  ├─ Data Collection & Processing
│  │  ├─ Collect from external sources → observability-pipelines
│  │  ├─ Parse logs in Datadog → log-configuration
│  │  ├─ Configure APM sampling → apm-configuration
│  │  ├─ RUM retention & metrics → rum-metrics-retention
│  │  └─ Enrich user data with CRM → audience-management
│  │
│  ├─ Monitoring & Alerting
│  │  ├─ Create/manage monitors → monitoring-alerting
│  │  ├─ Build dashboards → dashboards
│  │  ├─ Define SLOs → slos
│  │  └─ Synthetic tests → synthetics
│  │
│  └─ Data Management
│     ├─ Archive to cloud storage → log-configuration
│     ├─ Retention policies → data-deletion, log-configuration
│     └─ Access controls → data-governance
│
├─ 👥 MANAGE (Organization & access)
│  │
│  ├─ Users & Teams → user-access-management
│  ├─ SAML SSO setup → saml-configuration
│  ├─ Organization settings → organization-management
│  ├─ API keys → api-management
│  ├─ Data permissions → data-governance
│  └─ Audit activities → audit-logs
│
├─ 🔒 SECURE (Security operations)
│  │
│  ├─ Posture & vulnerabilities → security-posture-management
│  ├─ Runtime protection → application-security, cloud-workload-security
│  ├─ Cloud scanning → agentless-scanning
│  └─ Code security → static-analysis
│
├─ 🚨 RESPOND (Incident management)
│  │
│  ├─ Full incident workflow → incident-response
│  ├─ Investigation notebooks → notebooks
│  └─ Error management → error-tracking
│
├─ 🔧 AUTOMATE (Workflows & operations)
│  │
│  ├─ Workflow automation → workflows
│  ├─ Agent deployment → fleet-automation
│  ├─ Custom apps → app-builder
│  └─ CI/CD integration → cicd
│
└─ 💰 OPTIMIZE (Cost & usage)
   │
   ├─ Cloud costs → cloud-cost
   ├─ Datadog usage → usage-metering
   └─ Data lifecycle → data-deletion
```

### Selection by User Role

#### Site Reliability Engineer (SRE)
**Primary focus**: System reliability, performance, and incident response

**Start here**:
- **Investigating outages**: logs, traces, metrics, infrastructure, container-monitoring
- **Setting up monitoring**: monitoring-alerting, dashboards, slos
- **Incident management**: incident-response, notebooks
- **Performance analysis**: traces, database-monitoring, network-performance

**Example workflow**: "Production API is slow"
1. traces → Find slow requests and identify bottlenecks
2. logs → Check for errors during slow periods
3. database-monitoring → Analyze database query performance
4. monitoring-alerting → Create alert for latency threshold

#### DevOps Engineer
**Primary focus**: Infrastructure, deployment, automation

**Start here**:
- **Infrastructure visibility**: infrastructure, container-monitoring
- **Log management**: observability-pipelines, log-configuration
- **CI/CD**: cicd, fleet-automation
- **Automation**: workflows, app-builder

**Example workflow**: "Set up logging for new microservice"
1. observability-pipelines → Configure log collection from Kubernetes
2. log-configuration → Create parsing pipeline for application logs
3. log-configuration → Set up archive to S3 for compliance
4. monitoring-alerting → Create alerts for error rates

#### Security Engineer
**Primary focus**: Threat detection, compliance, vulnerability management

**Start here**:
- **Posture management**: security-posture-management, agentless-scanning
- **Threat detection**: application-security, cloud-workload-security
- **Compliance**: audit-logs, data-governance
- **Code security**: static-analysis

**Example workflow**: "Investigate security alert"
1. security → Query recent security signals
2. application-security → Check for attack patterns
3. logs → Search for suspicious activity
4. audit-logs → Review access patterns

#### Application Developer
**Primary focus**: Application performance, errors, user experience

**Start here**:
- **Error tracking**: error-tracking, logs
- **Performance**: traces, rum, metrics
- **User analytics**: audience-management, rum
- **Testing**: synthetics, cicd
- **Service management**: service-catalog, scorecards

**Example workflow**: "Debug production error"
1. error-tracking → Find error details and frequency
2. traces → Locate traces with errors
3. logs → View log context around errors
4. rum → Check if users are affected

#### Platform Engineer
**Primary focus**: Internal platforms, data pipelines, cost optimization

**Start here**:
- **Data pipelines**: observability-pipelines, log-configuration
- **Cost management**: cloud-cost, usage-metering
- **Access control**: user-access-management, data-governance
- **Internal tools**: app-builder, workflows

**Example workflow**: "Optimize observability costs"
1. usage-metering → Analyze Datadog usage by team
2. log-configuration → Adjust log retention policies
3. apm-configuration → Configure smart trace sampling
4. cloud-cost → Identify expensive cloud resources

### Selection by Common Scenarios

#### Scenario: Troubleshooting Production Issues

**Goal**: Quickly identify and resolve production incidents

**Agent sequence**:
1. **Initial investigation** (Data agents - parallel):
   - logs → Search for errors and warnings
   - metrics → Check system resource usage
   - traces → Find slow or failed requests
   - events → Look for deployment or configuration changes

2. **Deep dive** (Based on findings):
   - database-monitoring → If DB performance suspected
   - network-performance → If network issues suspected
   - rum → If frontend/user experience affected
   - audience-management → To identify which user segments are affected
   - security → If suspicious activity detected

3. **Context gathering** (Documentation):
   - notebooks → Document investigation findings
   - incident-response → Create/update incident record

4. **Prevention** (Configuration agents):
   - monitoring-alerting → Create alerts to prevent recurrence
   - dashboards → Build dashboard for this scenario

**Example queries**:
```
"Show error logs from checkout service in last 30 minutes"
"Find traces with 500 errors for /api/payment endpoint"
"What changed in production in the last hour?" (events)
"Is this affecting real users?" (rum)
```

#### Scenario: Setting Up a New Service

**Goal**: Configure complete observability for a new microservice

**Agent sequence**:
1. **Data collection setup** (Configuration agents - sequential):
   - observability-pipelines → Configure log collection from service
   - log-configuration → Create parsing pipeline for log format
   - apm-configuration → Set up trace sampling rules

2. **Monitoring setup** (Configuration agents - parallel):
   - monitoring-alerting → Create key alerts (errors, latency, resources)
   - dashboards → Build service overview dashboard
   - slos → Define SLO for service availability/performance

3. **Testing** (Configuration agents):
   - synthetics → Create synthetic tests for critical endpoints

4. **Documentation** (Configuration agents):
   - service-catalog → Register service with metadata
   - scorecards → Define quality standards

5. **Validation** (Data agents):
   - logs → Verify logs are flowing
   - traces → Confirm traces are captured
   - metrics → Check metrics are reporting

**Example queries**:
```
"Create pipeline to parse JSON logs from my new Python service"
"Set up alert when error rate exceeds 1% for 5 minutes"
"Build a dashboard showing request rate, latency, and errors"
"Define SLO: 99.9% of requests complete in under 500ms"
```

#### Scenario: Security Audit & Compliance

**Goal**: Review security posture and ensure compliance

**Agent sequence**:
1. **Posture assessment** (Data agents - parallel):
   - security-posture-management → Query vulnerability findings
   - agentless-scanning → Check for unpatched resources
   - audit-logs → Review access and configuration changes
   - security → Check recent security signals

2. **Code security** (Data agents):
   - static-analysis → Review code security findings
   - application-security → Check runtime threats

3. **Access review** (Data/Config agents):
   - user-access-management → Audit user access and permissions
   - data-governance → Review data access controls
   - api-management → Audit API key usage

4. **Remediation** (Configuration agents):
   - data-governance → Update access policies
   - user-access-management → Adjust user permissions
   - monitoring-alerting → Create security alerts

**Example queries**:
```
"Show all critical vulnerabilities in production"
"Who accessed sensitive data in the last 30 days?" (audit-logs)
"What security signals fired this week?"
"List all users with admin access" (user-access-management)
```

#### Scenario: Cost Optimization

**Goal**: Reduce observability and infrastructure costs

**Agent sequence**:
1. **Cost analysis** (Data agents - parallel):
   - usage-metering → Analyze Datadog usage by product/team
   - cloud-cost → Review cloud infrastructure costs
   - logs → Identify high-volume log sources
   - traces → Identify high-volume trace sources

2. **Optimization actions** (Configuration agents):
   - log-configuration → Adjust retention and exclusion filters
   - apm-configuration → Configure intelligent trace sampling
   - data-deletion → Set up data lifecycle policies
   - observability-pipelines → Add sampling at collection point

3. **Monitoring** (Configuration agents):
   - dashboards → Create cost tracking dashboard
   - monitoring-alerting → Alert on cost anomalies

4. **Validation** (Data agents):
   - usage-metering → Verify cost reductions

**Example queries**:
```
"Which services generate the most indexed logs?"
"What's our current APM span usage by service?"
"Set up sampling to reduce trace volume by 50% for staging"
"Create archive to S3 and reduce log retention to 15 days"
```

#### Scenario: Building Internal Tools

**Goal**: Create custom internal applications with Datadog data

**Agent sequence**:
1. **Planning** (Data agents - exploration):
   - metrics, logs, traces → Identify data sources needed
   - dashboards → Review existing visualizations

2. **Data access** (Data agents):
   - Use relevant data agents (logs, traces, metrics, etc.) to query data
   - rum → If building user analytics tools
   - usage-metering → If building cost dashboards

3. **Application development** (Configuration agents):
   - app-builder → Build UI and workflows
   - workflows → Create automation
   - api-management → Generate API keys for application

4. **Integration** (Configuration agents):
   - dashboards → Embed Datadog dashboards
   - notebooks → Integrate investigation tools

**Example queries**:
```
"Build an app showing team-level cost attribution"
"Create workflow to auto-remediate common issues"
"Generate API key for internal monitoring dashboard"
"Embed deployment dashboard in internal portal"
```

### Common Multi-Agent Workflows

#### Workflow: Comprehensive Service Health Check

This workflow combines multiple agents to get complete service visibility:

```
1. infrastructure → Check host health and resource usage
2. container-monitoring → Verify pod/container status (if applicable)
3. traces → Analyze request latency and error rates
4. logs → Check for errors and warnings
5. database-monitoring → Review query performance
6. rum → Verify user experience metrics (if frontend service)
7. synthetics → Check endpoint availability
8. monitoring-alerting → Review active alerts
```

**Use when**: Performing routine health checks or pre-deployment validation

#### Workflow: End-to-End Log Management

This workflow sets up complete log infrastructure:

```
1. observability-pipelines → Collect logs from sources
   ↓
2. log-configuration → Parse and enrich logs
   ↓
3. log-configuration → Configure indexes for searching
   ↓
4. log-configuration → Set up archives for long-term storage
   ↓
5. data-governance → Apply access controls
   ↓
6. logs → Validate logs are searchable (data agent)
```

**Use when**: Setting up logging for new services or migrating log infrastructure

#### Workflow: Security Incident Response

This workflow handles security incidents from detection to resolution:

```
1. security → Detect and triage security signals
   ↓
2. application-security → Analyze attack patterns
   ↓
3. logs → Search for related suspicious activity
   ↓
4. traces → Identify affected requests/services
   ↓
5. audit-logs → Review access patterns
   ↓
6. incident-response → Document incident
   ↓
7. cloud-workload-security → Verify runtime protections
   ↓
8. monitoring-alerting → Create prevention alerts
```

**Use when**: Responding to security alerts or investigating breaches

#### Workflow: Performance Optimization

This workflow identifies and resolves performance issues:

```
1. traces → Identify slow endpoints and services
   ↓
2. database-monitoring → Analyze slow queries
   ↓
3. metrics → Check resource utilization trends
   ↓
4. logs → Look for performance-related warnings
   ↓
5. rum → Validate user-perceived performance
   ↓
6. apm-configuration → Create metrics for tracking
   ↓
7. monitoring-alerting → Set up performance alerts
   ↓
8. dashboards → Build performance dashboard
```

**Use when**: Addressing performance complaints or proactive optimization

### Quick Reference by Intent

**"I want to know what happened"** → Data agents (logs, traces, metrics, events, security)

**"I want to set up..."** → Configuration agents (observability-pipelines, log-configuration, apm-configuration)

**"I want to be alerted when..."** → monitoring-alerting, slos, synthetics

**"I want to see..."** → dashboards, notebooks (visualization) OR data agents (query data)

**"I want to manage users/access"** → user-access-management, data-governance, organization-management

**"I want to respond to an incident"** → incident-response, notebooks, logs, traces

**"I want to automate..."** → workflows, app-builder, fleet-automation

**"I want to reduce costs"** → cloud-cost, usage-metering, data-deletion, log-configuration

**"I want to improve security"** → security-posture-management, application-security, cloud-workload-security

**"I want to build something"** → app-builder (UI apps), workflows (automation), dashboards (visualizations)

**"I want to understand my users"** → audience-management, rum, error-tracking

**"I want to segment my audience"** → audience-management (query users/accounts, create segments)

## Agent Identification

The plugin automatically identifies which AI agent (Claude, Letta, ChatGPT, etc.) is using it and reports this information with every API request. This enables:

- **Better support**: Datadog can provide agent-specific help and optimization
- **Usage analytics**: Understanding which agents are using the API
- **Enhanced debugging**: Easier troubleshooting of agent-specific issues

The identification is:
- **Automatic**: Detects agent type from environment variables
- **Privacy-focused**: No user data, API keys, or request content is included
- **Transparent**: Sends agent info via HTTP headers with each request
- **Customizable**: Can be explicitly configured via `DD_AGENT_TYPE` and `DD_AGENT_VERSION` environment variables

For detailed information, see [AGENT_IDENTIFICATION.md](./AGENT_IDENTIFICATION.md).

## Architecture

### Pup CLI Integration

This plugin leverages the [pup CLI tool](https://github.com/DataDog/pup), a Go-based command-line wrapper for Datadog APIs:

- **Pup CLI**: Provides 28 command groups covering 33+ API domains
- **Official API Clients**: Pup uses official Datadog API clients internally
  - **Go Client**: [datadog-api-client-go](https://github.com/DataDog/datadog-api-client-go)
  - **TypeScript Client**: [datadog-api-client-typescript](https://github.com/DataDog/datadog-api-client-typescript)
  - **Python Client**: [datadog-api-client-python](https://github.com/DataDog/datadog-api-client-python)
  - **Java Client**: [datadog-api-client-java](https://github.com/DataDog/datadog-api-client-java)
  - **Rust Client**: [datadog-api-client-rust](https://github.com/DataDog/datadog-api-client-rust)
- **API Documentation**: [Datadog API Reference](https://docs.datadoghq.com/api/latest/)
- **OpenAPI Specifications**: Available in the private `datadog-api-spec` repository (locally ../datadog-api-spec, or https://github.com/DataDog/datadog-api-spec on github)

This architecture offers several advantages:
- Fast, single-binary Go tool for quick execution
- OAuth2 authentication with secure token storage
- Multiple output formats (JSON, YAML, table)
- Direct access to all Datadog API endpoints
- Automatic updates with pup releases
- Code generation capabilities for multiple languages

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
- **Go**: Uses `datadog-api-client-go` for Go applications
- **Rust**: Uses `datadog-api-client` for Rust applications
- **Java**: Uses `datadog-api-client-java` for Java applications
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

User: "Help me build a Go program that queries metrics"
Claude: [Generates complete Go application using datadog-api-client-go]

User: "Help me build a Rust application that searches logs"
Claude: [Generates complete Rust application using datadog-api-client]

User: "Help me build a Java application that queries metrics"
Claude: [Generates complete Java application using datadog-api-client-java]
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
datadog-api-claude-plugin/
├── .claude-plugin/
│   └── plugin.json          # Plugin metadata (references 46 agents)
├── agents/                  # 46 specialized domain agents
│   ├── logs.md
│   ├── metrics.md
│   ├── monitoring-alerting.md
│   ├── dashboards.md
│   └── ...                  # (all other agent files)
├── skills/
│   └── code-generation/     # Code generation skill
│       └── SKILL.md
├── CLAUDE.md               # Plugin instructions (symlink to this file)
├── AGENTS.md               # This file - comprehensive agent guide
├── README.md               # Main documentation
└── package.json            # Plugin metadata

External dependency:
pup                         # Pup CLI tool - Go binary for executing Datadog API calls
                            # See: https://github.com/DataDog/pup
```

### Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

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
- [Datadog API Client Go](https://github.com/DataDog/datadog-api-client-go)
- [Datadog API Client Rust](https://github.com/DataDog/datadog-api-client-rust)
- [Datadog API Client Java](https://github.com/DataDog/datadog-api-client-java)
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
