# Material Symbols SVG / React Native

Material Symbols as React Native components. This package provides Google's Material Symbols in **Outlined (default), Rounded, and Sharp** styles as optimized React Native components, using **react-native-svg** with the same weight-based entry points as the React and Vue packages.

🌐 **[Documentation](https://material-symbols-svg.com/)**

## Features

- 🎨 **3,340+ Icons** - Complete Material Symbols collection
- 🎭 **3 Style Variants** - Outlined, Rounded, Sharp
- ⚖️ **7 Weight Variants** - From 100 (thin) to 700 (bold)
- 🌳 **Tree-shaking Friendly** - Bundler-dependent optimization
- 📦 **TypeScript Support** - Full type safety out of the box
- 📱 **React Native Ready** - Built on top of react-native-svg
- 🎭 **Fill Variants** - Both regular and filled versions available

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
import { Home, Settings } from '@material-symbols-svg/react-native/w100';
import { Home, Settings } from '@material-symbols-svg/react-native/w400';
import { Home, Settings } from '@material-symbols-svg/react-native/w700';
```

### Individual Icon Imports (Most Tree-shaking-friendly)

```tsx
import { HomeW400 } from '@material-symbols-svg/react-native/icons/home';
import { SettingsW500 } from '@material-symbols-svg/react-native/icons/settings';
```

### Filled Variants

```tsx
import { HomeFill, SettingsFill } from '@material-symbols-svg/react-native';
import { HomeFillW500 } from '@material-symbols-svg/react-native/w500';
```

### Style Variants (Single Package)

```tsx
import { Home, Settings } from '@material-symbols-svg/react-native/outlined';
import { Home, Settings } from '@material-symbols-svg/react-native/rounded';
import { Home, Settings } from '@material-symbols-svg/react-native/sharp';
```

## Component Props

All icons accept `react-native-svg` `SvgProps` plus the following convenience props:

```tsx
import { Home } from '@material-symbols-svg/react-native';

<Home
  size={24}
  color="tomato"
  fill="none"
  accessibilityLabel="Home"
  testID="home-icon"
/>
```

## Notes

- Requires `react-native-svg`
- Uses `currentColor` for the icon path when `fill` is not set
- Weight/style/export structure matches `@material-symbols-svg/react`

## Contributing

See the main repository for contribution guidelines: [material-symbols-svg](https://github.com/k-s-h-r/material-symbols-svg)
