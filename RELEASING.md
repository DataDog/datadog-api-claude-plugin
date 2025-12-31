# Release Process

This document guides an agent (or human) through the complete release process for the Datadog API Claude Plugin.

## Overview

The release process involves:
1. Version bumping (semantic versioning)
2. Plugin validation and cleanup
3. Creating a release PR
4. Tagging and GitHub release creation
5. CHANGELOG maintenance

## Prerequisites

Before starting a release, ensure:
- All intended features/fixes are merged to `main`
- Tests pass (if applicable)
- You have push access to the repository
- You have GitHub CLI (`gh`) installed and authenticated

## Step 1: Determine Version Bump Type

Read the current version from `.claude-plugin/plugin.json`:

```bash
cat .claude-plugin/plugin.json | grep '"version"'
```

Determine the bump type based on changes since last release:

- **PATCH** (x.y.Z): Bug fixes, typos, documentation updates
- **MINOR** (x.Y.0): New features, new agents, backward-compatible changes
- **MAJOR** (X.0.0): Breaking changes, API changes, architectural changes

**IMPORTANT**: If you determine a MAJOR version bump is needed, you MUST ask the user for confirmation before proceeding:

```
⚠️ The changes since the last release include breaking changes that warrant a MAJOR version bump.

Current version: 1.10.0
Proposed version: 2.0.0

Breaking changes identified:
- [List specific breaking changes]

Do you want to proceed with a major version bump to 2.0.0?
```

Wait for explicit user confirmation before proceeding with a major version bump.

## Step 2: Create Release Branch

```bash
# Ensure you're on main and up to date
git checkout main
git pull origin main

# Create release branch
git checkout -b release/v<NEW_VERSION>
```

Example: `git checkout -b release/v1.11.0`

## Step 3: Update Version in plugin.json

Edit `.claude-plugin/plugin.json` and update the `version` field:

```json
{
  "version": "<NEW_VERSION>"
}
```

## Step 4: Sort and Validate plugin.json

### Sort Skills Array

The `skills` array must be alphabetically sorted. Read the current array and sort it:

```bash
# Read current plugin.json
cat .claude-plugin/plugin.json
```

If the `skills` array is not alphabetically sorted, sort it. Example:

**Before:**
```json
"skills": [
  "./skills/code-generation/SKILL.md",
  "./skills/api-query/SKILL.md"
]
```

**After:**
```json
"skills": [
  "./skills/api-query/SKILL.md",
  "./skills/code-generation/SKILL.md"
]
```

### Sort Agents Array

The `agents` array must be alphabetically sorted. Read the current array and sort it:

**Example sorted order:**
```json
"agents": [
  "./agents/admin.md",
  "./agents/cases.md",
  "./agents/cicd.md",
  "./agents/cloud-cost.md",
  "./agents/dashboards.md",
  "./agents/error-tracking.md",
  "./agents/events.md",
  "./agents/incidents.md",
  "./agents/infrastructure.md",
  "./agents/logs.md",
  "./agents/metrics.md",
  "./agents/monitors.md",
  "./agents/network-performance.md",
  "./agents/notebooks.md",
  "./agents/on-call.md",
  "./agents/rum.md",
  "./agents/security.md",
  "./agents/service-catalog.md",
  "./agents/slos.md",
  "./agents/synthetics.md",
  "./agents/teams.md",
  "./agents/traces.md",
  "./agents/workflows.md"
]
```

### Validate JSON

After sorting, validate that plugin.json is valid JSON:

```bash
# Validate JSON syntax
cat .claude-plugin/plugin.json | jq . > /dev/null && echo "✓ Valid JSON" || echo "✗ Invalid JSON"
```

If validation fails, fix syntax errors before proceeding.

## Step 5: Update CHANGELOG.md

### Read Git History

Get all commits since the last release tag:

```bash
# Find last release tag
git tag --sort=-version:refname | head -1

# Get commits since last tag
git log <LAST_TAG>..HEAD --oneline --no-merges
```

### Categorize Changes

Review the commits and PRs to categorize changes:

- **Added**: New features, new agents, new capabilities
- **Changed**: Updates to existing features, refactors
- **Fixed**: Bug fixes, typos, corrections
- **Security**: Security-related changes
- **Deprecated**: Features marked for removal
- **Removed**: Removed features

### Update CHANGELOG.md

Add a new section at the top of `CHANGELOG.md`:

