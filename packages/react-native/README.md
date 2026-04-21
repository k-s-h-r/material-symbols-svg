# Material Symbols SVG / React Native

Material Symbols as React Native components. This package provides Google's Material Symbols in **Outlined (default), Rounded, and Sharp** styles as optimized React Native components, using **react-native-svg** for better performance, comprehensive weight support and tree-shaking-friendly output.

🌐 **[Documentation](https://material-symbols-svg.com/)**

## Features

- 🎨 **3,836+ Icons** - Complete Material Symbols collection
- 🎭 **3 Style Variants** - Outlined, Rounded, Sharp
- ⚖️ **7 Weight Variants** - From 100 (thin) to 700 (bold)
- 🌳 **Tree-shaking Friendly** - Bundler-dependent optimization
- 📦 **TypeScript Support** - Full type safety out of the box
- 📱 **React Native Ready** - Built on top of react-native-svg
- ⚡ **Optimized Performance** - Designed for ESM tree-shaking
- 🎭 **Fill Variants** - Both outlined and filled versions available

## Installation

```bash
npm install @material-symbols-svg/react-native react-native-svg
# or
pnpm add @material-symbols-svg/react-native react-native-svg
# or
yarn add @material-symbols-svg/react-native react-native-svg
```

## Quick Start

```tsx
import React from 'react';
import { View } from 'react-native';
import { Home, Settings, Search } from '@material-symbols-svg/react-native';

export function App() {
  return (
    <View>
      <Home />
      <Settings color="#2563eb" />
      <Search size={20} />
    </View>
  );
}
```

## Usage

### Basic Import (Default Weight 400)

```tsx
import { Home, Settings, Menu } from '@material-symbols-svg/react-native';
```

### Weight-Specific Imports

```tsx
// Thin (100)
import { Home, Settings } from '@material-symbols-svg/react-native/w100';

// Light (200)
import { Home, Settings } from '@material-symbols-svg/react-native/w200';

// Regular (300)
import { Home, Settings } from '@material-symbols-svg/react-native/w300';

// Medium (400) - Default
import { Home, Settings } from '@material-symbols-svg/react-native/w400';

// Semi-bold (500)
import { Home, Settings } from '@material-symbols-svg/react-native/w500';

// Bold (600)
import { Home, Settings } from '@material-symbols-svg/react-native/w600';

// Extra-bold (700)
import { Home, Settings } from '@material-symbols-svg/react-native/w700';
```

### Individual Icon Imports (Most Tree-shaking-friendly)

```tsx
import { Home, HomeW400 } from '@material-symbols-svg/react-native/icons/home';
import { SettingsW500 } from '@material-symbols-svg/react-native/icons/settings';
```

### Filled Variants

```tsx
import { HomeFill, SettingsFill } from '@material-symbols-svg/react-native';
// or weight-specific
import { HomeFillW500 } from '@material-symbols-svg/react-native/w500';
// or individual imports
import { HomeFill, HomeFillW400 } from '@material-symbols-svg/react-native/icons/home';
```

### Style Variants (Single Package)

```tsx
// Outlined (default weight: w400)
// (equivalent to '@material-symbols-svg/react-native')
import { Home, Settings } from '@material-symbols-svg/react-native/outlined';

// Rounded (default weight: w400)
import { Home, Settings } from '@material-symbols-svg/react-native/rounded';

// Sharp (default weight: w400)
import { Home, Settings } from '@material-symbols-svg/react-native/sharp';

// Outlined weight-specific
import { Home, Settings } from '@material-symbols-svg/react-native/outlined/w500';

// Rounded weight-specific
import { Home, Settings } from '@material-symbols-svg/react-native/rounded/w500';

// Sharp individual icon import
import { HomeW400 } from '@material-symbols-svg/react-native/sharp/icons/home';
```

## Component Props

All icons accept `react-native-svg` `SvgProps` plus the following convenience props:

```tsx
import { Home } from '@material-symbols-svg/react-native';

<Home
  size={24}
  color="tomato"
  fill="none"
  testID="home-icon"
/>
```

## Accessibility

- Decorative icons are not exposed unless you pass accessibility props explicitly.
- Use `accessibilityLabel` only when the icon itself is the semantic image.
- When the icon is inside `Pressable` or another control, label the wrapper instead of the icon.

```tsx
import { Pressable } from 'react-native';
import { Home, Settings } from '@material-symbols-svg/react-native';

<Home accessibilityRole="image" accessibilityLabel="Home" accessible />

<Pressable accessibilityRole="button" accessibilityLabel="Open settings">
  <Settings />
</Pressable>
```

## Bundle Size Optimization

### Tree-shaking Best Practices

> Note: Each icon module currently exports multiple variants (weights `W100` to `W700`, filled variants, and metadata). Importing from `icons/*` narrows the module scope to a single icon, but final bundle size still depends on your bundler and production configuration.

```tsx
// ✅ Good - Only imports specific icons
import { Home, Settings } from '@material-symbols-svg/react-native/w400';

// ✅ Better - Often smaller bundles (bundler-dependent)
import { Home, HomeW400 } from '@material-symbols-svg/react-native/icons/home';

// ❌ Avoid - Imports entire weight bundle
import * as Icons from '@material-symbols-svg/react-native/w400';
```

### Metro and Bundler Notes

React Native bundlers do not have a universal package import optimization flag like Next.js. Prefer explicit subpath imports such as `/w400` and `/icons/home`, then verify the production bundle output in your app.

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
