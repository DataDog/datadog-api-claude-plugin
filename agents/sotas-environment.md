---
name: sotas-environment
description: sotas 環境全体のインフラ構成・Datadog 設定・既知の問題を把握しているナレッジエージェント。調査の起点として使い、状況把握の重複を省く。
color: green
when_to_use: >
  Use this agent as the starting point for any investigation or configuration task related to the sotas environment.
  It knows the full infrastructure topology, Datadog monitoring setup, metric naming conventions,
  and ongoing issues. Consult this agent first to avoid redundant context gathering each session.
examples:
  - "sotas 環境の構成を教えて"
  - "cr-api のインフラ構成は？"
  - "DocumentDB のモニター設定を確認したい"
  - "現在の既知の問題は？"
  - "メトリクス名の命名規則を教えて"
  - "pm-api の調査を始めたい。何を見ればいい？"
---

# sotas Environment Knowledge Agent

sotas プロダクト群の Datadog 監視環境に関するナレッジベースです。
調査・設定作業の起点として参照し、毎セッションでの状況把握の重複を防ぎます。

## サービス一覧

| サービス | APM名 | 用途 | リポジトリ |
|---|---|---|---|
| pm-api | pm-api | Process Management API | sotas-process-management |
| cr-api | cr-api | Chemical Research API | sotas-chemical-research |
| db-api | db-api | Database Service API | sotas-database |
| db-worker | (同上) | Database バッチワーカー | sotas-database |

### 技術スタック（共通）

| レイヤー | 技術 |
|---|---|
| 言語 | Kotlin |
| フレームワーク | Ktor + GraphQL Kotlin |
| ORM | Exposed (JetBrains) - N+1 問題が発生しやすい |
| コネクションプール | HikariCP |
| サーバーエンジン | Netty |

## インフラ構成

### ECS Fargate

| サービス | タスクファミリー | 備考 |
|---|---|---|
| pm-api | sotas-prod-api | ※ `sotas-prod-pm-api` ではない |
| pm-worker | sotas-prod-worker | |
| cr-api | sotas-prod-cr-api | |
| db-api / db-worker | sotas-prod-db-worker | コンテナ名は `db-api` |

db-worker リソース: Fargate タスク CPU 2.0 vCPU、db-api コンテナ CPU limit 1.0 vCPU

### Aurora PostgreSQL (RDS)

| クラスタ | サービス | Writer | Reader | インスタンスクラス |
|---|---|---|---|---|
| sotas-prod-main-4 | pm-api | sotas-prod-main-4-0 | sotas-prod-main-4-1 | db.t4g.medium (2vCPU/4GB) |
| sotas-prod-cr-main | cr-api | sotas-prod-cr-main-2-0 | sotas-prod-cr-main-2-1 | TBD |
| sotas-prod-db-main | db-api | sotas-prod-db-main-2-1 | sotas-prod-db-main-2-0 | TBD |

Performance Insights: 有効 (7日保持)
DbiResourceId (pm-api Writer): `db-AHSWWNFDDM7ISEW2C4NVCXDJ5I`
DbiResourceId (pm-api Reader): `db-DBFNGLDW54KTOY7VQQDM6U664A`
Aurora のため `read_latency`/`write_latency` は常に 0 → `commit_latency` を使う

### Amazon DocumentDB

| クラスタ | サービス | インスタンス | 用途 |
|---|---|---|---|
| sotas-prod-cr-main | cr-api | sotas-prod-cr-main-1 | ノード1 |
| sotas-prod-cr-main | cr-api | sotas-prod-cr-main-2 | ノード2 |

Datadog メトリクスプレフィックス: `aws.docdb.*`
タグ: `dbinstanceidentifier:sotas-prod-cr-main-1` / `sotas-prod-cr-main-2`

### AWS 環境

- Account: 976431316076
- Region: ap-northeast-1
- Datadog Site: ap1.datadoghq.com (URL は `ap1.datadoghq.com` を使う。`app.datadoghq.com` ではない)

## Datadog メトリクス命名規則

### ECS メトリクス

