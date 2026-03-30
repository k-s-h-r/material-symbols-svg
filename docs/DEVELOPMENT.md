# 開発ガイド

この文書は、リポジトリを更新する開発者向けの手順をまとめたものです。利用者向けの import 例や API はルート `README.md` と各パッケージの `README.md` を参照してください。

## 前提

- Node.js 16 以上
- `pnpm`
- ESM 前提の TypeScript 実行環境として `tsx` を使用

## 初期セットアップ

```bash
pnpm install
pnpm run build
```

初回は `pnpm run build` を実行して、生成されるアイコンソースと配布物を揃えます。

## 主要コマンド

```bash
# 開発用ビルド（アイコン数を絞る）
pnpm run build:dev

# 本番ビルド
pnpm run build

# フレームワーク別ビルド
pnpm run build:react
pnpm run build:vue

# メタデータのみ再生成
pnpm run build:metadata

# 品質チェック
pnpm run lint
pnpm test
pnpm run knip
```

## 生成物の扱い

このリポジトリでは、アイコン本体のソースはビルド時に生成します。普段手で編集するのは、主にテンプレート・スクリプト・共通型です。

### 手で編集する場所

- `scripts/*.ts`
- `scripts/templates/*.ts`
- `packages/react/src/createMaterialIcon.ts`
- `packages/react/src/types.ts`
- `packages/vue/src/createMaterialIcon.ts`
- `packages/vue/src/types.ts`
- `metadata/*.json`

### ビルドで生成される場所

- `packages/react/src/icons/**`
- `packages/react/src/rounded/**`
- `packages/react/src/sharp/**`
- `packages/vue/src/icons/**`
- `packages/vue/src/rounded/**`
- `packages/vue/src/sharp/**`
- `packages/*/dist/**`
- `packages/metadata/paths/*.json`
- `packages/metadata/icon-index.json`

## 開発モード

`build:dev` は 10 個の代表アイコンだけを生成します。制御は `scripts/dev-icons.ts` に集約されています。

- 有効条件: `NODE_ENV=development` または `ICON_LIMIT=true`
- 目的: 生成時間とメモリ使用量を抑えること

必要なら個別に次のように実行できます。

```bash
NODE_ENV=development pnpm run build:react
ICON_LIMIT=true pnpm run build:vue
```

## スクリプト構成

### アイコン生成

- `scripts/generate-icons.ts`
  - `metadata/icon-catalog.json` を元に、各パッケージ向けのアイコンソースを生成する
- `scripts/generate-exports.ts`
  - `w100` から `w700`、`icons/*`、`rounded/*`、`sharp/*` の export を生成する
- `scripts/templates/react-template.ts`
- `scripts/templates/vue-template.ts`
  - 生成されるコンポーネントのテンプレート

### メタデータ生成

- `scripts/generate-metadata.ts`
  - `packages/metadata/paths/*.json` と `packages/metadata/icon-index.json` を生成する
- `scripts/update-metadata.ts`
  - upstream の差分を取得し、`metadata/icon-catalog.json` と `metadata/update-history.json` を更新する
- `scripts/generate-search-terms-full.ts`
- `scripts/generate-search-terms-incremental.ts`
  - OpenAI API を使って検索語を生成する
- `scripts/categorize-icons.ts`
  - 新規アイコンのカテゴリ分類を補助する

### リリース

- `scripts/update-upstream-deps.ts`
  - `@material-symbols/svg-*` の依存バージョンを更新する
- `scripts/bump-version.ts`
  - 全パッケージの version と update history のリリース版を更新する
- `scripts/prepare-release.ts`
  - version bump と `CHANGELOG.md` の確定だけを行う
- `scripts/release.ts`
  - ローカル公開用に build、commit、tag、push、publish をまとめて行う
- `scripts/release-publish.ts`
  - GitHub Release と npm publish を実行する

## アイコン更新フロー

通常は次の順序です。

```bash
pnpm run update:upstream-deps
pnpm i --lockfile-only --no-frozen-lockfile
pnpm i --frozen-lockfile
pnpm run sync:upstream
pnpm run build:metadata
pnpm run generate:search-terms
pnpm run build:metadata
pnpm run lint
pnpm run build
```

一括実行したい場合は `pnpm run update:icons:auto` を使います。

### `OPENAI_API_KEY` がある場合

- `generate:search-terms` が全体の検索語を更新する
- `sync:upstream` は新規アイコンに対して増分の検索語生成とカテゴリ分類を試みる

### `OPENAI_API_KEY` がない場合

- `pnpm run update:icons` は失敗する
- AI 処理を抜くなら `pnpm run sync:upstream` と `pnpm run build:metadata` を個別に実行する

## ディレクトリの見方

```text
metadata/
  icon-catalog.json        上流同期後の正規カタログ
  search-terms.json        検索語
  update-history.json      更新履歴
  source/                  upstream 取得結果

packages/react/
  src/                     共通コード + 生成アイコン
  dist/                    配布物

packages/vue/
  src/                     共通コード + 生成アイコン
  dist/                    配布物

packages/metadata/
  icon-index.json          配布用メタデータ
  paths/*.json             配布用 path データ
  update-history.json      配布用履歴
```

## トラブルシューティング

### メモリ不足

```bash
NODE_OPTIONS="--max-old-space-size=4096" pnpm run build
```

`build:react` と `build:vue` の内部では Rollup によりさらに大きいメモリ上限を指定しています。

### upstream 同期が失敗する

- ネットワーク到達性
- `raw.githubusercontent.com`
- npm からの upstream version 解決

を先に確認してください。

### 生成物が欠ける

- `pnpm run build:metadata`
- `pnpm run build:react`
- `pnpm run build:vue`

を順に再実行して、どの段階で欠けるかを切り分けます。

## 関連文書

- `docs/RELEASE_MANAGEMENT.md`
- `docs/RELEASE_MANAGEMENT_REFERENCE.md`
