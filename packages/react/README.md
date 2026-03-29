# Material Symbols SVG / React

Material Symbols as React components. This package provides Google's Material Symbols in **Outlined (default), Rounded, and Sharp** styles as optimized React components, using **SVG paths instead of web fonts** for better performance, comprehensive weight support and tree-shaking-friendly output.

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
import { HomeW400 } from '@material-symbols-svg/react/icons/home';
import { SettingsW500 } from '@material-symbols-svg/react/icons/settings';
```

### Filled Variants

```tsx
import { HomeFill, SettingsFill } from '@material-symbols-svg/react';
// or weight-specific
import { HomeFillW500 } from '@material-symbols-svg/react/w500';
// or individual imports
import { HomeFillW400 } from '@material-symbols-svg/react/icons/home';
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
  onClick={handleClick}
/>
```

## Bundle Size Optimization

### Tree-shaking Best Practices

> Note: Each icon module currently exports multiple variants (weights `W100`–`W700`, filled variants, and metadata). Importing from `icons/*` narrows the module scope to a single icon, but final bundle size still depends on your bundler and production configuration.

```tsx
// ✅ Good - Only imports specific icons
import { Home, Settings } from '@material-symbols-svg/react/w400';

// ✅ Better - Often smaller bundles (bundler-dependent)
import { HomeW400 } from '@material-symbols-svg/react/icons/home';

// ❌ Avoid - Imports entire weight bundle
import * as Icons from '@material-symbols-svg/react/w400';
```

### Next.js Configuration

If you use this package in Next.js, enable `experimental.optimizePackageImports` to reduce memory usage and speed up dev mode.

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

## Available Icons

This package includes 3,340+ Material Symbols icons across outlined, rounded, and sharp styles. All icons are available in multiple categories:

- **Action** - Common UI actions
- **Alert** - Notifications and warnings  
- **AV** - Audio/video controls
- **Communication** - Chat, email, phone
- **Content** - Text editing, formatting
- **Device** - Hardware and device icons
- **Editor** - Text and content editing
- **File** - File operations and types
- **Hardware** - Computer and device hardware
- **Home** - Smart home and IoT
- **Image** - Photo and image editing
- **Maps** - Location and navigation
- **Navigation** - App navigation elements
- **Notification** - System notifications
- **Places** - Locations and buildings
- **Search** - Search and discovery
- **Social** - Social media and sharing
- **Toggle** - On/off and selection controls

## Contributing

See the main repository for contribution guidelines: [material-symbols-svg](https://github.com/k-s-h-r/material-symbols-svg)

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
