# cr-api Ktor call group スレッドプールが過小

## ステータス: 未対応

## 問題

cr-api の Ktor call group スレッドが 8 に対し、ECS タスクは 8 vCPU / 32 GB で動作。
トラフィック増加時に全スレッドがブロックされ、アプリケーションが無応答になる。

## 発見経緯

2026-03-11 00:58〜01:18 JST の Synthetics アラート調査で判明。
トラフィックが通常の約2倍に増加した際、P100 レイテンシが 4.8秒まで悪化し Synthetics が 9分間連続 0% となった。

## 根本原因の詳細

設定ファイル: `sotas-chemical-research/backend/server/src/main/resources/application.yaml`

```yaml
connectionGroupSize: '$KTOR_CONNECTION_GROUP_SIZE:4'
workerGroupSize: '$KTOR_WORKER_GROUP_SIZE:4'
callGroupSize: '$KTOR_CALL_GROUP_SIZE:8'
```

関連する問題:
- DocumentDB の socketTimeout が無制限（デフォルト 0）→ 1スレッドが無期限ブロックの可能性
- GraphQL 実行タイムアウト未設定 → 遅いクエリがスレッドを長時間占有
- ヘルスチェックが DB 接続を確認しない → ALB は正常と判断し続ける
- サーキットブレーカー未設定 → 外部依存の障害が全スレッドに波及
- GC ログが本番で無効 → GC 影響の確認不可
- オートスケーリングが CPU ベース → CPU 使用率 1.6% のため発火しない

## 改善提案

| 優先度 | 施策 | 対象ファイル |
|---|---|---|
| 高 | KTOR_CALL_GROUP_SIZE を 32〜64 に変更 | ECS タスク定義 or application.yaml |
| 高 | DocumentDB 接続 URI に socketTimeoutMS=30000 追加 | application.yaml or WithMongoDbClient.kt |
| 高 | GraphQL 実行タイムアウト設定 | GraphQLModule.kt |
| 中 | ヘルスチェックに DB 接続確認追加 | Main.kt (HealthCheckService 活用) |
| 中 | GC ログ有効化 (本番) | JAVA_TOOL_OPTIONS in main.tf |
| 中 | オートスケーリングをリクエスト数/レイテンシベースに変更 | Terraform |
| 低 | サーキットブレーカー導入 | アプリケーションコード |
| 低 | Reader レプリカ活用 | アプリケーションコード |

## 備考

- 発見日: 2026-03-11
- 関連アラート: AWS Synthetics https://cr.sotas.com/sign-in/ 200 SuccessPercent (Monitor ID: 11656874)
- 調査レポート: 本セッション内で報告済み（.claude/reports 未保存）
