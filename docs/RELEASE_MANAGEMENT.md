# リリース管理

Material Symbols SVGプロジェクトのリリース管理（上流データ更新とバージョン管理）について説明します。

## 概要

このプロジェクトは以下の2つのプロセスを統合してリリース管理を行います：

1. **上流データ更新**: GoogleのMaterial Symbolsから最新のアイコンデータを取得
2. **バージョン管理**: 全7パッケージのバージョンを一括管理

## リリース方法

### 1. 自動化されたリリース (推奨)

Claude Codeの `/release` コマンドを使用した自動化されたリリースプロセスです。

#### 使用方法
```bash
# Claude Codeで実行
/release
```

#### 自動化される処理
1. **CHANGELOG.mdの更新**: 最新のタグから現在のコミットまでの変更を自動収集
2. **変更の分類**: コミット内容に基づいて以下のカテゴリに自動分類
   - **Added**: 新機能
   - **Changed**: 既存機能の変更
   - **Deprecated**: 近いうちに削除予定の機能
   - **Removed**: すでに削除された機能
   - **Fixed**: バグ修正
   - **Security**: 脆弱性関連
   - **Thanks**: 貢献者のGitHubユーザー名とPR番号
3. **バージョン更新**: `pnpm run bump:patch` の自動実行
4. **Gitタグ作成**: 新しいバージョンでのタグ作成
5. **GitHubリリース**: リリースノートの自動生成と公開
6. **npm publish促進**: 手動でのパッケージ公開を促進

#### 変更収集スクリプト
`./scripts/get-changes-since-tag.sh` がコミット情報を収集します：

```bash
#!/usr/bin/env bash
# 最新のタグから現在のコミットまでの変更を取得
# GitHubユーザー名とPR番号を抽出
# コミットの詳細情報を整理して出力
```

### 2. 手動リリース

従来の手動プロセスを使用したリリース方法です。

## 上流データ更新プロセス

### sync:upstream コマンド

```bash
# 完全な上流データ同期（推奨）
pnpm run sync:upstream
```

このコマンドは以下の処理を順次実行します：