```markdown
## [<NEW_VERSION>] - YYYY-MM-DD

### Added
- New On-Call Management agent with schedule management and paging
- New Notebooks agent for collaborative documentation
- Support for error tracking across traces, logs, and RUM

### Changed
- Improved network performance monitoring with device inventory

### Fixed
- Fixed version bump process in release workflow
```

**Format Guidelines:**
- Use present tense: "Add" not "Added"
- Be specific: Include agent names, feature names
- Group related changes
- Reference issue IDs where applicable: `(#123)`

## Step 7: Commit Changes

```bash
# Stage files
git add .claude-plugin/plugin.json README.md CHANGELOG.md

# Commit with descriptive message
git commit -m "chore: prepare release v<NEW_VERSION>

- Bump version to <NEW_VERSION>
- Sort skills and agents arrays alphabetically
- Update CHANGELOG.md with release notes
"
```

## Step 8: Push and Create Release PR

```bash
# Push release branch
git push -u origin release/v<NEW_VERSION>

# Create PR using GitHub CLI
gh pr create \
  --title "Release v<NEW_VERSION>" \
  --body "## Release v<NEW_VERSION>

This PR prepares the release for version <NEW_VERSION>.

### Changes
- Bump version from <OLD_VERSION> to <NEW_VERSION>
- Sort skills and agents arrays alphabetically
- Update CHANGELOG.md

### Release Notes
[Copy the relevant section from CHANGELOG.md]

### Checklist
- [x] Version bumped in plugin.json
- [x] Skills array sorted alphabetically
- [x] Agents array sorted alphabetically
- [x] plugin.json validated as valid JSON
- [x] CHANGELOG.md updated
- [ ] PR reviewed and approved
- [ ] Ready to merge

---

After merge:
1. Tag the release: \`git tag v<NEW_VERSION>\`
2. Push tag: \`git push origin v<NEW_VERSION>\`
3. Create GitHub release with release notes
"
```

## Step 9: Wait for Review and Merge

**HUMAN CHECKPOINT**: The release PR must be reviewed and approved by a human before proceeding.

Tell the user:
```
✓ Release PR created: https://github.com/DataDog/datadog-api-claude-plugin/pull/<PR_NUMBER>

Please review and merge the PR. Once merged, I'll continue with tagging and GitHub release creation.

Reply when the PR is merged.
```

**Wait for user confirmation that the PR is merged.**

## Step 10: Tag the Release

After the PR is merged:

```bash
# Switch to main and pull latest
git checkout main
git pull origin main

# Verify the version is correct
cat .claude-plugin/plugin.json | grep '"version"'

# Create annotated tag
git tag -a v<NEW_VERSION> -m "Release v<NEW_VERSION>"

# Push tag to remote
git push origin v<NEW_VERSION>
```

## Step 11: Create GitHub Release

Generate release notes by summarizing changes:

```bash
# Get PR titles merged since last release
gh pr list --state merged --limit 50 --json number,title,mergedAt
```

Create the GitHub release:

```bash
gh release create v<NEW_VERSION> \
  --title "v<NEW_VERSION>" \
  --notes "$(cat <<EOF
## What's New in v<NEW_VERSION>

[High-level summary of the release]

### ✨ New Features
- Feature 1
- Feature 2

### 🐛 Bug Fixes
- Fix 1
- Fix 2

### 📚 Documentation
- Doc improvement 1

### 🔧 Maintenance
- Maintenance item 1

## Full Changelog
[Link to full changelog]

**Full Changelog**: https://github.com/DataDog/datadog-api-claude-plugin/compare/<LAST_TAG>...v<NEW_VERSION>
EOF
)"
```

**Alternatively**, if you have the CHANGELOG section prepared:

```bash
# Extract the release notes from CHANGELOG.md
RELEASE_NOTES=$(sed -n '/## \[<NEW_VERSION>\]/,/## \[/p' CHANGELOG.md | sed '$d')

gh release create v<NEW_VERSION> \
  --title "v<NEW_VERSION>" \
  --notes "$RELEASE_NOTES

**Full Changelog**: https://github.com/DataDog/datadog-api-claude-plugin/compare/<LAST_TAG>...v<NEW_VERSION>"
```

## Step 12: Verify Release

Verify the release was created successfully:

```bash
# Check tag exists
git tag | grep v<NEW_VERSION>

# Check GitHub release
gh release view v<NEW_VERSION>
```

## Step 13: Announce Release (Optional)

If applicable, announce the release:
- Update project README with latest version
- Notify team channels
- Update documentation site

## Complete Release Checklist

Use this checklist to ensure all steps are completed:

