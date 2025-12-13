# Material Symbols SVG / React (Rounded)

Material Symbols as React components. This package provides Google's Material Symbols in **Rounded style** as optimized React components, using **SVG paths instead of web fonts** for better performance, comprehensive weight support and tree-shaking-friendly output.

🌐 **[Documentation](https://material-symbols-svg.com/)**

## Features

- 🎨 **3,340+ Icons** - Complete Material Symbols collection in Rounded style
- ⚖️ **7 Weight Variants** - From 100 (thin) to 700 (bold)
- 🌳 **Tree-shaking Friendly** - Bundler-dependent optimization
- 📦 **TypeScript Support** - Full type safety out of the box
- ⚡ **Optimized Performance** - Designed for ESM tree-shaking
- 🔄 **Hot Reload Friendly** - Fast development experience
- 🎭 **Fill Variants** - Both outlined and filled versions available

## Installation

```bash
npm install @material-symbols-svg/react-rounded
# or
pnpm add @material-symbols-svg/react-rounded
# or
yarn add @material-symbols-svg/react-rounded
```

## Quick Start

```tsx
import React from 'react';
import { Home, Settings, Search } from '@material-symbols-svg/react-rounded';

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
import { Home, Settings, Menu } from '@material-symbols-svg/react-rounded';
```

### Weight-Specific Imports

```tsx
// Thin (100)
import { Home, Settings } from '@material-symbols-svg/react-rounded/w100';

// Light (200)
import { Home, Settings } from '@material-symbols-svg/react-rounded/w200';

// Regular (300)
import { Home, Settings } from '@material-symbols-svg/react-rounded/w300';

// Medium (400) - Default
import { Home, Settings } from '@material-symbols-svg/react-rounded/w400';

// Semi-bold (500)
import { Home, Settings } from '@material-symbols-svg/react-rounded/w500';

// Bold (600)
import { Home, Settings } from '@material-symbols-svg/react-rounded/w600';

// Extra-bold (700)
import { Home, Settings } from '@material-symbols-svg/react-rounded/w700';
```

### Individual Icon Imports (Maximum Tree-shaking)

```tsx
import { HomeW400 } from '@material-symbols-svg/react-rounded/icons/home';
import { SettingsW500 } from '@material-symbols-svg/react-rounded/icons/settings';
```

### Filled Variants

```tsx
import { HomeFill, SettingsFill } from '@material-symbols-svg/react-rounded';
// or weight-specific
import { HomeFillW500 } from '@material-symbols-svg/react-rounded/w500';
// or individual imports
import { HomeFillW400 } from '@material-symbols-svg/react-rounded/icons/home';
```

## Component Props

All icons accept standard SVG props:

```tsx
import { Home } from '@material-symbols-svg/react-rounded';

<Home 
  size={24}          // or width/height
  color="blue"       // or fill
  className="icon"
  style={{ margin: '10px' }}
  onClick={handleClick}
/>
```

## Other Styles

This package provides **Rounded** style icons. For other styles:

### Outlined Style (Default)
```bash
npm install @material-symbols-svg/react
```

```tsx
import { Home, Settings } from '@material-symbols-svg/react';
```

### Sharp Style
```bash
npm install @material-symbols-svg/react-sharp
```

```tsx
import { Home, Settings } from '@material-symbols-svg/react-sharp';
```

## Bundle Size Optimization

### Tree-shaking Best Practices

> Note: Each icon module currently exports multiple variants (weights `W100`–`W700` and filled variants). Unused exports can often be removed in production builds, but results depend on your bundler and configuration.

```tsx
// ✅ Good - Only imports specific icons
import { Home, Settings } from '@material-symbols-svg/react-rounded/w400';

// ✅ Better - Best tree-shaking (when supported)
import { HomeW400 } from '@material-symbols-svg/react-rounded/icons/home';

// ❌ Avoid - Imports entire weight bundle
import * as Icons from '@material-symbols-svg/react-rounded/w400';
```

### Next.js Configuration

If you use this package in Next.js, enable `experimental.optimizePackageImports` to reduce memory usage and speed up dev mode.

Add to `next.config.js` / `next.config.ts` (include only what you use):

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@material-symbols-svg/react-rounded']
  }
};

export default nextConfig;
```

## Available Icons

This package includes 3,340+ Material Symbols icons in rounded style. All icons are available in multiple categories:

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

- **@material-symbols-svg/react** - Outlined style
  - [npm](https://www.npmjs.com/package/@material-symbols-svg/react) | [GitHub](../react)
- **@material-symbols-svg/react-rounded** - **Rounded style (this package)**
  - [npm](https://www.npmjs.com/package/@material-symbols-svg/react-rounded) | [GitHub](../react-rounded)
- **@material-symbols-svg/react-sharp** - Sharp style
  - [npm](https://www.npmjs.com/package/@material-symbols-svg/react-sharp) | [GitHub](../react-sharp)