#### 1. update:metadata (上流データの取得と更新)
- Google の [current_versions.json](https://github.com/google/material-design-icons/blob/master/update/current_versions.json) からカテゴリ情報を取得
- marella/material-symbols の [versions.json](https://github.com/marella/material-symbols/blob/main/metadata/versions.json) から最新アイコン一覧を取得
- 既存のメタデータとの差分を検出
- 変更履歴を記録

#### 2. generate:search-terms (検索用文字列生成)
- アイコンに関連するワードを4o-miniで生成

#### 3. build:metadata (パッケージ用データの生成)
- `@material-symbols/svg-*` パッケージからSVGパスデータを抽出
- 各アイコンのパスデータファイルを生成
- パッケージ用のメタデータを統合

### 更新されるファイル

#### プロジェクトルート (./metadata/)
- `icon-index.json` - アイコンのメタデータ（カテゴリ、バージョン情報）
- `search-terms.json` - 検索用文字列
- `update-history.json` - 更新履歴

#### npm パッケージ (./packages/metadata/)
- `icon-index.json` - アイコンのメタデータ（パッケージ版）
- `update-history.json` - 更新履歴（パッケージ版）
- `paths/*.json` - 各アイコンのSVGパスデータ（3,340+個のファイル）

### 変更検出

システムは以下の変更を自動的に検出します：

- **新規追加**: 新しく追加されたアイコン
- **更新**: カテゴリ情報が変更されたアイコン
- **削除**: 削除されたアイコン

変更は `update-history.json` に記録され、最新100件の更新記録が保持されます。

## バージョン管理システム

### 自動バージョン管理

全7つのパッケージのバージョンを一括で管理する自動バージョン管理システムが実装されています。

#### 対象パッケージ
- `@material-symbols-svg/react`
- `@material-symbols-svg/react-rounded`
- `@material-symbols-svg/react-sharp`
- `@material-symbols-svg/vue`
- `@material-symbols-svg/vue-rounded`
- `@material-symbols-svg/vue-sharp`
- `@material-symbols-svg/metadata`

### バージョン更新コマンド

```bash
# パッチバージョン（バグ修正、改善）
pnpm run bump:patch      # 0.1.6 → 0.1.7

# マイナーバージョン（アイコン追加・削除、新機能）
pnpm run bump:minor      # 0.1.6 → 0.2.0

# メジャーバージョン（破壊的変更）
pnpm run bump:major      # 0.1.6 → 1.0.0
```

### バージョニング戦略

#### パッチバージョン (patch)
- バグ修正
- パフォーマンス改善
- ドキュメント更新
- 軽微なコード改善
- 依存関係のアップデート（破壊的変更なし）

#### マイナーバージョン (minor)
- アイコンの追加・削除
- 新機能の追加
- 非破壊的な変更
- 新しいプロパティの追加（オプション）
- 上流データの更新（新しいアイコンを含む）

#### メジャーバージョン (major)
- 破壊的変更（API変更）
- コンポーネント構造の変更
- 型定義の破壊的変更
- 依存関係の破壊的変更
- サポートするフレームワークバージョンの変更

## 統合ワークフロー

### 1. 上流データ更新とリリース

```bash
# 1. 上流データを同期
pnpm run sync:upstream

# 2. 変更を確認
git status
git diff

# 3. アイコンコンポーネントを更新
pnpm run build

# 4. テストを実行
pnpm test

# 5. リントを実行
pnpm run lint

# 6. 変更をコミット
git add .
git commit -m "Update Material Symbols to latest version"

# 7. バージョンを更新（変更規模に応じて）
pnpm run bump:minor  # アイコン追加・削除の場合
pnpm run bump:patch  # バグ修正・改善の場合

# 8. 全パッケージを公開
pnpm run publish-packages

# 9. GitHubにプッシュ
git push origin main

# 10. リリースタグを作成（オプション）
git tag v$(cat packages/react/package.json | jq -r '.version')
git push origin --tags
```

### 2. 日常的な開発フロー

#### バグ修正のケース
```bash
# 1. バグを修正
# 2. テストを実行
pnpm test

# 3. リントを実行
pnpm run lint

# 4. 変更をコミット
git add .
git commit -m "Fix metadata icon naming to match component naming convention"

# 5. パッチバージョンを更新
pnpm run bump:patch

# 6. ビルドを実行
pnpm run build

# 7. 最終確認
git status
```

#### 新機能追加のケース
```bash
# 1. 新機能を実装
# 2. テストを追加・実行
pnpm test

# 3. 変更をコミット
git add .
git commit -m "Add search functionality to metadata"

# 4. マイナーバージョンを更新
pnpm run bump:minor

# 5. ビルドを実行
pnpm run build
```

### 3. 定期的な更新チェック

```bash
# 週次または月次で実行
pnpm run sync:upstream

# 変更があった場合のみバージョン更新
if git diff --quiet; then
  echo "No changes detected"
else
  pnpm run bump:minor
fi
```

### 4. 個別パッケージの公開

```bash
# React パッケージのみ公開
pnpm run publish-react

# Vue パッケージのみ公開
pnpm run publish-vue

# メタデータパッケージのみ公開
pnpm run publish-metadata
```

## 実行例

### 初回実行時の出力

```bash
$ pnpm run sync:upstream

> sync:upstream
> pnpm run update:metadata && pnpm run generate:search-terms && pnpm run build:metadata

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

> generate:search-terms
> node scripts/generate-search-terms.cjs

🚀 Starting search terms generation...
✅ Generated search terms for 3642 icons

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
$ pnpm run sync:upstream

> sync:upstream
> pnpm run update:metadata && pnpm run generate:search-terms && pnpm run build:metadata

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

> generate:search-terms
> node scripts/generate-search-terms.cjs

🚀 Starting search terms generation...
✅ Search terms already up to date

> build:metadata
> node scripts/generate-metadata.cjs

🚀 Starting consolidated metadata generation...
[... 既存データを使用 ...]
```

## 更新履歴の活用

### プログラムからのアクセス

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

#### 3. メモリ不足エラー

**症状:**
- build:metadata の実行が途中で停止
- 「JavaScript heap out of memory」エラー

**解決方法:**
```bash
# Node.js のメモリ制限を増加
export NODE_OPTIONS="--max-old-space-size=4096"
pnpm run sync:upstream
```

#### 4. バージョン不整合

**症状:**
```
Error: Version mismatch detected across packages
```

**解決方法:**
```bash
# 手動で全パッケージのバージョンを確認
find packages -name package.json -exec grep '"version"' {} \;

# 強制的にバージョンを再設定
pnpm run bump:patch
```

#### 5. npm公開エラー

**症状:**
```
npm ERR! 403 Forbidden - PUT https://registry.npmjs.org/@material-symbols-svg/react
```

**解決方法:**
```bash
# npm認証を確認
npm whoami

# ログインし直す
npm login

# パッケージのアクセス権限を確認
npm access ls-packages
```

#### 6. バージョン更新の取り消し

**症状:**
誤ったバージョンタイプで更新してしまった場合

**解決方法:**
```bash
# 最後のコミットを取り消す（まだプッシュしていない場合）
git reset --hard HEAD~1

# 正しいバージョンで再実行
pnpm run bump:patch  # 正しいバージョンタイプ
```

### エラーメッセージの解釈

- `No changes detected` - 上流データに変更なし（正常）
- `File not found or invalid` - 初回実行時または破損したファイル（正常）
- `Failed to parse JSON` - ネットワークエラーまたは上流データの問題
- `Permission denied` - ファイルアクセス権限の問題

## CI/CD統合

### GitHub Actions例

```yaml
name: Release

on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          registry-url: https://registry.npmjs.org/
      
      - run: npm install -g pnpm
      - run: pnpm install
      
      # 上流データ更新
      - run: pnpm run sync:upstream
      
      # ビルドとテスト
      - run: pnpm run build
      - run: pnpm test
      - run: pnpm run lint
      
      # バージョン判定
      - name: Determine version type
        id: version
        run: |
          if [[ "${{ github.event.head_commit.message }}" =~ ^feat ]]; then
            echo "type=minor" >> $GITHUB_OUTPUT
          elif [[ "${{ github.event.head_commit.message }}" =~ ^fix ]]; then
            echo "type=patch" >> $GITHUB_OUTPUT
          else
            echo "type=patch" >> $GITHUB_OUTPUT
          fi
      
      # バージョン更新と公開
      - run: pnpm run bump:${{ steps.version.outputs.type }}
      - run: pnpm run publish-packages
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 個別のワークフロー例

```yaml
# 上流データ更新専用
- name: Update Material Symbols
  run: |
    pnpm run sync:upstream
    pnpm run bump:minor  # アイコンの追加・削除があった場合
    git add .
    git commit -m "chore: update Material Symbols" || exit 0
```

## 最適化のヒント

### 1. 開発時の高速化

```bash
# 開発時は10個のアイコンに制限
NODE_ENV=development pnpm run sync:upstream
```

### 2. パフォーマンスモニタリング

```bash
# 実行時間の測定
time pnpm run sync:upstream
```

### 3. 定期的な更新の自動化

```bash
# cron job例（毎週月曜日の午前9時）
0 9 * * 1 cd /path/to/project && pnpm run sync:upstream
```

## ベストプラクティス

### 1. セマンティックバージョニングの遵守
- **パッチ**: 後方互換性のある修正
- **マイナー**: 後方互換性のある機能追加
- **メジャー**: 後方互換性のない変更

### 2. 変更履歴の記録
```bash
# コミットメッセージで変更タイプを明確に
git commit -m "feat: add new search functionality"  # minor
git commit -m "fix: resolve icon naming issue"      # patch
git commit -m "BREAKING CHANGE: update API"         # major
```

### 3. 公開前の確認
```bash
# 必ず実行するチェック項目
pnpm run build   # ビルドが成功する
pnpm test        # テストが通る
pnpm run lint    # リントが通る
git status       # コミットされていない変更がない
```

### 4. 変更ログ管理

詳細は後述の「CHANGELOG.md管理」セクションを参照してください。

## CHANGELOG.md管理

### 自動更新プロセス

Claude Codeの `/release` コマンドを使用した場合、CHANGELOG.mdは自動的に更新されます。

#### 変更収集の仕組み
1. **コミット情報の取得**: `./scripts/get-changes-since-tag.sh` が実行される
2. **GitHub API連携**: コミットからGitHubユーザー名とPR番号を抽出
3. **自動分類**: コミットメッセージの内容に基づいて適切なカテゴリに分類
4. **貢献者情報**: GitHubユーザー名（メンテナー除く）をThanksセクションに記載

#### 分類ルール
- **Added**: "feat:", "add:", "新機能" などのキーワード
- **Changed**: "change:", "update:", "変更" などのキーワード
- **Fixed**: "fix:", "修正", "バグ" などのキーワード
- **Security**: "security:", "脆弱性" などのキーワード
- **Thanks**: PR番号付きのコミットから貢献者を抽出

### 手動更新

プロジェクトルートの`CHANGELOG.md`に変更履歴を記録します。

**フォーマット:**
```markdown
# Changelog

## [Unreleased]

### Added
- 新機能の説明

### Changed
- 既存機能の変更

### Fixed
- バグ修正の内容

### Thanks
- @contributor-name (#123)

## [0.1.8] - 2025-07-10

### Fixed
- Fix metadata icon naming to match component naming convention

## [0.1.7] - 2025-07-06

### Changed
- Update all 7 packages to version 0.1.7
- Maintain version synchronization across React, Vue, and metadata packages

### Documentation
- Update sync:upstream command and remove unnecessary backup creation
```

### バージョンリンク管理

CHANGELOG.mdの下部にバージョンリンクを維持します：

```markdown
[Unreleased]: https://github.com/k-s-h-r/material-symbols-svg/compare/v0.1.8...HEAD
[0.1.8]: https://github.com/k-s-h-r/material-symbols-svg/compare/v0.1.7...v0.1.8
[0.1.7]: https://github.com/k-s-h-r/material-symbols-svg/compare/v0.1.6...v0.1.7
```

## 関連ファイル

- `scripts/update-metadata.cjs` - メタデータ更新スクリプト
- `scripts/generate-metadata.cjs` - パッケージ用メタデータ生成スクリプト
- `scripts/generate-search-terms.cjs` - 検索用文字列生成スクリプト
- `scripts/bump-version.cjs` - バージョン自動管理スクリプト
- `scripts/get-changes-since-tag.sh` - コミット変更収集スクリプト
- `.claude/commands/release.md` - Claude Codeリリースコマンド定義
- `package.json` - pnpm スクリプト定義
- `packages/metadata/package.json` - メタデータパッケージ設定

## 参考リンク

- [Google Material Design Icons](https://github.com/google/material-design-icons)
- [marella/material-symbols](https://github.com/marella/material-symbols)
- [Material Symbols公式ドキュメント](https://fonts.google.com/icons)
- [Semantic Versioning](https://semver.org/)
- [Claude Codeリリースコマンド作成記事](https://zenn.dev/yoshiko/articles/cc-release-command)