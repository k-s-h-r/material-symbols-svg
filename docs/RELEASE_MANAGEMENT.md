# リリース手順（標準は CI 公開）

本書は運用手順のみを記載します。詳細仕様は `docs/RELEASE_MANAGEMENT_REFERENCE.md` を参照してください。

## 結論

- 標準運用では `icon-update.yml` でPRを作成し、`release.yml` で公開します。
- ローカルで公開する場合も、手順は `release:prepare` → `release` に統一します。

## 前提

- 必須CLI: `node`, `pnpm`, `git`, `gh`, `npm`
- 必須認証: `gh auth status` が成功、`npm whoami` が成功
- 必須環境変数（アイコン更新時）: `OPENAI_API_KEY`
- GitHub シークレット（週次更新PR）: `OPENAI_API_KEY`
- GitHub シークレット（タグ起点リリース）: `NPM_TOKEN`

## 1. 標準フロー（推奨: 週次PR + タグ起点CI公開）

1. `.github/workflows/icon-update.yml` が更新PRを作成する。
2. PR本文の `from/to`、`added/updated/removed`、`Release tag (manual)` をレビューする。
3. PRを `main` にマージする。
4. PR本文の案内どおりにタグを作成してpushする（例: `git tag v0.1.20 && git push origin v0.1.20`）。
5. `.github/workflows/release.yml` が `build + release:publish`（GitHub Release + npm publish）を実行する。

## 2. 手動更新 + CI公開（週次PRを使わない場合）

```bash
pnpm run update:icons:auto
pnpm run release:prepare -- --type=auto
git add -A
git commit -m "chore: icon update + release prepare"
```

このコミットでPRを作成し、`main` マージ後にタグを手動pushします。公開は `release.yml` が行います。

## 3. ローカル公開（CIを使わない場合）

```bash
pnpm run update:icons:auto
pnpm run release:prepare -- --type=auto
pnpm run release -- --dry-run
pnpm run release
```

`release` は `build + releaseコミット + tag/push + release:publish` を実行します。
実行時点のブランチにコミットして push します（detached HEAD では実行不可）。

## リリース種別の自動判定（共通）

- 判定ロジックは `scripts/bump-version.cjs` の `resolveVersionType` に一本化されています。
- `--type=auto` は `metadata/update-history.json` の最新エントリで判定します。
- 最新履歴が `-unreleased` かつ `added + updated + removed > 0` なら `minor`。
- それ以外は `patch`。
- 手動上書きは `release:prepare -- --type=patch|minor|major` で可能です。

## 失敗時の復旧

- タグ起点リリース失敗: `.github/workflows/release.yml` のログを確認し、必要なら同じタグで rerun します。
- `release` 失敗: `pnpm run release -- --dry-run` で再確認し、`scripts/release.cjs` の `Recovery steps` に従います。
