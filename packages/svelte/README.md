# Material Symbols SVG / Svelte

Material Symbols as Svelte components. This package provides Google's Material Symbols in **Outlined (default), Rounded, and Sharp** styles as optimized Svelte components, using **SVG paths instead of web fonts** for better performance, comprehensive weight support and tree-shaking-friendly output.

🌐 **[Documentation](https://material-symbols-svg.com/)**

## Features

- 🎨 **3,340+ Icons** - Complete Material Symbols collection
- 🎭 **3 Style Variants** - Outlined, Rounded, Sharp
- ⚖️ **7 Weight Variants** - From 100 (thin) to 700 (bold)
- 🌳 **Tree-shaking Friendly** - Bundler-dependent optimization
- 📦 **TypeScript Support** - Full type safety out of the box
- ⚡ **Optimized Performance** - Designed for ESM tree-shaking
- 🔄 **Hot Reload Friendly** - Fast development experience
- 🎭 **Fill Variants** - Both outlined and filled versions available

## Installation

```bash
npm install @material-symbols-svg/svelte
# or
pnpm add @material-symbols-svg/svelte
# or
yarn add @material-symbols-svg/svelte
```

## Quick Start

```svelte
<script lang="ts">
  import { Home, Settings, Search } from '@material-symbols-svg/svelte';
</script>

<Home />
<Settings />
<Search />
```

## Usage

### Basic Import (Default Weight 400)

```svelte
<script lang="ts">
  import { Home, Settings, Menu } from '@material-symbols-svg/svelte';
</script>
```

### Weight-Specific Imports

```svelte
<script lang="ts">
  import { Home, Settings } from '@material-symbols-svg/svelte/w100';
  import { Home as Home400 } from '@material-symbols-svg/svelte/w400';
  import { Home as Home700 } from '@material-symbols-svg/svelte/w700';
</script>
```

### Individual Icon Imports

```svelte
<script lang="ts">
  import Home from '@material-symbols-svg/svelte/home';
  import { HomeW500, HomeFillW500 } from '@material-symbols-svg/svelte/icons/home';
</script>
```

### Filled Variants

```svelte
<script lang="ts">
  import { HomeFill, SettingsFill } from '@material-symbols-svg/svelte';
</script>
```

### Style Variants (Single Package)

```svelte
<script lang="ts">
  import { Home, Settings } from '@material-symbols-svg/svelte/outlined';
  import { Home as HomeRounded } from '@material-symbols-svg/svelte/rounded';
  import { Home as HomeSharp500 } from '@material-symbols-svg/svelte/sharp/w500';
</script>
```

## Component Props

All icons accept standard SVG props:

```svelte
<script lang="ts">
  import { Home } from '@material-symbols-svg/svelte';
</script>

<Home
  size={24}
  color="blue"
  class="icon"
  aria-label="Home"
/>
```

Decorative icons are `aria-hidden` by default. Pass accessible props such as `aria-label`, `aria-labelledby`, `role`, or `title` when the icon should be exposed to assistive technologies.

## Bundle Size Optimization

### Tree-shaking Best Practices

> Note: Each icon module currently exports multiple variants (weights `W100`–`W700`, filled variants, and metadata). Importing from `icons/*` narrows the module scope to a single icon, but final bundle size still depends on your bundler and production configuration.

```svelte
<script lang="ts">
  import { Home, Settings } from '@material-symbols-svg/svelte/w400';
  import HomeIcon from '@material-symbols-svg/svelte/home';
</script>
```

## Contributing

See the main repository for contribution guidelines: [material-symbols-svg](https://github.com/k-s-h-r/material-symbols-svg)
