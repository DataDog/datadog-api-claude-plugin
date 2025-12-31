---
description: Generate TypeScript, Python, or Java code for Datadog API operations instead of executing them directly
tags: [code-generation, typescript, python, java, templates]
---

# Code Generation Skill

This skill enables you to generate ready-to-use TypeScript, Python, or Java code for Datadog API operations instead of executing them directly. This is useful when users want to integrate Datadog operations into their own applications.

## When to Use This Skill

Use this skill when the user:
- Asks to "generate code" for a Datadog operation
- Wants to "create a script" or "write code" for querying/managing Datadog
- Needs code they can integrate into their application
- Wants to see how to use the Datadog API client libraries
- Specifies a programming language (TypeScript, Python) for the implementation

## How It Works

The code generation system:
1. Takes the same parameters as normal command execution
2. Generates complete, working code using official Datadog API clients
3. Includes proper error handling, configuration, and documentation
4. Outputs code that can be saved to a file and run immediately

## Supported Languages

- **TypeScript** (using `@datadog/datadog-api-client`)
- **Python** (using `datadog-api-client`)
- **Java** (using `com.datadoghq:datadog-api-client`)

## Usage Pattern

Add the `--generate` flag to any command with optional language specification:

```bash
# Generate TypeScript (default)
node dist/index.js metrics query --query="..." --generate

# Generate Python
node dist/index.js metrics query --query="..." --generate=python

# Generate Java
node dist/index.js metrics query --query="..." --generate=java

# Alternative syntax
node dist/index.js metrics query --query="..." --generate --language=java
```

## Supported Operations

Code generation is currently supported for:

### Metrics
- `metrics list` - List available metrics
- `metrics query` - Query metric time-series data
- `metrics submit` - Submit custom metrics

### Monitors
- `monitors list` - List all monitors
- `monitors get <id>` - Get monitor details
- `monitors create` - Create a new monitor

### Dashboards
- `dashboards list` - List all dashboards
- `dashboards create` - Create a new dashboard

### Logs
- `logs search` - Search logs

### Traces
- `traces search` - Search traces/spans

### SLOs
- `slos list` - List Service Level Objectives

### Incidents
- `incidents list` - List incidents

### Synthetics
- `synthetics list` - List synthetic tests

### RUM
- `rum search` - Search RUM events

### Security
- `security signals` - Search security signals

### Infrastructure
- `infrastructure hosts` - List hosts

### Admin
- `admin users` - List users

## Example Interactions

### Example 1: Generate TypeScript Code for Metrics Query

**User**: "Generate TypeScript code to query CPU metrics"

**Response**:
```
I'll generate TypeScript code to query CPU metrics from Datadog.

<Execute: node dist/index.js metrics query --query="avg:system.cpu.user{*}" --generate=typescript>

Here's the TypeScript code:

[Generated code output]

To use this code:
1. Save it to a file (e.g., `query-metrics.ts`)
2. Install dependencies: `npm install @datadog/datadog-api-client`
3. Set environment variables: `export DD_API_KEY="..." DD_APP_KEY="..."`
4. Compile: `tsc query-metrics.ts`
5. Run: `node query-metrics.js`
```

### Example 2: Generate Python Code for Monitor Creation

**User**: "Show me how to create a monitor in Python"

**Response**:
```
I'll generate Python code to create a Datadog monitor.

<Execute: node dist/index.js monitors create --name="High CPU" --query="avg(last_5m):avg:system.cpu.user{*} > 90" --generate=python>

Here's the Python code:

[Generated code output]

To use this code:
1. Save it to a file (e.g., `create_monitor.py`)
2. Install dependencies: `pip install datadog-api-client`
3. Set environment variables: `export DD_API_KEY="..." DD_APP_KEY="..."`
4. Make it executable: `chmod +x create_monitor.py`
5. Run: `./create_monitor.py`
```

### Example 2.5: Generate Java Code for Monitor Creation

**User**: "Generate Java code to create a monitor"

**Response**:
```
I'll generate Java code to create a Datadog monitor.

<Execute: node dist/index.js monitors create --name="High CPU" --query="avg(last_5m):avg:system.cpu.user{*} > 90" --generate=java>

Here's the Java code:

[Generated code output]

To use this code:
1. Save it to a file (e.g., `MonitorsCreateExample.java`)
2. Add to pom.xml: `<dependency><groupId>com.datadoghq</groupId><artifactId>datadog-api-client</artifactId></dependency>`
3. Set environment variables: `export DD_API_KEY="..." DD_APP_KEY="..."`
4. Compile: `javac MonitorsCreateExample.java`
5. Run: `java com.datadog.api.example.MonitorsCreateExample`
```

### Example 3: Generate Code for Application Integration

**User**: "I need Python code to query logs and save them to a file"

**Response**:
```
I'll generate Python code to query Datadog logs.

<Execute: node dist/index.js logs search --query="status:error" --generate=python>

Here's the Python code:

[Generated code output]

You can extend this code to:
- Save results to a file by adding `json.dump(result, open('logs.json', 'w'))`
- Process logs in a loop
- Schedule it with cron for regular log exports
- Integrate with your existing application
```

