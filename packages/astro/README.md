# @material-symbols-svg/astro

Material Symbols as Astro components. The Astro package supports the outlined, rounded, and sharp styles and keeps the same weight-based entry points as the React and Vue packages.

## Installation

```bash
pnpm add @material-symbols-svg/astro
```

## Usage

```astro
---
import { Home, HomeFill } from '@material-symbols-svg/astro';
import { Settings } from '@material-symbols-svg/astro/w500';
import { HomeW100, HomeW400, HomeFillW700 } from '@material-symbols-svg/astro/home';
import { Search } from '@material-symbols-svg/astro/rounded';
import { MenuW700 } from '@material-symbols-svg/astro/sharp/menu';
---

<Home size={24} color="#333" />
<HomeFill size={24} aria-label="Filled home" />
<Settings class="icon" />
<HomeW100 size={24} />
<HomeW400 size={24} />
<HomeFillW700 size={24} />
<Search size={24} />
<MenuW700 size={24} />
```

## Available Imports

- `@material-symbols-svg/astro`
- `@material-symbols-svg/astro/w100` ... `@material-symbols-svg/astro/w700`
- `@material-symbols-svg/astro/home`
- `@material-symbols-svg/astro/icons/home`
- `@material-symbols-svg/astro/icons/home-fill`
- `@material-symbols-svg/astro/outlined`
- `@material-symbols-svg/astro/rounded`
- `@material-symbols-svg/astro/sharp`
- `@material-symbols-svg/astro/rounded/home`
- `@material-symbols-svg/astro/sharp/home`

## Props

- `size?: number | string`
- `color?: string`
- `fill?: string`
- `class?: string`
- Any standard SVG attribute accepted by Astro

## Notes

- Style support: outlined, rounded, sharp
- Weight support: 100 to 700
- Icons stay `aria-hidden` by default, but become exposed when you pass accessible props such as `aria-label`, `aria-labelledby`, `role`, or `title`
