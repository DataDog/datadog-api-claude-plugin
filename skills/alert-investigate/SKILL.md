---
name: alert-investigate
description: Orchestrate multi-agent alert investigation - chains SRE triage, DBA analysis, and implementation review with parallel execution and structured handoffs
user-invokable: true
---

# Alert Investigation Orchestrator

This skill orchestrates a multi-agent alert investigation by chaining SRE triage, DBA analysis, and implementation review with parallel execution and structured data handoffs.

**Invocation**: `/alert-investigate <monitor-name-or-id> [time-range]`

## When to Use

- An alert fires and you need a comprehensive, automated investigation
- You want to chain sre-triage → dba → implementation-review without manual handoffs
- You need parallel data collection for faster incident response

## Overview

```
┌─────────────────────────────────────────────────────┐
│                 /alert-investigate                    │
│                                                      │
│  Phase 1: Classification                             │
│    └─ Determine alert_type from monitor name         │
│                                                      │
│  Phase 2: SRE Triage (parallel data collection)      │
│    ├─ Task A: Metrics (ALB, ECS, RDS)                │
│    ├─ Task B: APM (stats, trace metrics)             │
│    ├─ Task C: Logs (errors, warnings)                │
│    └─ Task D: Codebase search (if operation known)   │
│                                                      │
│  Phase 3: Decision Logic                             │
│    └─ Determine which specialized agents to invoke   │
│                                                      │
│  Phase 4: Specialized Agents (parallel where possible)│
│    ├─ DBA Agent (database deep dive)                 │
│    └─ Implementation Review (code analysis)          │
│                                                      │
│  Phase 5: Report Generation                          │
│    └─ /investigate-report                            │
└─────────────────────────────────────────────────────┘
```

## Phase 1: Alert Classification

Classify the alert to determine the investigation strategy. Extract the alert type from the monitor name:

| Condition (monitor name contains) | alert_type | Investigation bias |
|---|---|---|
| `TargetResponseTime`, `latency`, `duration`, `p99`, `p95` | `latency` | DB-heavy |
| `CPU`, `Memory`, `mem`, `OOM` | `cpu_memory` | Infrastructure-heavy |
| `5xx`, `error`, `HTTPCode`, `Error` | `error_rate` | Code-heavy |
| Anything else | `other` | Balanced |

### Get Monitor Details

```bash
# If monitor ID is provided
pup monitors get <monitor-id> --output=json

# If monitor name is provided, search for it
pup monitors search --query="<monitor-name>" --output=json
```

Extract from the monitor:
- `monitor_id`: The monitor ID
- `monitor_name`: Full monitor name
- `alert_type`: Classification from the table above
- `service`: Affected service name (from monitor tags or query)
- `environment`: prod / dev1
- `severity`: P1-P4 (from monitor priority or tags)

## Phase 2: SRE Triage (Parallel Data Collection)

Launch 4 parallel Task agents to collect data simultaneously. Each task collects a specific category of observability data.

> **Important**: Use the Task tool with `run_in_background: true` for all 4 tasks, then collect results.

### Task A: Metrics Collection (subagent_type: Bash)

Collect ALB, ECS, and RDS metrics in a single agent:

```bash
# ALB metrics
pup metrics query --query="avg:aws.applicationelb.target_response_time.average{targetgroup:<TG>}" --from="1h" --to="now" --output=json
pup metrics query --query="sum:aws.applicationelb.request_count{targetgroup:<TG>}.as_count()" --from="1h" --to="now" --output=json
pup metrics query --query="sum:aws.applicationelb.httpcode_target_5xx{targetgroup:<TG>}.as_count()" --from="1h" --to="now" --output=json

# ECS metrics
pup metrics query --query="avg:aws.ecs.cpuutilization{servicename:<SERVICE>}" --from="1h" --to="now" --output=json
pup metrics query --query="avg:aws.ecs.service.memory_utilization{servicename:<SERVICE>}" --from="1h" --to="now" --output=json

# RDS metrics
pup metrics query --query="avg:aws.rds.cpuutilization{dbinstanceidentifier:<WRITER>}" --from="1h" --to="now" --output=json
pup metrics query --query="avg:aws.rds.database_connections{dbinstanceidentifier:<WRITER>}" --from="1h" --to="now" --output=json
pup metrics query --query="avg:aws.rds.freeable_memory{dbinstanceidentifier:<WRITER>}" --from="1h" --to="now" --output=json
```

### Task B: APM Analysis (subagent_type: Bash)

Collect APM service stats and trace metrics:

