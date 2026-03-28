# @material-symbols-svg/astro

Material Symbols as Astro components. The Astro package currently supports the outlined style and keeps the same weight-based entry points as the React and Vue packages.

## Installation

```bash
pnpm add @material-symbols-svg/astro
```

## Usage

```astro
---
import { Home, HomeFill } from '@material-symbols-svg/astro';
import { Settings } from '@material-symbols-svg/astro/w500';
---

<Home size={24} color="#333" />
<HomeFill size={24} aria-label="Filled home" />
<Settings class="icon" />
```

## Available Imports

- `@material-symbols-svg/astro`
- `@material-symbols-svg/astro/w100` ... `@material-symbols-svg/astro/w700`
- `@material-symbols-svg/astro/icons/home`
- `@material-symbols-svg/astro/icons/home-fill`
- `@material-symbols-svg/astro/outlined`

## Props

- `size?: number | string`
- `color?: string`
- `fill?: string`
- `class?: string`
- Any standard SVG attribute accepted by Astro

## Notes

- Style support: outlined only
- Weight support: 100 to 700
- If `aria-label` is set, the icon is rendered with `role="img"`; otherwise it stays `aria-hidden`