- [ ] Determine version bump type (patch/minor/major)
- [ ] If major bump, confirm with user
- [ ] Create release branch
- [ ] Update version in plugin.json
- [ ] Sort skills array alphabetically
- [ ] Sort agents array alphabetically
- [ ] Validate plugin.json is valid JSON
- [ ] Update README.md version badge
- [ ] Update README.md agent count
- [ ] Sort agent lists/tables in README.md
- [ ] Update CHANGELOG.md with categorized changes
- [ ] Commit changes
- [ ] Push release branch
- [ ] Create release PR
- [ ] Wait for PR review and approval (HUMAN CHECKPOINT)
- [ ] PR merged to main
- [ ] Pull latest main
- [ ] Create git tag
- [ ] Push tag to remote
- [ ] Create GitHub release with notes
- [ ] Verify tag and release exist
- [ ] Clean up release branch (optional)

## Troubleshooting

### Invalid JSON after editing

If plugin.json fails validation:

```bash
# Use jq to identify the syntax error
cat .claude-plugin/plugin.json | jq .
```

Fix the reported syntax error (missing comma, bracket, quote, etc.)

### Merge Conflicts in Release PR

If the release branch has conflicts:

```bash
git checkout release/v<NEW_VERSION>
git pull origin main
# Resolve conflicts manually
git add .
git commit -m "Resolve merge conflicts"
git push
```

### Tag Already Exists

If the tag already exists:

```bash
# Delete local tag
git tag -d v<NEW_VERSION>

# Delete remote tag (use with caution!)
git push origin --delete v<NEW_VERSION>

# Recreate tag
git tag -a v<NEW_VERSION> -m "Release v<NEW_VERSION>"
git push origin v<NEW_VERSION>
```

### GitHub Release Creation Fails

If `gh release create` fails, create the release manually:

1. Go to https://github.com/DataDog/datadog-api-claude-plugin/releases/new
2. Select the tag: v<NEW_VERSION>
3. Enter release title: v<NEW_VERSION>
4. Paste release notes
5. Click "Publish release"

## Example Release Flow

Here's a complete example for releasing v1.11.0:

```bash
# Step 1: Determine version (assume it's a minor release with new features)
# Current: 1.10.0 → New: 1.11.0

# Step 2: Create release branch
git checkout main
git pull origin main
git checkout -b release/v1.11.0

# Step 3: Update version in plugin.json
# Edit .claude-plugin/plugin.json: "version": "1.11.0"

# Step 4: Sort arrays (if needed) and validate
cat .claude-plugin/plugin.json | jq . > /dev/null && echo "✓ Valid JSON"

# Step 5: Update README.md
# Edit README.md: version badge "1.11.0", update agent count, sort agent lists

# Step 6: Update CHANGELOG.md
# Add new section at top with changes

# Step 7: Commit
git add .claude-plugin/plugin.json README.md CHANGELOG.md
git commit -m "chore: prepare release v1.11.0

- Bump version to 1.11.0
- Sort skills and agents arrays alphabetically
- Update README.md version and agent list
- Update CHANGELOG.md with release notes
"

# Step 8: Push and create PR
git push -u origin release/v1.11.0
gh pr create --title "Release v1.11.0" --body "..."

# Step 9: Wait for human review and merge
# [User merges PR]

# Step 10: Tag the release
git checkout main
git pull origin main
git tag -a v1.11.0 -m "Release v1.11.0"
git push origin v1.11.0

# Step 11: Create GitHub release
gh release create v1.11.0 \
  --title "v1.11.0" \
  --notes "Release notes here..."

# Step 12: Verify
git tag | grep v1.11.0
gh release view v1.11.0
```

## Notes for Agents

If you are an agent orchestrating this release:

1. **Always validate** each step before proceeding
2. **Use exact version numbers** - don't use placeholders
3. **Read before writing** - always read current state before making changes
4. **Confirm major bumps** - never proceed with major version bump without user approval
5. **Wait at checkpoints** - explicit user confirmation required for PR merge
6. **Verify completion** - check that tags and releases were created successfully
7. **Use git commands** - prefer git CLI over file operations for version control
8. **Format CHANGELOG consistently** - follow the established pattern
9. **Be explicit in commits** - clear commit messages with full context
10. **Handle errors gracefully** - if a step fails, report the error and suggest fixes

## Related Documentation

- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [GitHub CLI Manual](https://cli.github.com/manual/)
- [Git Tagging](https://git-scm.com/book/en/v2/Git-Basics-Tagging)
