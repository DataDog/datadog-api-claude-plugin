---
name: investigate-report
description: Generate a standardized incident investigation report from Datadog analysis findings
user-invokable: true
---

# Investigate Report Skill

This skill generates a standardized incident investigation report based on the findings from an alert triage or incident investigation session.

**Invocation**: `/investigate-report`

## When to Use

- After completing an alert investigation (typically after using the sre-triage agent)
- When you want to document investigation findings in a structured format
- As part of an incident response workflow to create a permanent record
- When handing off an investigation to another team member

## Report Output

Two reports are generated per investigation:

1. **Detailed Report** (for SRE/infrastructure team):
   `.claude/reports/YYYY-MM-DD-<title-slug>.md`
   - Full investigation data, metrics values, pup commands, all layers

2. **App Developer Summary** (for sharing with application owners):
   `.claude/reports/YYYY-MM-DD-<title-slug>-summary.md`
   - Concise, actionable, focused on "what to fix" rather than "how we found it"

## Workflow

### 1. Gather Information

Before generating the report, collect the following from the current session or by asking the user:

**Required Information:**
- **Monitor/Alert**: Which monitor fired? (name, ID)
- **Time**: When did it fire? When was it resolved?
- **Severity**: P1-P4 classification
- **Status**: Resolved, Mitigated, Ongoing, or Investigating

**Investigation Findings:**
- **Summary**: One-paragraph overview of what happened
- **Timeline**: Key events in chronological order
- **Impact**: Which services, users, or business functions were affected
- **Root Cause**: What caused the issue (if identified)
- **Data Sources**: Which Datadog data was consulted (metrics, traces, logs)

**Actions:**
- **Immediate Actions**: What was done to resolve/mitigate
- **Recommended Follow-ups**: What should be done to prevent recurrence

### 2. Generate Report

Use the template below to create the report. Fill in all sections with data from the investigation.

### 3. Generate App Developer Summary

Using the same investigation findings, generate a concise summary for application developers. Use the App Developer Summary Template below.

### 4. Save Reports

Save both reports to `.claude/reports/` with the naming convention:

```text
.claude/reports/YYYY-MM-DD-<descriptive-title-slug>.md          # Detailed report
.claude/reports/YYYY-MM-DD-<descriptive-title-slug>-summary.md  # App developer summary
```

Example:

```text
.claude/reports/2026-02-25-pm-api-target-response-time-alert.md
.claude/reports/2026-02-25-pm-api-target-response-time-alert-summary.md
```

## Report Template

```markdown
# Investigation Report: <Monitor/Alert Name>

## Header

| Item | Value |
|---|---|
| Date | YYYY-MM-DD HH:MM (timezone) |
| Monitor | <Monitor Name> (ID: <monitor-id>) |
| Severity | P1/P2/P3/P4 |
| Status | Resolved / Mitigated / Ongoing / Investigating |
| Duration | <start time> ~ <end time> (<duration>) |
| Investigator | <name or AI session> |

## Summary

<One paragraph overview: what happened, what was the impact, what was the root cause>

## Timeline

| Time | Event |
|---|---|
| HH:MM | Alert fired |
| HH:MM | Investigation started |
| HH:MM | <Key finding or action> |
| HH:MM | Root cause identified |
| HH:MM | Resolution/mitigation applied |
| HH:MM | Alert recovered |

## Impact

### Affected Services
- <service-name>: <how it was affected>

### User Impact
- <Description of user-facing impact, if any>

### Business Impact
- <Description of business impact, if any>

## Investigation

### Layer 1: Load Balancer
<Findings from ALB metrics - response time, request count, errors>

### Layer 2: Application (APM)
<Findings from APM traces and stats - slow operations, error rates>

### Layer 3: Database
<Findings from DB metrics - slow queries, connection pool, CPU>

### Layer 4: Infrastructure
<Findings from compute metrics - CPU, memory, task count>

### Layer 5: Logs
<Findings from application logs - errors, warnings, stack traces>

## Root Cause Analysis

### Root Cause
<Detailed explanation of the root cause>
<必ず確度を明記: （確認済み）/（確度: 高）/（確度: 中）/（確度: 低）>

### Contributing Factors
- <Factor 1>（確度: 高/中/低）
- <Factor 2>（確度: 高/中/低）

## Actions

### Immediate Actions Taken
- [ ] <Action taken during investigation>

### Recommended Follow-ups

<各提案の期待効果に確度を付記すること>

#### High Priority
- [ ] <Action item with clear owner and timeline>（効果見込み: 大/中）

#### Medium Priority
- [ ] <Action item>（効果見込み: 中/小）

#### Low Priority
- [ ] <Action item>

## Data Sources

| Source | Query/Command | Result |
|---|---|---|
| Metrics | `pup metrics query --query="..." --from="..."` | <Key finding> |
| Traces | `pup traces search --query="..." --from="..."` | <Key finding> |
| Logs | `pup logs search --query="..." --from="..."` | <Key finding> |
| APM Stats | `pup apm stats --service=... --from="..."` | <Key finding> |

## Related Resources

- Monitor: <link to Datadog monitor>
- Dashboard: <link to relevant dashboard>
- Previous incidents: <links to related reports>
```

