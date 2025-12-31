# Contributing to Datadog API Claude Plugin

Thank you for your interest in contributing to the Datadog API Claude Plugin! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Code Style](#code-style)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Adding New Features](#adding-new-features)
- [Documentation](#documentation)
- [Release Process](#release-process)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. Please:

- Be respectful and considerate of others
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Accept responsibility for mistakes
- Prioritize the community's best interests

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/datadog-api-claude-plugin.git
   cd datadog-api-claude-plugin
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/DataDog/datadog-api-claude-plugin.git
   ```
4. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

### Prerequisites

- Node.js 16.0 or higher
- npm 7.0 or higher
- TypeScript 5.3 or higher
- Datadog account with API and Application keys (for testing)

### Install Dependencies

```bash
npm install
```

### Build the Project

```bash
npm run build
```

### Run Tests

```bash
npm test
```

### Watch Mode (for development)

```bash
npm run watch
```

### Set Up Test Credentials

Create a `.env` file (DO NOT commit this file):

```bash
DD_API_KEY=your-test-api-key
DD_APP_KEY=your-test-app-key
DD_SITE=datadoghq.com
```

## Project Structure

```
datadog-api-claude-plugin/
├── .claude-plugin/          # Claude Code plugin configuration
│   ├── plugin.json          # Plugin metadata and agent registry
│   ├── agents/              # Agent definitions
│   │   ├── metrics.md
│   │   ├── monitoring-alerting.md
│   │   └── ...
│   └── skills/              # Skill definitions
│       └── code-generation/ # Code generation skill
├── src/
│   ├── lib/                 # Core utilities
│   │   ├── client.ts        # Datadog API client wrapper
│   │   ├── config.ts        # Configuration and validation
│   │   ├── permissions.ts   # Permission system
│   │   ├── formatter.ts     # Response formatting
│   │   └── error-handler.ts # Error handling
│   ├── api/                 # API wrappers
│   │   ├── v1/              # Datadog API v1 wrappers
│   │   │   ├── monitors.ts
│   │   │   ├── dashboards.ts
│   │   │   └── ...
│   │   └── v2/              # Datadog API v2 wrappers
│   │       ├── metrics.ts
│   │       ├── logs.ts
│   │       └── ...
│   ├── codegen/             # Code generation templates
│   │   ├── typescript-templates.ts
│   │   └── python-templates.ts
│   └── index.ts             # CLI entry point
├── tests/
│   ├── unit/                # Unit tests
│   │   ├── config.test.ts
│   │   ├── permissions.test.ts
│   │   └── formatter.test.ts
│   └── integration/         # Integration tests (future)
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## Making Changes

### Before You Start

1. **Check existing issues** to see if someone is already working on it
2. **Open an issue** for discussion if you're adding a new feature
3. **Keep changes focused** - one feature or fix per pull request
4. **Follow the existing patterns** in the codebase

### Development Workflow

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the code style guidelines

3. **Write tests** for your changes:
   - Unit tests for new utilities
   - Integration tests for API wrappers
   - Update existing tests if needed

4. **Run tests**:
   ```bash
   npm test
   ```

5. **Build the project**:
   ```bash
   npm run build
   ```

6. **Test manually** with the CLI:
   ```bash
   node dist/index.js <command> <subcommand> [options]
   ```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Place unit tests in `tests/unit/`
- Follow the existing test structure and naming conventions
- Aim for high test coverage (80%+)
- Mock external dependencies (Datadog API)

**Example test:**

```typescript
describe('MyNewFeature', () => {
  it('should do something expected', () => {
    const result = myNewFeature();
    expect(result).toBe(expectedValue);
  });

  it('should handle error cases', () => {
    expect(() => myNewFeature(invalidInput)).toThrow();
  });
});
```

### Test Coverage Requirements

- **Utilities**: 90%+ coverage
- **API Wrappers**: 80%+ coverage
- **CLI Handlers**: Manual testing acceptable

## Code Style

### TypeScript Guidelines

- Use **strict TypeScript** mode
- Prefer **interfaces** over types for object shapes
- Use **async/await** over raw promises
- Add **JSDoc comments** for public functions
- Keep functions **small and focused** (< 50 lines)
- Use **descriptive variable names**

**Example:**

```typescript
/**
 * Query metrics from Datadog
 * @param params Query parameters including metric name and time range
 * @returns Formatted metric results
 */
async function queryMetrics(params: MetricQueryParams): Promise<string> {
  // Implementation
}
```

### Formatting

We use Prettier for code formatting:

```bash
npm run format
```

Configuration is in `.prettierrc` (or defaults).

### Linting

We use ESLint for code quality:

```bash
npm run lint
```

Fix auto-fixable issues:

```bash
npm run lint -- --fix
```

## Commit Messages

Follow conventional commit format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, no logic change)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples

```
feat(metrics): add support for metric tag filtering

- Add --tags parameter to metrics list command
- Update MetricsApi to accept tag filters
- Add tests for tag filtering

Closes #123
```

```
fix(logs): correct time range parsing for ISO dates

The time parser wasn't correctly handling ISO date strings.
Now it properly converts them to Unix timestamps.

Fixes #456
```

## Pull Request Process

### Before Submitting

1. ✅ Tests pass: `npm test`
2. ✅ Build succeeds: `npm run build`
3. ✅ Code is formatted: `npm run format`
4. ✅ No lint errors: `npm run lint`
5. ✅ Documentation is updated
6. ✅ CHANGELOG.md is updated (for user-facing changes)

### PR Title

Follow the same format as commit messages:

```
feat(domain): brief description of change
```

### PR Description

Include:

- **What**: What does this PR do?
- **Why**: Why is this change needed?
- **How**: How does it work?
- **Testing**: How was it tested?
- **Screenshots**: For UI changes (if applicable)

### PR Template

```markdown
## Description
Brief description of the changes

## Motivation
Why this change is needed

## Changes
- Change 1
- Change 2
- Change 3

## Testing
How this was tested

## Checklist
- [ ] Tests pass
- [ ] Build succeeds
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
```

### Review Process

- At least **one maintainer** must approve
- **All CI checks** must pass
- **Requested changes** must be addressed
- **Squash and merge** is preferred for clean history

## Adding New Features

### Adding a New Agent

1. **Create agent file**: `.claude-plugin/agents/new-domain.md`
2. **Follow the existing agent structure**:
   - Description and capabilities
   - Available commands with examples
   - Permission model
   - Error handling guidance
   - Best practices
3. **Register in plugin.json**:
   ```json
   {
     "name": "new-domain",
     "description": "Brief description",
     "path": "agents/new-domain.md"
   }
   ```

### Adding a New API Wrapper

1. **Create API file**: `src/api/v1/new-domain.ts` or `src/api/v2/new-domain.ts`
2. **Implement the API class**:
   ```typescript
   export class NewDomainApi {
     private api: v1.NewDomainApi;

     constructor() {
       this.api = getV1Api(v1.NewDomainApi);
     }

     async listItems(): Promise<string> {
       // Implementation
     }
   }
   ```
3. **Add CLI handler** in `src/index.ts`
4. **Write tests** in `tests/unit/`
5. **Update documentation**

### Adding Code Generation Templates

1. **Add to TypeScript templates**: `src/codegen/typescript-templates.ts`
2. **Add to Python templates**: `src/codegen/python-templates.ts`
3. **Follow existing template patterns**
4. **Test generated code manually**

## Documentation

### When to Update Documentation

- Adding new features
- Changing existing behavior
- Fixing bugs that affect usage
- Improving error messages

### Documentation Files

- **README.md**: User-facing documentation
- **ARCHITECTURE.md**: Design decisions and architecture
- **Agent files**: Domain-specific usage guidance
- **Code comments**: JSDoc for public APIs

### Documentation Style

- Use **clear, concise language**
- Include **examples** for complex features
- Keep **up-to-date** with code changes
- Use **code blocks** with syntax highlighting

## Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features (backward compatible)
- **Patch** (0.0.1): Bug fixes

### Release Checklist

1. Update version in:
   - `package.json`
   - `.claude-plugin/plugin.json`
2. Update `CHANGELOG.md` with all changes
3. Update `README.md` if needed
4. Run full test suite: `npm test`
5. Build: `npm run build`
6. Create git tag: `git tag v1.0.0`
7. Push tag: `git push origin v1.0.0`
8. Create GitHub release with changelog

## Common Tasks

### Adding a New Command

1. Add command handler in `src/index.ts`
2. Implement API call in appropriate API wrapper
3. Add help text
4. Add tests
5. Update agent documentation
6. Update README.md examples

### Fixing a Bug

1. Write a failing test that reproduces the bug
2. Fix the bug
3. Verify the test passes
4. Add regression test if needed
5. Update documentation if bug affected documented behavior

### Improving Error Messages

1. Identify error scenario
2. Add clear, actionable error message
3. Include suggestions for resolution
4. Test error cases
5. Update documentation

## Getting Help

- **Questions**: Open a GitHub Discussion
- **Bugs**: Open a GitHub Issue
- **Security**: Email security@datadoghq.com
- **Chat**: Join the community Discord (link in README)

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project README

Thank you for contributing to making Datadog integration with Claude better for everyone!
