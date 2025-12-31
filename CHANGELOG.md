# Changelog

All notable changes to the Datadog API Claude Plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.11.0] - 2025-12-31

### Added
- **5 New Specialized Agents**: Expanded from 23 to 28 agents with enhanced security, monitoring, and compliance coverage
  - **Database Monitoring**: Monitor database performance, query metrics, and connection health across PostgreSQL, MySQL, SQL Server, and Oracle
  - **Container Monitoring**: Monitor Kubernetes clusters, Docker containers, pods, deployments, and control plane health
  - **Application Security**: Manage ASM/WAF rules, detect application-level threats, and protect APIs with OWASP coverage
  - **Static Analysis**: SAST and SCA for code quality, security vulnerabilities, and dependency management across 14+ languages
  - **Audit Logs**: Query audit trail events for compliance, security auditing, and user activity tracking with support for HIPAA, PCI DSS, SOC 2, GDPR, SOX, and ISO 27001

### Changed
- Updated agent count from 23 to 28 agents across all documentation
- Enhanced security and compliance capabilities with ASM, SAST/SCA, and audit trail support

### Documentation
- Added comprehensive documentation for database monitoring (DBM) features
- Added Kubernetes and Docker container monitoring guidance
- Added OWASP Top 10 coverage for application security
- Added compliance reporting guidance for regulatory requirements

## [1.10.0] - 2025-12-31

### Added
- **10 New Specialized Agents**: Expanded from 12 to 23 agents with comprehensive domain coverage
  - **On-Call Management**: Manage on-call schedules, rotations, and paging workflows
  - **Notebooks**: Create and manage collaborative documentation and runbooks
  - **Network Performance Monitoring**: Monitor network devices, traffic, and performance
  - **Cloud Cost Management**: Track and optimize cloud infrastructure costs
  - **Events Management**: Query and analyze platform events
  - **Error Tracking**: Track and investigate errors across traces, logs, and RUM
  - **Service Catalog**: Manage service registry and ownership
  - **Teams Management**: Manage team membership, permissions, and structure
  - **Workflow Automation**: Create and manage automated workflows
  - **CI/CD Visibility**: Monitor CI/CD pipeline performance and test results
  - **Case Management**: Create and track support cases and incidents

### Changed
- Updated agent count from 12 to 23 agents across all documentation
- Enhanced plugin capabilities with broader Datadog API coverage

### Documentation
- Added RELEASING.md with comprehensive release process guide
- Updated README.md with agent list sorting and accurate agent count

## [1.0.0] - 2024-12-30

### Added
- **Production Release**: Official v1.0.0 release with full Datadog API coverage
- **Comprehensive Documentation**:
  - README.md (14KB) - User guide with 50+ examples
  - CONTRIBUTING.md (11.5KB) - Contribution guidelines
  - ARCHITECTURE.md (22KB) - Technical documentation
  - NEXT_STEPS.md (10.5KB) - Release and maintenance procedures
  - LICENSE (MIT) - Open source license
- **Plugin Structure Finalization**: Corrected plugin.json path resolution for Claude Code compatibility

### Changed
- Updated plugin.json to use correct path format (relative to `.claude-plugin` directory)
- Version bumped to 1.0.0 across all manifests

### Fixed
- Plugin.json path resolution issues for agent and skill discovery

## [0.2.0] - 2024-12-30

### Added
- **Code Generation**: Generate TypeScript and Python code for all Datadog operations
  - Added `--generate` flag to CLI commands
  - Support for `--generate=python` and `--generate=typescript`
  - Alternative `--language=` syntax
  - Complete code templates with imports, configuration, error handling, and documentation
- **Code Generation Skill**: New skill definition for code generation guidance
  - Comprehensive documentation in `.claude-plugin/skills/code-generation/SKILL.md`
  - Usage examples and best practices
  - Integration with all 12 domain agents

### Changed
- Updated plugin description to mention code generation support
- Enhanced help text for commands with code generation examples

### Documentation
- Added code generation section to README.md
- Updated architecture documentation

## [0.1.0] - 2024-12-30

### Added
- **Initial Release**: Complete Datadog API integration plugin for Claude Code
- **12 Domain Agents**: Specialized agents for each Datadog domain
  - `metrics`: Query, submit, and manage metrics
  - `monitors`: Manage alerting monitors
  - `dashboards`: Create and manage dashboards
  - `logs`: Search and analyze logs
  - `traces`: Query APM traces and spans
  - `slos`: Manage Service Level Objectives
  - `incidents`: Track incident management
  - `synthetics`: Monitor synthetic tests
  - `rum`: Query Real User Monitoring data
  - `security`: Search security signals and rules
  - `infrastructure`: View and manage hosts
  - `admin`: User and organization management

- **API Wrappers**: Complete implementation for all 12 domains
  - Datadog API v1: monitors, dashboards, slos, synthetics, hosts
  - Datadog API v2: metrics, logs, spans, incidents, rum, security, users
  - Type-safe interfaces using official `@datadog/datadog-api-client`

- **Core Utilities**:
  - **Client**: Singleton Datadog API client wrapper
  - **Configuration**: Environment variable validation (DD_API_KEY, DD_APP_KEY, DD_SITE)
  - **Permissions**: Three-tier permission system (READ/WRITE/DELETE)
  - **Formatter**: Multiple output formats (JSON, table, list, compact)
  - **Error Handler**: Custom error types with actionable messages

- **CLI Interface**:
  - Command structure: `node dist/index.js <domain> <action> [options]`
  - Flexible time parameter parsing (relative times: 1h, 30m, 7d)
  - Help system for all commands
  - Test command for credential validation

- **Agent Documentation**:
  - Comprehensive markdown documentation for each agent
  - Usage examples and command syntax
  - Permission models and best practices
  - Error handling guidance
  - Common user request patterns

- **Testing**:
  - 37 unit tests with 100% pass rate
  - Tests for configuration, permissions, and formatting
  - Jest test framework with ts-jest
  - Test coverage reporting

- **Build System**:
  - TypeScript compilation with strict mode
  - NPM scripts for build, test, watch, clean
  - ESLint and Prettier configuration
  - Pre-build clean step

### Documentation
- README.md: Comprehensive user documentation
- CLAUDE.md: Project overview and use cases
- AGENTS.md: Agent architecture documentation
- Package.json: Project metadata and scripts
- TSConfig.json: TypeScript configuration

### Security
- Environment variable-based credential management
- No hardcoded API keys or secrets
- Permission checks before operations
- Secure error messages (credentials never logged)
- Input validation and sanitization

## Version History Summary

- **v1.0.0**: Production release with complete documentation and plugin structure fixes
- **v0.2.0**: Code generation feature (TypeScript and Python)
- **v0.1.0**: Initial release with full API coverage and 12 agents

---

## Release Notes Guidelines

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):
- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features (backward compatible)
- **Patch** (0.0.1): Bug fixes

### Categories

- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements

### Linking

- [Unreleased]: https://github.com/DataDog/datadog-api-claude-plugin/compare/v1.0.0...HEAD
- [1.0.0]: https://github.com/DataDog/datadog-api-claude-plugin/compare/v0.2.0...v1.0.0
- [0.2.0]: https://github.com/DataDog/datadog-api-claude-plugin/compare/v0.1.0...v0.2.0
- [0.1.0]: https://github.com/DataDog/datadog-api-claude-plugin/releases/tag/v0.1.0
