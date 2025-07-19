# 開発ガイド

Material Symbols SVGプロジェクトの開発に関する詳細な情報を提供します。

## 開発環境のセットアップ

### 必要な環境
- **Node.js**: 16.0.0以上
- **pnpm**: パッケージマネージャー
- **TypeScript**: 5.3.3以上

### 初期セットアップ
```bash
# 依存関係のインストール
pnpm install

# 開発用ビルド（10個のアイコンに制限）
pnpm run build:dev

# 全アイコンのビルド
pnpm run build
```

## 開発時の制限について

### 10個アイコン制限
開発時は処理速度とメモリ使用量の最適化のため、以下の10個のアイコンに制限されます：

- **action**: favorite, home, search, settings
- **navigation**: arrow_forward, check, close, menu
- **social**: person
- **toggle**: star

### 制限の制御
```bash
# 開発時制限を有効にする（10個のアイコンのみ）
pnpm run build:dev

# 制限を無効にする（全アイコン）
pnpm run build
```

### 制限が適用される場所
- `scripts/generate-icons.cjs`: アイコンファイルの生成
- `scripts/generate-exports.cjs`: エクスポートファイルの生成
- 各パッケージのビルドプロセス

## 開発ノート

### アイコンの再生成プロセス

#### 1. 個別アイコンファイルの生成
```bash
# 全スタイル（outlined, rounded, sharp）
pnpm run build

# 特定のスタイルのみ
node scripts/generate-icons.cjs outlined
node scripts/generate-icons.cjs rounded
node scripts/generate-icons.cjs sharp
```

**実行内容:**
- `@material-symbols/svg-{weight}`パッケージからSVGファイルを読み込み
- SVGからパスデータを抽出
- フレームワーク別テンプレートを使用してTypeScriptファイルを生成
- `packages/{framework}/src/icons/`ディレクトリに出力

#### 2. ウェイトエクスポートファイルの生成
```bash
# 全スタイル
node scripts/generate-exports.cjs outlined
node scripts/generate-exports.cjs rounded
node scripts/generate-exports.cjs sharp
```

**実行内容:**
- 生成されたアイコンファイルを検索
- 各ウェイト毎のエクスポートファイル（`w100.ts` ~ `w700.ts`）を生成
- 開発時制限を適用
- TypeScript型定義も同時生成

### ファイル生成の詳細

#### TypeScriptファイルのみ生成
- `.js`ファイルは生成されない（Rollupでビルド時に生成）
- `.json`ファイルは不要（メタデータは別途管理）
- `.d.ts`ファイルはRollupで生成

#### メタデータファイルの生成場所
- `src/metadata/`: 各パッケージ用メタデータ
- `metadata/`: グローバルメタデータ（ソース）
- `packages/metadata/`: npm公開用メタデータパッケージ

## パッケージ構成の詳細

### ESM専用設計
```json
{
  "type": "module",
  "main": "./dist/w400.js",
  "types": "./dist/w400.d.ts"
}
```

### Package Exports戦略
各パッケージは以下のエクスポートパターンを提供：

```json
{
  "exports": {
    ".": {
      "types": "./dist/w400.d.ts",
      "import": "./dist/w400.js"
    },
    "./w100": {
      "types": "./dist/w100.d.ts",
      "import": "./dist/w100.js"
    },
    "./icons/*": {
      "types": "./dist/icons/*.d.ts",
      "import": "./dist/icons/*.js"
    }
  }
}
```

**メリット:**
- 各ウェイト毎のエクスポートマップを提供
- 個別アイコンのパスもexportsに含まれる
- TypeScript型定義を全ファイルに含む

## Material Symbols統合の詳細

### 上流データの取得
```bash
# アイコンの更新（推奨）- 全自動処理
pnpm run update:icons

# 個別コマンド
pnpm run sync:upstream           # アップストリーム同期のみ
pnpm run generate:search-terms   # 検索ワード＋カテゴリ自動生成
pnpm run build:metadata         # メタデータファイル生成
```

### サポート範囲
- **ウェイト**: 7つのウェイト（100、200、300、400、500、600、700）
- **スタイル**: 3つのスタイル（outlined、rounded、sharp）
- **アイコン数**: 3,657個（2025年7月現在、Material Symbols v0.33.0）
- **AI機能**: 検索ワード自動生成、カテゴリ自動分類（OpenAI GPT-4o-mini）

