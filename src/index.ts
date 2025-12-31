#!/usr/bin/env node
/**
 * CLI entry point for Datadog API Claude Plugin
 * Routes commands to appropriate API handlers
 */

import { ErrorHandler } from './lib/error-handler';
import { ResponseFormatter } from './lib/formatter';
import { ConfigValidator } from './lib/config';
import { createMetricsApi } from './api/v2/metrics';
import { createMonitorsApi } from './api/v1/monitors';
import { createDashboardsApi } from './api/v1/dashboards';
import { createLogsApi } from './api/v2/logs';
import { createSpansApi } from './api/v2/spans';
import { createSLOsApi } from './api/v1/slos';
import { createIncidentsApi } from './api/v2/incidents';
import { createSyntheticsApi } from './api/v1/synthetics';
import { createRUMApi } from './api/v2/rum';
import { createSecurityMonitoringApi } from './api/v2/security';
import { createHostsApi } from './api/v1/hosts';
import { createUsersApi } from './api/v2/users';
import { createCasesApi } from './api/v2/cases';
import { createKeyManagementApi } from './api/v2/key-management';
import { generateTypeScriptCode } from './codegen/typescript-templates';
import { generatePythonCode } from './codegen/python-templates';

/**
 * Helper function to parse time parameters
 * Supports Unix timestamps and relative time (e.g., "1h", "30m", "1d", "now")
 */
function parseTimeParam(timeStr: string): number {
  if (timeStr === 'now') {
    return Math.floor(Date.now() / 1000);
  }

  // If it's a number, assume it's a Unix timestamp
  if (/^\d+$/.test(timeStr)) {
    return parseInt(timeStr);
  }

  // Parse relative time (e.g., "1h", "30m", "2d")
  const match = timeStr.match(/^(\d+)([smhd])?$/);
  if (match) {
    const value = parseInt(match[1]);
    const unit = match[2] || 's'; // default to seconds
    const now = Math.floor(Date.now() / 1000);

    switch (unit) {
      case 's':
        return now - value;
      case 'm':
        return now - value * 60;
      case 'h':
        return now - value * 3600;
      case 'd':
        return now - value * 86400;
    }
  }

  // If all else fails, try to parse as ISO date
  const timestamp = Date.parse(timeStr);
  if (!isNaN(timestamp)) {
    return Math.floor(timestamp / 1000);
  }

  throw new Error(`Invalid time format: ${timeStr}`);
}

/**
 * Check if --generate flag is present and return language
 * Returns: 'typescript', 'python', or null if not generating
 */
function getGenerateLanguage(args: string[]): 'typescript' | 'python' | null {
  const generateFlag = args.find((arg) => arg === '--generate' || arg.startsWith('--generate='));

  if (!generateFlag) {
    return null;
  }

  // Check for --language flag
  const languageArg = args.find((arg) => arg.startsWith('--language='));
  if (languageArg) {
    const language = languageArg.split('=')[1].toLowerCase();
    if (language === 'typescript' || language === 'ts') {
      return 'typescript';
    } else if (language === 'python' || language === 'py') {
      return 'python';
    }
  }

  // Check if --generate has a value (e.g., --generate=python)
  if (generateFlag.includes('=')) {
    const language = generateFlag.split('=')[1].toLowerCase();
    if (language === 'typescript' || language === 'ts') {
      return 'typescript';
    } else if (language === 'python' || language === 'py') {
      return 'python';
    }
  }

  // Default to TypeScript
  return 'typescript';
}

/**
 * Generate code for a command
 */
function generateCode(
  language: 'typescript' | 'python',
  domain: string,
  operation: string,
  params: Record<string, any>
): string {
  if (language === 'python') {
    return generatePythonCode({ domain, operation, params });
  } else {
    return generateTypeScriptCode({ domain, operation, params });
  }
}

/**
 * Main CLI function
 */