```bash
# Service-level APM stats
pup apm stats --env=prod --service=<SERVICE> --from="1h" --output=json

# GraphQL operation breakdown
pup metrics query --query="avg:trace.graphql.request{service:<SERVICE>,env:prod} by {resource_name}" --from="1h" --to="now" --output=json

# PostgreSQL query latency
pup metrics query --query="avg:trace.postgresql.query{service:<SERVICE>,env:prod}" --from="1h" --to="now" --output=json
pup metrics query --query="p99:trace.postgresql.query{service:<SERVICE>,env:prod}" --from="1h" --to="now" --output=json
```

### Task C: Log Analysis (subagent_type: Bash)

Search for error and warning logs:

```bash
# Error logs (try service tag first, fall back to host tag)
pup logs search --query="service:<SERVICE> status:error" --from="1h" --limit=50 --output=json

# Warning logs
pup logs search --query="service:<SERVICE> status:warn" --from="1h" --limit=30 --output=json

# If service tag returns 0 results, use host tag
# pm-api: host:"/ecs/sotas-prod-api"
# cr-api: host:"/ecs/sotas-prod-cr-api"
pup logs search --query="host:\"<HOST_TAG>\" status:error" --from="1h" --limit=50 --output=json
```

### Task D: Codebase Search (subagent_type: Explore)

Only launch this task if a specific slow operation name is already known (from monitor context or previous investigation):

```
Search for the GraphQL resolver or endpoint handler for <operation_name>
in the appropriate repository based on service → repository mapping:
  pm-api → sotas-process-management/sotas-be/
  cr-api → sotas-chemical-research/backend/server/
  db-api → sotas-database/be/
```

### Consolidate Results

After all tasks complete, consolidate findings into the structured format:

```json:sre-triage-findings
{
  "schema": "sre-triage-findings",
  "version": "1.0",
  "metadata": {
    "monitor_id": "<number>",
    "monitor_name": "<string>",
    "alert_type": "latency|cpu_memory|error_rate|other",
    "service": "<string>",
    "environment": "prod|dev1",
    "time_range": {"from": "<ISO8601>", "to": "<ISO8601>"}
  },
  "severity": "P1|P2|P3|P4",
  "layers": {
    "alb": {
      "status": "investigated|skipped",
      "target_response_time_avg": "<number|null>",
      "request_count": "<number|null>",
      "error_5xx_count": "<number|null>",
      "anomalies": ["<string>"]
    },
    "apm": {
      "status": "investigated|skipped",
      "slow_operations": [
        {
          "name": "<string>",
          "avg_duration_ms": "<number>",
          "p99_duration_ms": "<number>",
          "hit_count": "<number>"
        }
      ],
      "overall_error_rate": "<number|null>",
      "anomalies": ["<string>"]
    },
    "database": {
      "status": "investigated|skipped",
      "rds_cpu_pct": "<number|null>",
      "connection_count": "<number|null>",
      "freeable_memory_bytes": "<number|null>",
      "slow_queries_detected": "<boolean>",
      "anomalies": ["<string>"]
    },
    "infrastructure": {
      "status": "investigated|skipped",
      "ecs_cpu_pct": "<number|null>",
      "ecs_memory_pct": "<number|null>",
      "anomalies": ["<string>"]
    },
    "logs": {
      "status": "investigated|skipped",
      "error_count": "<number>",
      "notable_errors": ["<string>"],
      "anomalies": ["<string>"]
    }
  },
  "recommendations": {
    "invoke_dba": "<boolean>",
    "invoke_implementation_review": "<boolean>",
    "dba_reason": "<string>",
    "implementation_review_reason": "<string>",
    "target_operation": "<string|null>",
    "target_db_cluster": "<string|null>"
  }
}
```

## Phase 3: Decision Logic

Based on the SRE triage findings, decide which specialized agents to invoke.

### Decision Matrix

#### For `alert_type == "latency"`:

```
Always invoke DBA:
  - Latency alerts are frequently DB-driven
  - reason: "Latency alert - DB investigation required"

Invoke Implementation Review when:
  - slow_operations is non-empty
  - reason: "Slow operation <name> identified, code review needed"
```

#### For `alert_type == "cpu_memory"`:

```
Invoke DBA when:
  - rds_cpu_pct > 50%, OR
  - slow_queries_detected == true
  - reason: "RDS CPU elevated / slow queries detected"

Invoke Implementation Review when:
  - slow_operations is non-empty
  - reason: "Slow operation identified during CPU/memory investigation"
```

#### For `alert_type == "error_rate"`:

```
Always invoke Implementation Review:
  - Error alerts are frequently code-driven
  - reason: "Error rate alert - code review required"

Invoke DBA when:
  - database.anomalies is non-empty, OR
  - rds_cpu_pct > 30%
  - reason: "DB anomalies detected during error investigation"
```

#### For `alert_type == "other"`:

```
Invoke DBA when:
  - database.anomalies is non-empty, OR
  - slow_queries_detected == true
  - reason: based on specific findings

Invoke Implementation Review when:
  - slow_operations is non-empty, OR
  - logs.notable_errors is non-empty
  - reason: based on specific findings
```