## App Developer Summary Template

This report is for sharing with application owners/developers. It should be understandable without Datadog expertise.

**Writing guidelines:**

- Infrastructure metrics (ALB, ECS, RDS) の詳細数値やコマンドは省略する
- 「何が問題か」「コードのどこを直すべきか」に集中する
- 事実（コード確認済み・メトリクス実測値）と推測（可能性・見込み）を明確に区別する
- 調査結果・原因分析・予測の記述には確度を明記する（下記「確度の記載ルール」参照）
- 改善提案には「効果見込み: 大/中/小」を付記する（確度ではなく効果の大きさ）
- Slack コードブロックへのコピペを想定し、インライン装飾（`**`, `` ` ``）は使わない
- 日本語で記載する（チーム共通言語）

This report uses plain text Markdown without inline formatting (`**`, `` ` `` etc.) so the content
remains readable when pasted inside a Slack code block.

```markdown
# <service-name> <alert-type>アラート調査結果

日時: YYYY-MM-DD HH:MM (timezone)
対象: <service-name> (<infrastructure-identifier>)
事象: <One-line description of what happened and threshold exceeded>

## 何が起きたか

<2-3 paragraphs explaining:>
<- What triggered the alert (specific user action, traffic pattern, etc.)>
<- Timeline of key events as bullet list>
<- Impact scope (who was affected, was there data loss, error count)>

## ボトルネック箇所（コード確認済み）

<Brief intro sentence>

### 1. <Issue title>

<Description of the problem. Reference specific functions/classes. No inline formatting.>

### 2. <Issue title>

<...repeat for each issue>

## DB 側の状況

<Brief assessment of database health as bullet list.>
<Focus on the conclusion: "DB is not the bottleneck" or "DB is the bottleneck because...">

## 改善提案

### すぐに効果が見込めるもの

- <proposal name> (効果見込み: 大/中/小)
  - 概要: <what to change>
  - 期待効果: <expected impact>
  - 根拠: <why this estimate>

### 中期的に検討すべきもの

- <proposal name> (効果見込み: 大/中/小)
  - 概要: <what to change>
  - 期待効果: <expected impact>
  - 根拠: <why this estimate>

## 参考情報

- Datadog Monitor: <URL to monitor on ap1.datadoghq.com>
- 詳細調査レポート: <path to detailed report>
```

## Implementation Notes

### Auto-Populating from Session Context

When generating a report within a session where investigation has already been performed:

1. **Extract monitor info** from any `pup monitors get` outputs in the session
2. **Build timeline** from the sequence of commands and findings
3. **Populate data sources** from the `pup` commands that were executed
4. **Summarize findings** from each investigation layer
5. **Derive root cause** from the analysis discussion

### Handling Incomplete Information

If some information is not available:
- Mark unknown fields as "TBD" or "Not investigated"
- Note which layers were not examined and why
- Suggest follow-up investigation for gaps

### Multiple Reports

If multiple alerts or issues were investigated in one session, create separate reports for each distinct incident.

## Best Practices

1. **Write for the next person**: The report should make sense to someone who wasn't part of the investigation
2. **Include data, not just conclusions**: Show the metrics/traces that led to your conclusions
3. **Be specific with recommendations**: Include who should do what, by when
4. **Link related reports**: If this is a recurring issue, reference previous investigations
5. **Update after resolution**: Add final resolution details and close action items

### 確度の記載ルール

両レポート（詳細版・サマリー版）に共通で適用する。

**すべての記述に確度レベルを明記すること。** 確度が不明な記述をそのまま書かない。

| 確度 | ラベル | 使う場面 | 例 |
| --- | --- | --- | --- |
| 確定 | **（確認済み）** | メトリクス実測値、コード確認済みの事実、ログで裏付けあり | 「RDS CPU は 19.1% に上昇（Datadog 実測値）」 |
| 高 | **（確度: 高）** | 複数のデータソースが一致する推論、相関が明確 | 「マスターデータ全件ロードがレイテンシの主因と考えられる（確度: 高 — APM・PI・コード全てが示唆）」 |
| 中 | **（確度: 中）** | 単一データソースからの推論、合理的だが他の可能性あり | 「キャッシュ導入で 30-50% 改善の可能性（確度: 中 — 類似パターンからの推測）」 |
| 低 | **（確度: 低）** | 仮説段階、データ不十分 | 「JVM ウォームアップが一因の可能性（確度: 低 — 未検証）」 |

**記載パターン:**

- **調査結果・原因分析**: 根本原因の記述、ボトルネック箇所の判断には必ず確度を付与する
- **予測・推論**: 因果関係の推論、総合判断には確度を明記する
- **Contributing Factors**: 各要因に確度を明記する
- **改善提案**: 確度ではなく「効果見込み: 大/中/小」を使う（修正した時のインパクト）
- **事実のみの記述**: 「（確認済み）」または出典を付記する（例:「APM 実測値」「コード確認済み」）

## Error Handling

If the reports directory doesn't exist, create it:
```bash
mkdir -p .claude/reports
```

If a report with the same name exists, append a sequence number:
```
.claude/reports/2026-02-25-pm-api-alert.md
.claude/reports/2026-02-25-pm-api-alert-2.md
```
