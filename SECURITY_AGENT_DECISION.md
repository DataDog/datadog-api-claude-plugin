# Security Agent Organization Decision

**Date**: 2025-12-31
**Issue**: dd-od7
**Decision**: Option C - Keep all security agents separate (rejecting both Option A and Option B)

## Executive Summary

After analyzing the security agent structure and codebase patterns, I recommend **keeping all three security agents separate** rather than creating a routing agent (Option A) or merging security.md + application-security.md (Option B). This decision aligns with established codebase patterns and the distinct nature of Datadog's security products.

## Current Security Agents

1. **security.md** (11KB) - Security Monitoring API for general threat detection
   - Security signals and rules
   - Cloud SIEM functionality
   - General security monitoring

2. **application-security.md** (22KB) - Application Security Management (ASM)
   - WAF rules and exclusion filters
   - Application-layer threat detection
   - OWASP Top 10 coverage
   - API-specific attacks

3. **security-posture-management.md** (33KB) - CSPM, Vulnerability Management, SBOM
   - Cloud misconfigurations
   - Vulnerability scanning (IAST, SCA, SAST, Infra)
   - Software Bill of Materials
   - CSM coverage analysis

## Analysis of Proposed Options

### Option A: Create security-overview.md Routing Agent

**Rationale from proposal**: Keep all agents due to distinct security domains with a routing agent for guidance.

**Arguments Against**:
1. **No routing agents exist in the codebase** - Violates established pattern
2. **Adds unnecessary indirection** - Users must navigate through routing agent
3. **Not the consolidation pattern** - Recent consolidations (monitoring-alerting, incident-response, user-access-management) merged agents directly, they didn't create routers
4. **Security users know their products** - Users working with ASM know they need ASM, users working with CSPM know they need CSPM
5. **Extra maintenance burden** - Routing agent must be updated when security agents change

**Verdict**: ❌ Reject - Violates codebase patterns and adds unnecessary complexity

### Option B: Merge security.md + application-security.md

**Rationale from proposal**: Both cover signals/rules using Security Monitoring API.

**Arguments Against**:
1. **Different Datadog products**: Security Monitoring (Cloud SIEM) vs Application Security Management are distinct product offerings
2. **Different APIs beyond signals**:
   - application-security.md uses Application Security API for WAF rules/exclusions
   - security.md focuses purely on Security Monitoring API
3. **Different use cases**:
   - security.md: Infrastructure and cloud security threats
   - application-security.md: Application-layer attacks (SQL injection, XSS, SSRF)
4. **Size concern**: Would create 33KB agent (11KB + 22KB)
5. **Specialization value**: application-security.md has extensive OWASP coverage, WAF management, and ASM-specific content that would clutter a general security agent
6. **Query overlap is minimal**: Yes, both query signals, but application-security.md always filters by `source:asm` making it a specialized subset

**Arguments For**:
1. Both query security signals
2. Both use Security Monitoring API (partially)
3. Would reduce agent count by 1

**Verdict**: ❌ Reject - Merges distinct products with different APIs and use cases

## Recommended Option C: Keep All Security Agents Separate

### Rationale

**1. Aligns with Successful Consolidation Pattern**

Recent successful consolidations merged agents that were part of the same **workflow or lifecycle**:

- **monitoring-alerting.md**: Merged monitors, templates, notification-rules, downtimes - all part of the alerting lifecycle
- **incident-response.md**: Merged incidents, on-call, cases - all part of incident management workflow
- **user-access-management.md**: Merged admin, user-management, teams - all managing the same user/access resources

The security agents do **NOT** fit this pattern:
- They are **parallel products**, not sequential workflow steps
- Each serves a **distinct security domain** (signals vs application vs posture)
- They target **different threat vectors** and use different APIs

**2. Security Products Are Distinct**

| Agent | Datadog Product | Primary API | Key Use Case |
|-------|----------------|-------------|--------------|
| security.md | Cloud SIEM | Security Monitoring API | Detect infrastructure threats |
| application-security.md | ASM | Application Security API + Security Monitoring API | Protect applications from OWASP attacks |
| security-posture-management.md | CSPM + VM | Posture Management API + Vulnerabilities API | Find misconfigurations and vulnerabilities |

These are three separate product lines within Datadog's security portfolio.

**3. No Routing Agents Exist**

The codebase contains **0 routing agents**. All 41 agents are direct-action agents. Creating a routing agent would establish a new pattern without clear benefit.

**4. Agent Sizes Support Separation**

- security.md: 11KB (small, focused)
- application-security.md: 22KB (medium, comprehensive ASM coverage)
- security-posture-management.md: 33KB (large, covers multiple security products)

These sizes indicate each agent has substantial unique content warranting separate files.

**5. Clear Differentiation in Descriptions**

The frontmatter descriptions clearly differentiate:
- security.md: "Query security monitoring signals and manage security rules"
- application-security.md: "Manage Application Security Management (ASM) including WAF rules, threat detection, API protection"
- security-posture-management.md: "Manage Cloud Security Posture Management (CSPM), vulnerability management, security findings, SBOM analysis"

Users can easily select the right agent based on these descriptions.

### Benefits of Keeping Separate

**For Users**:
- Direct access to specialized security capabilities
- Clear, focused agent for each security product
- No extra navigation through routing agent
- Descriptions immediately clarify which agent to use

**For Maintainers**:
- Each agent independently tracks its Datadog product
- API changes affect only the relevant agent
- Easier to maintain focused, specialized content
- No routing logic to keep in sync

**For the Plugin**:
- Maintains consistent pattern (no routing agents)
- Avoids creating over-large agents
- Preserves specialization benefits
- Reduces merge conflicts from consolidation

## Alternative Considered: Improve Descriptions

If discoverability is a concern, we could enhance the agent descriptions to better guide users:

**security.md**:
```yaml
description: Query security monitoring signals and manage security rules for Cloud SIEM. For application-layer threats, see application-security.md. For vulnerabilities and misconfigurations, see security-posture-management.md.
```

**application-security.md**:
```yaml
description: Manage Application Security Management (ASM) including WAF rules, threat detection, API protection, and application-level security monitoring. For infrastructure security signals, see security.md.
```

**security-posture-management.md**:
```yaml
description: Manage Cloud Security Posture Management (CSPM), vulnerability management, security findings, SBOM analysis, and CSM coverage monitoring. For runtime threat detection, see security.md and application-security.md.
```

## Decision

**Reject both Option A and Option B. Keep all three security agents separate.**

This decision:
- ✅ Maintains consistency with codebase patterns (no routing agents)
- ✅ Respects the distinct nature of Datadog's security products
- ✅ Preserves focused, maintainable agents
- ✅ Provides users with direct access to specialized capabilities
- ✅ Avoids creating unnecessarily large agents

## Implementation

1. Keep agents as-is: security.md, application-security.md, security-posture-management.md
2. Optionally enhance descriptions to cross-reference related security agents
3. Update AGENT_REORGANIZATION_PROPOSAL.md to reflect this decision
4. Close dd-od7 with documented rationale

## Impact

- **Agent Count**: No change (maintains 3 security agents)
- **User Experience**: Direct access to specialized security capabilities
- **Maintenance**: Each agent remains independently maintainable
- **Pattern Consistency**: Avoids introducing routing agent pattern

---

**Conclusion**: The security agents should remain separate because they represent distinct Datadog products with different APIs, use cases, and threat vectors. This aligns with the successful consolidation pattern where agents are merged only when they're part of the same workflow or manage the same resources.
