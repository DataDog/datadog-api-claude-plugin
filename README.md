# Datadog API Claude Plugin

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/DataDog/datadog-api-claude-plugin)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

A comprehensive Claude Code plugin that provides direct integration with Datadog APIs through an agent-based architecture powered by the `pup` CLI tool. Query metrics, manage monitors, create dashboards, search logs, and more—all through natural language interactions with Claude.

## Features

### 🎯 Comprehensive Agent Coverage

The plugin provides **46 specialized agents** organized into functional categories. Each agent provides expert guidance for specific Datadog domains and uses the `pup` CLI tool for execution.

#### Data & Observability
Query and analyze telemetry data:
- **logs**: Search and analyze log data
- **traces**: Query APM traces and spans
- **metrics**: Query time-series metrics
- **rum**: Real User Monitoring data
- **events**: Infrastructure events
- **security**: Security signals and findings
- **audience-management**: RUM user/account segmentation and analytics

#### Monitoring & Alerting
Set up monitoring and visualization:
- **monitoring-alerting**: Monitors, templates, notifications, downtimes
- **dashboards**: Visualization dashboards
- **slos**: Service Level Objectives
- **synthetics**: Synthetic monitoring tests
- **notebooks**: Investigation notebooks
- **powerpacks**: Reusable dashboard templates

#### Configuration & Data Management
Configure data collection and processing:
- **observability-pipelines**: Infrastructure-level data collection and routing
- **log-configuration**: Log archives, pipelines, indexes, destinations
- **apm-configuration**: APM retention and span-based metrics
- **rum-metrics-retention**: RUM retention and metrics

#### Infrastructure & Performance
Monitor infrastructure and performance:
- **infrastructure**: Host inventory and monitoring
- **container-monitoring**: Kubernetes and container metrics
- **database-monitoring**: Database performance
- **network-performance**: Network flow analysis
- **fleet-automation**: Agent deployment at scale
- **spark-pod-autosizing**: Spark resource optimization

#### Security & Compliance
Security operations and posture management:
- **security-posture-management**: CSPM, vulnerabilities, SBOM
- **application-security**: ASM runtime threat detection
- **cloud-workload-security**: CWS runtime security
- **agentless-scanning**: Cloud resource scanning
- **static-analysis**: Code security scanning

#### Cloud & Integrations
Cloud provider and third-party integrations:
- **aws-integration**: AWS monitoring and security
- **gcp-integration**: GCP monitoring and security
- **azure-integration**: Azure monitoring and security
- **third-party-integrations**: PagerDuty, Slack, OpsGenie, etc.

#### Development & Quality
CI/CD and code quality:
- **cicd**: Pipeline visibility and testing
- **error-tracking**: Application error management
- **scorecards**: Service quality tracking
- **service-catalog**: Service registry

#### Operations & Automation
Incident response and automation:
- **incident-response**: On-call, incidents, case management
- **workflows**: Automated workflows
- **app-builder**: Custom internal applications

#### Organization & Access
User management and governance:
- **user-access-management**: Users, teams, SCIM, auth mappings
- **saml-configuration**: SAML SSO setup
- **organization-management**: Multi-org settings
- **data-governance**: Access controls, sensitive data
- **audit-logs**: Audit trail
- **api-management**: API and application keys

#### Cost & Usage
Cost monitoring and optimization:
- **cloud-cost**: Cloud cost tracking
- **usage-metering**: Datadog usage attribution
- **data-deletion**: Data retention policies

### 🚀 Pup CLI Integration