async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);

    if (args.length === 0) {
      printUsage();
      process.exit(0);
    }

    const command = args[0];
    const subcommand = args[1];
    const commandArgs = args.slice(2);

    // Route to appropriate command handler
    // Note: Validation happens inside command handlers that need credentials
    switch (command) {
      case 'metrics':
        await handleMetricsCommand(subcommand, commandArgs);
        break;
      case 'monitors':
        await handleMonitorsCommand(subcommand, commandArgs);
        break;
      case 'dashboards':
        await handleDashboardsCommand(subcommand, commandArgs);
        break;
      case 'logs':
        await handleLogsCommand(subcommand, commandArgs);
        break;
      case 'traces':
        await handleTracesCommand(subcommand, commandArgs);
        break;
      case 'slos':
        await handleSlosCommand(subcommand, commandArgs);
        break;
      case 'incidents':
        await handleIncidentsCommand(subcommand, commandArgs);
        break;
      case 'synthetics':
        await handleSyntheticsCommand(subcommand, commandArgs);
        break;
      case 'rum':
        await handleRumCommand(subcommand, commandArgs);
        break;
      case 'security':
        await handleSecurityCommand(subcommand, commandArgs);
        break;
      case 'infrastructure':
        await handleInfrastructureCommand(subcommand, commandArgs);
        break;
      case 'admin':
        await handleAdminCommand(subcommand, commandArgs);
        break;
      case 'keys':
        await handleKeysCommand(subcommand, commandArgs);
        break;
      case 'cases':
        await handleCasesCommand(subcommand, commandArgs);
        break;
      case 'test':
        await handleTestCommand();
        break;
      case 'version':
        printVersion();
        break;
      case 'help':
      case '--help':
      case '-h':
        printUsage();
        break;
      default:
        console.error(`Unknown command: ${command}`);
        printUsage();
        process.exit(1);
    }
  } catch (error) {
    console.error(ErrorHandler.format(error as Error));
    process.exit(1);
  }
}

/**
 * Prints usage information
 */
function printUsage() {
  console.log(`
Datadog API Claude Plugin - CLI Tool

Usage: dd-plugin <command> <subcommand> [options]

Commands:
  metrics        Query and submit metrics
  monitors       Manage monitors
  dashboards     Manage dashboards
  logs           Search and analyze logs
  traces         Query APM traces
  slos           Manage Service Level Objectives
  incidents      Manage incidents
  synthetics     Manage synthetic tests
  rum            Query Real User Monitoring data
  security       Query security monitoring data
  infrastructure Manage hosts and integrations
  admin          Manage users, organizations, and API keys
  keys           Manage API keys and Application keys
  cases          Manage case management and projects
  test           Test connection and credentials
  version        Show version information
  help           Show this help message

Environment Variables:
  DD_API_KEY     Datadog API key (required)
  DD_APP_KEY     Datadog Application key (required)
  DD_SITE        Datadog site (default: datadoghq.com)

Examples:
  dd-plugin metrics list
  dd-plugin monitors list
  dd-plugin dashboards get <dashboard-id>
  dd-plugin test

For detailed command help:
  dd-plugin <command> help
  `);
}

/**
 * Prints version information
 */
function printVersion() {
  const packageJson = require('../package.json');
  console.log(`Datadog API Claude Plugin v${packageJson.version}`);
}

/**
 * Test command - validates connection and credentials
 */
async function handleTestCommand() {
  const config = ConfigValidator.validate();
  console.log(
    ResponseFormatter.formatSuccess('Configuration is valid', {
      site: config.site,
      apiKeyLength: config.apiKey.length,
      appKeyLength: config.appKey.length,
    })
  );

  // TODO: Make a simple API call to verify credentials work
  console.log('\nNote: Full credential verification will be implemented in Phase 2');
}

/**
 * Metrics command handler
 */
