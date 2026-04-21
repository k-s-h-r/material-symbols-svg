# Material Symbols SVG / React

Material Symbols as React components. This package provides Google's Material Symbols in **Outlined (default), Rounded, and Sharp** styles as optimized React components, using **SVG paths instead of web fonts** for better performance, comprehensive weight support and tree-shaking-friendly output.

🌐 **[Documentation](https://material-symbols-svg.com/)**

## Features

- 🎨 **3,836+ Icons** - Complete Material Symbols collection
- 🎭 **3 Style Variants** - Outlined, Rounded, Sharp
- ⚖️ **7 Weight Variants** - From 100 (thin) to 700 (bold)
- 🌳 **Tree-shaking Friendly** - Bundler-dependent optimization
- 📦 **TypeScript Support** - Full type safety out of the box
- ⚡ **Optimized Performance** - Designed for ESM tree-shaking
- 🔄 **Hot Reload Friendly** - Fast development experience
- 🎭 **Fill Variants** - Both outlined and filled versions available

## Installation

```bash
npm install @material-symbols-svg/react
# or
pnpm add @material-symbols-svg/react
# or
yarn add @material-symbols-svg/react
```

## Quick Start

```tsx
import React from 'react';
import { Home, Settings, Search } from '@material-symbols-svg/react';

function App() {
  return (
    <div>
      <Home />
      <Settings />
      <Search />
    </div>
  );
}
```

## Usage

### Basic Import (Default Weight 400)

```tsx
import { Home, Settings, Menu } from '@material-symbols-svg/react';
```

### Weight-Specific Imports

```tsx
// Thin (100)
import { Home, Settings } from '@material-symbols-svg/react/w100';

// Light (200)
import { Home, Settings } from '@material-symbols-svg/react/w200';

// Regular (300)
import { Home, Settings } from '@material-symbols-svg/react/w300';

// Medium (400) - Default
import { Home, Settings } from '@material-symbols-svg/react/w400';

// Semi-bold (500)
import { Home, Settings } from '@material-symbols-svg/react/w500';

// Bold (600)
import { Home, Settings } from '@material-symbols-svg/react/w600';

// Extra-bold (700)
import { Home, Settings } from '@material-symbols-svg/react/w700';
```

### Individual Icon Imports (Most Tree-shaking-friendly)

```tsx
import { Home, HomeW400 } from '@material-symbols-svg/react/icons/home';
import { SettingsW500 } from '@material-symbols-svg/react/icons/settings';
import { HomeW100 } from '@material-symbols-svg/react/home';
```

### Filled Variants

```tsx
import { HomeFill, SettingsFill } from '@material-symbols-svg/react';
// or weight-specific
import { HomeFillW500 } from '@material-symbols-svg/react/w500';
// or individual imports
import { HomeFill, HomeFillW400 } from '@material-symbols-svg/react/icons/home';
```

### Style Variants (Single Package)

```tsx
// Outlined (default weight: w400)
// (equivalent to '@material-symbols-svg/react')
import { Home, Settings } from '@material-symbols-svg/react/outlined';

// Rounded (default weight: w400)
import { Home, Settings } from '@material-symbols-svg/react/rounded';

// Sharp (default weight: w400)
import { Home, Settings } from '@material-symbols-svg/react/sharp';

// Outlined weight-specific
import { Home, Settings } from '@material-symbols-svg/react/outlined/w500';

// Rounded weight-specific
import { Home, Settings } from '@material-symbols-svg/react/rounded/w500';

// Sharp individual icon import
import { HomeW400 } from '@material-symbols-svg/react/sharp/icons/home';
```

## Component Props

All icons accept standard SVG props:

```tsx
import { Home } from '@material-symbols-svg/react';

<Home 
  size={24}          // or width/height
  color="blue"       // or fill
  className="icon"
  style={{ margin: '10px' }}
/>
```

## Accessibility

- Decorative icons stay `aria-hidden` by default.
- Expose standalone semantic icons with `aria-label`, `aria-labelledby`, or an SVG `<title>` child.
- When an icon is inside a button or link, put the accessible name on the interactive wrapper, not on the icon itself.

```tsx
<Home aria-label="Home" />

<Home>
  <title>Home</title>
</Home>

<button type="button" aria-label="Open settings">
  <Home />
</button>
```

## Bundle Size Optimization

### Tree-shaking Best Practices

> Note: Each icon module currently exports multiple variants (weights `W100`–`W700`, filled variants, and metadata). Importing from `icons/*` narrows the module scope to a single icon, but final bundle size still depends on your bundler and production configuration.

Framework checks against local Vite apps (React 16-19) showed that `icons/*` deep imports consistently reduced hot reload time from about `0.6-0.9s` to about `0.03s`, and reduced build time by about `1.3-2.0s`. In Next.js 14-16, deep imports also improved dev/build time more consistently than `optimizePackageImports`.

```tsx
// ✅ Recommended for faster dev/HMR in most setups
import { Home, HomeW400 } from '@material-symbols-svg/react/icons/home';

// ✅ Also fine - Root import and `/w400` resolve to the same outlined W400 entry
import { Home, Settings } from '@material-symbols-svg/react';

// ❌ Avoid - Imports an entire weight bundle namespace
import * as Icons from '@material-symbols-svg/react/w400';
```

### Next.js Configuration

If you use this package in Next.js, prefer deep imports first. In our Next.js 14-16 checks, `icons/*` imports improved dev/build time more than `experimental.optimizePackageImports`, while `optimizePackageImports` only produced smaller wins for root imports.

Enable `experimental.optimizePackageImports` if you still want to optimize root-import workflows in Next.js.

Add to `next.config.js` / `next.config.ts` (include only what you use):

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: [
      '@material-symbols-svg/react',
      '@material-symbols-svg/react/outlined',
      '@material-symbols-svg/react/rounded',
      '@material-symbols-svg/react/sharp',
    ],
  }
};

