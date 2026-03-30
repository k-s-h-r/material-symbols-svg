# docs/

このディレクトリには、リポジトリ運用者向けの文書だけを置きます。

## 収録方針

- 利用者向けの使い方はルート `README.md` と各パッケージの `README.md` に集約する
- `docs/` には開発フローとリリース運用の一次情報だけを置く
- 一時的な作業メモや、README と重複する説明は残さない

## 収録ファイル

- `docs/DEVELOPMENT.md`
  - 開発環境、ビルド、生成物、アイコン更新フロー
- `docs/RELEASE_MANAGEMENT.md`
  - 実運用の手順だけをまとめた短い版
- `docs/RELEASE_MANAGEMENT_REFERENCE.md`
  - どのスクリプトが何を更新するか、失敗時にどこを見るかの参照版

## 利用者向けドキュメント

- ルート `README.md`
  - リポジトリ全体の概要と基本的な導入
- `packages/react/README.md`
  - React パッケージの import パターンと props
- `packages/vue/README.md`
  - Vue パッケージの import パターンと props
- `packages/metadata/README.md`
  - メタデータパッケージの構造と利用例
