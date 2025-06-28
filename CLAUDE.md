# CLAUDE.md

このファイルは、このリポジトリでコードを扱う際のClaude Code (claude.ai/code) へのガイダンスを提供します。

## プロジェクト概要

Material Symbols SVGは、GoogleのMaterial SymbolsをReactコンポーネントとして提供するReactアイコンライブラリです。SVGパスデータを使用してWebフォントではなく、最適なtree-shakingとメモリ効率を実現します。このライブラリには3つのスタイル（outlined、rounded、sharp）と7つのウェイト（100-700）にわたる3,340個のアイコンが含まれています。

### パッケージ構成

3つの独立したnpmパッケージとして公開：
- `@material-symbols-svg/react` (v0.1.2) - Outlined style
- `@material-symbols-svg/react-rounded` (v0.1.2) - Rounded style  
- `@material-symbols-svg/react-sharp` (v0.1.2) - Sharp style

## ビルドコマンド

```bash
# 開発用ビルド（10個のアイコンに制限）
npm run build:icons:dev    # 個別アイコン生成（10個制限）

# 本番用ビルド（全アイコン）
npm run build              # デフォルトビルド（全アイコン）
npm run build:icons        # 個別アイコン生成（全アイコン）

# スタイル別ビルド
npm run build:icons:outlined  # Outlined style のみ
npm run build:icons:rounded   # Rounded style のみ  
npm run build:icons:sharp     # Sharp style のみ

# 品質管理
npm test                   # テストを実行
npm run lint              # TypeScriptファイルをリント

# 公開
npm run publish-packages  # 全パッケージをnpmに公開
```

### 開発時の制限について

開発時は処理速度とメモリ使用量の最適化のため、以下の10個のアイコンに制限されます：

- favorite, home, search, settings (action)
- arrow_forward, check, close, menu (navigation)
- person (social)
- star (toggle)

この制限は環境変数 `NODE_ENV=development` で制御されます。

## アーキテクチャ

### アイコン生成戦略
- **個別ファイル**: 各アイコンは個別のTypeScriptファイルを生成（3,340ファイル × 3スタイル）
- **SVGパスデータ**: アイコンは完全なSVGコンテンツではなく、パスデータ文字列のみを保存
- **メモリ効率**: すべてのアイコンを一度にバンドルすることを避け、ビルド時のメモリ問題を防止
- **Tree-shaking**: インポートされたアイコンのみが最終バンドルに含まれる

### コアコンポーネント
- **`createMaterialIcon.ts`**: アイコンコンポーネントを作成するファクトリ関数
- **`types.ts`**: TypeScript型定義
- **ウェイトエクスポート**: `w{weight}.ts` - 各ウェイト毎のエクスポートファイル
- **アイコンファイル**: `src/icons/`ディレクトリ内の個別TypeScriptファイル

### ビルドシステム
- **Rollup**: ESMビルドとTypeScript型定義(.d.ts)の生成
- **生成スクリプト**: 
  - `scripts/generate-icons.cjs` - SVGからアイコンファイル生成
  - `scripts/generate-exports.cjs` - ウェイト毎のエクスポートファイル生成

### インポート方法
1. **ウェイト毎のインポート**: 
   ```ts
   import { Home, Settings } from '@material-symbols-svg/react/w400';
   import { Home as HomeRounded } from '@material-symbols-svg/react-rounded/w400';
   ```
2. **個別アイコンインポート**: 
   ```ts
   import Home from '@material-symbols-svg/react/icons/home';
   ```
3. **デフォルト（w400）インポート**:
   ```ts
   import { Home, Settings } from '@material-symbols-svg/react';
   ```

## 開発ノート

### アイコンの再生成時
- **個別アイコン**: `scripts/generate-icons.cjs`が`@material-symbols/svg-{weight}`パッケージからSVGを処理
- **ウェイトエクスポート**: `scripts/generate-exports.cjs`が各ウェイト毎のエクスポートファイルを生成
- TypeScriptファイルのみを生成（.js/.jsonファイルは不要）
- メタデータファイルが`src/metadata/`と`metadata/`に生成される

### パッケージ構成
- **ESM専用**: package.json type: "module"でESMのみサポート
- **Package Exports**: 各ウェイト毎のエクスポートマップを提供
- **TypeScript型**: 全ファイルにTypeScript型定義(.d.ts)を含む
- **Individual icons**: 個別アイコンのパスもexportsに含まれる

### Material Symbols統合
- Googleの公式`@material-symbols/svg-*`パッケージからアイコンを取得
- すべての7つのMaterial Symbolウェイト（100、200、300、400、500、600、700）をサポート
- すべての3つのMaterial Symbolスタイル（outlined、rounded、sharp）をサポート
- Material Designの命名規則とSVG viewBox仕様を維持
- カテゴリメタデータから`"symbols"`カテゴリを除外（より有用なカテゴリ分類のため）

### ファイル構造
```
packages/
├── react/                    # Outlined style package
│   ├── src/
│   │   ├── icons/           # 個別アイコンファイル (3,340個)
│   │   ├── metadata/        # メタデータファイル
│   │   ├── createMaterialIcon.ts
│   │   ├── types.ts
│   │   ├── w100.ts ~ w700.ts # ウェイト別エクスポート
│   │   └── index.ts         # デフォルト(w400)エクスポート
│   ├── dist/                # ビルド出力
│   ├── package.json
│   └── rollup.config.mjs
├── react-rounded/           # Rounded style package (同様の構造)
└── react-sharp/             # Sharp style package (同様の構造)

scripts/
├── generate-icons.cjs       # アイコン生成スクリプト
└── generate-exports.cjs     # エクスポートファイル生成

metadata/                    # グローバルメタデータ
├── icon-index.json         # アイコンカテゴリ情報
└── paths/                  # アイコンパスデータ
```

### 公開プロセス
1. バージョン更新: パッケージのversion フィールドを更新
2. ビルド: `npm run build` で全パッケージをビルド
3. コミット: 変更をgitにコミット（公開前フックが実行される）
4. 公開: `npm run publish-packages` で全パッケージを同時公開

### 注意事項
- アイコン数が多いため、ビルドには時間がかかります（約1-2分）
- TypeScript型情報(.d.ts)が正しく生成されることを確認してください
- 開発時は10個制限でテストし、本番ビルド前に全アイコンでテストしてください