async function handleMetricsCommand(subcommand: string, args: string[]) {
  // Handle help without requiring credentials
  if (subcommand === 'help') {
    console.log(`
Metrics Commands:
  list [--filter=<pattern>] [--limit=<n>]   List available metrics
  query --query=<metric> [--from=<time>] [--to=<time>]   Query metric data
  submit                                    Submit custom metrics (use agent)

Code Generation:
  Add --generate or --generate=python to generate code instead of executing
  Add --language=typescript or --language=python to specify language

Time format: Unix timestamp or relative (e.g., 1h, 30m, 1d ago)

Examples:
  dd-plugin metrics list
  dd-plugin metrics list --filter="system.*"
  dd-plugin metrics query --query="avg:system.cpu.user{*}" --from="1h" --to="now"
  dd-plugin metrics query --query="avg:system.cpu.user{*}" --generate=python
    `);
    return;
  }

  // Check if we're generating code instead of executing
  const generateLanguage = getGenerateLanguage(args);

  switch (subcommand) {
    case 'list':
      const filter = args.find((arg) => arg.startsWith('--filter='))?.split('=')[1];
      const limit = args.find((arg) => arg.startsWith('--limit='))?.split('=')[1];

      if (generateLanguage) {
        const code = generateCode(generateLanguage, 'metrics', 'list', { filter, limit });
        console.log(code);
        return;
      }

      const api = createMetricsApi();
      const result = await api.listMetrics({
        filter,
        limit: limit ? parseInt(limit) : undefined,
      });
      console.log(result);
      break;

    case 'query':
      const query = args.find((arg) => arg.startsWith('--query='))?.split('=')[1];
      const from = args.find((arg) => arg.startsWith('--from='))?.split('=')[1];
      const to = args.find((arg) => arg.startsWith('--to='))?.split('=')[1];

      if (!query) {
        console.error(ResponseFormatter.formatError('--query is required'));
        process.exit(1);
      }

      if (generateLanguage) {
        const code = generateCode(generateLanguage, 'metrics', 'query', { query, from, to });
        console.log(code);
        return;
      }

      // Parse time parameters (default to last hour)
      // Note: Datadog API v2 requires milliseconds, not seconds
      const now = Date.now();
      const fromTimestamp = from ? parseTimeParam(from) * 1000 : now - 3600000;
      const toTimestamp = to ? parseTimeParam(to) * 1000 : now;

      const metricsApi = createMetricsApi();
      const queryResult = await metricsApi.queryMetrics({
        query,
        from: fromTimestamp,
        to: toTimestamp,
      });
      console.log(queryResult);
      break;

    case 'submit':
      const metric = args.find((arg) => arg.startsWith('--metric='))?.split('=')[1];
      const value = args.find((arg) => arg.startsWith('--value='))?.split('=')[1];
      const tags = args.find((arg) => arg.startsWith('--tags='))?.split('=')[1]?.split(',');

      if (generateLanguage) {
        const code = generateCode(generateLanguage, 'metrics', 'submit', { metric, value, tags });
        console.log(code);
        return;
      }

      console.log(
        ResponseFormatter.formatError(
          'Metric submission requires structured data',
          { note: 'Use the agent for interactive metric submission, or use --generate to create code' }
        )
      );
      break;

    default:
      console.error(ResponseFormatter.formatError('Unknown subcommand', { subcommand }));
      process.exit(1);
  }
}

/**
 * Monitors command handler
 */
async function handleMonitorsCommand(subcommand: string, args: string[]) {
  // Handle help without requiring credentials
  if (subcommand === 'help') {
    console.log(`
Monitors Commands:
  list [--name=<name>] [--tags=<tag1,tag2>]   List monitors
  get <monitor-id>                             Get monitor details
  search <query>                               Search monitors by name
  create                                       Create monitor (use agent)
  delete <monitor-id>                          Delete monitor

Examples:
  dd-plugin monitors list
  dd-plugin monitors list --name="CPU"
  dd-plugin monitors get 12345
  dd-plugin monitors search "production"
  dd-plugin monitors delete 12345
    `);
    return;
  }

  const api = createMonitorsApi();

  switch (subcommand) {
    case 'list':
      const name = args.find((arg) => arg.startsWith('--name='))?.split('=')[1];
      const tags = args.find((arg) => arg.startsWith('--tags='))?.split('=')[1]?.split(',');
      const result = await api.listMonitors({ name, tags });
      console.log(result);
      break;

    case 'get':
      const monitorId = args[0];
      if (!monitorId) {
        console.error(ResponseFormatter.formatError('Monitor ID is required'));
        process.exit(1);
      }
      const monitor = await api.getMonitor(parseInt(monitorId));
      console.log(monitor);
      break;

    case 'create':
      console.log(
        ResponseFormatter.formatError(
          'Monitor creation requires structured data',
          { note: 'Use the agent for interactive monitor creation' }
        )
      );
      break;

    case 'delete':
      const deleteId = args[0];
      if (!deleteId) {
        console.error(ResponseFormatter.formatError('Monitor ID is required'));
        process.exit(1);
      }
      const deleteResult = await api.deleteMonitor(parseInt(deleteId));
      console.log(deleteResult);
      break;

    case 'search':
      const searchQuery = args.join(' ');
      if (!searchQuery) {
        console.error(ResponseFormatter.formatError('Search query is required'));
        process.exit(1);
      }
      const searchResult = await api.searchMonitors(searchQuery);
      console.log(searchResult);
      break;

    default:
      console.error(ResponseFormatter.formatError('Unknown subcommand', { subcommand }));
      process.exit(1);
  }
}

/**
 * Dashboards command handler
 */
