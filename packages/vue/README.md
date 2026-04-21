# Material Symbols SVG / Vue

Material Symbols as Vue components. This package provides Google's Material Symbols in **Outlined (default), Rounded, and Sharp** styles as optimized Vue components, using **SVG paths instead of web fonts** for better performance, comprehensive weight support and tree-shaking-friendly output.

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
npm install @material-symbols-svg/vue
# or
pnpm add @material-symbols-svg/vue
# or
yarn add @material-symbols-svg/vue
```

## Quick Start

```vue
<template>
  <div>
    <Home />
    <Settings />
    <Search />
  </div>
</template>

<script setup lang="ts">
import { Home, Settings, Search } from '@material-symbols-svg/vue';
</script>
```

## Usage

### Basic Import (Default Weight 400)

```vue
<script setup lang="ts">
import { Home, Settings, Menu } from '@material-symbols-svg/vue';
</script>
```

### Weight-Specific Imports

```vue
<script setup lang="ts">
// Thin (100)
import { Home, Settings } from '@material-symbols-svg/vue/w100';

// Light (200)
import { Home, Settings } from '@material-symbols-svg/vue/w200';

// Regular (300)
import { Home, Settings } from '@material-symbols-svg/vue/w300';

// Medium (400) - Default
import { Home, Settings } from '@material-symbols-svg/vue/w400';

// Semi-bold (500)
import { Home, Settings } from '@material-symbols-svg/vue/w500';

// Bold (600)
import { Home, Settings } from '@material-symbols-svg/vue/w600';

// Extra-bold (700)
import { Home, Settings } from '@material-symbols-svg/vue/w700';
</script>
```

### Individual Icon Imports (Most Tree-shaking-friendly)

```vue
<script setup lang="ts">
import { Home, HomeW400 } from '@material-symbols-svg/vue/icons/home';
import { SettingsW500 } from '@material-symbols-svg/vue/icons/settings';
import { HomeW100 } from '@material-symbols-svg/vue/home';
</script>
```

### Filled Variants

```vue
<script setup lang="ts">
import { HomeFill, SettingsFill } from '@material-symbols-svg/vue';
// or weight-specific
import { HomeFillW500 } from '@material-symbols-svg/vue/w500';
// or individual imports
import { HomeFill, HomeFillW400 } from '@material-symbols-svg/vue/icons/home';
</script>
```

### Style Variants (Single Package)

```vue
<script setup lang="ts">
// Outlined (default weight: w400)
// (equivalent to '@material-symbols-svg/vue')
import { Home, Settings } from '@material-symbols-svg/vue/outlined';

// Rounded (default weight: w400)
import { Home, Settings } from '@material-symbols-svg/vue/rounded';

// Sharp (default weight: w400)
import { Home, Settings } from '@material-symbols-svg/vue/sharp';

// Outlined weight-specific
import { Home, Settings } from '@material-symbols-svg/vue/outlined/w500';

// Rounded weight-specific
import { Home, Settings } from '@material-symbols-svg/vue/rounded/w500';

// Sharp individual icon import
import { HomeW400 } from '@material-symbols-svg/vue/sharp/icons/home';
</script>
```

## Component Props

All icons accept standard SVG props:

```vue
<template>
  <Home 
    :size="24"
    color="blue"
    class="icon"
    :style="{ margin: '10px' }"
  />
</template>
```

## Accessibility

- Decorative icons stay `aria-hidden` by default.
- Expose standalone semantic icons with `aria-label`, `aria-labelledby`, or an SVG `<title>` child.
- When an icon is inside a button or link, put the accessible name on the interactive wrapper, not on the icon itself.

```vue
<template>
  <Home aria-label="Home" />

  <Home>
    <title>Home</title>
  </Home>

  <button type="button" aria-label="Open settings">
    <Home />
  </button>
</template>
```

## Bundle Size Optimization

### Tree-shaking Best Practices

> Note: Each icon module currently exports multiple variants (weights `W100`–`W700`, filled variants, and metadata). Importing from `icons/*` narrows the module scope to a single icon, but final bundle size still depends on your bundler and production configuration.

Framework checks showed a large DX difference for Vue consumers. In Vite, `icons/*` deep imports reduced hot reload time from about `2.68s` to about `0.03s` and build time from about `5.98s` to about `0.87s`. In Nuxt 3, the same switch reduced dev startup from about `48s` to about `2.9s` and build time from about `31s` to about `4.1s`.

```vue
<script setup lang="ts">
// ✅ Recommended for Vite and Nuxt apps
import { Home, HomeW400 } from '@material-symbols-svg/vue/icons/home';

// ✅ Also fine - Root import and `/w400` resolve to the same outlined W400 entry
import { Home, Settings } from '@material-symbols-svg/vue';

// ❌ Avoid - Imports an entire weight bundle namespace
import * as Icons from '@material-symbols-svg/vue/w400';
</script>
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
