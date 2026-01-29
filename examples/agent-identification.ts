/**
 * Example: Agent Identification
 *
 * This example demonstrates how the plugin automatically identifies
 * which AI agent is using it and reports this information with API requests.
 */

import { ConfigValidator } from '../src/lib/config';
import { getClient, v2 } from '../src/lib/client';

async function main() {
  console.log('=== Agent Identification Example ===\n');

  // Step 1: Validate configuration (this triggers agent detection)
  const config = ConfigValidator.validate();

  console.log('Detected Agent Information:');
  console.log('---------------------------');
  console.log(`Agent Type: ${config.agentInfo.type}`);
  console.log(`Agent Version: ${config.agentInfo.version || 'Not specified'}`);
  console.log('\nMetadata:');
  console.log(JSON.stringify(config.agentInfo.metadata, null, 2));

  console.log('\nHeaders that will be sent with each request:');
  console.log('---------------------------------------------');
  console.log(`DD-Agent-Type: ${config.agentInfo.type}`);
  if (config.agentInfo.version) {
    console.log(`DD-Agent-Version: ${config.agentInfo.version}`);
  }
  if (config.agentInfo.metadata) {
    console.log(`DD-Agent-Metadata: ${JSON.stringify(config.agentInfo.metadata)}`);
  }

  // User-Agent string
  const userAgentParts = [
    `datadog-api-claude-plugin/${config.agentInfo.metadata?.plugin_version || 'unknown'}`,
    `agent/${config.agentInfo.type}`,
  ];
  if (config.agentInfo.version) {
    userAgentParts.push(`agent-version/${config.agentInfo.version}`);
  }
  console.log(`User-Agent: ${userAgentParts.join(' ')}`);

  console.log('\n=== Making a test API request ===\n');

  try {
    // Step 2: Make a test API request
    // The client automatically includes agent identification headers
    const client = getClient();
    const metricsApi = client.getV2Api(v2.MetricsApi);

    console.log('Fetching active metrics (this request includes agent headers)...');

    const response = await metricsApi.listActiveMetrics({
      from: Math.floor(Date.now() / 1000) - 3600, // Last hour
      limit: 5,
    });

    console.log(`\nSuccess! Retrieved ${response.data?.length || 0} metrics`);
    console.log('\nThe request included agent identification headers automatically.');

    console.log('\n✓ Agent identification is working correctly!');
  } catch (error) {
    console.error('\nError making API request:', error);
    console.log('\nNote: The agent headers were still sent with the request.');
  }

  console.log('\n=== How to customize agent identification ===\n');
  console.log('Set environment variables before running:');
  console.log('  export DD_AGENT_TYPE="my-custom-agent"');
  console.log('  export DD_AGENT_VERSION="1.0.0"');
  console.log('\nOr for specific agent types:');
  console.log('  export CLAUDE_MODEL="claude-3-opus-20240229"  # Auto-detects as Claude');
  console.log('  export LETTA_API_KEY="letta-key-xxx"          # Auto-detects as Letta');
  console.log('  export OPENAI_API_KEY="sk-xxx"                # Auto-detects as ChatGPT');
}

// Run the example
if (require.main === module) {
  main()
    .then(() => {
      console.log('\nExample completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nExample failed:', error);
      process.exit(1);
    });
}

export { main };