async function handleDashboardsCommand(subcommand: string, args: string[]) {
  // Handle help without requiring credentials
  if (subcommand === 'help') {
    console.log(`
Dashboards Commands:
  list                           List all dashboards
  get <dashboard-id>             Get dashboard details
  url <dashboard-id>             Get dashboard URL
  create                         Create dashboard (use agent)
  delete <dashboard-id>          Delete dashboard

Examples:
  dd-plugin dashboards list
  dd-plugin dashboards get abc-123-def
  dd-plugin dashboards url abc-123-def
  dd-plugin dashboards delete abc-123-def
    `);
    return;
  }

  const api = createDashboardsApi();

  switch (subcommand) {
    case 'list':
      const result = await api.listDashboards();
      console.log(result);
      break;

    case 'get':
      const dashboardId = args[0];
      if (!dashboardId) {
        console.error(ResponseFormatter.formatError('Dashboard ID is required'));
        process.exit(1);
      }
      const dashboard = await api.getDashboard(dashboardId);
      console.log(dashboard);
      break;

    case 'create':
      console.log(
        ResponseFormatter.formatError(
          'Dashboard creation requires structured data',
          { note: 'Use the agent for interactive dashboard creation' }
        )
      );
      break;

    case 'delete':
      const deleteId = args[0];
      if (!deleteId) {
        console.error(ResponseFormatter.formatError('Dashboard ID is required'));
        process.exit(1);
      }
      const deleteResult = await api.deleteDashboard(deleteId);
      console.log(deleteResult);
      break;

    case 'url':
      const urlId = args[0];
      if (!urlId) {
        console.error(ResponseFormatter.formatError('Dashboard ID is required'));
        process.exit(1);
      }
      const urlResult = await api.getDashboardPublicUrl(urlId);
      console.log(urlResult);
      break;

    default:
      console.error(ResponseFormatter.formatError('Unknown subcommand', { subcommand }));
      process.exit(1);
  }
}

/**
 * Logs command handler
 */
async function handleLogsCommand(subcommand: string, args: string[]) {
  // Handle help without requiring credentials
  if (subcommand === 'help') {
    console.log(`
Logs Commands:
  search --query=<query> [--from=<time>] [--to=<time>] [--limit=<n>]   Search logs

Time format: Unix timestamp or relative (e.g., 1h, 30m, 1d ago)

Examples:
  dd-plugin logs search --query="status:error" --from="1h" --to="now"
  dd-plugin logs search --query="service:api" --limit=100
    `);
    return;
  }

  const api = createLogsApi();

  switch (subcommand) {
    case 'search':
      const query = args.find((arg) => arg.startsWith('--query='))?.split('=')[1];
      const from = args.find((arg) => arg.startsWith('--from='))?.split('=')[1];
      const to = args.find((arg) => arg.startsWith('--to='))?.split('=')[1];
      const limit = args.find((arg) => arg.startsWith('--limit='))?.split('=')[1];

      if (!query) {
        console.error(ResponseFormatter.formatError('--query is required'));
        process.exit(1);
      }

      const now = Math.floor(Date.now() / 1000);
      const fromTimestamp = from ? parseTimeParam(from) : now - 3600;
      const toTimestamp = to ? parseTimeParam(to) : now;

      const result = await api.searchLogs({
        query,
        from: fromTimestamp,
        to: toTimestamp,
        limit: limit ? parseInt(limit) : undefined,
      });
      console.log(result);
      break;

    default:
      console.error(ResponseFormatter.formatError('Unknown subcommand', { subcommand }));
      process.exit(1);
  }
}

/**
 * Traces command handler
 */
async function handleTracesCommand(subcommand: string, args: string[]) {
  if (subcommand === 'help') {
    console.log(`
Traces Commands:
  search --query=<query> [--from=<time>] [--to=<time>] [--limit=<n>]   Search spans

Examples:
  dd-plugin traces search --query="service:api" --from="1h"
    `);
    return;
  }

  const api = createSpansApi();
  const query = args.find((arg) => arg.startsWith('--query='))?.split('=')[1] || '*';
  const from = args.find((arg) => arg.startsWith('--from='))?.split('=')[1];
  const to = args.find((arg) => arg.startsWith('--to='))?.split('=')[1];
  const now = Math.floor(Date.now() / 1000);
  const result = await api.searchSpans({
    query,
    from: from ? parseTimeParam(from) : now - 3600,
    to: to ? parseTimeParam(to) : now,
  });
  console.log(result);
}

/**
 * SLOs command handler
 */
