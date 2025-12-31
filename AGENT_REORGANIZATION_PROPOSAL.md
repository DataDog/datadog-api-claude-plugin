# Agent Reorganization Proposal

**Date**: 2025-12-31
**Issue**: dd-9fm
**Current Agent Count**: 49
**Proposed Agent Count**: ~35-40
**Expected Impact**: Significant improvement in user experience and reduced decision paralysis

## Executive Summary

An audit of the 49 agents in this plugin revealed 8 major overlap groups with 21 agents having potential consolidation opportunities. This proposal outlines a phased approach to consolidate redundant agents while maintaining feature coverage and improving clarity.

## Analysis Methodology

All 49 agent files were systematically reviewed for:
- Main purpose and scope (from frontmatter descriptions)
- Key Datadog features/APIs covered
- Overlapping functionality with other agents
- Potential consolidation opportunities

## Key Findings

### Major Overlap Groups Identified

1. **User & Organization Management** (4 agents) - HIGH overlap
2. **Security Monitoring & Threats** (5 agents) - HIGH overlap
3. **Log Management Configuration** (3 agents) - MEDIUM-HIGH overlap
4. **APM & Traces Configuration** (2 agents) - MEDIUM overlap
5. **Infrastructure & Container Monitoring** (2 agents) - MEDIUM overlap
6. **Data Management & Protection** (3 agents) - MEDIUM-HIGH overlap
7. **Monitoring & Alerting Core** (4 agents) - MEDIUM overlap
8. **On-Call & Incident Management** (3 agents) - MEDIUM overlap

---

## Detailed Consolidation Recommendations

### Priority 1: High-Value Consolidations (Immediate)

#### 1.1 User & Access Management Consolidation
**Current Agents:**
- `admin.md` - Organization administration and user management
- `user-management.md` - User accounts, roles, invitations, SAML
- `teams.md` - Team creation and membership

**Proposed Solution:**
- **MERGE** into single agent: `user-access-management.md`
- **Rationale**: All three cover user/org administration with significant overlap
- **Scope**: User accounts, roles, teams, API keys, SAML, invitations
- **Keep Separate**: `organization-management.md` (focuses on multi-org hierarchies and org-level settings)

**Impact**: 4 agents → 2 agents (50% reduction in user/org domain)

#### 1.2 Infrastructure Monitoring Review
**Current Agents:**
- `infrastructure.md` - Hosts, containers, processes monitoring (broad)
- `container-monitoring.md` - Container-specific monitoring (narrow)

**Proposed Solution:**
- **INVESTIGATE**: Review `container-monitoring.md` for unique value beyond `infrastructure.md`
- **Option A**: If significant unique content exists, keep both with clear differentiation
- **Option B**: If mostly redundant, merge into `infrastructure.md` with enhanced container section

**Impact**: Potentially 2 agents → 1 agent

#### 1.3 Monitoring & Alerting Consolidation
**Current Agents:**
- `monitors.md` - Create/manage monitors for alerting
- `monitor-templates.md` - Reusable monitor templates
- `notification-rules.md` - Notification routing rules
- `downtimes.md` - Scheduled downtime management

**Proposed Solution:**
- **MERGE** into single comprehensive agent: `monitoring-alerting.md`
- **Rationale**: All four cover the monitoring/alerting lifecycle
- **Sections**:
  - Monitor creation and management
  - Monitor templates for reuse
  - Notification routing and rules
  - Downtime scheduling

**Impact**: 4 agents → 1 agent (75% reduction in monitoring domain)

---

### Priority 2: Medium-Value Consolidations (Next Phase)

#### 2.1 Incident Response Consolidation
**Current Agents:**
- `incidents.md` - Incident management and response
- `on-call.md` - On-call scheduling and paging
- `cases.md` - Case management for tracking issues

**Proposed Solution:**
- **MERGE** into single agent: `incident-response.md`
- **Rationale**: All three are part of the incident response workflow
- **Sections**:
  - Incident declaration and management
  - On-call scheduling and rotation
  - Case tracking and follow-up

**Impact**: 3 agents → 1 agent

