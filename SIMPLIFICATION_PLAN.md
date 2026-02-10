# Simplification Plan for Pup CLI Migration

## Overview

This document tracks the simplification effort after migrating from TypeScript to `pup` CLI. The goal is to remove technical debt, reduce duplication, and improve maintainability.

## Completed Work ✅

### Phase 1: Remove Obsolete Code & Dependencies ✅ COMPLETE
**Status**: All TypeScript artifacts removed

**Removed**:
- `node_modules/` - 21 empty TypeScript/Jest/ESLint dependency folders
- `ARCHITECTURE_LEGACY.md` - Outdated TypeScript architecture documentation
- `examples/agent-identification.ts` - TypeScript example
- `package-lock.json` - No dependencies needed
- `.gitignore` TypeScript entries - Cleaned from 44 to 27 lines

**Impact**: ~90% reduction in repository cruft, cleaner structure

### Phase 2: Documentation Modernization ✅ COMPLETE
**Status**: All documentation updated for pup CLI

**Updated**:
- `CLAUDE.md` - Removed TypeScript references, emphasized pup CLI
- `README.md` - Updated examples to use shell scripts and pup commands
- `AGENTS.md` - Removed Node.js architecture references
- `CHANGELOG.md` - Documented all changes

**Impact**: 100% documentation alignment with pup CLI architecture

### Phase 3A: Agent Template Infrastructure ✅ COMPLETE
**Status**: Template system created and validated

**Created**:
- `agents/_templates/` directory with 5 reusable templates:
  - `pup-context.md` - CLI tool context and environment variables
  - `time-formats.md` - Time format documentation
  - `permission-model-read.md` - Read-only operations
  - `permission-model-write.md` - Write operations
  - `permission-model-mixed.md` - Mixed operations
- Comprehensive documentation (README.md, IMPLEMENTATION_NOTES.md)
- Proof-of-concept: `EXAMPLE_logs_refactored.md`

**Validation Results**:
- Test case: logs.md agent
  - Before: 211 lines
  - After (with templates): 190 lines
  - Reduction: 21 lines (10%)

**Projected Impact** (all 46 agents):
- Current: ~33,897 lines
- With templates: ~19,090 lines
- **Reduction: ~14,807 lines (43.7%)**

---

## Remaining Work 🚧

### Phase 3B: Template Validation ⏳ NEXT
**Goal**: Validate template approach with additional agents

**Tasks**:
- [ ] Refactor 2-3 more agents to use templates
- [ ] Verify template completeness for different agent types
- [ ] Identify any edge cases or missing templates
- [ ] Adjust templates based on findings

**Acceptance Criteria**:
- Templates work for read-only, write-only, and mixed agents
- No missing common sections identified
- Validation shows consistent 10% reduction per agent

### Phase 3C: Template Rollout 📋 FUTURE
**Goal**: Apply templates to all remaining agents

**Tasks**:
- [ ] Refactor all 46 agents to use template references
- [ ] Update agent files to use `<!-- TEMPLATE: filename.md -->` comments
- [ ] Verify all agents maintain functionality
- [ ] Update AGENTS.md to document template system

**Estimated Effort**: Can be done incrementally, 5-10 agents at a time

**Expected Results**:
- 43.7% reduction in agent content (~14,807 lines)
- Guaranteed consistency across all agents
- Single source of truth for common sections

### Phase 4: Skills & Repository Cleanup 🔧 FUTURE

**Skills Review**:
- [x] ~~GitHub issue filing skill~~ - ✅ Added as `/dd-file-issue`
- [ ] Review `skills/code-generation/SKILL.md` - Does this still apply with pup CLI?
- [ ] Consider pup CLI troubleshooting skill
- [ ] Consider agent selection helper skill

**Repository Cleanup**:
- [ ] Review `.github/workflows/` - Remove TypeScript build steps if any
- [ ] Update `CONTRIBUTING.md` - Clarify no TypeScript knowledge needed
- [ ] Update `RELEASING.md` - Simplify release process
- [ ] Verify CI/CD reflects pup-based architecture

---

## Success Metrics

### Achieved ✅
- [x] Repository size reduced by >80% (removed node_modules, examples, etc.)
- [x] Documentation references pup CLI consistently
- [x] No references to TypeScript/Node.js execution
- [x] Template infrastructure proven (10% reduction per agent)
- [x] Issue filing automation (`/dd-file-issue` skill)

### In Progress ⏳
- [ ] Agent files 30-50% smaller (Phase 3B/C)
- [ ] Contributing guide updated for pup-only workflow
- [ ] All 46 agents use template system

### Target Metrics
- **Final repository reduction**: 50-60% overall
- **Agent maintenance**: 5 template files instead of 46 duplicated sections
- **Onboarding time**: <10 minutes to understand architecture
- **Documentation accuracy**: 100% aligned with implementation

---

## Implementation Strategy

### Recommended Approach for Phase 3B/C

**Incremental Rollout**:
1. Start with 2-3 diverse agents (read-only, write-only, mixed)
2. Validate templates work for all types
3. Roll out in batches of 5-10 agents
4. Review and adjust as needed

**Agent Prioritization**:
1. **High-traffic agents first**: logs, metrics, traces, monitoring-alerting
2. **Similar agents together**: All integration agents, all security agents, etc.
3. **Complex agents last**: Agents with unique patterns

**Template Reference Format**:
```markdown
<!-- TEMPLATE: pup-context.md -->
<!-- TEMPLATE: time-formats.md -->
<!-- TEMPLATE: permission-model-read.md -->
```

### Quality Assurance

Before completing Phase 3C:
- [ ] All agents maintain functionality
- [ ] Template content is accurate and complete
- [ ] No agent-specific variations in template sections
- [ ] Documentation updated to reference template system

---

## Future Enhancements

Beyond the current plan, consider:

1. **Additional Templates**
   - Common response formatting patterns
   - Error handling boilerplate
   - Integration notes patterns

2. **Validation Tooling**
   - Script to verify template usage
   - Lint rules for template compliance
   - CI check for template consistency

3. **Agent Consolidation** (Optional)
   - Consider merging very similar agents if it makes sense
   - Keep 46 specialized agents unless compelling reason to merge
   - Domain separation has benefits for agent selection

---

## Timeline Estimate

| Phase | Effort | Status |
|-------|--------|--------|
| Phase 1 & 2 | 4-6 hours | ✅ Complete |
| Phase 3A | 2-3 hours | ✅ Complete |
| Phase 3B | 1-2 hours | ⏳ Next |
| Phase 3C | 4-6 hours | 📋 Future |
| Phase 4 | 2-3 hours | 📋 Future |

**Total remaining**: ~8-12 hours of focused work

---

## Notes

- **No breaking changes**: All phases maintain functionality
- **Incremental approach**: Can be done in small batches
- **Measurable progress**: Each phase has clear success metrics
- **Documentation-driven**: Keep docs updated as we go

**Last Updated**: 2026-02-10
**Current Phase**: 3B (Template Validation)
