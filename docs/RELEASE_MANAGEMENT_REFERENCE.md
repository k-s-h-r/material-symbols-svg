# リリース管理リファレンス

`docs/RELEASE_MANAGEMENT.md` は実行手順だけを載せた短い版です。こちらは、どの処理がどのファイルを更新するかを確認するための参照用です。

## ワークフロー全体像

### 標準フロー

1. `.github/workflows/icon-update.yml`
   - `pnpm run update:icons:auto`
   - `pnpm run build:metadata`
   - `pnpm exec tsx scripts/sync-dependencies.ts`
   - `pnpm i --lockfile-only --no-frozen-lockfile`
   - `pnpm run release:prepare -- --type=auto`
   を実行して PR を作成する
2. PR をレビューして `main` にマージする
3. PR 本文にある `vX.Y.Z` タグを手動で push する
4. `.github/workflows/release.yml` が
   - `pnpm run build:metadata`
   - `pnpm run build:react`
   - `pnpm run build:vue`
   - `pnpm run release:publish -- --tag=vX.Y.Z`
   を実行する

### ローカル公開フロー

1. `pnpm run release:prepare -- --type=auto`
2. `pnpm run release -- --dry-run`
3. `pnpm run release`

## 主要コマンドと責務

### upstream / metadata

- `pnpm run update:upstream-deps` (`scripts/update-upstream-deps.ts`)
  - `package.json` と各パッケージの `@material-symbols/svg-*` 依存バージョンを更新する
- `pnpm run sync:upstream` (`scripts/update-metadata.ts`)
  - upstream の `versions.json` を取得する
  - `metadata/icon-catalog.json` を更新する
  - `metadata/update-history.json` と `packages/metadata/update-history.json` を更新する
  - `metadata/source/` に取得結果を保存する
- `pnpm run generate:search-terms` (`scripts/generate-search-terms-full.ts`)
  - `metadata/search-terms.json` を更新する
  - `OPENAI_API_KEY` が必須
- `pnpm run build:metadata` (`scripts/generate-metadata.ts`)
  - `packages/metadata/paths/*.json`
  - `packages/metadata/icon-index.json`
  を生成する

### version / changelog / publish

- `pnpm run bump:patch|minor|major|auto` (`scripts/bump-version.ts`)
  - `packages/*/package.json` の version を揃える
  - 最新の update history が `-unreleased` ならリリース版に確定する
- `pnpm run release:prepare -- --type=...` (`scripts/prepare-release.ts`)
  - `bump-version.ts` を呼ぶ
  - `CHANGELOG.md` の `Unreleased` を確定する
  - build、tag、push、publish は行わない
- `pnpm run release` (`scripts/release.ts`)
  - ローカル公開用の最終工程
  - build、release commit、tag、push、`release:publish` を実行する
- `pnpm run release:publish -- --tag=vX.Y.Z` (`scripts/release-publish.ts`)
  - GitHub Release の作成または更新
  - npm publish

## 主に更新されるファイル

### ルートの管理データ

- `metadata/icon-catalog.json`
- `metadata/search-terms.json`
- `metadata/update-history.json`
- `metadata/source/versions.json`
- `metadata/source/upstream-version.json`

### 配布用データ

- `packages/metadata/icon-index.json`
- `packages/metadata/paths/*.json`
- `packages/metadata/update-history.json`

### version / changelog

- `CHANGELOG.md`
- `packages/react/package.json`
- `packages/vue/package.json`
- `packages/metadata/package.json`

## `-unreleased` の扱い

- `sync:upstream` で差分が見つかると、最新履歴は `X.Y.Z-unreleased` として記録される
- `bump:*` または `release:prepare` を実行すると、その最新履歴がリリース版に確定する

## 自動判定ルール

`scripts/bump-version.ts` の `resolveVersionType` が単一の判定源です。

- 最新履歴が `-unreleased` ではない場合: `patch`
- 最新履歴が `-unreleased` で、`added + updated + removed > 0` の場合: `minor`
- それ以外: `patch`

手動上書きは `--type=patch|minor|major` です。

## AI 処理

- `sync:upstream` は、新規 `uncategorized` アイコンがあり `OPENAI_API_KEY` もある場合に
  - `scripts/generate-search-terms-incremental.ts`
  - `scripts/categorize-icons.ts`
  を内部から試行する
- `pnpm run generate:search-terms` は API キーがないと失敗する

## 失敗時の確認ポイント

- upstream 同期失敗: `raw.githubusercontent.com` への到達性
- release workflow 失敗: `.github/workflows/release.yml` のログ
- ローカル publish 失敗: `pnpm run release -- --dry-run` と `scripts/release.ts` の recovery steps