#### 2.2 Security Agent Organization
**Current Agents:**
- `security.md` - Security monitoring, signals, rules
- `application-security.md` - ASM (application-layer threats)
- `cloud-workload-security.md` - CWS (runtime threat detection)
- `security-posture-management.md` - CSPM (cloud misconfigurations)
- `static-analysis.md` - Code-level vulnerabilities

**Proposed Solution:**
**Option A - Routing Agent** (Recommended):
- Create `security-overview.md` that routes users to specialized agents
- Keep all 5 agents due to distinct security domains
- Add clear "When to Use" guidance in security-overview.md

**Option B - Partial Consolidation**:
- Merge `security.md` + `application-security.md` (both cover signals/rules)
- Keep other three separate

**Impact**: Option A: 5 agents + 1 router; Option B: 5 agents → 4 agents

#### 2.3 Data Privacy & Access Control
**Current Agents:**
- `data-management.md` - Datasets, reference tables, sensitive data scanner
- `data-deletion.md` - GDPR data deletion requests
- `restriction-policies.md` - IP/domain allowlists, resource restrictions, logs RBAC

**Proposed Solution:**
- **MERGE** into comprehensive agent: `data-privacy-governance.md`
- **Rationale**: All three cover data access control and privacy
- **Alternative**: Keep `data-deletion.md` separate due to compliance criticality
- **Note**: Move logs RBAC from `restriction-policies.md` to `log-configuration.md`

**Impact**: 3 agents → 1-2 agents

---

### Priority 3: Documentation & Clarification

#### 3.1 Data vs Configuration Agents
**Agent Pairs with Overlap:**
- `logs.md` (data access) vs `log-configuration.md` (infrastructure config)
- `traces.md` (data access) vs `apm-configuration.md` (infrastructure config)

**Proposed Solution:**
- **KEEP SEPARATE** - Clear separation of concerns
- **ACTION**: Add explicit documentation explaining:
  - Use data agents (logs.md, traces.md) for querying and analyzing observability data
  - Use config agents (log-configuration.md, apm-configuration.md) for setting up infrastructure

**Impact**: No consolidation, improved clarity through documentation

#### 3.2 Observability Pipelines Clarification
**Potential Overlap:**
- `observability-pipelines.md` - Data collection, processing, routing (broad)
- `log-configuration.md` - Log pipelines and processing (specific)

**Proposed Solution:**
- **INVESTIGATE**: Determine if observability-pipelines.md supersedes log pipelines
- **ACTION**: Document relationship and when to use each
- **Possible Outcome**: Log pipelines might be deprecated in favor of Observability Pipelines

**Impact**: Clarification, potential future consolidation

---

## Agents with No Overlaps (Keep As-Is)

The following 20 agents cover unique domains with no significant overlaps:

1. `metrics.md` - Metrics query and submission
2. `dashboards.md` - Dashboard creation and visualization
3. `slos.md` - Service Level Objectives
4. `synthetics.md` - Synthetic monitoring tests
5. `rum.md` - Real User Monitoring
6. `error-tracking.md` - Error tracking and aggregation
7. `events.md` - Event submission and queries
8. `cicd.md` - CI/CD Visibility
9. `workflows.md` - Workflow automation
10. `service-catalog.md` - Service ownership and dependencies
11. `notebooks.md` - Collaborative investigation notebooks
12. `scorecards.md` - Service scorecards for best practices
13. `database-monitoring.md` - Database performance monitoring
14. `powerpacks.md` - Reusable dashboard widgets
15. `fleet-automation.md` - Fleet management automation
16. `app-builder.md` - Custom app building
17. `rum-metrics-retention.md` - RUM data retention configuration
18. `api-management.md` - API catalog and management
19. `audit-logs.md` - Audit trail and compliance logging
20. `agentless-scanning.md` - Cloud security scanning without agents

**Recommendation**: No changes needed for these agents.

---

## Phased Implementation Plan

### Phase 1: Quick Wins (Week 1)
- [ ] Consolidate user/access management (admin + user-management + teams)
- [ ] Review and decide on infrastructure vs container-monitoring
- [ ] Consolidate monitoring & alerting (4 agents → 1)

**Expected Reduction**: 49 → 44-45 agents

### Phase 2: Medium Consolidations (Week 2)
- [ ] Consolidate incident response (incidents + on-call + cases)
- [ ] Decide on security agent strategy (routing vs consolidation)
- [ ] Consolidate data privacy & governance

