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
```

## 注意事項

- 開発時は一部アイコンのみで生成される（`scripts/dev-icons.ts`）
- メモリ不足時は `NODE_OPTIONS="--max-old-space-size=4096"` を利用