#### Priority Override (P1/P2):

```
If severity == "P1" OR severity == "P2":
  Always invoke BOTH DBA and Implementation Review
  regardless of the decision matrix above
  reason: "P1/P2 alert - comprehensive investigation required"
```

#### No Anomalies Detected:

```
If no anomalies in any layer AND severity is P3/P4:
  Skip both specialized agents
  Record "No significant anomalies detected" in the report
  Suggest monitoring for recurrence
```

## Phase 4: Specialized Agents

Launch DBA and Implementation Review agents based on Phase 3 decisions. Launch them in parallel when both are needed.

### DBA Agent Invocation

Use the Task tool to invoke the DBA agent with the following context:

```
Prompt for Task tool:

You are the DBA agent. Investigate database performance for the following alert.

**Context from SRE Triage:**
- Service: <service>
- DB Cluster: <target_db_cluster> (Writer: <writer_instance_id>)
- Time Range: <time_range>
- Alert Type: <alert_type>
- DBA Invocation Reason: <dba_reason>

**Anomalies detected:**
<database.anomalies from sre-triage-findings>

**Slow operations (from APM):**
<apm.slow_operations from sre-triage-findings>

Follow the DBA agent investigation flow (Steps 1-4).
Use Datadog metrics first. If AWS credentials are available, also use Performance Insights.

Produce output as a `dba-findings` JSON block.
```

### Implementation Review Agent Invocation

Use the Task tool to invoke the Implementation Review agent with the following context:

```
Prompt for Task tool:

You are the Implementation Review agent. Trace the identified bottleneck to source code.

**Context from SRE Triage:**
- Service: <service>
- Target Operation: <target_operation>
- Alert Type: <alert_type>
- Implementation Review Reason: <implementation_review_reason>

**Slow operations (from APM):**
<apm.slow_operations from sre-triage-findings>

**Error details (if error_rate alert):**
<logs.notable_errors from sre-triage-findings>

[If DBA findings are available:]
**Context from DBA:**
- Target Tables: <target_tables from dba-findings>
- Target Queries: <target_queries from dba-findings>
- Suggested Indexes: <suggested_indexes from dba-findings>

Follow the Implementation Review agent workflow (Steps 1-5).
Map the service to the correct repository and search for the resolver/handler code.

Produce output as an `implementation-review-findings` JSON block.
```

### Handling DBA → Implementation Review Dependency

When both agents are invoked:

1. Launch both in parallel using the Task tool
2. If DBA completes first and produces `target_tables` / `target_queries`, provide these as additional context to Implementation Review
3. If Implementation Review completes first, its findings stand alone (DBA context is supplementary, not required)

## Phase 5: Report Generation

After all phases complete, automatically invoke the `/investigate-report` skill.

The report should include:
- All structured findings from each phase
- The phase tracking table (see below)
- Clear distinction between facts (measured data) and hypotheses (root cause analysis)

## Phase Tracking Table

Maintain this table throughout the investigation to show progress:

```markdown
| Phase | Status | Key Finding |
|---|---|---|
| Classification | completed / in_progress | <alert_type> alert (<severity>) |
| SRE Triage | completed / in_progress | <one-line summary> |
| DBA | completed / skipped / in_progress | <one-line summary> |
| Implementation Review | completed / skipped / in_progress | <one-line summary> |
| Report | completed / in_progress | saved to .claude/reports/... |
```

Update and display this table after each phase completes.

## JSON Contract Schemas

### sre-triage-findings (Phase 2 → Phase 4)

Produced by SRE Triage, consumed by DBA and Implementation Review agents. See Phase 2 "Consolidate Results" section for full schema.

### dba-findings (Phase 4 → Report)

```json:dba-findings
{
  "schema": "dba-findings",
  "version": "1.0",
  "metadata": {
    "db_instance": "<string>",
    "db_cluster": "<string>",
    "engine": "Aurora PostgreSQL",
    "instance_class": "<string>",
    "time_range": {"from": "<ISO8601>", "to": "<ISO8601>"}
  },
  "datadog_metrics": {
    "status": "investigated|skipped",
    "cpu_pct": "<number|null>",
    "db_load": "<number|null>",
    "db_load_cpu": "<number|null>",
    "db_load_non_cpu": "<number|null>",
    "commit_latency_ms": "<number|null>",
    "connection_count": "<number|null>",
    "freeable_memory_bytes": "<number|null>",
    "anomalies": ["<string>"]
  },
  "performance_insights": {
    "status": "investigated|skipped|no_credentials",
    "top_wait_events": [
      {"event": "<string>", "avg_load": "<number>"}
    ],
    "top_sql": [
      {"sql_id": "<string>", "sql_text_truncated": "<string>", "avg_load": "<number>"}
    ]
  },
  "apm_trace_metrics": {
    "status": "investigated|skipped",
    "postgresql_query_avg_ms": "<number|null>",
    "postgresql_query_p99_ms": "<number|null>",
    "slow_operations_by_db_time": ["<string>"]
  },
  "diagnosis": {
    "root_cause_category": "slow_query|connection_exhaustion|lock_contention|cpu_saturation|memory_pressure|none",
    "description": "<string>",
    "confidence": "high|medium|low"
  },
  "recommendations": {
    "invoke_implementation_review": "<boolean>",
    "target_tables": ["<string>"],
    "target_queries": ["<string>"],
    "suggested_indexes": ["<string>"],
    "other_actions": ["<string>"]
  }
}
```