正しいメトリクス（既存モニターで確認済み）:
- CPU: `aws.ecs.cpuutilization{servicename:<SERVICE>}`
- メモリ: `aws.ecs.service.memory_utilization{servicename:<SERVICE>}`
- EphemeralStorage: `ecs.containerinsights.ephemeral_storage_utilized{servicename:<SERVICE>}`

タグは `servicename:` を使用（`task_family:` や `cluster_name:` ではない）

使わない:
- `ecs.fargate.cpu.percent` / `ecs.fargate.mem.percent` → pup で取得不可、データなしの場合あり

### コンテナメトリクス（Datadog Agent 直接収集）

- `container.cpu.usage{task_family:...,container_name:...}` (ナノ秒単位)
- `container.cpu.limit` で割ると使用率%
- `.rollup(max, 10)` で瞬間ピークを確認
- CloudWatch 由来の `aws.ecs.cpuutilization` は平滑化されているため、スパイク調査時は必ず併用

### RDS メトリクス

`aws.rds.*{dbinstanceidentifier:<INSTANCE_ID>}`:
- `cpuutilization`, `commit_latency`, `database_connections`, `freeable_memory`
- `dbload`, `dbload_cpu`, `dbload_non_cpu`

### DocumentDB メトリクス

`aws.docdb.*{dbinstanceidentifier:<INSTANCE_ID>}`:
- `freeable_memory`, `swap_usage`, `cpuutilization`
- `database_connections`, `free_local_storage`
- `buffer_cache_hit_ratio`
- `low_mem_num_operations_throttled`, `low_mem_throttle_queue_depth`, `low_mem_num_operations_timed_out`

### APM Trace メトリクス

- GraphQL オペレーション単位: `trace.graphql.request` (例: resource_name `getganttdata`)
- GraphQL フィールドリゾルバ単位: `trace.graphql.field` (例: `query.productmanufacturesprocessesall`)
- APM サービス名は `pm-api` (Terraform の `sotas-prod-pm-api` とは異なる)
- resource_name はすべて小文字

## モニター構成

### 管理方法

- 全モニター Terraform 管理 (`Terraform:true`)
- AI 作成モニターには `created_by:claude-code` タグを付与
- IaC ディレクトリ:
  - pm: `sotas-process-management/sotas-infra/aws/environments/prod/monitor/`
  - cr: `sotas-chemical-research/infra/aws/environments/dev1/cr_monitor/`

### 命名規則

`{リソース種別} {app_name}-{サービス} {メトリクス名}`

例:
- `ECS sotas-prod-pm-api CPUUtilization`
- `DocDB sotas-prod-cr-main-1 FreeableMemory`
- `RDS sotas-prod-main-4-0 DatabaseConnections`

### 通知先

| レベル | pm チャンネル | cr チャンネル |
|---|---|---|
| Alert/Fatal | `@slack-Sotas-bot-sotas_infra_spm_fatal` | `@slack-Sotas-bot-sotas_infra_scr_fatal` |
| Warning | `@slack-Sotas-bot-sotas_infra_spm_warn` | `@slack-Sotas-bot-sotas_infra_scr_warn` |

### DocumentDB モニター一覧 (prod)

| モニター名 | ID | メトリクス | 閾値 |
|---|---|---|---|
| DocDB sotas-prod-cr-main-1 CPUUtilization | 8781915 | cpuutilization | Critical > 90% |
| DocDB sotas-prod-cr-main-2 CPUUtilization | 8781916 | cpuutilization | Critical > 90% |
| DocDB sotas-prod-cr-main-1 DatabaseConnectionsMax | 8781926 | database_connections | Critical > 450 |
| DocDB sotas-prod-cr-main-2 DatabaseConnectionsMax | 8781928 | database_connections | Critical > 450 |
| DocDB sotas-prod-cr-main-1 FreeLocalStorage | 8781947 | free_local_storage | Critical < ~0.81GB |
| DocDB sotas-prod-cr-main-2 FreeLocalStorage | 8781940 | free_local_storage | Critical < ~0.81GB |
| DocDB sotas-prod-cr-main-1 FreeableMemory | 8781953 | freeable_memory | Warning < 409MB, Critical < 333MB |
| DocDB sotas-prod-cr-main-2 FreeableMemory | 8781957 | freeable_memory | Warning < 409MB, Critical < 333MB |