async function handleSlosCommand(subcommand: string, args: string[]) {
  if (subcommand === 'help') {
    console.log(`
SLOs Commands:
  list                  List all SLOs
  get <slo-id>          Get SLO details
  delete <slo-id>       Delete SLO

Examples:
  dd-plugin slos list
  dd-plugin slos get abc-123
    `);
    return;
  }

  const api = createSLOsApi();
  switch (subcommand) {
    case 'list':
      console.log(await api.listSLOs());
      break;
    case 'get':
      console.log(await api.getSLO(args[0]));
      break;
    case 'delete':
      console.log(await api.deleteSLO(args[0]));
      break;
    default:
      console.error(ResponseFormatter.formatError('Unknown subcommand', { subcommand }));
  }
}

/**
 * Incidents command handler
 */
async function handleIncidentsCommand(subcommand: string, args: string[]) {
  if (subcommand === 'help') {
    console.log(`
Incidents Commands:
  list                  List all incidents
  get <incident-id>     Get incident details

Examples:
  dd-plugin incidents list
  dd-plugin incidents get abc-123
    `);
    return;
  }

  const api = createIncidentsApi();
  switch (subcommand) {
    case 'list':
      console.log(await api.listIncidents());
      break;
    case 'get':
      console.log(await api.getIncident(args[0]));
      break;
    default:
      console.error(ResponseFormatter.formatError('Unknown subcommand', { subcommand }));
  }
}

/**
 * Synthetics command handler
 */
async function handleSyntheticsCommand(subcommand: string, args: string[]) {
  if (subcommand === 'help') {
    console.log(`
Synthetics Commands:
  list                  List all synthetic tests
  get <test-id>         Get test details

Examples:
  dd-plugin synthetics list
  dd-plugin synthetics get abc-123
    `);
    return;
  }

  const api = createSyntheticsApi();
  switch (subcommand) {
    case 'list':
      console.log(await api.listTests());
      break;
    case 'get':
      console.log(await api.getTest(args[0]));
      break;
    default:
      console.error(ResponseFormatter.formatError('Unknown subcommand', { subcommand }));
  }
}

/**
 * RUM command handler
 */
async function handleRumCommand(subcommand: string, args: string[]) {
  if (subcommand === 'help') {
    console.log(`
RUM Commands:
  search --query=<query> [--from=<time>] [--to=<time>]   Search RUM events

Examples:
  dd-plugin rum search --query="@type:view" --from="1h"
    `);
    return;
  }

  const api = createRUMApi();
  const query = args.find((arg) => arg.startsWith('--query='))?.split('=')[1] || '*';
  const from = args.find((arg) => arg.startsWith('--from='))?.split('=')[1];
  const to = args.find((arg) => arg.startsWith('--to='))?.split('=')[1];
  const now = Math.floor(Date.now() / 1000);
  const result = await api.searchRUMEvents({
    query,
    from: from ? parseTimeParam(from) : now - 3600,
    to: to ? parseTimeParam(to) : now,
  });
  console.log(result);
}

/**
 * Security command handler
 */
async function handleSecurityCommand(subcommand: string, args: string[]) {
  if (subcommand === 'help') {
    console.log(`
Security Commands:
  signals [--from=<time>] [--to=<time>]   List security signals
  rules                                    List security rules

Examples:
  dd-plugin security signals --from="24h"
  dd-plugin security rules
    `);
    return;
  }

  const api = createSecurityMonitoringApi();
  switch (subcommand) {
    case 'signals':
      const from = args.find((arg) => arg.startsWith('--from='))?.split('=')[1];
      const to = args.find((arg) => arg.startsWith('--to='))?.split('=')[1];
      const now = Math.floor(Date.now() / 1000);
      console.log(await api.listSecuritySignals({
        from: from ? parseTimeParam(from) : now - 86400,
        to: to ? parseTimeParam(to) : now,
      }));
      break;
    case 'rules':
      console.log(await api.listSecurityRules());
      break;
    default:
      console.error(ResponseFormatter.formatError('Unknown subcommand', { subcommand }));
  }
}

/**
 * Infrastructure command handler
 */
async function handleInfrastructureCommand(subcommand: string, args: string[]) {
  if (subcommand === 'help') {
    console.log(`
Infrastructure Commands:
  hosts [--filter=<filter>]   List all hosts
  totals                       Get host totals

Examples:
  dd-plugin infrastructure hosts
  dd-plugin infrastructure hosts --filter="env:prod"
  dd-plugin infrastructure totals
    `);
    return;
  }

  const api = createHostsApi();
  switch (subcommand) {
    case 'hosts':
      const filter = args.find((arg) => arg.startsWith('--filter='))?.split('=')[1];
      console.log(await api.listHosts(filter));
      break;
    case 'totals':
      console.log(await api.getHostTotals());
      break;
    default:
      console.error(ResponseFormatter.formatError('Unknown subcommand', { subcommand }));
  }
}

