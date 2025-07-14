# CLAUDE.md

このファイルは、このリポジトリでコードを扱う際のClaude Code (claude.ai/code) への指示を提供します。

## 基本ルール

- **ユーザーとは日本語でやり取りを行う**
- **Git コミットメッセージは英語で作成する**
- **コードコメントは英語で記述する**
- **TypeScriptの型定義を必ず含める**
- **ESM専用（CommonJSは使用しない）**

## プロジェクト概要

Material Symbols SVGは、GoogleのMaterial SymbolsをReactおよびVueコンポーネントとして提供するアイコンライブラリです。

## 必須コマンド

```bash
# 開発用ビルド（10個のアイコンに制限）
pnpm run build:dev

# 本番用ビルド（全アイコン）
pnpm run build

# 品質管理
pnpm test
pnpm run lint

# バージョン管理
pnpm run bump:patch         # バグ修正時
pnpm run bump:minor         # 機能追加時
pnpm run bump:major         # 破壊的変更時

# メタデータ更新
pnpm run sync:upstream
```

## 重要な注意事項

### 開発時制限
開発時は10個のアイコンに制限されます：favorite, home, search, settings, arrow_forward, check, close, menu, person, star

### メモリ対処
メモリ不足時: `export NODE_OPTIONS="--max-old-space-size=4096"`

### 必須作業フロー
1. `pnpm run build:dev` - 開発時制限でテスト
2. `pnpm run lint` - 型チェック
3. `pnpm run build` - 本番ビルド前テスト
4. TypeScript型定義(.d.ts)が正しく生成されることを確認