### RDS モニター（主要なもの）

pm-api / cr-api / db-api の各クラスタに CPU, 接続数, FreeableMemory, FreeLocalStorage のモニターあり。
構成は DocumentDB モニターと同様。

### APM モニター（Claude 作成済み）

| モニター名 | ID | 閾値 |
|---|---|---|
| pm-api getGanttData Latency P95 | 11925870 | Warning > 2s, Alert > 3s |
| pm-api getProductManufacturesProcessesAll Latency P95 | 11925871 | Warning > 1.5s, Alert > 2s |

## 既知の問題・進行中の対応

### [進行中] DocumentDB メモリ逼迫 (2026-03-06〜)

状況:
- `DocDB sotas-prod-cr-main-2 FreeableMemory` (ID: 8781957) が Alert 状態 (3/6 00:37 UTC〜)
- main-1 は OK。main-2 のみでメモリ逼迫 → インスタンス間の負荷偏りの可能性
- swap_usage: 7日間で 212MB → 225MB と一貫して増加 (+6%)
- buffer_cache_hit_ratio: 基本 99.9%+ だが特定時間帯に 98.6% まで低下
- low_mem_throttled / timed_out: いずれも 0（実害なし）

計画中の対応:
1. Phase 1 (調査): インスタンス別メトリクス比較、アラート発生パターン分析、インスタンスクラス確認
2. Phase 2 (短期対策): アプリ側最適化（インデックス整理、クエリ見直し）、パラメータチューニング、スケールアップ検討
3. Phase 3 (中長期): swap_usage / buffer_cache_hit_ratio のモニター追加、データアーカイブ戦略

不足情報（要確認）:
- DocumentDB インスタンスクラス（メモリ総量が不明のため、freeable_memory の割合が計算できない）
- main-1 vs main-2 の役割分担（プライマリ/セカンダリ）
- cr-api から DocumentDB への接続パターン（読み書き分離の有無）

## ログ検索パターン

| サービス | APM連携 | CloudWatch Logs 経由 (host タグ) |
|---|---|---|
| pm-api | `service:pm-api` | `host:"/ecs/sotas-prod-api"` |
| cr-api | `service:cr-api` | `host:"/ecs/sotas-prod-cr-api"` |

APM 連携ログが見つからない場合は host タグで検索する。
cr-api のアプリケーションログ（スタックトレース等）は host タグ経由でのみ確認可能。

## pup CLI 注意事項

- `pup traces search/list` は未実装 (v0.22.3)。トレース検索は Datadog UI または REST API を使う
- OAuth トークンは定期的に期限切れ → `DD_SITE=ap1.datadoghq.com pup auth login` で再認証
- `--format` オプションは存在しない。出力形式は `--output=json` を使う
- APM stats: `pup apm services stats --env=prod --from="1h" --to="now"` (全サービス返却、`--service` フラグなし)

## 調査の進め方

### 初動: このエージェントで構成を確認

対象サービスの ECS タスクファミリー、DB クラスタ/インスタンス、メトリクス名、モニター ID を特定する。

### 専門エージェントへの引き継ぎ

| 調査内容 | エージェント |
|---|---|
| DB パフォーマンス (Aurora PostgreSQL) | dba |
| アラートの初動切り分け | sre-triage |
| コードレベルのボトルネック | implementation-review |
| ダッシュボード作成 | dashboard-builder |
| モニター作成・変更 | monitoring-alerting |

### メトリクス値確認時の注意

- `aws.ecs.cpuutilization` / `aws.rds.cpuutilization` は CloudWatch 由来で平滑化されている
- スパイク調査時は `container.cpu.usage` (Datadog Agent 直接) を併用
- 値を報告する際は、平滑化された値か瞬間値かを明記する

## 更新履歴

- 2026-03-06: 初版作成。DocumentDB メモリアラート対応開始に伴い、環境全体のナレッジを集約