/**
 * Admin command handler
 */
async function handleAdminCommand(subcommand: string, args: string[]) {
  if (subcommand === 'help') {
    console.log(`
Admin Commands:
  users                 List all users
  user <user-id>        Get user details

Examples:
  dd-plugin admin users
  dd-plugin admin user abc-123
    `);
    return;
  }

  const api = createUsersApi();
  switch (subcommand) {
    case 'users':
      console.log(await api.listUsers());
      break;
    case 'user':
      console.log(await api.getUser(args[0]));
      break;
    default:
      console.error(ResponseFormatter.formatError('Unknown subcommand', { subcommand }));
  }
}

/**
 * Key Management command handler
 */
async function handleKeysCommand(subcommand: string, args: string[]) {
  if (subcommand === 'help') {
    console.log(`
Keys Commands:
  api-keys [subcommand]      Manage API keys
  app-keys [subcommand]      Manage Application keys
  my-app-keys [subcommand]   Manage current user's Application keys

API Keys Subcommands:
  list [--filter=<text>] [--page-size=<n>] [--page-number=<n>]
  get <key-id>
  create --name=<name>
  update <key-id> --name=<name>
  delete <key-id>

Application Keys Subcommands:
  list [--filter=<text>] [--page-size=<n>] [--page-number=<n>]
  get <key-id>
  update <key-id> --name=<name>
  delete <key-id>

My Application Keys Subcommands:
  list [--filter=<text>] [--page-size=<n>] [--page-number=<n>]
  create --name=<name> [--scopes=<scope1,scope2>]
  delete <key-id>

Examples:
  dd-plugin keys api-keys list
  dd-plugin keys api-keys get abc-123
  dd-plugin keys api-keys create --name="My API Key"
  dd-plugin keys api-keys delete abc-123
  dd-plugin keys app-keys list
  dd-plugin keys my-app-keys list
  dd-plugin keys my-app-keys create --name="My App Key" --scopes="dashboards_read,monitors_read"
    `);
    return;
  }

  const api = createKeyManagementApi();

  // Handle api-keys subcommand
  if (subcommand === 'api-keys') {
    const apiKeySubcommand = args[0];
    const apiKeyArgs = args.slice(1);

    switch (apiKeySubcommand) {
      case 'list': {
        const filter = apiKeyArgs.find((arg) => arg.startsWith('--filter='))?.split('=')[1];
        const pageSize = apiKeyArgs.find((arg) => arg.startsWith('--page-size='))?.split('=')[1];
        const pageNumber = apiKeyArgs.find((arg) => arg.startsWith('--page-number='))?.split('=')[1];
        console.log(
          await api.listApiKeys({
            filter,
            pageSize: pageSize ? parseInt(pageSize) : undefined,
            pageNumber: pageNumber ? parseInt(pageNumber) : undefined,
          })
        );
        break;
      }

      case 'get':
        if (!apiKeyArgs[0]) {
          console.error(ResponseFormatter.formatError('API key ID is required'));
          return;
        }
        console.log(await api.getApiKey(apiKeyArgs[0]));
        break;

      case 'create': {
        const name = apiKeyArgs.find((arg) => arg.startsWith('--name='))?.split('=')[1];
        if (!name) {
          console.error(ResponseFormatter.formatError('--name is required'));
          return;
        }
        console.log(await api.createApiKey(name));
        break;
      }

      case 'update': {
        const keyId = apiKeyArgs[0];
        const name = apiKeyArgs.find((arg) => arg.startsWith('--name='))?.split('=')[1];
        if (!keyId || !name) {
          console.error(ResponseFormatter.formatError('Key ID and --name are required'));
          return;
        }
        console.log(await api.updateApiKey(keyId, name));
        break;
      }

      case 'delete':
        if (!apiKeyArgs[0]) {
          console.error(ResponseFormatter.formatError('API key ID is required'));
          return;
        }
        console.log(await api.deleteApiKey(apiKeyArgs[0]));
        break;

      default:
        console.error(ResponseFormatter.formatError('Unknown api-keys subcommand', { apiKeySubcommand }));
    }
    return;
  }

  // Handle app-keys subcommand
  if (subcommand === 'app-keys') {
    const appKeySubcommand = args[0];
    const appKeyArgs = args.slice(1);

    switch (appKeySubcommand) {
      case 'list': {
        const filter = appKeyArgs.find((arg) => arg.startsWith('--filter='))?.split('=')[1];
        const pageSize = appKeyArgs.find((arg) => arg.startsWith('--page-size='))?.split('=')[1];
        const pageNumber = appKeyArgs.find((arg) => arg.startsWith('--page-number='))?.split('=')[1];
        console.log(
          await api.listApplicationKeys({
            filter,
            pageSize: pageSize ? parseInt(pageSize) : undefined,
            pageNumber: pageNumber ? parseInt(pageNumber) : undefined,
          })
        );
        break;
      }

      case 'get':
        if (!appKeyArgs[0]) {
          console.error(ResponseFormatter.formatError('Application key ID is required'));
          return;
        }
        console.log(await api.getApplicationKey(appKeyArgs[0]));
        break;

      case 'update': {
        const keyId = appKeyArgs[0];
        const name = appKeyArgs.find((arg) => arg.startsWith('--name='))?.split('=')[1];
        if (!keyId || !name) {
          console.error(ResponseFormatter.formatError('Key ID and --name are required'));
          return;
        }
        console.log(await api.updateApplicationKey(keyId, name));
        break;
      }

      case 'delete':
        if (!appKeyArgs[0]) {
          console.error(ResponseFormatter.formatError('Application key ID is required'));
          return;
        }
        console.log(await api.deleteApplicationKey(appKeyArgs[0]));
        break;

      default:
        console.error(ResponseFormatter.formatError('Unknown app-keys subcommand', { appKeySubcommand }));
    }
    return;
  }

  // Handle my-app-keys subcommand
  if (subcommand === 'my-app-keys') {
    const myAppKeySubcommand = args[0];
    const myAppKeyArgs = args.slice(1);

    switch (myAppKeySubcommand) {
      case 'list': {
        const filter = myAppKeyArgs.find((arg) => arg.startsWith('--filter='))?.split('=')[1];
        const pageSize = myAppKeyArgs.find((arg) => arg.startsWith('--page-size='))?.split('=')[1];
        const pageNumber = myAppKeyArgs.find((arg) => arg.startsWith('--page-number='))?.split('=')[1];
        console.log(
          await api.listCurrentUserApplicationKeys({
            filter,
            pageSize: pageSize ? parseInt(pageSize) : undefined,
            pageNumber: pageNumber ? parseInt(pageNumber) : undefined,
          })
        );
        break;
      }

      case 'create': {
        const name = myAppKeyArgs.find((arg) => arg.startsWith('--name='))?.split('=')[1];
        const scopesStr = myAppKeyArgs.find((arg) => arg.startsWith('--scopes='))?.split('=')[1];
        const scopes = scopesStr ? scopesStr.split(',') : undefined;
        if (!name) {
          console.error(ResponseFormatter.formatError('--name is required'));
          return;
        }
        console.log(await api.createCurrentUserApplicationKey(name, scopes));
        break;
      }

      case 'delete':
        if (!myAppKeyArgs[0]) {
          console.error(ResponseFormatter.formatError('Application key ID is required'));
          return;
        }
        console.log(await api.deleteCurrentUserApplicationKey(myAppKeyArgs[0]));
        break;

      default:
        console.error(ResponseFormatter.formatError('Unknown my-app-keys subcommand', { myAppKeySubcommand }));
    }
    return;
  }

  console.error(ResponseFormatter.formatError('Unknown keys subcommand', { subcommand }));
}

