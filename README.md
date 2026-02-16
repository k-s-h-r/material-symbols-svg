# Material Symbols SVG

Material Symbols as framework components. This library provides Google's Material Symbols as optimized components with comprehensive weight support and excellent performance.

🌐 **[Documentation](https://material-symbols-svg.com/)**

## Features

- 🎨 **3,340+ Icons** - Complete Material Symbols collection
- ⚖️ **7 Weight Variants** - From 100 (thin) to 700 (bold)
- 🎭 **3 Style Variants** - Outlined, Rounded, and Sharp
- 🌳 **Optimized Imports** - Only import what you use
- 📦 **TypeScript Support** - Full type safety out of the box
- ⚡ **Optimized Performance** - Tree-shaking friendly (bundler-dependent)
- 🔄 **Hot Reload Friendly** - Fast development experience

## Available Packages

### React Components

```bash
npm install @material-symbols-svg/react          # Stable (Outlined)
npm install @material-symbols-svg/react@beta     # Beta (Outlined + Rounded + Sharp)
```

### Vue Components

```bash
npm install @material-symbols-svg/vue            # Stable (Outlined)
npm install @material-symbols-svg/vue@beta       # Beta (Outlined + Rounded + Sharp)
```

## Quick Start

### React

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

### Vue

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

**React:**
```tsx
import { Home, Settings, Menu } from '@material-symbols-svg/react';
```

**Vue:**
```ts
import { Home, Settings, Menu } from '@material-symbols-svg/vue';
```

### Weight-Specific Imports

**React:**
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

**Vue:**
```ts
// Weight-specific imports follow the same pattern
import { Home, Settings } from '@material-symbols-svg/vue/w100';
import { Home, Settings } from '@material-symbols-svg/vue/w400';
import { Home, Settings } from '@material-symbols-svg/vue/w700';
```

### Individual Icon Imports (Maximum Optimization)

**React:**
```tsx
import { HomeW400 } from '@material-symbols-svg/react/icons/home';
import { SettingsW500 } from '@material-symbols-svg/react/icons/settings';
```

**Vue:**
```ts
import { HomeW400 } from '@material-symbols-svg/vue/icons/home';
import { SettingsW500 } from '@material-symbols-svg/vue/icons/settings';
```

### Filled Variants

**React:**
```tsx
import { HomeFill, SettingsFill } from '@material-symbols-svg/react';
// or
import { HomeFillW500 } from '@material-symbols-svg/react/icons/home';
```

**Vue:**
```ts
import { HomeFill, SettingsFill } from '@material-symbols-svg/vue';
// or
import { HomeFillW500 } from '@material-symbols-svg/vue/icons/home';
```

### Style Variants

#### Outlined Style (Explicit Path)
**React:**
```bash
npm install @material-symbols-svg/react@beta
```
```tsx
import { Home, Settings } from '@material-symbols-svg/react/outlined/w500';
```

**Vue:**
```bash
npm install @material-symbols-svg/vue@beta
```
```ts
import { Home, Settings } from '@material-symbols-svg/vue/outlined/w500';
```

#### Rounded Style
**React:**
```bash
npm install @material-symbols-svg/react@beta
```
```tsx
import { Home, Settings } from '@material-symbols-svg/react/rounded';
```

**Vue:**
```bash
npm install @material-symbols-svg/vue@beta
```
```ts
import { Home, Settings } from '@material-symbols-svg/vue/rounded';
```

#### Sharp Style
**React:**
```bash
npm install @material-symbols-svg/react@beta
```
```tsx
import { Home, Settings } from '@material-symbols-svg/react/sharp';
```

**Vue:**
```bash
npm install @material-symbols-svg/vue@beta
```
```ts
import { Home, Settings } from '@material-symbols-svg/vue/sharp';
```

## Component Props

All icons accept standard SVG props:

**React:**
```tsx
import { Home } from '@material-symbols-svg/react';

<Home 
  size={24}          // or width/height
  color="blue"       // or fill
  className="icon"
  style={{ margin: '10px' }}
  onClick={handleClick}
/>
```

**Vue:**
```vue
<template>
  <Home 
    :size="24"          
    color="blue"       
    class="icon"
    :style="{ margin: '10px' }"
    @click="handleClick"
  />
</template>

<script setup lang="ts">
import { Home } from '@material-symbols-svg/vue';

const handleClick = () => {
  console.log('Icon clicked');
};
</script>
```

## Architecture

This library implements a Lucide-style architecture focused on modular imports:

- **Per-icon Modules**: Each icon module contains one icon's variants (weights, fill)
- **Memory Efficient**: Avoids bundling all icons at once
- **Bundle Friendly**: Unused exports are removable in modern bundlers
- **Scalable**: Source and output are split by framework and style paths

### File Structure

```
packages/
├── react/
│   └── src/
│       ├── icons/*.ts
│       ├── rounded/icons/*.ts
│       └── sharp/icons/*.ts
└── vue/
    └── src/
        ├── icons/*.ts
        ├── rounded/icons/*.ts
        └── sharp/icons/*.ts
```

## Development

### Prerequisites

- Node.js ≥ 16.0.0
- pnpm (recommended)

### Setup

```bash
git clone https://github.com/k-s-h-r/material-symbols-svg.git
cd material-symbols-svg
pnpm install

# Generate icon files (required for first time setup)
pnpm run build
```

**Note**: Icon files are generated during build and not committed to the repository. You must run the build command to generate the icon files before using the library.

### Build

```bash
# Development build (limited to 10 icons for speed)
pnpm run build:dev

# Production build (all 6,680+ icons)
pnpm run build

# Individual package build
pnpm run --filter="@material-symbols-svg/react" build
```

### Available Scripts

```bash
# Build all packages
pnpm run build

# Run tests
pnpm test

# Lint code
pnpm run lint

# Clean build artifacts
pnpm run clean
```

### Release Workflow

Standard operation:
1. Weekly GitHub Actions job creates an icon update PR (`.github/workflows/icon-update.yml`)
2. Review the PR (`from/to` upstream version and `added/updated/removed` counts)
3. Merge into `main`
4. Run release plan check and then release

```bash
pnpm run release -- --dry-run
pnpm run release
```

Release type defaults to `auto`:
- `added + updated + removed > 0` -> `minor`
- `added + updated + removed = 0` -> `patch`
- Manual override: `pnpm run release -- --type=major`

Fallback (manual icon update):

```bash
pnpm run update:icons:auto
pnpm run build
```

See `/Users/k/develop/material-symbols-svg-worktrees/feature-task-t0/docs/RELEASE_MANAGEMENT.md` and `/Users/k/develop/material-symbols-svg-worktrees/feature-task-t0/docs/RELEASE_MANAGEMENT_REFERENCE.md` for full release operations.

### Development Mode

During development, icon generation is limited to 10 icons for faster build times:
- Home, Settings, Star, Favorite, Person
- Search, Menu, Close, Check, ArrowForward

This can be controlled via:
- Environment variable: `ICON_LIMIT=true` or `NODE_ENV=development`
- Development commands: `pnpm run build:dev`

## Bundle Size Optimization

### Import Best Practices

> Note: Each icon module currently contains multiple variants (weights `W100`–`W700`, filled variants, and metadata). Importing from `icons/*` narrows module scope to a single icon, but final bundle size still depends on your bundler and production settings.

**React:**
```tsx
// ✅ Good - Only imports specific icons
import { Home, Settings } from '@material-symbols-svg/react/w400';

// ✅ Better - Often smaller bundles (bundler-dependent)
import { HomeW400 } from '@material-symbols-svg/react/icons/home';

// ❌ Avoid - Imports entire weight bundle
import * as Icons from '@material-symbols-svg/react/w400';
```

**Vue:**
```ts
// ✅ Good - Only imports specific icons
import { Home, Settings } from '@material-symbols-svg/vue/w400';

// ✅ Better - Often smaller bundles (bundler-dependent)
import { HomeW400 } from '@material-symbols-svg/vue/icons/home';

// ❌ Avoid - Imports entire weight bundle
import * as Icons from '@material-symbols-svg/vue/w400';
```

### Next.js Configuration

If you use this library in Next.js, enable `experimental.optimizePackageImports` to avoid loading large numbers of icon modules during development.

Add to `next.config.js` / `next.config.ts` (include only what you use):

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@material-symbols-svg/react']
  }
};

export default nextConfig;
```

### Bundle Analysis

This library is designed to be tree-shakable:
- Each icon is a separate module under `icons/*`
- Weight entry points (e.g. `/w400`) are convenience re-exports
- Actual bundle size depends on tree-shaking support in your bundler

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the Apache-2.0 License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Google Material Symbols](https://fonts.google.com/icons) - Original icon designs
- [Lucide](https://lucide.dev/) - Architecture inspiration for optimal bundling

## Related Packages

- **@material-symbols-svg/react** - React components (Outlined / Rounded / Sharp)
  - [npm](https://www.npmjs.com/package/@material-symbols-svg/react) | [GitHub](https://github.com/k-s-h-r/material-symbols-svg/tree/main/packages/react)
- **@material-symbols-svg/vue** - Vue components (Outlined / Rounded / Sharp)
  - [npm](https://www.npmjs.com/package/@material-symbols-svg/vue) | [GitHub](https://github.com/k-s-h-r/material-symbols-svg/tree/main/packages/vue)