## Generated Code Features

All generated code includes:

1. **Proper Imports**: Official Datadog API client libraries
2. **Configuration**: Environment variable handling for credentials
3. **Error Handling**: Try/catch blocks with detailed error messages
4. **Documentation**: Comments explaining what the code does
5. **Type Annotations**: TypeScript types or Python type hints
6. **Main Function**: Ready-to-run main() function
7. **Usage Examples**: Comments showing how to run the code

## TypeScript Generated Code Structure

```typescript
// Imports
import { client, v2 } from '@datadog/datadog-api-client';

// Configuration
const configuration = client.createConfiguration({...});

// Main operation function
async function queryMetrics() {
  const apiInstance = new v2.MetricsApi(configuration);
  // ... operation logic
}

// Error handling
function handleError(error: any) {
  // ... error formatting
}

// Main execution
async function main() {
  // ... validation and execution
}

main().catch(...);
```

## Python Generated Code Structure

```python
#!/usr/bin/env python3
# Imports
from datadog_api_client import ApiClient, Configuration
from datadog_api_client.v2.api.metrics_api import MetricsApi

# Configuration
def configure_datadog():
    configuration = Configuration()
    # ... configuration logic
    return configuration

# Main operation function
def query_metrics(configuration):
    with ApiClient(configuration) as api_client:
        api_instance = MetricsApi(api_client)
        # ... operation logic

# Error handling
def handle_error(error):
    # ... error formatting

# Main execution
def main():
    configuration = configure_datadog()
    query_metrics(configuration)

if __name__ == "__main__":
    main()
```

## Java Generated Code Structure

```java
package com.datadog.api.example;

// Imports
import com.datadog.api.client.ApiClient;
import com.datadog.api.client.ApiException;
import com.datadog.api.client.v2.api.MetricsApi;

public class MetricsQueryExample {
    // Main method with configuration
    public static void main(String[] args) {
        // Environment variable validation
        // API client configuration
        // Authentication setup
        // Operation execution
    }

    // Operation method
    private static void queryMetrics(ApiClient apiClient) throws ApiException {
        MetricsApi apiInstance = new MetricsApi(apiClient);
        // ... operation logic
    }
}
```

## When NOT to Use Code Generation

Don't use code generation when:
- User wants immediate results (use direct execution instead)
- User is exploring/experimenting with Datadog (execute directly first)
- User hasn't specified they want code

Instead, execute the command directly and only suggest code generation if they ask to automate or integrate the operation.

## Tips for Using This Skill

1. **Ask about language preference**: If user doesn't specify, TypeScript is the default
2. **Explain how to use the code**: Always provide instructions for running generated code
3. **Suggest improvements**: Point out how they can extend or customize the code
4. **Security reminders**: Remind users not to commit credentials to version control
5. **Install instructions**: Provide package installation commands for each language:
   - TypeScript: `npm install @datadog/datadog-api-client`
   - Python: `pip install datadog-api-client`
   - Java: Add Maven/Gradle dependency for `com.datadoghq:datadog-api-client`

## Common User Phrases That Trigger This Skill

- "Generate code to..."
- "Show me how to... in TypeScript/Python/Java"
- "I need a script that..."
- "How do I integrate Datadog with..."
- "Create a Python/Java program to..."
- "Write TypeScript/Java code for..."
- "I want to automate..."
- "Generate Java code for..."

## Integration with Agents

The code generation skill works seamlessly with all 12 domain agents:
- Metrics agent
- Monitors agent
- Dashboards agent
- Logs agent
- Traces agent
- SLOs agent
- Incidents agent
- Synthetics agent
- RUM agent
- Security agent
- Infrastructure agent
- Admin agent

Each agent can trigger code generation by adding the `--generate` flag to their CLI commands.

## Best Practices

1. **Always validate parameters**: Ensure required parameters are provided before generating code
2. **Use meaningful examples**: Generate code with realistic queries and parameters
3. **Include error handling**: All generated code should handle errors gracefully
4. **Add comments**: Explain non-obvious parts of the generated code
5. **Test locally**: Verify generated code templates work before showing them to users

## Future Enhancements

Planned improvements:
- Generate code for WRITE operations (create, update, delete)
- Support for additional languages (Ruby, more JVM languages)
- Generate complete applications (multi-file projects)
- Add unit tests to generated code
- Generate Terraform/IaC configurations
- CLI tool installation code generation

## Technical Details

The code generation system uses template-based generation:
- TypeScript templates in `src/codegen/typescript-templates.ts`
- Python templates in `src/codegen/python-templates.ts`
- Java templates in `src/codegen/java-templates.ts`
- Go templates in `src/codegen/go-templates.ts`
- Rust templates in `src/codegen/rust-templates.ts`
- Each domain has specific templates for common operations
- Parameters are interpolated into templates at generation time
- Generated code uses official Datadog API clients for type safety and compatibility
