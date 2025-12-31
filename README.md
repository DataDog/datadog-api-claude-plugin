# Datadog API Claude Plugin

[![Version](https://img.shields.io/badge/version-1.15.0-blue.svg)](https://github.com/DataDog/datadog-api-claude-plugin)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

A comprehensive Claude Code plugin that provides direct integration with Datadog APIs through an agent-based architecture. Query metrics, manage monitors, create dashboards, search logs, and more—all through natural language interactions with Claude.

## Features

### 🎯 Comprehensive Agent Coverage

The plugin provides **48 specialized agents** organized into functional categories:

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

### 🚀 Code Generation

Generate production-ready TypeScript, Python, or Go code for any Datadog operation:

```bash
# Generate TypeScript code
node dist/index.js metrics query --query="avg:system.cpu.user{*}" --generate

# Generate Python code
node dist/index.js metrics query --query="avg:system.cpu.user{*}" --generate=python

# Generate Go code
node dist/index.js metrics query --query="avg:system.cpu.user{*}" --generate=go
```

### 🤖 Intelligent Agents

48 specialized agents that understand natural language queries:

- **Domain expertise**: Each agent specializes in one Datadog domain
- **Context-aware**: Agents provide relevant suggestions and examples
- **Permission-aware**: Three-tier permission system (READ/WRITE/DELETE)
- **Error handling**: Clear, actionable error messages

### 🔒 Security First

- Environment variable-based credentials (no hardcoded keys)
- Permission checks before destructive operations
- Input sanitization and validation
- Secure error handling (credentials never logged)

## Installation

### Prerequisites

- Node.js 16.0 or higher
- Claude Code CLI
- Datadog account with API and Application keys

### Install Dependencies

```bash
npm install
```

### Build the Plugin

```bash
npm run build
```

### Configure Credentials

Set up your Datadog credentials as environment variables:

```bash
export DD_API_KEY="your-datadog-api-key"
export DD_APP_KEY="your-datadog-application-key"
export DD_SITE="datadoghq.com"  # Optional, defaults to datadoghq.com
```

**Getting Your Keys:**

1. Log in to your Datadog account
2. Navigate to **Organization Settings** → **API Keys**
3. Create or copy your API Key
4. Navigate to **Organization Settings** → **Application Keys**
5. Create or copy your Application Key

## Quick Start

### Test Your Configuration

```bash
node dist/index.js test
```

### Query Metrics

```bash
# List available metrics
node dist/index.js metrics list

# Query CPU usage for the last hour
node dist/index.js metrics query --query="avg:system.cpu.user{*}" --from="1h" --to="now"
```

### List Monitors

```bash
node dist/index.js monitors list
```

### Search Logs

```bash
# Search for errors in the last hour
node dist/index.js logs search --query="status:error" --from="1h" --to="now"
```

### Generate Code

```bash
# Generate TypeScript code to query metrics
node dist/index.js metrics query --query="avg:system.cpu.user{*}" --generate > query_metrics.ts

# Generate Python code to create a monitor
node dist/index.js monitors create --name="High CPU" --generate=python > create_monitor.py

# Generate Go code to list monitors
node dist/index.js monitors list --generate=go > list_monitors.go
```

## Usage

### Command Structure

```bash
node dist/index.js <domain> <action> [options]
```

### Available Domains

| Domain | Description | Example |
|--------|-------------|---------|
| `admin` | User management | `admin users` |
| `cases` | Case management | `cases list` |
| `cicd` | CI/CD Visibility | `cicd pipelines` |
| `cloud-cost` | Cloud cost management | `cloud-cost aws list` |
| `dashboards` | Manage dashboards | `dashboards get <id>` |
| `error-tracking` | Error tracking | `errors search` |
| `events` | Event management | `events search` |
| `incidents` | Manage incidents | `incidents list` |
| `infrastructure` | Manage hosts | `infrastructure hosts` |
| `logs` | Search logs | `logs search --query="status:error"` |
| `metrics` | Query and submit metrics | `metrics query --query="..."` |
| `monitors` | Manage alerting monitors | `monitors list` |
| `network-performance` | Network monitoring | `network connections` |
| `notebooks` | Collaborative notebooks | `notebooks list` |
| `on-call` | On-call management | `on-call schedule who-is-on-call` |
| `rum` | Query RUM events | `rum search --query="@type:view"` |
| `scorecards` | Service scorecards | `scorecards rules list` |
| `security` | Security monitoring | `security signals` |
| `service-catalog` | Service catalog | `service-catalog list` |
| `slos` | Manage SLOs | `slos list` |
| `synthetics` | Manage synthetic tests | `synthetics list` |
| `teams` | Team management | `teams list` |
| `traces` | Query APM traces | `traces search --query="service:api"` |
| `workflows` | Workflow automation | `workflows list` |

### Time Parameters

Many commands accept `--from` and `--to` time parameters with flexible formats:

```bash
# Relative time
--from="1h"    # 1 hour ago
--from="30m"   # 30 minutes ago
--from="7d"    # 7 days ago

# Unix timestamp
--from="1704067200"

# "now" for current time
--to="now"

# ISO date
--from="2024-01-01T00:00:00Z"
```

### Common Options

- `--generate` or `--generate=python` or `--generate=go` - Generate code instead of executing
- `--language=typescript` or `--language=python` or `--language=go` - Specify code generation language
- `--filter=<pattern>` - Filter results by pattern
- `--limit=<n>` - Limit number of results
- `--help` - Show help for a specific command

## Examples

### Metrics

```bash
# List all metrics
node dist/index.js metrics list

# Filter metrics by prefix
node dist/index.js metrics list --filter="system.*"

# Query metric with time range
node dist/index.js metrics query \
  --query="avg:system.cpu.user{*}" \
  --from="4h" \
  --to="now"

# Query by service and environment
node dist/index.js metrics query \
  --query="sum:app.requests{env:prod} by {service}"
```

### Monitors

```bash
# List all monitors
node dist/index.js monitors list

# Get specific monitor details
node dist/index.js monitors get 12345678

# Search monitors by name
node dist/index.js monitors search "CPU"

# Delete a monitor (requires confirmation)
node dist/index.js monitors delete 12345678
```

### Dashboards

```bash
# List all dashboards
node dist/index.js dashboards list

# Get dashboard details
node dist/index.js dashboards get "abc-123-def"

# Get dashboard public URL
node dist/index.js dashboards url "abc-123-def"
```

### Logs

```bash
# Search for errors
node dist/index.js logs search \
  --query="status:error" \
  --from="1h" \
  --to="now"

# Search by service
node dist/index.js logs search \
  --query="service:web-app status:warn"

# Complex query with attributes
node dist/index.js logs search \
  --query="@user.id:12345 status:error"
```

### Traces

```bash
# Search traces for a service
node dist/index.js traces search \
  --query="service:api" \
  --from="1h" \
  --to="now"

# Find slow traces (duration > 2 seconds)
node dist/index.js traces search \
  --query="@duration:>2000000000"

# Search traces with errors
node dist/index.js traces search \
  --query="service:api @error.type:*"
```

### SLOs

```bash
# List all SLOs
node dist/index.js slos list

# Get SLO details
node dist/index.js slos get "abc-123-def"

# Get SLO history
node dist/index.js slos history "abc-123-def" \
  --from="30d" \
  --to="now"
```

### Incidents

```bash
# List all incidents
node dist/index.js incidents list

# Get incident details
node dist/index.js incidents get "abc-123-def"
```

### Synthetics

```bash
# List synthetic tests
node dist/index.js synthetics list

# Get test details
node dist/index.js synthetics get "abc-def-ghi"
```

### RUM

```bash
# Search RUM view events
node dist/index.js rum search \
  --query="@type:view" \
  --from="1h" \
  --to="now"

# Search for errors
node dist/index.js rum search \
  --query="@type:error @device.type:mobile"

# Search by session
node dist/index.js rum search \
  --query="@session.id:abc-def-123"
```

### Security

```bash
# List security signals
node dist/index.js security signals \
  --from="24h" \
  --to="now"

# Search high-severity signals
node dist/index.js security signals \
  --query="status:high"

# List security rules
node dist/index.js security rules
```

### Infrastructure

```bash
# List all hosts
node dist/index.js infrastructure hosts

# Filter by environment
node dist/index.js infrastructure hosts \
  --filter="env:production"

# Filter by cloud provider
node dist/index.js infrastructure hosts \
  --filter="cloud_provider:aws"

# Get host totals
node dist/index.js infrastructure totals
```

### Admin

```bash
# List all users
node dist/index.js admin users

# Get user details
node dist/index.js admin user "abc-123-def"
```

### Case Management

```bash
# List all cases
node dist/index.js cases list

# Search cases by status and priority
node dist/index.js cases list --status=OPEN --priority=P1

# Get case details
node dist/index.js cases get CASE-123

# Create a new case
node dist/index.js cases create \
  --title="API Gateway Timeout" \
  --type-id="550e8400-e29b-41d4-a716-446655440000" \
  --priority=P2 \
  --description="Users experiencing 504 errors"

# Update case status
node dist/index.js cases update CASE-123 --status=IN_PROGRESS

# Assign case to user
node dist/index.js cases assign CASE-123 user@example.com

# Add comment
node dist/index.js cases comment CASE-123 "Root cause identified"

# Archive case
node dist/index.js cases archive CASE-123

# List projects
node dist/index.js cases projects list

# Create project
node dist/index.js cases projects create "Q1 2025 Production Incidents"
```

## Code Generation

### TypeScript

Generate TypeScript code using the official `@datadog/datadog-api-client`:

```bash
node dist/index.js metrics query \
  --query="avg:system.cpu.user{*}" \
  --generate > query_metrics.ts
```

**To use generated TypeScript code:**

```bash
# Install dependencies
npm install @datadog/datadog-api-client

# Set credentials
export DD_API_KEY="..."
export DD_APP_KEY="..."

# Compile and run
tsc query_metrics.ts
node query_metrics.js
```

### Python

Generate Python code using the official `datadog-api-client`:

```bash
node dist/index.js metrics query \
  --query="avg:system.cpu.user{*}" \
  --generate=python > query_metrics.py
```

**To use generated Python code:**

```bash
# Install dependencies
pip install datadog-api-client

# Set credentials
export DD_API_KEY="..."
export DD_APP_KEY="..."

# Run
python query_metrics.py
```

### Go

Generate Go code using the official `datadog-api-client-go`:

```bash
node dist/index.js metrics query \
  --query="avg:system.cpu.user{*}" \
  --generate=go > query_metrics.go
```

**To use generated Go code:**

```bash
# Initialize module (if needed)
go mod init myapp
go mod tidy

# Set credentials
export DD_API_KEY="..."
export DD_APP_KEY="..."

# Run
go run query_metrics.go
```

### Code Generation Features

Generated code includes:
- Complete imports from official Datadog clients
- Configuration with environment variable handling
- Proper error handling with detailed messages
- Type annotations (TypeScript), type hints (Python), or strong typing (Go)
- Documentation comments explaining usage
- Main execution function ready to run

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for more details.

### Agent-Based Design

The plugin uses 48 specialized agents, each focusing on a specific Datadog domain:

```
User Query → Claude → Domain Agent → CLI Tool → Datadog API
                                                       ↓
                                            Format Response → User
```

### Permission System

Three-tier permission model:

- **READ**: Execute automatically (queries, lists)
- **WRITE**: Log warnings (create, update operations)
- **DELETE**: Require explicit confirmation (delete operations)

### Code Structure

```
datadog-api-claude-plugin/
├── .claude-plugin/          # Plugin configuration
│   ├── plugin.json          # Plugin metadata (references 48 agents)
│   └── skills/              # Code generation skill
├── agents/                  # 48 specialized domain agents
├── src/
│   ├── lib/                 # Core utilities
│   │   ├── client.ts        # Datadog client wrapper
│   │   ├── config.ts        # Credential validation
│   │   ├── permissions.ts   # Permission checks
│   │   ├── formatter.ts     # Response formatting
│   │   └── error-handler.ts # Error handling
│   ├── api/                 # API wrappers
│   │   ├── v1/              # Datadog API v1
│   │   └── v2/              # Datadog API v2
│   ├── codegen/             # Code generation
│   │   ├── typescript-templates.ts
│   │   └── python-templates.ts
│   └── index.ts             # CLI entry point
└── tests/                   # Unit tests
```

## Development

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run watch
```

### Run Tests

```bash
npm test
```

### Test Coverage

```bash
npm run test:coverage
```

### Lint

```bash
npm run lint
```

### Format

```bash
npm run format
```

## Troubleshooting

### Missing Credentials

```
Error: DD_API_KEY environment variable is required
```

**Solution:** Set environment variables:
```bash
export DD_API_KEY="your-api-key"
export DD_APP_KEY="your-app-key"
```

### Invalid Credentials

```
Error: 403 Forbidden - API key is invalid
```

**Solution:** Verify your API and Application keys are correct and have proper permissions.

### Command Not Found

```
Error: Unknown command: xyz
```

**Solution:** Run `node dist/index.js help` to see available commands.

### Time Format Error

```
Error: Invalid time format: xyz
```

**Solution:** Use valid time formats: `1h`, `30m`, `7d`, Unix timestamp, or ISO date.

## Security Best Practices

1. **Never commit credentials** - Use environment variables only
2. **Use read-only keys** when possible for querying operations
3. **Rotate keys regularly** - Update API and Application keys periodically
4. **Limit key scope** - Use keys with minimal required permissions
5. **Monitor key usage** - Review API key usage in Datadog audit logs

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- **Documentation**: [Datadog API Documentation](https://docs.datadoghq.com/api/latest/)
- **Issues**: [GitHub Issues](https://github.com/DataDog/datadog-api-claude-plugin/issues)
- **Community**: [Datadog Community](https://community.datadoghq.com/)

## Related Resources

- [Datadog API Client TypeScript](https://github.com/DataDog/datadog-api-client-typescript)
- [Datadog API Client Python](https://github.com/DataDog/datadog-api-client-python)
- [Datadog API Client Go](https://github.com/DataDog/datadog-api-client-go)
- [Claude Code Documentation](https://docs.anthropic.com/claude/docs)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for more details.

## Roadmap

- [ ] Interactive permission prompts for WRITE/DELETE operations
- [ ] Enhanced response formatting with tables and pagination
- [ ] Support for additional Datadog APIs
- [ ] Plugin marketplace publication