The plugin uses [pup](https://github.com/DataDog/pup), a Go-based CLI tool that provides:
- **OAuth2 Authentication** (preferred) with secure token storage
- **API Key Support** for traditional authentication
- **28 command groups** covering 33+ Datadog API domains
- **200+ subcommands** for comprehensive operations
- **Multiple output formats**: JSON, YAML, and table

### 🤖 Intelligent Agents

46 specialized agents that understand natural language queries:
- **Domain expertise**: Each agent specializes in one Datadog domain
- **Context-aware**: Agents provide relevant suggestions and examples
- **Permission-aware**: Guidance on read vs. write operations
- **Code generation**: Can generate Python, TypeScript, Java, Go, or Rust code

### 🏷️ Agent Identification

The plugin automatically identifies which AI agent is using it and reports this information with each API request:
- **Automatic detection**: Identifies Claude, Letta, ChatGPT, and other agents
- **Transparent reporting**: Sends agent type, version, and metadata via HTTP headers
- **Privacy-focused**: No user data, API keys, or request content included
- **Customizable**: Explicitly set agent type via environment variables

See [AGENT_IDENTIFICATION.md](./AGENT_IDENTIFICATION.md) for detailed information.

## Installation

### Prerequisites

- Claude Code CLI
- [Pup CLI tool](https://github.com/DataDog/pup) installed and available in PATH
- Datadog account with OAuth2 or API/Application keys

### Setup

The plugin automatically uses the `pup` CLI tool. Ensure pup is installed and available in your PATH.

See the [pup installation guide](https://github.com/DataDog/pup#installation) for setup instructions.

### Authentication

The plugin uses pup's authentication. Configure it once:

#### Option 1: OAuth Login (Recommended)

```bash
pup auth login
```

**Benefits:**
- Secure browser-based authentication
- Automatic token refresh
- Tokens stored in OS keychain (macOS Keychain, Windows Credential Manager, or Linux Secret Service)
- Fine-grained permission scopes

**OAuth Commands:**
```bash
pup auth login      # Start OAuth login flow
pup auth logout     # Revoke tokens
pup auth status     # Show authentication status
pup auth refresh    # Force token refresh
```

#### Option 2: API Keys (Fallback)

```bash
export DD_API_KEY="your-datadog-api-key"
export DD_APP_KEY="your-datadog-application-key"
export DD_SITE="datadoghq.com"  # Optional, defaults to datadoghq.com
```

Get your keys from:
1. **Organization Settings** → **API Keys**
2. **Organization Settings** → **Application Keys**

## Quick Start

### Test Connection

```bash
pup test
```

### Query Metrics

```bash
# List available metrics
pup metrics list

# Query CPU usage for the last hour
pup metrics query --query="avg:system.cpu.user{*}" --from="1h" --to="now"
```

### List Monitors

```bash
pup monitors list
```

### Search Logs

```bash
# Search for errors in the last hour
pup logs search --query="status:error" --from="1h" --to="now"
```

## Using with Claude

Simply interact with Claude using natural language. The agents will automatically use pup commands:

**Example conversations:**

```
You: "Show me error logs from the API service in the last hour"
Claude: [Uses logs agent and executes: pup logs search --query="service:api status:error" --from="1h"]

You: "What monitors are currently alerting?"
Claude: [Uses monitoring-alerting agent and executes: pup monitors list --state=Alert]

You: "Generate Python code to query metrics"
Claude: [Provides Python code using datadog-api-client library]
```

## Code Generation

The plugin can generate code in multiple languages for integration into your applications:

### Python Example

```python
#!/usr/bin/env python3
import os
from datadog_api_client import ApiClient, Configuration
from datadog_api_client.v2.api.metrics_api import MetricsApi

configuration = Configuration()
configuration.api_key['apiKeyAuth'] = os.getenv('DD_API_KEY')
configuration.api_key['appKeyAuth'] = os.getenv('DD_APP_KEY')

with ApiClient(configuration) as api_client:
    api_instance = MetricsApi(api_client)
    # Query logic here...
```

### TypeScript Example

```typescript
import { client, v2 } from '@datadog/datadog-api-client';

const configuration = client.createConfiguration({
  authMethods: {
    apiKeyAuth: process.env.DD_API_KEY || '',
    appKeyAuth: process.env.DD_APP_KEY || '',
  },
});

const apiInstance = new v2.MetricsApi(configuration);
// Query logic here...
```

### Supported Languages

- **Python**: Using `datadog-api-client`
- **TypeScript/JavaScript**: Using `@datadog/datadog-api-client`
- **Java**: Using `com.datadoghq:datadog-api-client`
- **Go**: Using `github.com/DataDog/datadog-api-client-go`
- **Rust**: Using `datadog-api-client`

## Pup Command Reference

### Common Commands

```bash
# Metrics
pup metrics query --query="avg:system.cpu.user{*}" --from="1h"
pup metrics list --filter="system.*"

# Logs
pup logs search --query="status:error" --from="30m"
pup logs aggregate --query="service:api" --from="1h"

# Traces
pup traces search --query="service:api" --from="1h"

# Monitors
pup monitors list --tag="env:prod"
pup monitors get 12345678
pup monitors delete 12345678 --yes

# Dashboards
pup dashboards list
pup dashboards get abc-123-def
pup dashboards url abc-123-def

# SLOs
pup slos list
pup slos get abc-123-def

# Incidents
pup incidents list
pup incidents get abc-123-def

# Security
pup security rules list
pup security signals list --from="24h"

# Infrastructure
pup infrastructure hosts list
pup tags list

# Users & Access
pup users list
pup organizations list
pup api-keys list
```

### Output Formats

```bash
# JSON (default)
pup metrics query --query="..." --output=json

# Table view
pup monitors list --output=table

# YAML
pup dashboards get abc-123 --output=yaml
```

### Time Parameters

```bash
# Relative time
--from="1h"    # 1 hour ago
--from="30m"   # 30 minutes ago
--from="7d"    # 7 days ago
--from="1w"    # 1 week ago

# "now" for current time
--to="now"

# Unix timestamps
--from="1704067200"

# ISO dates
--from="2024-01-01T00:00:00Z"
```

## Architecture

### Agent-Based Design

```
User Query → Claude → Domain Agent → Pup CLI → Datadog API
                                                     ↓
                                        Format Response → User
```

Each agent specializes in a specific Datadog domain and provides:
- Natural language understanding of user queries
- Appropriate pup command construction
- Code generation capabilities
- Domain-specific guidance and best practices

### Project Structure

```
datadog-api-claude-plugin/
├── .claude-plugin/
│   └── plugin.json          # Plugin metadata (references 46 agents)
├── agents/                  # 46 specialized domain agents
│   ├── logs.md
│   ├── metrics.md
│   ├── monitors.md
│   └── ...
├── skills/
│   └── code-generation/     # Code generation skill
│       └── SKILL.md
├── CLAUDE.md               # Plugin instructions (symlink to AGENTS.md)
├── AGENTS.md               # Comprehensive agent documentation
└── README.md               # This file
```

## Troubleshooting

### Pup Not Found

```
Error: Command not found: pup
```

**Solution:** Install pup and ensure it's in your PATH. See the [pup installation guide](https://github.com/DataDog/pup#installation).

### Authentication Errors

```
Error: No authentication credentials found
```

**Solution:** Authenticate using OAuth or set API keys:
```bash
# OAuth (recommended)
pup auth login

# API Keys
export DD_API_KEY="..."
export DD_APP_KEY="..."
```

### Invalid Credentials

```
Error: 403 Forbidden
```

**Solution:** Verify your credentials are correct:
```bash
pup auth status  # Check OAuth status
pup test         # Test connection
```

## Security Best Practices

1. **Use OAuth authentication** - Tokens are stored securely in your OS keychain
2. **Never commit credentials** - Use OAuth or environment variables
3. **Use read-only keys** when possible for query-only operations
4. **Rotate keys regularly** if using API keys
5. **Monitor access** - Review API usage in Datadog audit logs

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

Apache License 2.0 - see [LICENSE](LICENSE) for details.

Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.

This product includes software developed at Datadog (https://www.datadoghq.com/).
Copyright 2024-present Datadog, Inc.

## Support

- **Plugin Documentation**: [AGENTS.md](AGENTS.md) - Comprehensive agent guide
- **Pup Documentation**: [Pup CLI Repository](https://github.com/DataDog/pup)
- **Datadog API**: [Datadog API Documentation](https://docs.datadoghq.com/api/latest/)
- **Issues**: [GitHub Issues](https://github.com/DataDog/datadog-api-claude-plugin/issues)
- **Community**: [Datadog Community](https://community.datadoghq.com/)

## Related Resources

- [Pup CLI](https://github.com/DataDog/pup) - Go-based Datadog API CLI
- [Datadog API Client TypeScript](https://github.com/DataDog/datadog-api-client-typescript)
- [Datadog API Client Python](https://github.com/DataDog/datadog-api-client-python)
- [Datadog API Client Go](https://github.com/DataDog/datadog-api-client-go)
- [Datadog API Client Java](https://github.com/DataDog/datadog-api-client-java)
- [Datadog API Client Rust](https://github.com/DataDog/datadog-api-client-rust)
- [Claude Code Documentation](https://docs.anthropic.com/claude/docs)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.
