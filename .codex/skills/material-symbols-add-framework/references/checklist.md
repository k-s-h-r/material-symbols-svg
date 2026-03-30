# Material Symbols Framework Checklist

新しい framework package を追加するとき、または既存 package を他 framework と揃えるときに使うチェックリスト。

## 最初に比較する

- target package は、既存の最も近い package と diff して比較する。1 つの package をそのまま盲目的にコピーしない。
- アクセシビリティ、public API shape、slot / children の扱いで判断が曖昧な場合は Lucide を参照する。ただし最優先はこの repo 内の一貫性。
- 実装前と実装後の両方で、次の観点が揃っているか確認する。
  - generator support
  - runtime behavior
  - accessibility
  - import / export surface
  - tests
  - docs
  - publish metadata
  - CI assumptions

## 確認するファイル

- Root
  - `package.json`
  - `.github/workflows/ci.yml`
  - `README.md`
  - `.gitignore`
- Generators
  - `scripts/generate-icons.ts`
  - `scripts/generate-exports.ts`
  - `scripts/templates/<framework>-template.ts`
- Package
  - `packages/<framework>/package.json`
  - `packages/<framework>/README.md`
  - `packages/<framework>/src/createMaterialIcon.ts` or equivalent component factory
  - `packages/<framework>/src/types.ts`
  - `packages/<framework>/src/icon-helpers.ts` if logic is shared
  - `packages/<framework>/src/index.*`
  - `packages/<framework>/src/w*.ts`
  - `packages/<framework>/tests/*`
  - `packages/<framework>/vitest.config.ts` if tests are added

## Public Surface

- 個別 icon import は `/icons/` 配下に揃える。
- `./package.json` を export する。
- `files` は最小限に保つ。component package は特別な理由がない限り `dist`、`README.md`、`LICENSE` に揃える。
- `author` は `k-s-h-r` に揃える。
- `main`、`types`、`svelte`、`react-native` などの framework-specific export condition は、近い package に合わせる。
- default entry だけでなく、次の public entry point 全体を確認する。
  - root entry
  - `w400` などの weight entry
  - `rounded`、`sharp` などの style entry
  - `/icons/` 配下の individual icon entry
  - `svelte` や `react-native` など framework 固有 condition

## Runtime

### Web packages

- decorative icon はデフォルトで `aria-hidden` にする。
- `aria-*`、`role`、`title` のいずれかがある場合は hidden を外す。
- child content または slot content がある場合も hidden を外す。
- caller が custom `style` を渡しても `color` を保持する。
- framework が対応している範囲で、`size`、`color`、`fill`、`class`、`className`、ref forwarding を近い package と揃える。

### React Native

- default で `accessibilityRole="image"` を付けない。
- `accessible` も強制しない。
- 明示的な accessibility props はそのまま forward する。
- prop forwarding、color handling、ref behavior も package family と揃える。

## アクセシビリティ確認

- まずこの repo 内の最も近い package と比較し、ルールがまだ曖昧なら Lucide で確認する。
- decorative icon と meaningful icon を分けて確認する。
- label ベースと構造ベースの両方を確認する。
  - `aria-label`
  - `aria-labelledby`
  - `role`
  - `title`
  - icon を意味のあるものにする children / slot content
- props の後勝ち spread で accessibility logic が壊れないことを確認する。

## Style / Prop 確認

- `color` と custom `style` が共存することを確認する。
- 後勝ちの prop spread で、計算済みの accessibility や style が意図せず上書きされないことを確認する。
- package が想定する framework-native props を受け取り、rendered SVG または component root に forward していることを確認する。

## Test

- component render test では少なくとも次を確認する。
  - basic render
  - size
  - color
  - decorative icon がデフォルトで hidden
  - labeled icon が assistive tech から見える
  - children / slot content
  - `color` と custom `style` の併用
- refs や accessibility props など framework 特有の props がある場合は explicit prop forwarding test も追加する。
- accessibility や style merge の logic を切り出した場合は helper test も追加する。
- test から `src/w400`、`src/index`、generated icon module を import しない。
- `createMaterialIcon(...)` や local fixture component を使い、CI が prior build に依存しないようにする。

## CI

- PR validation の基本は `pnpm test` と `pnpm lint`。
- CI が失敗して local が通る場合は、working tree に残っている generated file を疑う。
- build step を CI に足してごまかすより、generated artifact に依存しない test に直す。
- GitHub Actions は local branch そのものではなく、merge commit と clean checkout を見る前提で考える。

## Docs / Metadata

- framework が新しい public entry point を増やす場合は package README の install / import examples を更新する。
- repository 全体の supported frameworks や usage examples が変わる場合は root README も更新する。
- package metadata は次を揃える。
  - `author`
  - `license`
  - `repository.directory`
  - `homepage`
  - `bugs`
  - `files`

## Tooling

- 依存バージョンは 1 package だけ勝手に上げず、近い package manifest の toolchain に合わせる。
- Vitest や Vite を触る場合は、変更対象 package だけでなく test を持つ他 framework package も確認する。

## 最終確認

- `pnpm --dir packages/<framework> test`
- `pnpm --dir packages/<framework> lint`
- package-specific typecheck if available
- root `pnpm test`
- root `pnpm lint`
- 挙動が変わった箇所は、最も近い既存 package と Lucide の両方に対して手動比較する
