# Material Symbols React

Material Symbols as React components with TypeScript support. This library provides Google's Material Symbols as optimized React components with comprehensive weight support and excellent tree-shaking capabilities.

## Features

- 🎨 **6,680+ Icons** - Complete Material Symbols collection
- ⚖️ **7 Weight Variants** - From 100 (thin) to 700 (bold)
- 🎭 **3 Style Variants** - Outlined, Rounded, and Sharp
- 🌳 **Perfect Tree-shaking** - Only import what you use
- 📦 **TypeScript Support** - Full type safety out of the box
- ⚡ **Optimized Performance** - Individual icon files prevent bundle bloat
- 🔄 **Hot Reload Friendly** - Fast development experience

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

### Individual Icon Imports (Maximum Tree-shaking)

```tsx
import { HomeW400 } from '@material-symbols-svg/react/icons/home';
import { SettingsW500 } from '@material-symbols-svg/react/icons/settings';
```

### Filled Variants

```tsx
import { HomeFill, SettingsFill } from '@material-symbols-svg/react';
// or
import { HomeFillW500 } from '@material-symbols-svg/react/icons/home';
```

### Style Variants

#### Rounded Style
```bash
npm install @material-symbols-svg/react-rounded
```

```tsx
import { Home, Settings } from '@material-symbols-svg/react-rounded';
```

#### Sharp Style
```bash
npm install @material-symbols-svg/react-sharp
```

```tsx
import { Home, Settings } from '@material-symbols-svg/react-sharp';
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

## Architecture

This library implements a Lucide-style architecture for optimal performance:

- **Individual Files**: Each icon variant generates a separate TypeScript file
- **Memory Efficient**: Avoids bundling all icons at once
- **Tree-shaking Optimized**: Only imported icons are included in the final bundle
- **Scalable**: Handles 140,280+ individual icon files efficiently

### File Structure

```
src/
├── icons/                    # Individual icon files
│   ├── outlined/w{weight}/   # Outlined style by weight
│   ├── rounded/w{weight}/    # Rounded style by weight
│   └── sharp/w{weight}/      # Sharp style by weight
├── outlined/                 # Outlined weight exports
├── rounded/                  # Rounded weight exports
├── sharp/                    # Sharp weight exports
└── createMaterialIcon.ts     # Icon factory function
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

### Development Mode

During development, icon generation is limited to 10 icons for faster build times:
- Home, Settings, Star, Favorite, Person
- Search, Menu, Close, Check, ArrowForward

This can be controlled via:
- Environment variable: `ICON_LIMIT=true` or `NODE_ENV=development`
- Development commands: `pnpm run build:dev`

## Bundle Size Optimization

### Tree-shaking Best Practices

```tsx
// ✅ Good - Only imports specific icons
import { Home, Settings } from '@material-symbols-svg/react/w400';

// ✅ Better - Maximum tree-shaking
import { HomeW400 } from '@material-symbols-svg/react/icons/home';

// ❌ Avoid - Imports entire weight bundle
import * as Icons from '@material-symbols-svg/react/w400';
```

### Bundle Analysis

The library is designed for optimal tree-shaking:
- Each icon is a separate module
- No barrel exports that prevent optimization
- Individual weight variants for precise control

## Browser Support

- Chrome ≥ 60
- Firefox ≥ 60
- Safari ≥ 12
- Edge ≥ 79

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
- [Lucide](https://lucide.dev/) - Architecture inspiration for optimal tree-shaking

## Related Packages

- [`@material-symbols-svg/react`](packages/react) - Outlined style (default)
- [`@material-symbols-svg/react-rounded`](packages/react-rounded) - Rounded style
- [`@material-symbols-svg/react-sharp`](packages/react-sharp) - Sharp style

---

🚀 **Generated with [Claude Code](https://claude.ai/code)**

Co-Authored-By: Claude <noreply@anthropic.com>