# リリース手順

この文書は実運用の手順だけをまとめた短い版です。どのスクリプトが何を更新するかは `docs/RELEASE_MANAGEMENT_REFERENCE.md` を参照してください。

## 前提

- 必須 CLI: `node`, `pnpm`, `git`, `gh`, `npm`
- ローカル認証: `gh auth status` と `npm whoami` が成功すること
- アイコン更新時の環境変数: `OPENAI_API_KEY`
- GitHub Actions のシークレット: `OPENAI_API_KEY`, `NPM_TOKEN`

## 1. 標準フロー

推奨運用は「更新 PR を作成してから、タグ push で公開する」流れです。

1. `.github/workflows/icon-update.yml` が `pnpm run update:icons:auto` と `pnpm run release:prepare -- --type=auto` を実行し、更新 PR を作成する
2. PR 本文の upstream version、`added/updated/removed`、予定タグ、version/changelog 更新を確認する
3. PR を `main` にマージする
4. PR 本文に出ているタグを作成して push する

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

5. `.github/workflows/release.yml` がタグ push を契機に build と `release:publish` を実行する

## 2. 手動更新 + CI 公開

週次 PR を使わずに同じ流れを手元で再現する場合は、次を実行します。

```bash
pnpm run update:icons:auto
pnpm run build:metadata
pnpm i --lockfile-only --no-frozen-lockfile
pnpm run release:prepare -- --type=auto
git add -A
git commit -m "chore: prepare icon update release"
```

このコミットで PR を作成し、`main` マージ後にタグを push します。公開処理自体は `release.yml` が担います。

## 3. ローカル公開

CI を使わずにローカルから公開する場合は、先に `release:prepare` を済ませてから `release` を実行します。

```bash
pnpm run release:prepare -- --type=auto
pnpm run release -- --dry-run
pnpm run release
```

`release` は build、release commit、tag 作成、push、`release:publish` をまとめて実行します。detached HEAD では実行できません。

## リリース種別の自動判定

- 判定実装は `scripts/bump-version.ts` の `resolveVersionType`
- 最新の `metadata/update-history.json` が `-unreleased` で、かつ `added + updated + removed > 0` なら `minor`
- それ以外は `patch`
- 手動上書きは `pnpm run release:prepare -- --type=patch|minor|major`

## 失敗時の復旧

- タグ起点リリース失敗: `.github/workflows/release.yml` のログを確認し、必要なら同じタグで rerun
- `pnpm run release` 失敗: `pnpm run release -- --dry-run` で計画を確認し、`scripts/release.ts` が出す recovery steps に従う
