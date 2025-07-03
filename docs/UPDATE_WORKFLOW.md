# Material Symbols 更新ワークフロー

このドキュメントは、Material Symbols の上流データを更新する際の詳細なワークフローを説明します。

## 概要

`npm run sync:upstream` コマンドを使用して、Google の Material Design Icons と marella/material-symbols から最新のデータを取得し、ローカルのメタデータとパッケージデータを更新します。

## sync:upstream の動作フロー

### 1. update:metadata (上流データの取得と更新)

```bash
npm run update:metadata
```

**実行内容:**
- Google の [current_versions.json](https://github.com/google/material-design-icons/blob/master/update/current_versions.json) からカテゴリ情報を取得
- marella/material-symbols の [versions.json](https://github.com/marella/material-symbols/blob/main/metadata/versions.json) から最新アイコン一覧を取得
- 既存のメタデータとの差分を検出
- 変更履歴を記録

### 2. build:metadata (パッケージ用データの生成)

```bash
npm run build:metadata
```

**実行内容:**
- `@material-symbols/svg-*` パッケージからSVGパスデータを抽出
- 各アイコンのパスデータファイルを生成
- パッケージ用のメタデータを統合

## 更新されるファイル

### ./metadata/ (プロジェクトルート)
- `icon-index.json` - アイコンのメタデータ（カテゴリ、バージョン情報）
- `update-history.json` - 更新履歴

### ./packages/metadata/ (npm パッケージ)
- `icon-index.json` - アイコンのメタデータ（パッケージ版）
- `update-history.json` - 更新履歴（パッケージ版）
- `paths/*.json` - 各アイコンのSVGパスデータ（3,340+個のファイル）

## 使用方法

### 基本的な使用方法

```bash
# 完全な上流データ同期（推奨）
npm run sync:upstream
```

### 個別実行

```bash
# 上流データ取得のみ
npm run update:metadata

# パッケージ用データ生成のみ
npm run build:metadata
```

## 推奨ワークフロー

### 1. Material Symbols の新しいアイコンを取り込む

```bash
# 1. 上流データを同期
npm run sync:upstream

# 2. アイコンコンポーネントを更新
npm run build

# 3. 変更を確認
git status
git diff

# 4. 変更をコミット
git add .
git commit -m "Update Material Symbols to latest version"
```

### 2. 定期的な更新チェック

```bash
# 週次または月次で実行
npm run sync:upstream
```

## 実行例

### 初回実行時の出力

```bash
$ npm run sync:upstream

> sync:upstream
> npm run update:metadata && npm run build:metadata

> update:metadata
> node scripts/update-metadata.cjs

Starting metadata update...
Fetching upstream metadata...
Fetched 6209 icons from current_versions.json
Fetched 3642 icons from versions.json
File not found or invalid: /Users/k/develop/material-symbols-svg/metadata/icon-index.json, creating new one
Updated icon index with 3642 icons
Update history recorded: 3642 added, 0 updated, 0 removed

Update Summary:
Total icons: 3642
Added: 3642
Updated: 0
Removed: 0

Newly added icons:
  - 123 (action)
  - 360 (maps)
  - 10k (av)
  ... and 3632 more

Metadata update completed successfully!

> build:metadata
> node scripts/generate-metadata.cjs

🚀 Starting consolidated metadata generation...

📁 Generating consolidated icon metadata files...
   Processing 4004 unique icons across 3 styles
   ✅ Generated 3340 individual metadata files in packages/metadata/paths/

📝 Generating global icon index...
   📂 Loaded category data from: current_versions.json
   ✅ Generated packages/metadata/icon-index.json

🎉 Successfully generated consolidated metadata!
   📊 Summary:
      Unique icons: 4004
      Path files: 3340
      Styles: outlined, rounded, sharp
      Weights: 100, 200, 300, 400, 500, 600, 700
      Output: packages/metadata/
```

### 変更なしの場合の出力

```bash
$ npm run sync:upstream

> sync:upstream
> npm run update:metadata && npm run build:metadata

> update:metadata
> node scripts/update-metadata.cjs

Starting metadata update...
Fetching upstream metadata...
Fetched 6209 icons from current_versions.json
Fetched 3642 icons from versions.json
Updated icon index with 3642 icons
No changes detected, skipping history update

Update Summary:
Total icons: 3642
Added: 0
Updated: 0
Removed: 0

Metadata update completed successfully!

> build:metadata
> node scripts/generate-metadata.cjs

🚀 Starting consolidated metadata generation...
[... 省略 ...]
```

## 変更検出

システムは以下の変更を自動的に検出します：

- **新規追加**: 新しく追加されたアイコン
- **更新**: カテゴリ情報が変更されたアイコン  
- **削除**: 削除されたアイコン

変更は `update-history.json` に記録され、最新100件の更新記録が保持されます。

## 更新履歴の活用

### プログラムから更新履歴にアクセス

```typescript
// ESMの場合
import updateHistory from '@material-symbols-svg/metadata/update-history.json';

// 最新の更新情報を取得
const latestUpdate = updateHistory.updates[0];
console.log(`最新更新: ${latestUpdate.timestamp}`);
console.log(`追加: ${latestUpdate.added.length}件`);
console.log(`更新: ${latestUpdate.updated.length}件`);
console.log(`削除: ${latestUpdate.removed.length}件`);
```

### 更新履歴の構造

```json
{
  "updates": [
    {
      "timestamp": "2025-07-03T14:14:49.269Z",
      "added": [
        {
          "name": "new_icon",
          "category": "action"
        }
      ],
      "updated": [
        {
          "name": "existing_icon",
          "oldCategories": ["old_category"],
          "newCategories": ["new_category"]
        }
      ],
      "removed": [
        {
          "name": "deleted_icon",
          "category": "action"
        }
      ]
    }
  ]
}
```

## トラブルシューティング

### よくある問題

#### 1. ネットワークエラー

**エラー例:**
```
Error updating metadata: Error: getaddrinfo ENOTFOUND raw.githubusercontent.com
```

**解決方法:**
- インターネット接続を確認
- プロキシ設定を確認
- しばらく時間を置いて再実行

#### 2. 権限エラー

**エラー例:**
```
Error: EACCES: permission denied, open '/Users/k/develop/material-symbols-svg/metadata/icon-index.json'
```

**解決方法:**
- ファイルの権限を確認
- 管理者権限で実行するか、ファイルの所有者を変更

#### 3. 大量のファイル生成によるメモリ不足

**症状:**
- build:metadata の実行が途中で停止
- 「JavaScript heap out of memory」エラー

**解決方法:**
```bash
# Node.js のメモリ制限を増加
export NODE_OPTIONS="--max-old-space-size=4096"
npm run sync:upstream
```

### エラーメッセージの解釈

- `No changes detected` - 上流データに変更なし（正常）
- `File not found or invalid` - 初回実行時または破損したファイル（正常）
- `Failed to parse JSON` - ネットワークエラーまたは上流データの問題
- `Permission denied` - ファイルアクセス権限の問題

## 最適化のヒント

### 1. 開発時の高速化

```bash
# 開発時は10個のアイコンに制限
NODE_ENV=development npm run sync:upstream
```

### 2. CI/CDでの使用

```yaml
# GitHub Actions例
- name: Update Material Symbols
  run: |
    npm run sync:upstream
    git add .
    git commit -m "chore: update Material Symbols" || exit 0
```

### 3. パフォーマンスモニタリング

```bash
# 実行時間の測定
time npm run sync:upstream
```

## 関連ファイル

- `scripts/update-metadata.cjs` - メタデータ更新スクリプト
- `scripts/generate-metadata.cjs` - パッケージ用メタデータ生成スクリプト
- `package.json` - npm スクリプト定義
- `packages/metadata/package.json` - メタデータパッケージ設定

## 参考リンク

- [Google Material Design Icons](https://github.com/google/material-design-icons)
- [marella/material-symbols](https://github.com/marella/material-symbols)
- [Material Symbols公式ドキュメント](https://fonts.google.com/icons)