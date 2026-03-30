---
name: material-symbols-add-framework
description: material-symbols-svg モノレポ内でフレームワーク向け package を追加または調整するための skill。新しい UI フレームワーク対応を追加するとき、既存 package の実装パターンを別フレームワークへ移植するとき、または React / Vue / Astro / Svelte / React Native 間で exports、アクセシビリティ、style handling、tests、CI、generator templates、docs、publish metadata の実装差分を埋めたいときに使う。
---

# Material Symbols Add Framework

新しいフレームワーク向け package は、独自仕様を増やすのではなく既存 package のパターンに合わせて追加する。まず最も近い既存 package と比較し、その後 runtime behavior、exports、アクセシビリティ、tests、docs、CI、publish metadata まで揃っているか確認してから完了とする。

## 進め方

1. 編集前に比較対象となる package を決める。
   - TS / render-function 系は `packages/react` と `packages/vue` を起点にする。
   - コンパイル系コンポーネントは `packages/svelte` と `packages/astro` を起点にする。
   - モバイル系は `packages/react-native` を起点にする。
   - この repo 内で挙動が揺れているか判断が曖昧な場合は、Lucide を第二の参照先として使う。特に decorative icon の既定動作、accessible icon の公開条件、slot / children の扱い、import surface の設計を確認する。
   - 具体的な確認項目は [references/checklist.md](references/checklist.md) を読む。

2. 実装前に、どこまで揃えるかを比較して把握する。
   - generator support、package exports、README examples、runtime props、アクセシビリティ既定動作、test strategy、publish metadata を編集前に見ておく。
   - 最初に動く実装ができた時点で止めない。利用者が実際に import、render、test、publish できる面まで他 package と揃っているか確認する。

3. generator と package entry point をまとめて更新する。
   - `scripts/templates/<framework>-template.ts` を追加または更新する。
   - `scripts/generate-icons.ts` と `scripts/generate-exports.ts` がその framework を認識する状態にする。
   - 専用の `build:*` や `publish:*` が必要なら root `package.json` の scripts も更新する。
   - package の `exports` は近い framework 群の package に合わせる。

4. runtime behavior を既存 package に揃える。
   - `size`、`color`、`fill` の意味を他の icon package と合わせる。
   - caller が custom `style` を渡しても `color` が失われないようにする。
   - web package では decorative icon をデフォルトで hidden にし、accessible props や child content がある場合だけ公開する。
   - React Native では default の accessibility exposure を強制せず、明示的な props のみ forward する。
   - slot / children の扱いは明示的に確認する。child content を受け取れる framework なら、アクセシビリティ判定と render path の両方がそれを考慮している必要がある。

5. clean checkout でも成立する tests を追加する。
   - isolated logic には helper test、user-visible behavior には component render test を優先する。
   - test から `src/w400` や生成済み icon module を import しない。
   - `createMaterialIcon(...)` や同等の local fixture component を使い、CI が prebuilt artifact に依存しないようにする。
   - CI は生成物の残骸も local build cache も無い clean checkout だと考える。

6. docs、CI、publish metadata を揃えてから完了にする。
   - public surface が変わる場合は package README の usage examples と root README を更新する。
   - package の `files` は最小限に保ち、他の publish 対象 package と揃える。
   - ユーザーが明示しない限り、root の PR CI は `pnpm test` と `pnpm lint` を前提にする。

## 確認

- まず package-local の確認を行い、その後 root の `pnpm test` と `pnpm lint` を実行する。
- GitHub Actions で失敗して local では通る場合は、CI runner が clean checkout で動いている前提で、generated-file import や local build artifact の残りを疑う。
- 完了と判断する前に、[references/checklist.md](references/checklist.md) を section ごとに見直し、exports、a11y、docs、publish metadata の取りこぼしがないことを確認する。
- publish 前に `package.json` の `exports`、`files`、README examples を再確認する。
