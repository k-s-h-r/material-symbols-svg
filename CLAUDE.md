# CLAUDE.md

このファイルは、このリポジトリでコードを扱う際のClaude Code (claude.ai/code) へのガイダンスを提供します。

## プロジェクト概要

Material Symbols Reactは、GoogleのMaterial SymbolsをReactコンポーネントとして提供するReactアイコンライブラリです。最適なtree-shakingとメモリ効率のためにLucideスタイルのアーキテクチャを実装しています。このライブラリには3つのスタイル（outlined、rounded、sharp）と7つのウェイト（100-700）にわたる6,680以上のアイコンが含まれており、合計140,280個の個別アイコンファイルがあります。

## ビルドコマンド

```bash
# 開発用ビルド（10個のアイコンに制限）
npm run build:dev      # 開発用完全ビルド
npm run dev            # ウォッチモードでの開発（10個制限）

# 本番用ビルド（全アイコン）
npm run build          # デフォルトビルド（全アイコン）
npm run build:prod     # 本番用完全ビルド（全アイコン）

# 個別実行
npm run build:icons:dev    # 個別アイコン生成（10個制限）
npm run build:weights:dev  # ウェイトエクスポート生成（10個制限）
npm run build:icons       # 個別アイコン生成（全アイコン）
npm run build:weights     # ウェイトエクスポート生成（全アイコン）
npm run build:lib         # ライブラリビルドのみ

# 管理・クリーンアップ
npm run clean          # ビルド成果物をクリーン
```

### 開発時の制限について

開発時は処理速度とメモリ使用量の最適化のため、以下の10個のアイコンに制限されます：

- Home, Settings, Star, Favorite, Person
- Search, Menu, Close, Check, ArrowForward

この制限は以下の方法で制御できます：
- 環境変数: `ICON_LIMIT=true` または `NODE_ENV=development`
- 開発用コマンド: `npm run build:dev`, `npm run dev`

## テストと品質管理

```bash
# テストを実行
npm test

# ウォッチモードでテストを実行
npm run test:watch

# カバレッジ付きでテストを実行
npm run test:coverage

# TypeScriptファイルをリント
npm run lint

# リント問題を自動修正
npm run lint:fix

# Prettierでコードを整形
npm run format

# ファイル出力なしでの型チェック
npm run type-check
```

## アーキテクチャ

### アイコン生成戦略
- **個別ファイル**: 各アイコンバリアントは個別のTypeScriptファイルを生成（合計140,280ファイル）
- **メモリ効率**: すべてのアイコンを一度にバンドルすることを避け、ビルド時のメモリ問題を防止
- **Tree-shaking**: インポートされたアイコンのみが最終バンドルに含まれる
- **パス構造**: `src/icons/{style}/w{weight}/{IconName}.ts`

### コアコンポーネント
- **`createMaterialIcon.ts`**: アイコンコンポーネントを作成するファクトリ関数
- **`types.ts`**: TypeScript型定義
- **ウェイトエクスポート**: `src/{style}/w{weight}.ts` - 各ウェイト毎のエクスポートファイル
- **アイコンファイル**: `src/icons/`ディレクトリ内の個別TypeScriptファイル

### ビルドシステム
- **Rollup**: 選択的ファイルコピーを備えたESM/CommonJSデュアルビルド用に設定
- **TypeScript**: 大規模なアイコンディレクトリを除外し、必須ファイルのみを選択的に含むよう設定
- **生成スクリプト**: 
  - `scripts/generate-icons.cjs` - SVGからアイコンファイル生成
  - `scripts/generate-weight-exports.cjs` - ウェイト毎のエクスポートファイル生成

### インポート方法
1. **ウェイト毎のインポート**: 
   ```ts
   import { Home, Settings } from 'material-symbols-react/w400';
   import { Home as HomeRounded } from 'material-symbols-react/rounded/w400';
   ```
2. **個別アイコンインポート**: 
   ```ts
   import Home from 'material-symbols-react/icons/outlined/w400/Home';
   ```
3. **SVGパスデータ**: アイコンは完全なSVGコンテンツではなく、パスデータ文字列のみを保存
4. **プレビュー機能**: 各アイコンファイルにBase64エンコードされたSVGプレビューを含む

## 開発ノート

### アイコンの再生成時
- **個別アイコン**: `scripts/generate-icons.cjs`が`@material-symbols/svg-{weight}`パッケージからSVGを処理
- **ウェイトエクスポート**: `scripts/generate-weight-exports.cjs`が各ウェイト毎のエクスポートファイルを生成
- TypeScriptファイルのみを生成（.js/.jsonファイルは不要）
- ツール用のメタデータファイルが`src/metadata/`に生成される

### ビルド最適化
- TypeScriptコンパイルはメモリ枯渇を防ぐためアイコンディレクトリを除外
- Rollupはメモリ効率のためpreserveModulesではなく選択的ファイルコピーを使用
- tsconfig includeにより必須ファイルのみがTypeScriptコンパイルに含まれる

### パッケージ構成
- **ESM専用**: package.json type: "module"でESMのみサポート
- **Package Exports**: 各ウェイト・スタイル毎のエクスポートマップを提供
- **TypeScript型**: 全ファイルにTypeScript型定義を含む
- **公開前フック**: テストとリントを自動実行

### Material Symbols統合
- Googleの公式`@material-symbols/svg-*`パッケージからアイコンを取得
- すべての7つのMaterial Symbolウェイト（100、200、300、400、500、600、700）をサポート
- すべての3つのMaterial Symbolスタイル（outlined、rounded、sharp）をサポート
- Material Designの命名規則とSVG viewBox仕様を維持
- 各アイコンにプレビュー用のBase64 SVGデータを含む

### ファイル構造
```
src/
├── icons/                    # 個別アイコンファイル
│   ├── outlined/w{weight}/   # アウトラインスタイル
│   ├── rounded/w{weight}/    # ラウンドスタイル  
│   └── sharp/w{weight}/      # シャープスタイル
├── outlined/                 # アウトライン用ウェイトエクスポート
├── rounded/                  # ラウンド用ウェイトエクスポート
├── sharp/                    # シャープ用ウェイトエクスポート
├── metadata/                 # メタデータファイル
├── createMaterialIcon.ts     # アイコンファクトリ
└── types.ts                  # 型定義
```