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

### アイコンアップデートフロー

理想的なリリースワークフロー：

1. **package.jsonの更新（手動）**
   - `dependencies`の`@material-symbols/svg-*`バージョンを更新

2. **上流データの同期**
   ```bash
   pnpm run sync:upstream
   ```
   - アイコン変更を検出すると自動で全パッケージを"unreleased"状態に設定
   - 新規アイコンの検索ワード・カテゴリ自動生成（OPENAI_API_KEY設定時）

3. **ビルドとテスト**
   ```bash
   pnpm run build:dev  # 開発時制限でテスト
   pnpm run lint       # 型チェック
   pnpm run build      # 本番ビルド
   ```

4. **バージョンアップとリリース**
   ```bash
   pnpm run bump:patch  # unreleased解除 + 正式バージョン
   ```

5. **パッケージ公開**
   ```bash
   pnpm run publish-packages
   ```

### バージョン管理の仕組み
- アイコン変更検出時：全パッケージが"x.x.x-unreleased"に設定
- `bump:patch/minor/major`：unreleased状態を解除して正式リリース
- marella/material-symbolsのバージョンは`metadata/source/upstream-version.json`で記録