/**
 * Cases command handler
 */
async function handleCasesCommand(subcommand: string, args: string[]) {
  if (subcommand === 'help') {
    console.log(`
Cases Commands:
  list [options]                List/search cases
  get <case-id>                 Get case details
  create [options]              Create a new case
  update <case-id> [options]    Update case status or priority
  assign <case-id> <user>       Assign case to user
  unassign <case-id>            Unassign case
  archive <case-id>             Archive a case
  unarchive <case-id>           Unarchive a case
  comment <case-id> <text>      Add comment to case
  projects [subcommand]         Manage projects

List Options:
  --status=<status>             Filter by status (OPEN, IN_PROGRESS, CLOSED)
  --priority=<priority>         Filter by priority (P1-P5)
  --project-id=<id>             Filter by project ID
  --filter=<text>               Search text filter
  --page=<number>               Page number
  --size=<number>               Page size (max 100)
  --sort=<field>                Sort field (created_at, priority, status)
  --asc=<true|false>            Sort order (default: true)

Create Options:
  --title=<text>                Case title (required)
  --type-id=<uuid>              Case type ID (required)
  --priority=<P1-P5>            Priority level
  --description=<text>          Case description
  --project-id=<uuid>           Project ID

Update Options:
  --status=<status>             Update status
  --priority=<priority>         Update priority

Project Commands:
  cases projects list           List all projects
  cases projects get <id>       Get project details
  cases projects create <name>  Create new project
  cases projects delete <id>    Delete project

Examples:
  dd-plugin cases list
  dd-plugin cases list --status=OPEN --priority=P1
  dd-plugin cases get CASE-123
  dd-plugin cases create --title="API Outage" --type-id="uuid" --priority=P1
  dd-plugin cases update CASE-123 --status=CLOSED
  dd-plugin cases assign CASE-123 user@example.com
  dd-plugin cases comment CASE-123 "Root cause identified"
  dd-plugin cases projects list
    `);
    return;
  }

  const api = createCasesApi();

  // Handle projects subcommand
  if (subcommand === 'projects') {
    const projectSubcommand = args[0];
    const projectArgs = args.slice(1);

    switch (projectSubcommand) {
      case 'list':
        console.log(await api.listProjects());
        break;
      case 'get':
        console.log(await api.getProject(projectArgs[0]));
        break;
      case 'create':
        console.log(await api.createProject(projectArgs[0]));
        break;
      case 'delete':
        console.log(await api.deleteProject(projectArgs[0]));
        break;
      default:
        console.error(ResponseFormatter.formatError('Unknown project subcommand', { projectSubcommand }));
    }
    return;
  }

  // Parse command arguments into options
  const parseOptions = (args: string[]): Record<string, any> => {
    const options: Record<string, any> = {};
    args.forEach((arg) => {
      if (arg.startsWith('--')) {
        const [key, value] = arg.substring(2).split('=');
        if (key && value !== undefined) {
          options[key] = value;
        }
      }
    });
    return options;
  };

  switch (subcommand) {
    case 'list': {
      const options = parseOptions(args);
      console.log(
        await api.searchCases({
          filter: options.filter,
          status: options.status,
          priority: options.priority,
          projectId: options['project-id'],
          page: options.page ? parseInt(options.page) : undefined,
          size: options.size ? parseInt(options.size) : undefined,
          sortField: options.sort,
          sortAsc: options.asc !== 'false',
        })
      );
      break;
    }

    case 'get':
      console.log(await api.getCase(args[0]));
      break;

    case 'create': {
      const options = parseOptions(args);
      if (!options.title || !options['type-id']) {
        console.error(
          ResponseFormatter.formatError('Missing required options', {
            required: ['--title', '--type-id'],
          })
        );
        return;
      }
      console.log(
        await api.createCase({
          title: options.title,
          typeId: options['type-id'],
          priority: options.priority,
          description: options.description,
          projectId: options['project-id'],
        })
      );
      break;
    }

    case 'update': {
      const caseId = args[0];
      const options = parseOptions(args.slice(1));

      if (options.status) {
        console.log(await api.updateCaseStatus(caseId, options.status));
      } else if (options.priority) {
        console.log(await api.updateCasePriority(caseId, options.priority));
      } else {
        console.error(
          ResponseFormatter.formatError('No update options provided', {
            available: ['--status', '--priority'],
          })
        );
      }
      break;
    }

    case 'assign': {
      const caseId = args[0];
      const userId = args[1];
      if (!userId) {
        console.error(ResponseFormatter.formatError('User ID required for assignment'));
        return;
      }
      console.log(await api.assignCase(caseId, userId));
      break;
    }

    case 'unassign':
      console.log(await api.unassignCase(args[0]));
      break;

    case 'archive':
      console.log(await api.archiveCase(args[0]));
      break;

    case 'unarchive':
      console.log(await api.unarchiveCase(args[0]));
      break;

    case 'comment': {
      const caseId = args[0];
      const comment = args.slice(1).join(' ');
      if (!comment) {
        console.error(ResponseFormatter.formatError('Comment text required'));
        return;
      }
      console.log(await api.addCaseComment(caseId, comment));
      break;
    }

    default:
      console.error(ResponseFormatter.formatError('Unknown subcommand', { subcommand }));
  }
}

// Run the CLI
if (require.main === module) {
  main().catch((error) => {
    console.error(ErrorHandler.format(error));
    process.exit(1);
  });
}

export { main };
