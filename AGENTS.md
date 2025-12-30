# Datadog API Claude Plugin

## Overview

The Datadog API Claude Plugin enables Claude to directly interact with Datadog APIs without requiring an MCP (Model Context Protocol) server. This plugin provides seamless integration with Datadog's comprehensive monitoring and observability platform, allowing users to query, read, and write data through natural language interactions.

## Architecture

### Direct API Integration

Unlike traditional MCP-based approaches, this plugin leverages Datadog's official API clients directly:

- **TypeScript Client**: [datadog-api-client-typescript](https://github.com/DataDog/datadog-api-client-typescript)
- **Python Client**: [datadog-api-client-python](https://github.com/DataDog/datadog-api-client-python)
- **API Documentation**: [Datadog API Reference](https://docs.datadoghq.com/api/latest/?tab=typescript)
- **OpenAPI Specifications**: Available in the private `datadog-api-spec` repository

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
4. **Bump Version** (if code changed) - Update .claude-plugin/plugin.json with semantic versioning. New agents/skills are just minor versions, patches to fix existing functionality.
5. **Update issue status** - Close finished work, update in-progress items
6. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
7. **Clean up** - Clear stashes, prune remote branches
8. **Verify** - All changes committed AND pushed
9. **Manage PR** - use the `gh` tool to create a PR, and update the description appropriately with information for a human or another AI code review bot.
10. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
