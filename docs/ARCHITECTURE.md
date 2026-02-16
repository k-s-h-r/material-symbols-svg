# アーキテクチャ

Material Symbols SVGプロジェクトのアーキテクチャとシステム設計について説明します。

## アーキテクチャ概要

Material Symbols SVGは、GoogleのMaterial SymbolsをReactおよびVueコンポーネントとして提供するフレームワーク横断的なアイコンライブラリです。SVGパスデータを使用してWebフォントではなく、最適なtree-shakingとメモリ効率を実現します。

### 主要な設計原則

1. **フレームワーク横断性**: React、Vue両方をサポート
2. **メモリ効率**: 個別ファイル生成によるメモリ最適化
3. **Tree-shaking**: 使用されるアイコンのみバンドルに含める
4. **型安全性**: 完全なTypeScriptサポート

## アイコン生成戦略

### 個別ファイル生成
- **ファイル数**: 各アイコンは個別のTypeScriptファイルを生成（3,340ファイル × 3スタイル）
- **メリット**: すべてのアイコンを一度にバンドルすることを避け、ビルド時のメモリ問題を防止
- **Tree-shaking**: インポートされたアイコンのみが最終バンドルに含まれる

### SVGパスデータの使用
- **データ形式**: アイコンは完全なSVGコンテンツではなく、パスデータ文字列のみを保存
- **メリット**: ファイルサイズの削減と処理速度の向上
- **実装**: `createMaterialIcon`ファクトリ関数でSVGコンポーネントを生成

```typescript
// アイコンファイルの例
const pathData = "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z";
export default createMaterialIcon("home", pathData);
```

## コアコンポーネント

### createMaterialIcon.ts
アイコンコンポーネントを作成するファクトリ関数

**責務:**
- SVGパスデータからReact/Vueコンポーネントを生成
- プロパティ（サイズ、色、クラス名など）の処理
- アクセシビリティ属性の設定

**React版の例:**
```typescript
export default function createMaterialIcon(
  name: string,
  path: string
): React.FC<MaterialIconProps> {
  return ({ size = 24, color, className, ...props }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color || 'currentColor'}
      className={`material-icon material-icon-${name} ${className || ''}`}
      {...props}
    >
      <path d={path} />
    </svg>
  );
}
```

### types.ts
TypeScript型定義

**定義内容:**
- `MaterialIconProps`: アイコンコンポーネントのプロパティ型
- `IconWeight`: サポートするウェイト（100-700）
- `IconStyle`: サポートするスタイル（outlined、rounded、sharp）

### ウェイトエクスポート
`w{weight}.ts` - 各ウェイト毎のエクスポートファイル

**機能:**
- 各ウェイト（100、200、300、400、500、600、700）のアイコンを一括エクスポート
- 開発時制限（10個アイコン）の適用
- 型定義の提供

## ビルドシステム

### Rollup設定
- **ESMビルド**: package.json type: "module"でESMのみサポート
- **TypeScript型定義**: 全ファイルにTypeScript型定義(.d.ts)を含む
- **最適化**: バンドルサイズの最小化とtree-shaking対応

### 生成スクリプト

#### scripts/generate-icons.cjs
SVGからアイコンファイル生成

**処理フロー:**
1. `@material-symbols/svg-{weight}`パッケージからSVGファイルを読み込み
2. SVGからパスデータを抽出
3. フレームワーク別テンプレートを使用してTypeScriptファイルを生成
4. `src/icons/`ディレクトリに出力

#### scripts/generate-exports.cjs
ウェイト毎のエクスポートファイル生成

**処理フロー:**
1. 生成されたアイコンファイルを検索
2. 各ウェイト毎にエクスポートファイルを生成
3. 開発時制限（10個アイコン）を適用
4. 型定義ファイルも同時生成

## パッケージ構成

### 3つの独立パッケージ

**React パッケージ:**
- `@material-symbols-svg/react` - Outlined / Rounded / Sharp style

**Vue パッケージ:**
- `@material-symbols-svg/vue` - Outlined / Rounded / Sharp style

**メタデータパッケージ:**
- `@material-symbols-svg/metadata` - アイコンメタデータとパスデータ

### Package Exports
各パッケージは以下のエクスポートパターンを提供：