### 命名規則の処理
```javascript
// 数字で始まるアイコン名の処理例
"3d_rotation" → "Icon3dRotation"  // コンポーネント名
"3d_rotation" → "3d_rotation"     // ファイル名は維持
```

### カテゴリ分類とAI機能
- **AI自動カテゴリ分類**: 新規アイコンを自動で適切なカテゴリに分類
- **検索ワード自動生成**: アイコンの用途や同義語を自動生成
- **Material Designの標準カテゴリ**: action, av, communication, etc.
- **環境変数設定**: `OPENAI_API_KEY`を設定すると自動処理が有効化
- **手動処理**: `node scripts/categorize-icons.cjs` でカテゴリ分類のみ実行可能

## テンプレートシステム

### React用テンプレート
`scripts/templates/react-template.js`

```javascript
// 生成されるReactコンポーネントの例
import { createMaterialIcon } from '../createMaterialIcon.js';

const pathData = "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z";
export default createMaterialIcon("home", pathData);
```

### Vue用テンプレート
`scripts/templates/vue-template.js`

```javascript
// 生成されるVueコンポーネントの例
import { createMaterialIcon } from '../createMaterialIcon.js';

const pathData = "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z";
export default createMaterialIcon("home", pathData);
```

## デバッグとトラブルシューティング

### 一般的な問題

#### 1. メモリ不足
**症状:**
- ビルド時に「JavaScript heap out of memory」エラー
- 処理が途中で停止

**解決方法:**
```bash
# Node.jsのメモリ制限を増加
export NODE_OPTIONS="--max-old-space-size=4096"
pnpm run build
```

#### 2. ファイル数の制限
**症状:**
- 「too many open files」エラー
- ファイル生成が完了しない

**解決方法:**
```bash
# macOS/Linuxの場合
ulimit -n 4096

# 永続的に設定
echo "ulimit -n 4096" >> ~/.bashrc
```

#### 3. 型定義の不整合
**症状:**
- TypeScriptコンパイルエラー
- インポート時の型エラー

**解決方法:**
```bash
# 型定義ファイルの再生成
pnpm run build:dev
pnpm run build
```

### パフォーマンス最適化

#### 開発時の高速化
```bash
# 開発時制限を使用
pnpm run build:dev

# 特定のパッケージのみビルド
pnpm run build:react:dev
pnpm run build:vue:dev
```

#### 並列処理の活用
```bash
# 複数のパッケージを並列ビルド
pnpm run build:react & pnpm run build:vue & wait
```

## 品質管理

### テスト
```bash
# 全パッケージのテスト実行
pnpm test

# 特定のパッケージのテスト
pnpm -r --filter="./packages/react" test

# カバレッジ付きテスト
pnpm -r --filter="./packages/react" test:coverage
```

### リント
```bash
# 全パッケージのリント
pnpm run lint

# 特定のパッケージのリント
pnpm -r --filter="./packages/react" lint
```

### 型チェック
```bash
# TypeScriptコンパイラでの型チェック
pnpm -r exec tsc --noEmit
```

## 注意事項

### ビルド時間
- **全アイコン**: 約1-2分（3,340個 × 3スタイル）
- **開発時制限**: 約10-20秒（10個 × 3スタイル）

### TypeScript型情報
- **型定義ファイル**: すべてのファイルに`.d.ts`を含める
- **型の一貫性**: 全パッケージで同じ型定義を使用
- **エクスポートの正確性**: package.jsonのexportsと実際のファイルの整合性

### 開発フロー
1. **開発時制限でテスト**: `pnpm run build:dev`
2. **型チェック**: `pnpm run lint`
3. **本番ビルド前テスト**: `pnpm run build`
4. **最終確認**: すべてのパッケージで型定義が正しく生成されることを確認

## 拡張とカスタマイズ

### 新しいフレームワークの追加
1. `packages/`下に新しいパッケージディレクトリを作成
2. `createMaterialIcon`関数をフレームワーク用に実装
3. `scripts/templates/`にテンプレートファイルを追加
4. ビルドスクリプトを更新

### 新しいスタイルの追加
1. `@material-symbols/svg-{style}-{weight}`パッケージの確認
2. 生成スクリプトにスタイル追加
3. パッケージ構成を更新

### カスタムアイコンの追加
1. `metadata/`にカスタムアイコン情報を追加
2. SVGパスデータを準備
3. 生成スクリプトを拡張してカスタムアイコンを処理