---
name: investigate
description: >
  障害・パフォーマンス調査を4観点（メトリクス/ログ、コードベース、SRE、DBA）で
  並行実行するオーケストレーター。「調査して」「investigate」で自動的に起動される。
user-invocable: true
---

# Investigation Orchestrator

障害・パフォーマンス調査を自動的に4観点で並行実行します。

**呼び出し**: `/investigate <アラート名またはサービス名> [時間帯]`

## 使い方

ユーザーが以下のような依頼をしたら、このスキルを使用する:
- 「調査してください」「調査お願いします」
- 「アラートが発生しました」
- 「investigate this alert」
- 障害やパフォーマンス問題の調査依頼全般

## Phase 1: 対象の特定

ユーザーの入力から以下を特定する:

- サービス名（pm-api / cr-api / db-api）
- 時間帯（FROM / TO）
- アラート名/モニター ID（あれば）

モニター ID がある場合:
```bash
pup monitors get <monitor-id> --output json
```

### 環境マッピング

| サービス | APM名 | ECS servicename | タスクファミリー | RDS Writer | RDS Cluster | ホストタグ |
|---|---|---|---|---|---|---|
| pm-api | pm-api | sotas-prod-api | sotas-prod-api | sotas-prod-main-4-0 | sotas-prod-main-4 | /ecs/sotas-prod-api |
| cr-api | cr-api | sotas-prod-cr-api | sotas-prod-cr-api | sotas-prod-cr-main-2-0 | sotas-prod-cr-main | /ecs/sotas-prod-cr-api |
| db-api | db-api | sotas-prod-db-api | sotas-prod-db-worker | sotas-prod-db-main-2-1 | sotas-prod-db-main | /ecs/sotas-prod-db-worker |

## Phase 2: 4観点の並行調査

Agent ツールで3つのサブエージェントを並行起動する。

**必ず単一メッセージ内で3つの Agent ツール呼び出しを同時に行うこと（並行実行）。**

### Agent 1: SRE Investigator

```
subagent_type: sre-investigator

サービス: <SERVICE>
時間帯: <FROM> 〜 <TO>
環境情報:
- APM名: <APM_SERVICE>
- ECS servicename: <ECS_SERVICE>
- タスクファミリー: <TASK_FAMILY>
- ホストタグ: <HOST_TAG>

以下のレイヤーを順に調査してください:
1. ALB メトリクス（レスポンスタイム、リクエスト数、5xx、ヘルシーホスト）
2. ECS メトリクス（CPU、メモリ、タスク数 — CloudWatch + コンテナ直接の両方）
3. APM スループット（hits、errors、オペレーション別）
4. ログ（エラー、警告、キーワード検索）

時間帯の前後30分も含めてベースラインと比較すること。
```

### Agent 2: DBA Investigator

```
subagent_type: dba-investigator

サービス: <SERVICE>
時間帯: <FROM> 〜 <TO>
環境情報:
- RDS Writer: <WRITER>
- RDS Reader: <READER>
- RDS Cluster: <CLUSTER>

以下を調査してください:
1. RDS CPU、DB Load、Commit Latency
2. 接続数（Writer + Reader）
3. IOPS、メモリ、Swap
4. デッドロック、Active/Blocked トランザクション
5. DocumentDB（cr-api の場合のみ）

時間帯の前後30分も含めてベースラインと比較すること。
```

### Agent 3: Code Investigator

```
subagent_type: code-investigator

サービス: <SERVICE>
リポジトリ: <REPO_PATH>
バックエンドパス: <BACKEND_PATH>

以下を調査してください:
1. サーバー/スレッドプール設定（callGroupSize 等）
2. ヘルスチェック実装（DB接続確認の有無）
3. タイムアウト設定（HikariCP、DocumentDB、HTTP クライアント）
4. コネクションプール設定
5. JVM/GC 設定
6. サーキットブレーカー/レート制限の有無
7. ECS タスク定義（CPU/メモリ、オートスケーリング）
```

## Phase 3: 結果の統合

3つのサブエージェントの結果を統合し、以下を判定:

### 根本原因の判定

各観点の結果を突き合わせて、根本原因を推定する:

- SRE: インフラリソース枯渇? トラフィック急増? ネットワーク障害?
- DBA: DB 負荷? 接続枯渇? ロック競合? スロークエリ?
- Code: スレッドプール枯渇? タイムアウト未設定? リソース不足?

### 確度の判定ルール

- 複数観点のデータが一致 → 確度: 高
- 単一観点からの推論 → 確度: 中
- 仮説段階、データ不十分 → 確度: 低

## Phase 4: レポート生成

調査結果を `.claude/reports/YYYY-MM-DD-<topic>.md` に保存する。

レポートには以下を含める:
- 概要（1段落）
- タイムライン（JST）
- 各観点の調査結果（数値の確認元を明記）
- 根本原因分析（確度を付記）
- 改善提案（効果見込み: 大/中/小）

### 確認元の記載ルール

数値や事実を記載する際は確認元を具体的に明記:
- Datadog Metrics / <メトリクス名>
- Datadog Logs / <検索条件>
- Datadog APM / <サービス名>
- <リポジトリ名> コード / <ファイル名:行番号>

## 注意事項

- 事実と推測は必ず区別する
- 太字マークダウン (`**`) は使わない
- 100% 確定していない事項は断定表現を避ける
- Datadog Site: ap1.datadoghq.com
- 時刻は JST で報告
