# Astroメモ

Astroパッケージ（`@material-symbols-svg/astro`）の現状と、保留中の課題をまとめる。

## 現状

- Astro版は `outlined` のみ対応
- `pnpm run build:astro` で `packages/astro/dist` を生成できる
- `@material-symbols-svg/astro/icons/home` のような個別 import は実用的な速度で動作する
- 型定義は `dist/*.d.ts` と `dist/icon-entry.d.ts` を生成する

## 保留中の課題

### 1. ルート named import が遅い

以下の形式は開発時の表示まで極端に時間がかかる。

```ts
import { Raven } from '@material-symbols-svg/astro';
```

一方、以下は問題なく動く。

```ts
import Home from '@material-symbols-svg/astro/icons/home';
```

## 現時点の理解

- 遅さの主因は、`@material-symbols-svg/astro` の巨大なバレル export
- Astro/Vite dev では、tree-shaking 前に大量モジュールの解決と解析コストが乗る
- Material Symbols はアイコン数が多く、さらに weight / fill バリエーションがあるため、Lucide系より不利

## 一旦の方針

- 現状の実装は維持する
- Astro版の主導線は個別 import を想定する
- ルート named import は実用上非推奨と考える

## 将来の検討候補

### A. Lucide寄せの実装へ変更

- 1アイコン1モジュールにして、共通 `Icon.astro` にデータを渡す
- ただし巨大バレル自体の問題は残るため、決定打にはなりにくい

### B. Astroだけ import 設計を変える

- `@material-symbols-svg/astro/icons/home`
- `@material-symbols-svg/astro/home`
- `@material-symbols-svg/astro/w400/home`

のような個別 import を正式導線にする。

### C. weight を props 化する

```astro
---
import Home from '@material-symbols-svg/astro/icons/home';
---

<Home weight={500} filled />
```

- ファイル数は減る
- ただし weight 単位の tree-shaking は弱くなる

## 参考

- Lucide Astro 実装:
  - `packages/astro/src/lucide-astro.ts` から `icons/index` を再 export
  - 各アイコンは薄い TS モジュール
  - 共通 `Icon.astro` に描画を集約
- ただし Lucide は Material Symbols よりアイコン数・バリエーション数が少ない
