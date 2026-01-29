# Agent Identification

The Datadog API Claude Plugin automatically identifies which AI agent is using the plugin and reports this information with every API request. This helps Datadog understand usage patterns, optimize the API experience for different agents, and provide better support.

## Overview

When agents use this plugin to interact with Datadog APIs, the plugin:
- Detects the agent type (Claude, Letta, ChatGPT, etc.)
- Collects agent version and metadata
- Sends this information via custom headers with each API request
- Provides runtime context (Node.js version, plugin version)

## How It Works

### Automatic Detection

The plugin automatically detects the agent type based on environment variables:

| Agent | Detection Method | Environment Variables |
|-------|-----------------|----------------------|
| **Claude** | Anthropic API key or model | `CLAUDE_MODEL`, `ANTHROPIC_API_KEY` |
| **Letta** | Letta API configuration | `LETTA_API_KEY`, `LETTA_BASE_URL` |
| **ChatGPT/OpenAI** | OpenAI API key or model | `OPENAI_API_KEY`, `OPENAI_MODEL` |
| **Custom/Unknown** | Falls back to generic or unknown | `AI_ASSISTANT_TYPE` |

### Headers Sent with Each Request

The plugin adds the following headers to all Datadog API requests:

```
DD-Agent-Type: claude
DD-Agent-Version: 3.5.0
DD-Agent-Metadata: {"model":"claude-3-opus-20240229","runtime":"nodejs","node_version":"v20.10.0","plugin_version":"1.16.0"}
User-Agent: datadog-api-claude-plugin/1.16.0 agent/claude agent-version/3.5.0
```

## Configuration

### Explicit Agent Identification

You can explicitly specify the agent type and version using environment variables:

```bash
export DD_AGENT_TYPE="claude"
export DD_AGENT_VERSION="3.5.0"
```

These environment variables take precedence over automatic detection.

### For Generic AI Assistants

If your AI assistant doesn't match the built-in detection patterns, you can set:

```bash
export AI_ASSISTANT_TYPE="my-custom-assistant"
```

## Examples

### Example 1: Claude Detection

```bash
# Environment
export CLAUDE_MODEL="claude-3-opus-20240229"
export ANTHROPIC_API_KEY="sk-ant-api03-xxx"
export DD_API_KEY="your-datadog-api-key"
export DD_APP_KEY="your-datadog-app-key"

# The plugin automatically detects:
# - Agent Type: claude
# - Model: claude-3-opus-20240229
```

### Example 2: Letta Detection

```bash
# Environment
export LETTA_API_KEY="letta-key-xxx"
export LETTA_VERSION="0.5.0"
export DD_API_KEY="your-datadog-api-key"
export DD_APP_KEY="your-datadog-app-key"

# The plugin automatically detects:
# - Agent Type: letta
# - Metadata includes Letta version
```

### Example 3: ChatGPT Detection

```bash
# Environment
export OPENAI_API_KEY="sk-xxx"
export OPENAI_MODEL="gpt-4"
export DD_API_KEY="your-datadog-api-key"
export DD_APP_KEY="your-datadog-app-key"

# The plugin automatically detects:
# - Agent Type: chatgpt
# - Model: gpt-4
```

### Example 4: Custom Agent

```bash
# Environment
export DD_AGENT_TYPE="my-company-ai"
export DD_AGENT_VERSION="2.1.0"
export DD_API_KEY="your-datadog-api-key"
export DD_APP_KEY="your-datadog-app-key"

# Explicitly sets:
# - Agent Type: my-company-ai
# - Version: 2.1.0
```

## Metadata Collected

The plugin collects the following metadata automatically:

| Field | Description | Example |
|-------|-------------|---------|
| `runtime` | JavaScript runtime | `"nodejs"` |
| `node_version` | Node.js version | `"v20.10.0"` |
| `plugin_version` | Plugin version | `"1.16.0"` |
| `model` | AI model name (if available) | `"claude-3-opus-20240229"` |

## Privacy Considerations

- **No API Keys Sent**: API keys and application keys are never included in headers or metadata
- **No User Data**: No user-specific or PII data is collected
- **No Request Content**: Query parameters, request bodies, and response data are not included
- **Opt-Out**: You can set `DD_AGENT_TYPE="unknown"` to avoid automatic detection

## Benefits

### For Users
- Better support from Datadog for agent-specific issues
- Optimized API responses for different agent capabilities
- Enhanced debugging and troubleshooting

### For Datadog
- Understand which agents are using the API
- Optimize API design for common agent patterns
- Provide agent-specific documentation and examples
- Track adoption and usage patterns

## Troubleshooting

### Agent Not Detected

If your agent isn't being detected automatically:

```bash
# Check current detection
node -e "console.log(process.env)"

# Set explicitly
export DD_AGENT_TYPE="your-agent-type"
export DD_AGENT_VERSION="your-version"
```

### Verify Headers Are Sent

You can verify the headers are being sent by enabling debug mode:

```bash
export DEBUG=datadog:*
```

## Integration Examples

### Claude Integration

```typescript
// Claude automatically provides these environment variables
process.env.CLAUDE_MODEL = "claude-3-opus-20240229";

// Plugin detects and reports:
// - Agent: claude
// - Model: claude-3-opus-20240229
```

### Custom Integration

```typescript
// For custom agents, set environment variables before import
process.env.DD_AGENT_TYPE = "my-agent";
process.env.DD_AGENT_VERSION = "1.0.0";

import { getClient } from '@datadog/datadog-api-claude-plugin';

// All API calls will include agent identification
const client = getClient();
```

## API Reference

### AgentInfo Interface

```typescript
interface AgentInfo {
  type: string;           // Agent type (claude, letta, chatgpt, etc.)
  version?: string;       // Agent version (optional)
  metadata?: {            // Additional metadata
    runtime: string;      // Runtime environment
    node_version: string; // Node.js version
    plugin_version: string; // Plugin version
    model?: string;       // AI model name (if available)
    [key: string]: string; // Additional custom fields
  };
}
```

### Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DD_AGENT_TYPE` | Explicit agent type | No | `"claude"` |
| `DD_AGENT_VERSION` | Explicit agent version | No | `"3.5.0"` |
| `CLAUDE_MODEL` | Claude model name | No | `"claude-3-opus-20240229"` |
| `ANTHROPIC_API_KEY` | Anthropic API key (triggers Claude detection) | No | `"sk-ant-api03-xxx"` |
| `LETTA_API_KEY` | Letta API key (triggers Letta detection) | No | `"letta-key-xxx"` |
| `LETTA_BASE_URL` | Letta base URL (triggers Letta detection) | No | `"https://api.letta.ai"` |
| `OPENAI_API_KEY` | OpenAI API key (triggers ChatGPT detection) | No | `"sk-xxx"` |
| `OPENAI_MODEL` | OpenAI model name | No | `"gpt-4"` |
| `AI_ASSISTANT_TYPE` | Generic assistant type | No | `"my-assistant"` |

## Support

If you have questions or issues with agent identification:

1. Check the [GitHub Issues](https://github.com/DataDog/datadog-api-claude-plugin/issues)
2. Review the main [README](./README.md)
3. Contact Datadog support with your agent type and plugin version

## Related Documentation

- [Plugin Architecture](./ARCHITECTURE.md)
- [API Documentation](https://docs.datadoghq.com/api/latest/)
- [Contributing Guide](./CONTRIBUTING.md)
