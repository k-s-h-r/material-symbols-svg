# リリース手順（週次PR → レビュー → 公開）

本書は通常運用で使う最短手順です。詳細仕様・更新ファイル一覧・トラブルシューティングは `docs/RELEASE_MANAGEMENT_REFERENCE.md` を参照してください。

## 前提

- 必須CLI: `node`, `pnpm`, `git`, `gh`, `npm`
- 必須認証: `gh auth status` が成功、`npm whoami` が成功
- 必須環境変数（アイコン更新時）: `OPENAI_API_KEY`
- GitHub Actions 週次更新PRを使う場合、リポジトリシークレット `OPENAI_API_KEY` が設定済み
- GitHub Actions リリースを使う場合、リポジトリシークレット `NPM_TOKEN` が設定済み

## 標準フロー（推奨）

1. 週次ワークフロー（`.github/workflows/icon-update.yml`）が更新PRを作成する
2. PR本文の `from/to` バージョンと `added/updated/removed` 件数を確認してレビューする
3. PRを `main` にマージする
4. リリース方法を選ぶ（ローカル実行または GitHub Actions）

### ローカルでリリース

```bash
pnpm run release:local -- --dry-run
pnpm run release:local
```

`release:local` は内部で `pnpm run build` を実行してから publish します。

### GitHub Actions でリリース

`.github/workflows/release.yml` を手動実行します（Actions UI または CLI）。

```bash
# 計画確認のみ
gh workflow run release.yml --ref main -f dry_run=true

# 実リリース
gh workflow run release.yml --ref main -f dry_run=false
```

`release.yml` は `pnpm run release:ci` を実行し、コミットを作らずにタグ/Release/publish を行います。

## 互換コマンド

以下は後方互換のため有効です（内部的には `release:local` を実行）:

```bash
pnpm run release -- --dry-run
pnpm run release
```

## リリース種別の判定

- 既定は `--type=auto`
- 判定対象は最新 `update-history` エントリ
- `added + updated + removed > 0` なら `minor`
- `added + updated + removed = 0` なら `patch`
- 手動上書き: `pnpm run release:local -- --type=major`

## 例外時フォールバック（手動更新）

週次PRが使えない場合は、以下を手動実行して同等の更新PRを作成します。

```bash
pnpm run update:icons:auto
pnpm run build
```

`update:icons:auto` の内訳:
- `pnpm run update:upstream-deps`（`svg-100`〜`svg-700` を同一バージョンへ更新）
- `pnpm i`
- `pnpm run update:icons`

## 失敗時の復旧（`release:local` / `release:ci`）

- preflight失敗（CLI/認証/branch/dirty tree）: 問題を解消して `pnpm run release:local -- --dry-run` から再実行
- bump/CHANGELOG後に停止: `git status --short` で状態確認し、`release.cjs` の表示する Recovery steps に従って再開
- publish失敗: バージョン・タグ重複を確認し、必要なら `pnpm run publish-packages` を再実行
- 緊急時は手動フォールバック（`bump:*`, CHANGELOG確定, タグ, GitHub Release, `publish-packages`）で完遂可能
