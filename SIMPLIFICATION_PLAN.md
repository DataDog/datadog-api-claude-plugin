# Simplification Plan for Pup CLI Migration

## Overview
Now that the plugin uses `pup` CLI instead of TypeScript, we can significantly simplify the codebase.

## Phase 1: Remove Obsolete Code & Dependencies ✅ HIGH PRIORITY

### Files to Remove
- [ ] `node_modules/` - All TypeScript/Jest/ESLint dependencies (21 folders)
- [ ] `ARCHITECTURE.md` - Describes outdated TypeScript architecture
- [ ] `examples/agent-identification.ts` - TypeScript example no longer relevant
- [ ] `package-lock.json` - No dependencies = no lock file needed
- [ ] `.gitignore` entries for TypeScript build artifacts (dist/, *.tsbuild, etc.)

### Files to Update
- [ ] `package.json` - ✅ Already minimal, just metadata
- [ ] `LICENSE-3rdparty.csv` - Verify contents, may only need pup
- [ ] `.gitignore` - Remove TypeScript-specific entries

**Expected Impact**: ~90% reduction in repository size, cleaner structure

## Phase 2: Documentation Modernization ✅ HIGH PRIORITY

### CLAUDE.md Updates
- [ ] Remove references to "TypeScript implementation"
- [ ] Clarify what code generation still exists (if any)
- [ ] Update "Multi-Language Support" section - does this still apply with pup?
- [ ] Simplify "Development" section - no TypeScript build process
- [ ] Update project structure diagram to reflect current state

### README.md Updates
- [ ] Remove TypeScript-specific language
- [ ] Emphasize pup CLI as the primary tool
- [ ] Update installation instructions
- [ ] Simplify "How It Works" section

### AGENTS.md Updates
- [ ] Remove references to TypeScript/Node.js architecture
- [ ] Update decision trees and workflows for pup CLI approach
- [ ] Simplify agent selection guide

**Expected Impact**: Clearer documentation, easier onboarding

## Phase 3: Agent File Consolidation 🔄 MEDIUM PRIORITY

### Current State
- 46 agent files
- ~33,897 total lines
- ~735 lines per agent average
- High redundancy in boilerplate sections

### Consolidation Opportunities

#### Option A: Template-Based Approach
Extract common sections into templates that agents inherit/reference:

1. **Create `agents/_templates/`**:
   - `common-header.md` - Standard agent header
   - `pup-context.md` - CLI tool context, env vars
   - `time-formats.md` - Time format documentation
   - `permission-model-read.md` - Read-only operations
   - `permission-model-write.md` - Write operations with confirmation

2. **Simplify agents** to just:
   - Frontmatter (description, metadata)
   - Domain-specific capabilities
   - Pup commands for this domain
   - Domain-specific examples

**Estimated reduction**: 30-50% per agent file

#### Option B: Macro/Include System
Use markdown includes or templating to reference common content:

```markdown
---
description: Search and analyze Datadog logs
---

# Logs Agent

{{include: common-header}}

## Your Capabilities
- Search logs with flexible queries
- Filter by tags and attributes
...

{{include: pup-context}}
{{include: time-formats}}
{{include: permission-model-read}}
```

#### Option C: Consolidate Similar Agents
Some agents could potentially be merged:

**Candidates for merging**:
- `aws-integration.md` + `gcp-integration.md` + `azure-integration.md` → `cloud-integrations.md` with provider-specific sections
- `application-security.md` + `cloud-workload-security.md` → `runtime-security.md`
- Consider carefully - domain separation has benefits

**Trade-offs**:
- ✅ Fewer agents to maintain
- ✅ Less duplication
- ❌ Potentially less focused agents
- ❌ Harder for Claude to select right agent

### Recommended Approach: Template-Based (Option A)

**Benefits**:
- Maintains 46 specialized agents (good for selection)
- Reduces duplication significantly
- Easier to maintain consistent documentation
- Updates to common sections propagate automatically

**Implementation**:
1. Create `agents/_templates/` directory
2. Extract common content into template files
3. Update each agent to reference templates
4. Add documentation on template system

**Expected Impact**:
- ~15,000 lines removed from agent files
- Easier maintenance and consistency
- Cleaner agent-specific content

## Phase 4: Skills & Commands Review 🔍 LOW PRIORITY

### Current Skills
- `skills/code-generation/SKILL.md` - Does this still work with pup CLI?

### Potential New Skills
- [ ] GitHub issue filing skill (see separate plan)
- [ ] Pup CLI troubleshooting skill
- [ ] Agent selection helper skill

## Phase 5: Repository Cleanup 🧹 LOW PRIORITY

### GitHub Actions / CI
- [ ] Review `.github/workflows/` - any TypeScript build steps?
- [ ] Update CI to reflect pup-based architecture

### Developer Experience
- [ ] Update `CONTRIBUTING.md` - no TypeScript knowledge needed
- [ ] Simplify development setup instructions
- [ ] Update `RELEASING.md` process

## Implementation Priority

1. **Phase 1** (Do First): Remove obsolete code - immediate wins
2. **Phase 2** (Do Second): Documentation updates - clarity for users
3. **Phase 3** (Do Third): Agent consolidation - long-term maintenance
4. **Phase 4** (Do Fourth): Skills review - enhances functionality
5. **Phase 5** (Do Last): Repository cleanup - polish

## Success Metrics

- [ ] Repository size reduced by >80%
- [ ] Documentation references pup CLI consistently
- [ ] No references to TypeScript/Node.js execution
- [ ] Agent files 30-50% smaller
- [ ] Contributing guide doesn't require TS knowledge
- [ ] New contributors can understand architecture in <10 minutes
