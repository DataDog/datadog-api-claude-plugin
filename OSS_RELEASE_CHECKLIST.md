# Open Source Release Checklist for datadog-api-claude-plugin

This document tracks the completion of requirements for releasing this repository as open source according to Datadog's OSS policy.

## Completed Items ✅

### Required Files
- [x] **LICENSE file** - Changed from MIT to Apache 2.0
- [x] **NOTICE file** - Created with Datadog copyright and attribution
- [x] **LICENSE-3rdparty.csv** - Complete list of all dependencies with SPDX identifiers
- [x] **README.md** - Comprehensive documentation (already exists, updated license badge)
- [x] **CONTRIBUTING.md** - Contribution guidelines (already exists)

### GitHub Templates
- [x] **Pull Request template** - `.github/PULL_REQUEST_TEMPLATE.md`
- [x] **Issue templates** - Created bug report, feature request, and documentation templates
- [x] **Issue template config** - Links to Datadog support and community

### Copyright Headers
- [x] **Source files** - Added Apache 2.0 headers to all 26 TypeScript files in `src/`
- [x] **Config files** - Added headers to `jest.config.js` and `eslint.config.mjs`

### License Compatibility
- [x] **Third-party verification** - All dependencies use MIT or Apache-2.0 licenses, compatible with Apache 2.0
- [x] **Package.json** - Updated license field from "MIT" to "Apache-2.0"

### Security
- [x] **Credential check** - Manual review shows no hardcoded credentials (all use environment variables)
- [x] **Sensitive data** - No tokens, keys, or secrets found in repository

### Repository Configuration
- [x] **CODEOWNERS** - Already exists (`.github/CODEOWNERS`)
- [x] **CI workflow** - Already exists (`.github/workflows/ci.yml`)
- [x] **Dependabot** - Already configured (`.github/dependabot.yml`)

## Remaining Items ⚠️

### Security Scan
- [ ] **Self-service security scan** - Need to trigger scan via #sit Slack channel
  - Per the guidelines: "trigger a self-service scan for hard-coded credentials and remediate all findings"
  - Contact: https://dd.enterprise.slack.com/archives/C027P1CK07N
  - Reference: https://datadoghq.atlassian.net/wiki/spaces/SECENG/pages/3267396489/Secret+Scanning+Usage#Self-Service-Scanning

### Repository Security Settings
- [ ] **GitHub security configuration** - Ensure repository follows Datadog's guide to secure GitHub repositories
  - Review branch protection rules
  - Review required status checks
  - Review access controls
  - Enable security scanning features

### Approval Process
1. [ ] **Post in #opensource Slack channel** for review and approval
   - Channel: https://dd.enterprise.slack.com/archives/C5SQHB3LZ
   - Include link to this checklist
   - Mention completion of all required items
   - Note that self-service security scan is pending

2. [ ] **Fill out Jira form** to make repository public (after approval)
   - Form: https://datadoghq.atlassian.net/jira/software/c/projects/GHGOV/forms/form/direct/1213960947439456/10002

## License Information

**Selected License**: Apache 2.0 with NOTICE file

**Rationale**: This is a small non-core repository, and Apache 2.0 is the default license for Datadog OSS projects. All dependencies are compatible (MIT and Apache-2.0 licenses).

## Third-Party Dependencies Summary

All runtime dependencies:
- `@datadog/datadog-api-client` (Apache-2.0) ✅ Compatible
- `asciichart` (MIT) ✅ Compatible
- `inquirer` (MIT) ✅ Compatible

All dev dependencies are MIT or Apache-2.0 licensed ✅

## Next Steps

1. **Trigger security scan**: Contact #sit Slack channel to run self-service scan
2. **Review security scan results**: Remediate any findings if necessary
3. **Verify GitHub security settings**: Ensure repository follows Datadog security guidelines
4. **Post in #opensource**: Request review with link to this checklist
5. **Wait for approval**: Address any feedback from the OSS team
6. **Submit Jira form**: Once approved, request repository to be made public

## Notes

- Repository URL: https://github.com/DataDog/datadog-api-claude-plugin
- Current status: Private
- Target status: Public open source
- License: Apache 2.0
- All source files now include required copyright headers
- All documentation is comprehensive and up-to-date
- CI/CD pipeline is functional and includes tests, linting, and builds