```json
{
  "exports": {
    ".": { "import": "./dist/w400.js", "types": "./dist/w400.d.ts" },
    "./w100": { "import": "./dist/w100.js", "types": "./dist/w100.d.ts" },
    "./w200": { "import": "./dist/w200.js", "types": "./dist/w200.d.ts" },
    "./w300": { "import": "./dist/w300.js", "types": "./dist/w300.d.ts" },
    "./w400": { "import": "./dist/w400.js", "types": "./dist/w400.d.ts" },
    "./w500": { "import": "./dist/w500.js", "types": "./dist/w500.d.ts" },
    "./w600": { "import": "./dist/w600.js", "types": "./dist/w600.d.ts" },
    "./w700": { "import": "./dist/w700.js", "types": "./dist/w700.d.ts" },
    "./icons/*": { "import": "./dist/icons/*.js", "types": "./dist/icons/*.d.ts" }
  }
}
```

## ファイル構造

```
packages/
├── react/                    # React package (Outlined / Rounded / Sharp)
│   ├── src/
│   │   ├── icons/           # 個別アイコンファイル (3,340個)
│   │   ├── rounded/         # Rounded style entry/icons
│   │   ├── sharp/           # Sharp style entry/icons
│   │   ├── metadata/        # メタデータファイル
│   │   ├── createMaterialIcon.ts
│   │   ├── types.ts
│   │   ├── w100.ts ~ w700.ts # ウェイト別エクスポート
│   │   └── index.ts         # デフォルト(w400)エクスポート
│   ├── dist/                # ビルド出力
│   ├── package.json
│   └── rollup.config.mjs
├── vue/                     # Vue package (Outlined / Rounded / Sharp)
│   ├── src/
│   │   ├── icons/           # 個別アイコンファイル (3,340個)
│   │   ├── rounded/         # Rounded style entry/icons
│   │   ├── sharp/           # Sharp style entry/icons
│   │   ├── metadata/        # メタデータファイル
│   │   ├── createMaterialIcon.ts
│   │   ├── types.ts
│   │   ├── w100.ts ~ w700.ts # ウェイト別エクスポート
│   │   └── index.ts         # デフォルト(w400)エクスポート
│   ├── dist/                # ビルド出力
│   ├── package.json
│   └── rollup.config.mjs
└── metadata/                # メタデータパッケージ
    ├── icon-index.json      # アイコンカテゴリ情報
    ├── paths/               # アイコンパスデータ
    ├── update-history.json  # 更新履歴
    └── package.json

scripts/
├── bump-version.cjs         # バージョン自動管理
├── generate-icons.cjs       # アイコン生成スクリプト
├── generate-exports.cjs     # エクスポートファイル生成
├── generate-metadata.cjs    # メタデータパッケージ生成
├── generate-search-terms-full.cjs # 検索用文字列生成（全体）
├── generate-search-terms-incremental.cjs # 検索用文字列生成（増分）
└── update-metadata.cjs      # 上流データ更新

metadata/                    # グローバルメタデータ（ソース）
├── icon-index.json         # アイコンカテゴリ情報
├── paths/                  # アイコンパスデータ
└── update-history.json     # 更新履歴
```

## Material Symbols統合

### 上流データソース
- **GoogleのMaterial Design Icons**: カテゴリ情報
- **marella/material-symbols**: アイコン一覧とバージョン情報
- **@material-symbols/svg-*** パッケージ: 実際のSVGデータ

### サポート範囲
- **ウェイト**: 7つのウェイト（100、200、300、400、500、600、700）
- **スタイル**: 3つのスタイル（outlined、rounded、sharp）
- **アイコン数**: 3,340個（2025年7月現在）

### 命名規則
- **Material Designの命名規則**: `snake_case`でのアイコン名
- **コンポーネント命名**: `PascalCase`でのコンポーネント名
- **特殊処理**: 数字で始まるアイコン名には`Icon`プレフィックスを付加

### メタデータ管理
- **カテゴリ分類**: Material Designの標準カテゴリ
- **`symbols`カテゴリの除外**: より有用なカテゴリ分類のため
- **更新履歴**: 追加、更新、削除の変更履歴を記録

## パフォーマンス最適化

### 開発時制限
処理速度とメモリ使用量の最適化のため、開発時は10個のアイコンに制限：

```javascript
// 開発時制限対象アイコン
const DEV_ICONS = [
  'favorite', 'home', 'search', 'settings', // action
  'arrow_forward', 'check', 'close', 'menu', // navigation
  'person', // social
  'star' // toggle
];
```

### メモリ管理
- **個別ファイル生成**: 全アイコンの同時読み込みを回避
- **Tree-shaking**: 未使用アイコンをバンドルから除外
- **型定義の最適化**: 必要な型情報のみを提供

### ビルド最適化
- **並列処理**: 可能な限り並列でのファイル生成
- **キャッシング**: 変更されたファイルのみを再生成
- **最小化**: 本番ビルドでのファイルサイズ最小化