### implementation-review-findings (Phase 4 → Report)

```json:implementation-review-findings
{
  "schema": "implementation-review-findings",
  "version": "1.0",
  "metadata": {
    "service": "<string>",
    "repository": "<string>",
    "backend_path": "<string>",
    "time_range": {"from": "<ISO8601>", "to": "<ISO8601>"}
  },
  "code_analysis": {
    "status": "investigated|skipped|repo_not_found",
    "target_operation": "<string>",
    "resolver_file": "<string>",
    "resolver_line": "<number|null>",
    "orm_patterns": {
      "n_plus_one_detected": "<boolean>",
      "full_table_scan_detected": "<boolean>",
      "missing_pagination": "<boolean>",
      "unnecessary_columns": "<boolean>",
      "details": "<string>"
    }
  },
  "database_schema": {
    "status": "investigated|skipped",
    "relevant_tables": ["<string>"],
    "missing_indexes": ["<string>"],
    "migration_files_checked": ["<string>"]
  },
  "fix_proposals": [
    {
      "priority": "high|medium|low",
      "category": "query_optimization|index_addition|pagination|caching|connection_pool|code_refactor",
      "description": "<string>",
      "file_path": "<string|null>",
      "estimated_impact": "<string>"
    }
  ]
}
```

## Error Handling

| Situation | Response |
|---|---|
| **AWS credentials not available** | Run DBA with Datadog metrics only. Skip Performance Insights. Record `performance_insights.status: "no_credentials"` |
| **pup auth expired** | Run `pup auth refresh` and retry. If still failing, ask user to re-authenticate |
| **Codebase not cloned** | Skip Implementation Review. Record `code_analysis.status: "repo_not_found"`. Include recommendation to clone the repo |
| **No anomalies detected** | For P3/P4: skip specialized agents, record "No significant anomalies" in report. For P1/P2: still run both agents |
| **Monitor not found** | Ask user to provide the monitor ID or verify the monitor name |
| **Service unknown** | Ask user to confirm the service name and provide the target group / DB cluster details |

## Service → Infrastructure Mapping Reference

For quick lookup when constructing queries:

| Service | APM Name | ALB Target Group | ECS Service Name | RDS Writer Instance | RDS Cluster |
|---|---|---|---|---|---|
| pm-api | pm-api | (check monitor tags) | sotas-prod-api | sotas-prod-main-4-0 | sotas-prod-main-4 |
| cr-api | cr-api | (check monitor tags) | sotas-prod-cr-api | sotas-prod-cr-main-2-0 | sotas-prod-cr-main |
| db-api | db-api | (check monitor tags) | sotas-prod-db-api | sotas-prod-db-main-2-1 | sotas-prod-db-main |

## Example Invocation

```
User: /alert-investigate db-api TargetResponseTime

Phase 1 - Classification:
  alert_type: latency
  service: db-api
  severity: P2

Phase 2 - SRE Triage (4 parallel tasks):
  [metrics]    ALB response time avg: 2.3s (normal: 0.3s)
  [apm]        editTdsReadResultDetail: avg 1.8s, p99 5.2s
  [logs]       3 timeout warnings in last hour
  [codebase]   Found resolver in sotas-database/be/

Phase 3 - Decision:
  → Invoke DBA: YES (latency alert)
  → Invoke Implementation Review: YES (slow operation identified)

Phase 4 - Specialized Agents (parallel):
  [DBA]        RDS CPU 19%, top SQL: REFRESH_RESIN_PRODUCT_INDEXES
  [Impl Review] Master data full-load pattern in resolver

Phase 5 - Report:
  → /investigate-report → .claude/reports/2026-03-03-db-api-target-response-time.md
```

| Phase | Status | Key Finding |
|---|---|---|
| Classification | completed | latency alert (P2) |
| SRE Triage | completed | editTdsReadResultDetail slow, RDS CPU 19% |
| DBA | completed | REFRESH_RESIN_PRODUCT_INDEXES top SQL |
| Implementation Review | completed | Master data full-load pattern |
| Report | completed | saved to .claude/reports/... |
