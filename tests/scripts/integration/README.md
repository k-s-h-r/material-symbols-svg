# 統合テストについて

現在の統合テストファイルは、Vitestのワーカー制限により`process.chdir()`が使用できないため、直接実行することができません。

## 代替案

以下の方法で統合テストを実行できます：

### 1. 手動テスト
```bash
# 開発モードでアイコン生成をテスト
NODE_ENV=development node scripts/generate-icons.cjs outlined react

# メタデータ生成をテスト
node scripts/generate-metadata.cjs

# エクスポート生成をテスト
node scripts/generate-exports.cjs outlined react
```

### 2. 実際のビルドコマンドでのテスト
```bash
# 実際のビルドプロセス
npm run build:icons:dev
npm run build:metadata
```

### 3. 単体テストでの間接的テスト
- `common.js`の全関数は単体テストでカバー済み
- 統合テストが検証する主要なロジックは単体テストで確認可能

## テストファイルの状態

統合テストファイルは参考実装として残してありますが、現在は実行されません。
将来的にVitestまたはテスト環境の制限が解除された場合に使用可能です。