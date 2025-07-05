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
pnpm run build:icons:dev    # 個別アイコン生成（10個制限）

# 本番用ビルド（全アイコン）
pnpm run build              # デフォルトビルド（全アイコン）
pnpm run build:icons        # 個別アイコン生成（全アイコン）

# スタイル別ビルド
pnpm run build:icons:outlined  # Outlined style のみ
pnpm run build:icons:rounded   # Rounded style のみ  
pnpm run build:icons:sharp     # Sharp style のみ

# 品質管理
pnpm test                   # テストを実行
pnpm run lint              # TypeScriptファイルをリント

# バージョン管理
pnpm run bump:patch         # パッチバージョン更新
pnpm run bump:minor         # マイナーバージョン更新
pnpm run bump:major         # メジャーバージョン更新

# 公開
pnpm run publish-packages  # 全パッケージをnpmに公開

# メタデータ更新
pnpm run update:metadata       # 上流からメタデータを更新
pnpm run generate:search-terms # 検索用文字列を生成
pnpm run sync:upstream         # メタデータ更新とビルドを実行
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

### バージョン管理

**自動バージョン管理機能**が実装されています。全パッケージのバージョンを一括で更新できます。

#### バージョン更新コマンド

```bash
# パッチバージョン（バグ修正、改善）
pnpm run bump:patch      # 0.1.6 → 0.1.7

# マイナーバージョン（アイコン追加・削除、新機能）
pnpm run bump:minor      # 0.1.6 → 0.2.0

# メジャーバージョン（破壊的変更）
pnpm run bump:major      # 0.1.6 → 1.0.0
```

#### バージョニング戦略

- **パッチ (patch)**: バグ修正、パフォーマンス改善、ドキュメント更新、軽微なコード改善
- **マイナー (minor)**: アイコンの追加・削除、新機能追加、非破壊的な変更
- **メジャー (major)**: 破壊的変更（API変更、コンポーネント構造の変更、型定義の変更）

#### 使用例

```bash
# アイコンを新しく追加した場合
pnpm run bump:minor

# バグを修正した場合
pnpm run bump:patch

# APIを変更した場合
pnpm run bump:major
```

### 公開プロセス
1. **バージョン更新**: 上記のbumpコマンドで全パッケージのバージョンを更新
2. **ビルド**: `pnpm run build` で全パッケージをビルド
3. **コミット**: 変更をgitにコミット（公開前フックが実行される）
4. **公開**: `pnpm run publish-packages` で全パッケージを同時公開

### 注意事項
- アイコン数が多いため、ビルドには時間がかかります（約1-2分）
- TypeScript型情報(.d.ts)が正しく生成されることを確認してください
- 開発時は10個制限でテストし、本番ビルド前に全アイコンでテストしてください

## Material Symbols 上流データ更新

### 自動更新システム

Material Symbols の上流データを自動的に取得し、ローカルメタデータを更新するシステムが実装されています。

### 更新プロセス

1. **メタデータ更新**: `pnpm run update:metadata`
   - Google の [current_versions.json](https://github.com/google/material-design-icons/blob/master/update/current_versions.json) からカテゴリ情報を取得
   - marella/material-symbols の [versions.json](https://github.com/marella/material-symbols/blob/main/metadata/versions.json) から最新アイコン一覧を取得
   - 両方のデータをマージして `metadata/icon-index.json` を更新

2. **アイコン検索用文字列生成**: `pnpm run generate:search-terms`
  - アイコンに関連するワードを4o-miniで生成

2. **統合更新**: `pnpm run sync:upstream`
   - メタデータ更新とビルドを一括実行
   - 変更されたアイコンの確認と更新履歴の記録

### 更新履歴の管理

- **更新履歴**: `metadata/update-history.json`
  - 新規追加、更新、削除されたアイコンを記録
  - タイムスタンプ付きで変更ログを管理
  - 最新100件の更新記録を保持

### 変更検出

システムは以下の変更を自動的に検出します：

- **新規追加**: 新しく追加されたアイコン
- **更新**: カテゴリ情報が変更されたアイコン  
- **削除**: 削除されたアイコン

### 使用方法

```bash
# 上流データからメタデータを更新
pnpm run update:metadata

# 検索用文字列を生成
pnpm run generate:search-terms

# メタデータ更新とビルドを一括実行
pnpm run sync:upstream
```

### 更新データソース

- **カテゴリ情報**: [Google Material Design Icons](https://github.com/google/material-design-icons/blob/master/update/current_versions.json)
- **アイコン一覧**: [marella/material-symbols](https://github.com/marella/material-symbols/blob/main/metadata/versions.json)
- **SVG データ**: `@material-symbols/svg-*` パッケージ（package.json で管理）

### 詳細なワークフロー

詳細な更新手順、トラブルシューティング、実行例については [UPDATE_WORKFLOW.md](docs/UPDATE_WORKFLOW.md) を参照してください。