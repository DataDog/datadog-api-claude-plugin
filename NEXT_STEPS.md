# Next Steps: Simplification & Issue Filing

## Summary

This document outlines the next steps for simplifying the plugin after the pup CLI migration and adding issue filing capabilities.

## ✅ Completed

1. **Created SIMPLIFICATION_PLAN.md** - Comprehensive plan for simplifying the codebase
2. **Created file-issue skill** - New skill to intelligently file GitHub issues to correct repository
3. **Registered new skill** - Updated plugin.json to include file-issue skill

## 🚀 Ready to Implement

### Phase 1: Quick Wins (High Priority)

These can be done immediately for maximum impact:

#### 1. Remove Obsolete Dependencies
```bash
# Remove TypeScript/Jest/ESLint dependencies
rm -rf node_modules/
rm package-lock.json

# Update .gitignore to remove TS-specific entries
# Remove: dist/, *.tsbuild, .tsbuildinfo, coverage/, etc.
```

#### 2. Remove Outdated Documentation
```bash
# Archive or remove ARCHITECTURE.md (completely outdated)
git mv ARCHITECTURE.md ARCHITECTURE_LEGACY.md  # or just remove

# Remove TypeScript example
rm examples/agent-identification.ts
# Consider: remove entire examples/ directory if empty
```

#### 3. Verify/Update LICENSE-3rdparty.csv
- Check what's listed
- Should only have pup and its dependencies
- May be removable entirely

### Phase 2: Documentation Updates (High Priority)

#### Update CLAUDE.md
Focus areas:
1. Remove "TypeScript Implementation" references
2. Update "Multi-Language Support" section
   - Clarify: does code generation still exist with pup?
   - If yes, how does it work?
3. Simplify "Project Structure" section
4. Update "Development" section (no TS build process)

#### Update README.md
Focus areas:
1. Remove TypeScript-specific language
2. Emphasize pup CLI throughout
3. Simplify architecture description
4. Update installation steps

#### Update AGENTS.md
Focus areas:
1. Remove TypeScript/Node.js architecture references
2. Update decision trees for pup CLI approach
3. Verify examples use pup commands

### Phase 3: Agent Consolidation (Medium Priority)

This is a larger effort but offers significant long-term benefits.

#### Step 1: Create Agent Templates
```bash
mkdir -p agents/_templates

# Create template files:
agents/_templates/
├── common-header.md           # Standard agent introduction
├── pup-context.md             # CLI tool, env vars, project location
├── time-formats.md            # Time format documentation
├── permission-model-read.md   # Read operations documentation
├── permission-model-write.md  # Write operations documentation
└── README.md                  # How to use templates
```

#### Step 2: Refactor Agents to Use Templates
- Start with 2-3 agents as proof of concept
- Measure reduction in duplication
- Roll out to remaining agents

Expected results:
- ~30-50% reduction per agent file
- ~15,000 lines removed total
- Easier maintenance

### Phase 4: Test New File-Issue Skill (Immediate)

Try the new skill:

```
User: "File an issue about X"
```

Test cases:
1. **Pup issue**: "The pup logs search command isn't working"
   - Should route to DataDog/pup
2. **Plugin issue**: "The logs agent documentation is wrong"
   - Should route to DataDog/datadog-api-claude-plugin
3. **Ambiguous**: "Something is broken"
   - Should ask clarifying questions

## 📋 Decision Points

### Question 1: Code Generation
**Does the plugin still generate code with pup CLI?**

- If YES: Update docs to explain how it works
- If NO: Remove all code generation references from docs

**Current state**:
- `skills/code-generation/SKILL.md` exists
- README mentions "Code generation: Can generate Python, TypeScript, Java, Go, or Rust code"
- Need to clarify if this still applies

### Question 2: Agent Consolidation Strategy
**Which approach for reducing agent duplication?**

Options:
1. **Template-based** (recommended): Extract common sections to template files
2. **Macro/include system**: Use markdown includes
3. **Consolidate agents**: Merge similar agents (e.g., cloud integrations)

Recommendation: Start with template-based approach (Option 1)

### Question 3: Examples Directory
**What to do with examples/?**

- Currently has one TypeScript file: `agent-identification.ts`
- Options:
  1. Remove entire directory
  2. Add new pup-based examples
  3. Keep directory for future examples

Recommendation: Remove if no plans for examples, or add pup examples

## 🎯 Priorities

### Do First (This Week)
1. ✅ Test file-issue skill
2. Remove node_modules and obsolete files
3. Update/remove ARCHITECTURE.md
4. Quick documentation pass (remove TS references)

### Do Soon (Next Week)
1. Comprehensive documentation update (CLAUDE.md, README.md, AGENTS.md)
2. Verify/update LICENSE-3rdparty.csv
3. Update .gitignore

### Do Later (Next Sprint)
1. Create agent templates
2. Refactor agents to use templates
3. Create pup CLI troubleshooting docs
4. Add more examples

## 📊 Expected Impact

### Repository Size
- Before: ~34K lines in agents + build artifacts + dependencies
- After: ~19K lines in agents + no build artifacts + no dependencies
- **Reduction: ~45-55%**

### Maintenance Burden
- Before: Maintain 46 agents with high duplication
- After: Maintain templates + 46 focused agents
- **Reduction: ~30-40% in update effort**

### Developer Experience
- Before: Need TypeScript knowledge to contribute
- After: Just markdown and pup CLI knowledge
- **Onboarding time: from 1-2 days to 1-2 hours**

## 🔗 Related Documents

- [SIMPLIFICATION_PLAN.md](./SIMPLIFICATION_PLAN.md) - Detailed simplification plan
- [skills/file-issue/SKILL.md](./skills/file-issue/SKILL.md) - New issue filing skill
- [CLAUDE.md](./CLAUDE.md) - Main plugin instructions
- [AGENTS.md](./AGENTS.md) - Agent selection guide

## 📝 Notes

### Why This Matters

The pup CLI migration was a great architectural decision:
- ✅ Single binary, fast execution
- ✅ OAuth2 authentication built-in
- ✅ Official Datadog API client under the hood
- ✅ Multi-format output (JSON, YAML, table)

But we're still carrying TypeScript baggage:
- ❌ Empty node_modules folders
- ❌ Outdated architecture docs
- ❌ TypeScript examples
- ❌ Documentation references TS implementation

Time to finish the migration and reap the full benefits! 🎉

### Key Insight: Agent Duplication

The 46 agents are well-organized and domain-focused (good!), but they share a LOT of boilerplate:
- Same env var documentation (46 times)
- Same time format documentation (30+ times)
- Same project location (46 times)
- Same permission model patterns

This is maintenance burden and opportunity for inconsistency.

**Solution**: Templates let us maintain the 46-agent structure (good for selection) while eliminating duplication (good for maintenance).

## 🚦 Status

- [x] Analysis complete
- [x] Plans documented
- [x] File-issue skill created
- [ ] Quick wins implemented
- [ ] Documentation updated
- [ ] Agent templates created
- [ ] Agents refactored

**Last Updated**: 2026-02-10
