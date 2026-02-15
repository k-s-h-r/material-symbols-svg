# リリース管理（詳細 / 参照用）

`docs/RELEASE_MANAGEMENT.md` には手順のみを記載しています。本書は「何がどこで更新されるか」「問題が発生した場合にどこを確認するか」の参照用です。

## 標準運用フロー

1. GitHub Actions 週次ジョブ（`.github/workflows/icon-update.yml`）が upstream 更新PRを作成
2. PR本文の `from/to` と `added/updated/removed` 件数をレビュー
3. PRを `main` にマージ
4. `pnpm run release -- --dry-run` で計画確認
5. `pnpm run release` でタグ作成・GitHub Release・npm publish まで実行

旧手動フロー（ローカル更新→手動リリース）はフォールバックとして維持します。

## 必要CLI / 認証 / 環境変数

- CLI: `node`, `pnpm`, `git`, `gh`, `npm`
- 認証: `gh auth status`, `npm whoami`
- 環境変数（ローカル）: `OPENAI_API_KEY`（`update:icons` 実行時）
- シークレット（GitHub）: `OPENAI_API_KEY`（週次更新ワークフロー）

## コマンド一覧

- `pnpm run sync:upstream`（`scripts/update-metadata.cjs`）
  - `package.json` の `@material-symbols/svg-*` から `marella/material-symbols` のバージョンを決め、`metadata/versions.json` を取得
  - `metadata/icon-catalog.json` を更新（カテゴリは既存を維持、新規は `uncategorized`）
  - 差分（added/updated/removed）を `metadata/update-history.json` に記録（変更があった場合のみ）
  - 上流スナップショットを `metadata/source/` に保存
- `pnpm run generate:search-terms`（`scripts/generate-search-terms.cjs`）
  - OpenAI API を呼び、アイコンの検索ワード（英語）を生成して `metadata/search-terms.json` を更新
  - 必須: `OPENAI_API_KEY`
- `pnpm run build:metadata`（`scripts/generate-metadata.cjs`）
  - `packages/metadata/paths/*.json` と `packages/metadata/icon-index.json` を生成
  - `metadata/search-terms.json` があれば `icon-index.json` に `searchTerms` として反映
- `pnpm run bump:patch|minor|major|auto`（`scripts/bump-version.cjs`）
  - `packages/*/package.json` のバージョンを一括で更新
  - `metadata/update-history.json` の最新エントリが `-unreleased` なら、リリースバージョンに置換
  - `auto` の場合は最新の `update-history` を見て、`added + updated + removed > 0` なら `minor`、0 なら `patch` を自動選択
  - `node scripts/bump-version.cjs --type=major` のように `--type` で手動上書き可能
- `pnpm run release`（`scripts/release.cjs`）
  - 事前チェック（必要CLI, `gh`/`npm` 認証, `main` ブランチ, clean tree）
  - リリース種別判定（`--type=auto` 既定、`--type` で上書き）
  - `bump-version` 実行、`CHANGELOG.md` の `Unreleased` 確定、コミット、タグ、push
  - GitHub Release 作成、`pnpm run publish-packages` 実行
  - `--dry-run` で副作用なし実行計画を表示

## 更新される主なファイル

### ルート（`metadata/`）

- `metadata/icon-catalog.json`（カテゴリ + 上流 version 付きのカタログ）
- `metadata/search-terms.json`（検索ワード）
- `metadata/update-history.json`（更新履歴: added/updated/removed + バージョン情報）
- `metadata/source/versions.json`（上流 `versions.json` の保存）
- `metadata/source/upstream-version.json`（取得した上流バージョン情報）

### 配布（`packages/metadata/`）

- `packages/metadata/icon-index.json`（配布用メタデータ。検索ワードがあれば含む）
- `packages/metadata/update-history.json`（配布版の更新履歴）
- `packages/metadata/paths/*.json`（各アイコンの path データ。リポジトリでは `.gitignore` で除外）

## `-unreleased` の扱い

- `sync:upstream` で差分が検出されると、`metadata/update-history.json` の `package_version` は `{packages/metadata/package.json の version}-unreleased` として記録されます。
- `bump:*` を実行すると、`packages/*` のバージョン更新に加えて、履歴の最新エントリが `-unreleased` ならリリース版に更新されます。

## バージョン種別の自動判定ルール

- 判定対象は `metadata/update-history.json` の最新エントリ
- `added + updated + removed > 0` の場合: `minor`
- `added + updated + removed = 0` の場合: `patch`
- 判定結果（件数と最終決定）は `bump-version.cjs` の実行ログに必ず表示されます
- `--type=patch|minor|major|auto` で判定を上書きできます（`--type` が優先）

## AI（カテゴリ/検索ワード）

- `sync:upstream` は、新規 `uncategorized` がいて `OPENAI_API_KEY` がある場合に、内部で以下を試みます（失敗しても同期自体は継続）:
  - `node scripts/generate-search-terms-new.cjs`（新規アイコンだけ検索ワード生成）
  - `node scripts/categorize-icons.cjs`（カテゴリ分類）
- いっぽう `pnpm run generate:search-terms` は `OPENAI_API_KEY` が無いと失敗します（`update:icons` が止まる理由になります）。

## 便利コマンド

- 最新の更新履歴確認: `node -e "const h=require('./metadata/update-history.json'); console.log(h[0]);"`
- 件数だけ確認: `node -e "const h=require('./metadata/update-history.json')[0]; console.log({added:h.added.length,updated:h.updated.length,removed:h.removed.length});"`

## よくある問題

- `sync:upstream` が失敗する: ネットワーク（`raw.githubusercontent.com`）への到達性を確認
- `update:icons` が失敗する: `OPENAI_API_KEY` が設定されているか確認（AI を使用しない場合は `sync:upstream` + `build:metadata` を実行）
- `build:metadata` の実行が重い: `NODE_OPTIONS="--max-old-space-size=4096"` などで Node のメモリ上限を引き上げる
- `pnpm run release` が失敗する: 標準出力の `Recovery steps` に従って、失敗ステップ以降を再開する