**Expected Reduction**: 44-45 → 40-42 agents

### Phase 3: Documentation & Polish (Week 3)
- [ ] Document data vs config agent relationships
- [ ] Clarify observability pipelines scope
- [ ] Update AGENTS.md with new structure
- [ ] Create agent selection guide for users

**Expected Reduction**: Final count 38-42 agents

---

## Benefits

### For Users
- **Reduced Decision Paralysis**: Fewer agents means easier selection
- **Clearer Boundaries**: Better-defined agent responsibilities
- **Improved Discoverability**: Related functionality grouped together
- **Better User Experience**: Less confusion about which agent to use

### For Maintainers
- **Easier Maintenance**: Fewer files to update when APIs change
- **Reduced Duplication**: Single source of truth for related features
- **Better Testing**: Consolidated agents are easier to test comprehensively
- **Clearer Architecture**: More logical organization

---

## Risks & Mitigations

### Risk 1: Loss of Specialized Context
**Mitigation**: Keep very specialized agents (e.g., security domains) separate if they serve distinct use cases

### Risk 2: Over-Consolidation Creates "Mega-Agents"
**Mitigation**: Only merge agents with clear overlap; maintain logical boundaries

### Risk 3: User Confusion During Transition
**Mitigation**: Document changes clearly, consider deprecation warnings if agents are renamed

---

## Success Metrics

- Agent count reduction: 49 → 38-42 (20-25% reduction)
- User feedback: Improved ease of agent selection
- Maintenance burden: Reduced time to update agents when APIs change
- Test coverage: Maintained or improved after consolidation

---

## Next Steps

1. **Decision Required**: Approve phased consolidation plan
2. **Create Issues**: File individual issues for each consolidation task
3. **Implementation**: Execute Phase 1 consolidations
4. **Testing**: Validate consolidated agents work correctly
5. **Documentation**: Update all references and guides
6. **Release**: Version bump with clear changelog

---

## Appendix: Detailed Agent Matrix

| Current Agent | Size | Overlap Group | Consolidation Action | Target Agent |
|---------------|------|---------------|---------------------|--------------|
| admin.md | 10KB | User Mgmt | MERGE | user-access-management.md |
| user-management.md | 28KB | User Mgmt | MERGE | user-access-management.md |
| teams.md | 19KB | User Mgmt | MERGE | user-access-management.md |
| organization-management.md | 27KB | User Mgmt | KEEP SEPARATE | organization-management.md |
| monitors.md | 8KB | Monitoring | MERGE | monitoring-alerting.md |
| monitor-templates.md | 24KB | Monitoring | MERGE | monitoring-alerting.md |
| notification-rules.md | 30KB | Monitoring | MERGE | monitoring-alerting.md |
| downtimes.md | 12KB | Monitoring | MERGE | monitoring-alerting.md |
| incidents.md | 8KB | Incident Response | MERGE | incident-response.md |
| on-call.md | 22KB | Incident Response | MERGE | incident-response.md |
| cases.md | 9KB | Incident Response | MERGE | incident-response.md |
| infrastructure.md | 9KB | Infrastructure | REVIEW | TBD |
| container-monitoring.md | 19KB | Infrastructure | REVIEW | TBD |
| security.md | 11KB | Security | DECISION NEEDED | TBD |
| application-security.md | 22KB | Security | DECISION NEEDED | TBD |
| cloud-workload-security.md | 25KB | Security | DECISION NEEDED | TBD |
| security-posture-management.md | 33KB | Security | DECISION NEEDED | TBD |
| static-analysis.md | 21KB | Security | DECISION NEEDED | TBD |
| data-management.md | 49KB | Data Privacy | MERGE | data-privacy-governance.md |
| data-deletion.md | 36KB | Data Privacy | MERGE OR KEEP | data-privacy-governance.md |
| restriction-policies.md | 34KB | Data Privacy | MERGE | data-privacy-governance.md |
| logs.md | 6KB | None | KEEP | logs.md |
| log-configuration.md | 35KB | None | KEEP | log-configuration.md |
| traces.md | 7KB | None | KEEP | traces.md |
| apm-configuration.md | 23KB | None | KEEP | apm-configuration.md |

---

**End of Proposal**
