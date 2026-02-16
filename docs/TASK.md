# Reactスタイル統合β タスク（仕様確定版）

このファイルは、`@material-symbols-svg/react` に `outlined` / `rounded` / `sharp` を統合し、npmへβ公開可能かを検証するための実行計画です。

## 目的

- 現在3パッケージに分離しているReact向けスタイルを、`@material-symbols-svg/react`へ統合できるか検証する
- npm公開制約（ファイル数・サイズ）の実際の限界に対して、統合版が成立するかをβで確認する
- stable利用者への影響を避けるため、検証は`beta` dist-tagで行う

## スコープ

- 対象: Reactパッケージのみ
- 対象パッケージ: `@material-symbols-svg/react`
- 対象スタイル: `outlined` / `rounded` / `sharp`
- 公開形態: `npm publish --tag beta`

## 非スコープ

- Vueパッケージの統合
- 既存stable導線（`latest`）への切り替え
- `@material-symbols-svg/react-rounded` / `@material-symbols-svg/react-sharp` の即時廃止

## 確定仕様

### 1. 互換性ポリシー

- 既存のOutlined APIは完全維持する
- 既存importは変更不要とする
- 既存利用者に破壊的変更を入れない

### 2. エクスポート仕様（React）

- 維持:
  - `@material-symbols-svg/react`
  - `@material-symbols-svg/react/w100` 〜 `@material-symbols-svg/react/w700`
  - `@material-symbols-svg/react/icons/*`
- 追加:
  - `@material-symbols-svg/react/rounded`
  - `@material-symbols-svg/react/rounded/w100` 〜 `@material-symbols-svg/react/rounded/w700`
  - `@material-symbols-svg/react/rounded/icons/*`
  - `@material-symbols-svg/react/sharp`
  - `@material-symbols-svg/react/sharp/w100` 〜 `@material-symbols-svg/react/sharp/w700`
  - `@material-symbols-svg/react/sharp/icons/*`

### 3. β公開ポリシー

- 検証公開は`beta` dist-tagのみで行う
- βバージョンはSemVerのpre-release形式を使う（例: `0.1.22-beta.0`）
- `latest`は更新しない
- 既存の`react-rounded` / `react-sharp`は併存維持する

### 4. 成功判定

- buildが通る
- 既存Outlined importが壊れない
- 新規rounded/sharp subpath importが機能する
- `npm pack --dry-run --json`で成果物情報を取得できる
- `npm publish --tag beta`が成功する、または失敗理由を再現可能に記録できる

## 事前ベースライン（0.1.22）

- `@material-symbols-svg/react`: `unpackedSize=102,342,355` / `fileCount=7,618`
- `@material-symbols-svg/react-rounded`: `unpackedSize=139,608,979` / `fileCount=7,619`
- `@material-symbols-svg/react-sharp`: `unpackedSize=90,061,823` / `fileCount=7,618`
- 単純合算見積: `unpackedSize=332,013,157` / `fileCount=22,855`

## ステータス定義

- Backlog: 未着手
- In Progress: 実施中
- Done: 完了
- Blocked: 外部要因で停止

## 実行タスク

### T7 仕様固定とドキュメント反映

- ステータス: Done
- 目的: 統合対象、互換ポリシー、β公開方針を固定する
- 変更対象:
  - `docs/TASK.md`
- 受け入れ条件:
  - 仕様が曖昧なく読み取れる
  - 実装・検証タスクへ直接分解可能

### T8 生成ロジックの統合対応

- ステータス: Done
- 目的: `packages/react`単体で3スタイル分の生成が可能な状態にする
- 変更対象:
  - `scripts/generate-icons.cjs`
  - `scripts/generate-exports.cjs`
  - `scripts/templates/react-template.js`
- 要件:
  - Outlined既存生成を維持
  - rounded/sharpを`packages/react/src`配下へ追加生成
  - export生成をstyle別サブパスに対応
- 受け入れ条件:
  - `pnpm run --filter="@material-symbols-svg/react" build`で生成/ビルドが成功する

### T9 `@material-symbols-svg/react` exports再設計

- ステータス: Done
- 目的: package exportsでrounded/sharp subpathを公開する
- 変更対象:
  - `packages/react/package.json`
  - 必要に応じて`packages/react/rollup.config.mjs`
  - `packages/react/README.md`
- 要件:
  - 既存exportsを維持
  - `/rounded`・`/sharp`系列のexportsを追加
- 受け入れ条件:
  - TypeScript解決と実行時importが両方成功する

### T10 ローカル検証（機能・互換・サイズ）

- ステータス: Done
- 目的: β公開前に機能とパッケージ規模を検証する
- 実施内容:
  - build実行
  - `npm pack --dry-run --json`で`size`/`unpackedSize`/`entryCount`取得
- 実測結果（`@material-symbols-svg/react@0.1.22`）:
  - `size`: `53,670,418` bytes
  - `unpackedSize`: `332,039,021` bytes
  - `entryCount`: `22,843`
- 受け入れ条件:
  - 検証結果がログ化され、公開可否判定に使える

### T11 β公開実行（Reactのみ）

- ステータス: In Progress
- 目的: 統合版を`beta`タグで実公開し、npm制約に対する実測結果を得る
- 実施内容:
  - バージョン調整（`0.1.23-beta.0`）
  - `npm publish --tag beta`（対象: `@material-symbols-svg/react`）
- 進捗:
  - `packages/react/package.json` を `0.1.23-beta.0` に更新済み
- 受け入れ条件:
  - 公開成功、または失敗理由が明確に記録される

### T12 判定と次アクション決定

- ステータス: Backlog
- 目的: β結果を受けて正式方針を決定する
- 判定:
  - 成功時: 統合運用への移行計画を作成
  - 失敗時: 制約回避案（分割維持、分割再設計、配布形式変更）を策定
- 受け入れ条件:
  - 次の実装方針が1つに確定している
