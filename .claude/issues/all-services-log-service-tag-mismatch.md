# 全サービスのログ service タグが `api` に統一されてしまっている

## ステータス: 未対応

## 問題

複数プロダクトのログが全て `service:api` タグで Datadog に送信されており、ログ-トレース連携ができず、プロダクト間のログが混在する。

| プロダクト | APM service | Logs service | host タグ |
|---|---|---|---|
| pm-api (SPM) | `pm-api` | `api` | `/ecs/sotas-prod-api` |
| cr-api (SCR) | `cr-api` | `api` | `/ecs/sotas-prod-cr-api` |
| db-worker (DB) | `db-api` | `api` | `/ecs/sotas-prod-db-worker` / `/ecs/sotas-dev1-db-worker` |

`service:api` で検索すると全プロダクトのログが混在して返却される。

## 原因

ログの流れ: ECS コンテナ → CloudWatch Logs → Lambda Forwarder (v4.4.0) → Datadog

全サービスの ECS タスク定義でコンテナ名が `api` となっている。
Lambda Forwarder がログストリーム名 `api/<task-family>/<task-id>` の先頭セグメント（= コンテナ名）を service タグに使用するため、全て `service:api` になる。

## 影響

- Datadog UI でログとAPMトレースの自動連携が機能しない（全サービス共通）
- `service:cr-api` や `service:pm-api` でログ検索すると 0件
- `service:api` で検索すると pm-api / cr-api / db-worker のログが混在
- 正しくは `host:` タグでしか区別できない
- 障害調査時にログが見つからないと誤認するリスク
- Datadog の Log-to-Trace 連携、Service Map でのログ表示が不正確

## 修正方法（選択肢）

注意: 全ての方法について実装の確認は未実施。Datadog ドキュメントと Lambda Forwarder ソースコードからの提案であり、実環境での検証が必要。

### 方法1: CloudWatch ロググループにタグ追加

各 CloudWatch ロググループに正しい `service` タグを追加。
Forwarder の `DdEnrichCloudwatchTags` が有効なら、このタグが優先されるとされる。

Terraform 変更イメージ（全サービス分）:

```hcl
# cr-api
resource "aws_cloudwatch_log_group" "cr_api" {
  tags = { service = "cr-api" }
}

# pm-api
resource "aws_cloudwatch_log_group" "pm_api" {
  tags = { service = "pm-api" }
}

# db-worker
resource "aws_cloudwatch_log_group" "db_worker" {
  tags = { service = "db-api" }
}
```

実装前に確認が必要な事項:

- [ ] Lambda Forwarder の `DdEnrichCloudwatchTags` が有効か（v4.x デフォルト有効とされるが未確認）
- [ ] Forwarder Lambda に `logs:ListTagsForResource` IAM 権限があるか
- [ ] CloudWatch ロググループの Terraform 定義の場所（各リポジトリの infra/ 内）
- [ ] Forwarder Lambda の Terraform 定義と現在の設定
- [ ] dev1 環境等で先行テストし、タグが Datadog 側の service に反映されることを検証

### 方法2: Datadog Log Pipeline で Service Remapper（インフラ変更不要）

Datadog 側でログパイプラインを作成し、service タグを上書き。

手順:

1. Datadog UI > Logs > Configuration > Pipelines > New Pipeline
2. フィルタ: `source:ecs host:"/ecs/sotas-prod-cr-api"`
3. プロセッサ追加: Category Processor で `computed_service` = `cr-api`
4. プロセッサ追加: Service Remapper で `computed_service` を読み取り

Terraform:

```hcl
resource "datadog_logs_custom_pipeline" "cr_api_service_remap" {
  name       = "cr-api Service Remapper"
  is_enabled = true
  filter {
    query = "source:ecs host:\"/ecs/sotas-prod-cr-api\""
  }
  processor {
    category_processor {
      name       = "Set service to cr-api"
      target     = "computed_service"
      is_enabled = true
      category {
        name = "cr-api"
        filter { query = "*" }
      }
    }
  }
  processor {
    service_remapper {
      name       = "Remap service"
      is_enabled = true
      sources    = ["computed_service"]
    }
  }
}
```

### 方法3: ECS コンテナ名を `api` → `cr-api` に変更（根本解決）

ECS タスク定義のコンテナ名を変更。ログストリーム名が `cr-api/cr-api/<task-id>` になり、Forwarder が `service:cr-api` を導出。

影響範囲が大きいため、他の参照（ヘルスチェック、サイドカー設定等）の確認が必要。

### 方法4: FireLens (Fluent Bit) に移行（長期）

CloudWatch + Lambda Forwarder をやめ、ECS サイドカーの Fluent Bit から直接 Datadog に送信。
`dd_service: cr-api` を明示指定できる。最も柔軟だが変更量が最大。

## 備考

- いずれの方法も新規ログからの反映。既存のインデックス済みログは変更不可
- pm-api, db-worker も同じ問題を確認済み（2026-03-11 確認: `service:api` で3プロダクト混在）
- 発見日: 2026-03-11（cr-api 障害調査時に判明）
- 対象リポジトリ: sotas-chemical-research, sotas-process-management, sotas-database（各 infra/ ディレクトリ）
