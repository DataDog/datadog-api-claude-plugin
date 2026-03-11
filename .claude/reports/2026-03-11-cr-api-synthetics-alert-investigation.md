# cr-api Synthetics アラート調査レポート (2026-03-11)

## 概要

2026-03-11 00:58〜01:18 JST に AWS Synthetics モニター (Monitor ID: 11656874) が複数回発火した。cr-api (`https://cr.sotas.com/sign-in/`) の SuccessPercent が 0% に低下し、約20分間サービスが無応答となった。根本原因は Ktor call group スレッドプール（8スレッド）の枯渇と推定される（確度: 中〜大）。

## タイムライン (JST)

- 00:55頃: トラフィックが通常の約2倍に増加（Datadog APM / cr-api）
- 00:58: Synthetics アラート発火、SuccessPercent 0%
- 00:58〜01:18: 約20分間、Synthetics が 0% を継続（9分連続 0% を含む）
- 01:18以降: 自然回復、SuccessPercent 100% に復帰

## SRE 観点

### ALB メトリクス

- レスポンスタイム: P100 が 4.8秒まで悪化（通常 1秒未満）
  - 確認元: Datadog Metrics / aws.applicationelb.target_response_time.maximum
- ヘルシーホスト数: 障害中も変動なし（ALB はホストを unhealthy と判定しなかった）
  - 確認元: Datadog Metrics / aws.applicationelb.healthy_host_count

### ECS メトリクス

- CPU 使用率: CloudWatch 由来で 1.6% 程度（平滑化された値）
  - 確認元: Datadog Metrics / aws.ecs.cpuutilization{servicename:sotas-prod-cr-api}
- オートスケーリング: CPU ベースのため発火せず（閾値に対して 1.6% は遠すぎる）
- タスク数: 変動なし

### APM スループット

- 障害時間帯にリクエスト hits が通常の約2倍に増加
  - 確認元: Datadog APM / cr-api (trace.netty.request.hits)
- エラー率の顕著な増加は確認できず（アプリが無応答のためエラーレスポンスも返せなかった可能性）

### ログ

- 障害時間帯のアプリケーションログ: 0件
  - 確認元: Datadog Logs / host:"/ecs/sotas-prod-cr-api" status:error
- cr-api は ERROR レベルのみログ出力する設計のため、アプリ無応答時にはログが生成されないのは想定通りの動作
- 注意: cr-api のログは `service:api` タグで送信されており、`service:cr-api` では検索不可（別途 issue 化済み）

## DBA 観点

- RDS (Aurora PostgreSQL): 障害時間帯に顕著な異常なし
  - CPU 使用率: 正常範囲内
  - Commit Latency: 正常範囲内
  - 接続数: 安定
  - 確認元: Datadog Metrics / aws.rds.cpuutilization{dbinstanceidentifier:sotas-prod-cr-main-2-0}
- DocumentDB: 個別メトリクスの精査は未実施（次回セッションで要確認）

## コードベース観点

### Ktor スレッドプール設定

sotas-chemical-research / backend/server/src/main/resources/application.yaml:

```yaml
connectionGroupSize: '$KTOR_CONNECTION_GROUP_SIZE:4'
workerGroupSize: '$KTOR_WORKER_GROUP_SIZE:4'
callGroupSize: '$KTOR_CALL_GROUP_SIZE:8'
```

- call group が 8 スレッドに対し、ECS タスクは 8 vCPU / 32 GB
- 8 スレッドが全てブロックされるとアプリケーション全体が無応答になる

### 関連する設定上の問題

- DocumentDB の socketTimeout がデフォルト（0 = 無制限）→ 1スレッドが無期限ブロックの可能性
  - 確認元: sotas-chemical-research コード / 接続 URI 内にタイムアウト指定なし
- GraphQL 実行タイムアウト未設定 → 遅いクエリがスレッドを長時間占有
- ヘルスチェックが `call.respond(OK)` のみ → DB 接続不可でも ALB は正常と判断
- サーキットブレーカー未設定 → 外部依存の障害が全スレッドに波及
- GC ログが本番で無効 → GC 影響の確認不可

## 根本原因分析

確度: 中〜大

推定される障害シーケンス:

1. 00:55頃、通常の約2倍のトラフィックが流入
2. call group の 8 スレッドが全て占有される
3. 新規リクエストがキューに滞留 → レイテンシ急増（P100: 4.8秒）
4. Synthetics チェックがタイムアウト → SuccessPercent 0%
5. ALB ヘルスチェックは DB 確認をしないため、unhealthy 判定されず
6. CPU ベースのオートスケーリングは CPU 1.6% のため発火せず
7. トラフィック減少とともに自然回復

スレッドプールの上限に達した直接的な証拠（JVM スレッドダンプ等）はないが、以下の状況証拠から推定:

- 8 スレッドという小さなプールサイズ
- 2倍のトラフィック増加という外部要因
- CPU が低いままという事実（CPU ではなくスレッド枯渇が律速）
- DocumentDB タイムアウトなしという増幅要因

## 改善提案

### 効果見込み: 大

- KTOR_CALL_GROUP_SIZE を 32〜64 に変更
- DocumentDB 接続 URI に socketTimeoutMS=30000 追加
- GraphQL 実行タイムアウト設定

### 効果見込み: 中

- ヘルスチェックに DB 接続確認追加
- GC ログ有効化（本番環境）
- オートスケーリングをリクエスト数/レイテンシベースに変更

### 効果見込み: 小

- サーキットブレーカー導入
- Reader レプリカ活用

## 関連 Issue

- `.claude/issues/cr-api-thread-pool-undersized.md` — スレッドプール設定の詳細
- `.claude/issues/all-services-log-service-tag-mismatch.md` — ログ service タグの不整合（調査中に発見）

## 備考

- DocumentDB の詳細メトリクス精査は未実施
- 全ての改善提案は IaC (Terraform) + アプリケーションコード変更で対応が必要
- 調査で使用した pup CLI コマンドの一部で `DD_SITE` 未設定による取得失敗があり、再取得済み
