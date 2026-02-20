# AGENTS.md

このファイルは、このリポジトリで作業するあらゆるコーディングエージェント向けの共通ガイドです。

## 基本ルール

- ユーザーとのやり取りは日本語
- Gitコミットメッセージは英語
- コードコメントは英語
- TypeScriptは明示的な型を優先（`noImplicitAny: true`）
- スクリプトは ESM 前提（`type: module` / `moduleResolution: NodeNext`）

## プロジェクト概要

Material Symbols SVG は、Google Material Symbols を React / Vue コンポーネントとして提供するモノレポです。

## よく使うコマンド

```bash
# 開発用ビルド（開発時アイコン制限あり）
pnpm run build:dev

# 本番ビルド
pnpm run build

# メタデータ生成のみ
pnpm run build:metadata

# 品質チェック
pnpm run lint
pnpm test
pnpm run knip

# 上流同期
pnpm run sync:upstream
pnpm run update:upstream-deps
pnpm run update:icons
pnpm run update:icons:auto

# リリース関連
pnpm run bump:auto
pnpm run release:prepare -- --type=auto
pnpm run release
pnpm run release:publish -- --tag=vX.Y.Z
```

## ワークフローの要点

### アイコン更新

1. 依存更新が必要なら `pnpm run update:upstream-deps`
2. `pnpm run sync:upstream`
3. `pnpm run build:metadata`
4. 必要に応じて `pnpm run generate:search-terms`（`OPENAI_API_KEY` 必須）
5. `pnpm run lint` / `pnpm run build`

### リリース

1. `pnpm run release:prepare -- --type=auto`（version / changelog 準備）
2. `pnpm run release`（build, commit, tag, push, release publish）

## 注意事項

- 開発時は一部アイコンのみで生成される（`scripts/dev-icons.ts`）
- メモリ不足時は `NODE_OPTIONS="--max-old-space-size=4096"` を利用
