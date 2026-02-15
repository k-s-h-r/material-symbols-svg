# リリース手順（アイコン更新 → バージョン → 公開）

本書では、通常のリリース作業で実施する手順のみを記載します。仕組み・ファイル構成・トラブルシューティングは `docs/RELEASE_MANAGEMENT_REFERENCE.md` を参照してください。

## 前提

- Node.js および pnpm がインストールされている
- インターネットに接続できる（`sync:upstream` は GitHub から取得します）
- `pnpm run update:icons` を使用する場合、`OPENAI_API_KEY` が設定されている（検索ワード生成で OpenAI API を使用します）
- Claude Code の `/release` を使用する場合、`gh`（GitHub CLI）および `jq` が利用できる
- npm publish 権限があり、認証が完了している（例: `npm whoami` が成功する）

## ⭐️ アイコンアップデートの流れ

### 1) upstream 依存のバージョンを更新

```bash
pnpm run update:upstream-deps
```

- `npm view @material-symbols/svg-100 version` から最新バージョンを取得し、`@material-symbols/svg-100`〜`svg-700` を同一バージョンへ更新します
- 既に同バージョンの場合は変更なしで終了します

特定バージョンを指定する場合:

```bash
pnpm run update:upstream-deps -- --version=x.y.z
```

### 2) 依存を更新

```bash
pnpm i
```

### 3) アイコンメタデータを更新

```bash
pnpm run update:icons
```

または、1)〜3) を一括で実行:

```bash
pnpm run update:icons:auto
```

内訳（概要）:
- `pnpm run sync:upstream`
  - `package.json` で指定したバージョンに対応する `marella/material-symbols` の `metadata/versions.json` を取得
  - 前回状態と比較し、追加/更新/削除を `metadata/update-history.json` に記録（この時点では `-unreleased` として記録）
  - `metadata/icon-catalog.json` と `metadata/source/*` を更新
- `pnpm run generate:search-terms`
  - 追加アイコンの検索ワードを OpenAI で生成し `metadata/search-terms.json` を更新
- `pnpm run build:metadata`
  - `packages/metadata/icon-index.json` など配布用メタデータを生成（未分類は `uncategorized` のまま）

`OPENAI_API_KEY` を設定しない場合:
```bash
pnpm run sync:upstream
pnpm run build:metadata
```

### 4) ビルド

```bash
pnpm run build
```

### 5) リリース（どちらか）

#### A. Claude Code（推奨）

Claude Code で `/release` を実行し、指示に従って進めます（CHANGELOG 更新 → バージョン更新 → タグ作成 → push → GitHub Release 作成）。

#### B. 手動

1. `pnpm run bump:patch`（または `bump:minor` / `bump:major`）
2. `CHANGELOG.md` の `Unreleased` を新しいバージョンセクションへ移動し、下部リンクも更新
3. `CHANGELOG.md` とバージョン更新された `packages/*/package.json` をコミット
4. Git タグ作成 → `git push origin main --tags`
5. GitHub でリリース作成（CHANGELOG の該当セクションを使用）

### 6) 公開

```bash
pnpm run publish-packages
```

（補足）公開するパッケージを絞る場合は `pnpm run publish-react` / `pnpm run publish-vue` / `pnpm run publish-metadata` を使います。
