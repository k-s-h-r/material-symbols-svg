# 今後の作業タスク（要件定義）

このファイルは、今後の開発タスクを「実装可能な要件」まで具体化した管理用バックログです。

## 確定方針
- 自動リリースコマンドは `npm publish` まで含める
- `update-history` の差分元は `@material-symbols/svg-100` を代表バージョンとして扱う
- アイコン自動更新は GitHub Actions で週1回実行する
- 自動更新で OpenAI を利用する
- `package.json` の `@material-symbols/svg-*` は手動編集せず、ローカルコマンドで更新する
- ローカル自動化を先に作り、同じコマンドを GitHub Actions から再利用する

## ステータス定義
- Backlog: 着手前
- Ready: 要件確定・実装可能
- In Progress: 実装中
- Done: 実装と検証完了

## 実装順序（依存関係）
1. T0 upstream依存バージョン更新のローカル自動化
2. T2 `update-history` のバージョン基準化
3. T3 バージョン管理ルールの自動判定
4. T1 自動リリースコマンド（ローカル）
5. T4 GitHub Actions による週次自動更新PR
6. T6 GitHub Actions による自動リリース
7. T5 ドキュメント更新

## T0 upstream依存バージョン更新のローカル自動化
ステータス: Done
目的: `package.json` の `@material-symbols/svg-100` から `svg-700` までの更新を手動編集不要にする。
対象: `scripts/update-upstream-deps.cjs`（新規）, `package.json`, `docs/RELEASE_MANAGEMENT.md`

### 要件
- 新規コマンド `pnpm run update:upstream-deps` を追加する
- デフォルト動作で `npm view @material-symbols/svg-100 version` から最新を取得する
- `@material-symbols/svg-100` から `@material-symbols/svg-700` までを同一バージョンに揃えて更新する
- 更新形式は既存方針に合わせて `^x.y.z` を維持する
- オプション `--version=x.y.z` で指定バージョン更新を可能にする
- 追加コマンド `pnpm run update:icons:auto` を追加し、`update:upstream-deps -> lockfile同期 -> frozen install -> update:icons` を順に実行する
- すでに同バージョンならファイル変更なしで正常終了する

### 公開インターフェース変更
- 新規 npm scripts: `update:upstream-deps`, `update:icons:auto`
- 追加CLIオプション: `--version`

### 受け入れ条件
- 手動で `package.json` を編集しなくても upstream 更新開始ができる
- 同一バージョン再実行時に差分が発生しない
- ローカル実行ログで更新前後バージョンが確認できる

### テスト観点
- 最新取得で `svg-100` から `svg-700` が同一バージョンへ更新される
- `--version` 指定で狙ったバージョンになる
- 同一バージョン時は no-op になる

## T1 自動リリースコマンドの設計・実装（ローカル）
ステータス: Done
目的: 手動手順（`.claude/tmp/リリース管理.md`）を単一コマンド化し、再現性を高める。
対象: `scripts/release.cjs`, `package.json`, `CHANGELOG.md`, `docs/RELEASE_MANAGEMENT.md`

### 要件
- `pnpm run release` を追加し、以下を順番に実行する
- 事前チェック（必須コマンド、認証状態、作業ツリー状態）
- バージョン種別の決定（T3の自動判定ロジックを利用）
- `bump:*` の実行
- CHANGELOG の `Unreleased` を新バージョンへ確定
- Git コミット、タグ作成、`main` とタグの push
- GitHub Release 作成
- `pnpm run publish-packages` 実行
- 失敗時はどのステップで停止したかを明示し、再開手順を標準出力に表示する

### 公開インターフェース変更
- 新規 npm script: `release`
- 追加オプション（CLI）: `--type=patch|minor|major|auto`（デフォルト `auto`）
- 追加オプション（CLI）: `--dry-run`（副作用なしの確認実行）

### 受け入れ条件
- 1コマンドでタグ作成、GitHub Release、npm publish まで完了する
- `--dry-run` で実行計画だけ表示できる
- `--type` 指定で自動判定を上書きできる

### テスト観点
- 正常系: `auto` 判定で minor/patch が切り替わる
- 異常系: `gh` 未認証、`npm whoami` 失敗、dirty tree の停止
- 回復系: publish失敗時の再実行手順が機能する

## T2 update-history のバージョン基準化
ステータス: Done
目的: `metadata/update-history.json` を「更新前/更新後の upstream バージョン差分」で再現可能にする。
対象: `scripts/update-metadata.cjs`, `metadata/update-history.json`, `packages/metadata/update-history.json`, `metadata/source/upstream-version.json`

### 要件
- 代表バージョンとして `@material-symbols/svg-100` を採用する
- `update-history` エントリに `from` / `to` の upstream バージョン情報を記録する
- 差分判定はカテゴリ差分を含めず、アイコンの追加・更新・削除のみを対象にする
- 既存の `material_symbols_version` は互換のため維持し、`to` バージョンとして扱う
- 履歴生成時に「前回バージョン」と「今回バージョン」が同一なら履歴を追加しない