export default nextConfig;
```

If your app imports from specific subpaths (for example `/w500`), add those subpaths explicitly:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: [
      '@material-symbols-svg/react',
      '@material-symbols-svg/react/outlined',
      '@material-symbols-svg/react/rounded',
      '@material-symbols-svg/react/sharp',
      '@material-symbols-svg/react/w500',
      '@material-symbols-svg/react/rounded/w500',
      '@material-symbols-svg/react/sharp/w500',
    ],
  }
};

export default nextConfig;
```

## License

This project is licensed under the Apache-2.0 License. See the [LICENSE](../../LICENSE) file for details.

## Acknowledgments

- [Google Material Symbols](https://fonts.google.com/icons) - Original icon designs
- [Lucide](https://lucide.dev/) - Architecture inspiration for optimal tree-shaking

## Related Packages

- **@material-symbols-svg/react** - React components (Outlined / Rounded / Sharp)
  - [npm](https://www.npmjs.com/package/@material-symbols-svg/react) | [GitHub](../react)
- **@material-symbols-svg/vue** - Vue components (Outlined / Rounded / Sharp)
  - [npm](https://www.npmjs.com/package/@material-symbols-svg/vue) | [GitHub](../vue)
- **@material-symbols-svg/svelte** - Svelte components (Outlined / Rounded / Sharp)
  - [npm](https://www.npmjs.com/package/@material-symbols-svg/svelte) | [GitHub](../svelte)
- **@material-symbols-svg/astro** - Astro components (Outlined / Rounded / Sharp)
  - [npm](https://www.npmjs.com/package/@material-symbols-svg/astro) | [GitHub](../astro)
- **@material-symbols-svg/react-native** - React Native components (Outlined / Rounded / Sharp)
  - [npm](https://www.npmjs.com/package/@material-symbols-svg/react-native) | [GitHub](../react-native)