### 追加データ構造（案）
- `material_symbols_version_from`: string
- `material_symbols_version_to`: string
- `material_symbols_package`: `"@material-symbols/svg-100"`

### 受け入れ条件
- 既存ローカル状態に依存せず、バージョン情報から履歴を再現できる
- 同一バージョン再実行で不要な履歴が増えない
- `metadata/` と `packages/metadata/` の履歴が常に一致する

### テスト観点
- `0.40.1 -> 0.40.2` の更新で added/updated/removed が記録される
- `0.40.2 -> 0.40.2` で履歴更新なし
- カテゴリ変更のみでは `updated` に入らない

## T3 バージョン管理ルールの適用
ステータス: Done
目的: アイコン変更ありなら `minor`、変更なしなら `patch` を標準ルール化する。
対象: `scripts/release.cjs`（または共通判定モジュール）, `scripts/bump-version.cjs`, `docs/RELEASE_MANAGEMENT_REFERENCE.md`

### 要件
- 判定対象は最新の `update-history` エントリ
- `added + updated + removed > 0` の場合は `minor`
- 上記が 0 の場合は `patch`
- 手動上書きの `--type` 指定を許可する
- 判定結果を実行ログに必ず表示する

### 受け入れ条件
- ルールが一意で、同じ入力に対して同じ結果になる
- 誤判定時に手動上書きでリリース可能

### テスト観点
- 変更あり履歴で `minor`
- 変更なし履歴で `patch`
- `--type=major` で常に major

## T4 アイコンアップデートの自動化（GitHub）
ステータス: Done
目的: upstream の新バージョンを週次で検知し、更新PRを自動作成する。
対象: `.github/workflows/icon-update.yml`（新規）, `.github/pull_request_template.md`（必要に応じて）, `package.json`

### 要件
- `schedule` と `workflow_dispatch` を持つ
- 実行頻度は週1回
- バージョン更新は T0 の `pnpm run update:upstream-deps` を呼び出して実施する
- `pnpm i`、`pnpm run update:icons` を実行する（週次更新PRでは重い `build` は実行しない）
- `OPENAI_API_KEY` を利用して検索語/カテゴリ更新を含める
- 変更がある場合のみ自動PRを作成する
- PR本文に更新前後バージョン、added/updated/removed 件数を記載する

### 必要シークレット
- `OPENAI_API_KEY`

### 受け入れ条件
- 週次実行で新バージョン時のみPRが作成される
- 差分がない週はPRを作らず正常終了する
- PRだけでリリース判断に必要な情報が確認できる

### テスト観点
- 手動実行で「差分なし」ケースを確認
- モック更新でPR作成フローを確認
- OpenAIキー未設定時の失敗理由が明確に出る

## T5 リリース管理ドキュメント更新
ステータス: Done
目的: 新フローを手順書と参照ドキュメントへ反映し、運用のブレをなくす。
対象: `docs/RELEASE_MANAGEMENT.md`, `docs/RELEASE_MANAGEMENT_REFERENCE.md`, `README.md`, `docs/TASK.md`

### 要件
- 新しい標準フロー（週次PR -> 手動レビュー -> `pnpm run release`）を明記する
- 旧手動手順は「例外時のフォールバック」として残す
- 自動判定ルール（minor/patch）と手動上書き方法を明記する
- 必要環境変数、必要CLI、失敗時の復旧手順を記載する

### 受け入れ条件
- 新規メンバーが文書のみで同じ運用を再現できる
- ドキュメント間の矛盾がない

## T6 GitHub Actions による自動リリース
ステータス: Done
目的: GitHub上でリリース（タグ、GitHub Release、npm publish）を自動実行できるようにする。
対象: `.github/workflows/release.yml`（新規）, `package.json`

### 要件
- タグpush（`v*`）をトリガーに実行する
- タグ作成は人手で実施し、workflow は公開処理のみを担う
- `metadata/update-history.json` を含む更新は事前に更新PRで取り込み済みとし、release workflow内ではコミットを行わない
- GitHub Release 作成、`pnpm run publish-packages` を Actions 内で完結させる
- 再実行時の重複公開を防ぐガード（既存タグ、既存バージョン、npm公開済みチェック）を入れる

### 必要シークレット
- `NPM_TOKEN`
- 必要に応じて `GH_RELEASE_TOKEN`（`GITHUB_TOKEN` で不足する場合のみ）

### 受け入れ条件
- GitHub Actions から単独でリリース完了できる
- 失敗時の再実行で重複タグや重複publishが発生しない

### テスト観点
- タグpushでリリースが完了する
- 既存タグありケースで安全停止する
- npm 公開済みケースで安全停止する
