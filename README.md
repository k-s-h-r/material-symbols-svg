# Material Symbols SVG

Material Symbols as framework components. This monorepo provides Google's Material Symbols as optimized components for React, Vue, Svelte, Astro, and React Native.

🌐 **[Documentation](https://material-symbols-svg.com/)**

## Features

- 🎨 **3,836+ Icons** - Complete Material Symbols collection
- ⚖️ **7 Weight Variants** - From 100 (thin) to 700 (bold)
- 🎭 **3 Style Variants** - Outlined, Rounded, and Sharp
- 🌳 **Optimized Imports** - Import only what you use
- 📦 **TypeScript Support** - Full type safety out of the box
- ⚡ **Optimized Performance** - SVG-based, bundler-friendly output

## Packages

| Package | Description | Links |
| --- | --- | --- |
| `@material-symbols-svg/react` | Material Symbols as React components | [npm](https://www.npmjs.com/package/@material-symbols-svg/react) · [README](./packages/react/README.md) |
| `@material-symbols-svg/vue` | Material Symbols as Vue components | [npm](https://www.npmjs.com/package/@material-symbols-svg/vue) · [README](./packages/vue/README.md) |
| `@material-symbols-svg/svelte` | Material Symbols as Svelte components | [npm](https://www.npmjs.com/package/@material-symbols-svg/svelte) · [README](./packages/svelte/README.md) |
| `@material-symbols-svg/astro` | Material Symbols as Astro components | [npm](https://www.npmjs.com/package/@material-symbols-svg/astro) · [README](./packages/astro/README.md) |
| `@material-symbols-svg/react-native` | Material Symbols as React Native components | [npm](https://www.npmjs.com/package/@material-symbols-svg/react-native) · [README](./packages/react-native/README.md) |

For framework-specific usage, see each package README in the links above.

## Figma

Material Symbols is also available as a Figma plugin for design workflows.

- [Material Symbols plugin on Figma Community](https://www.figma.com/community/plugin/1088610476491668236/material-symbols)

## Quick Start

### React

```bash
npm install @material-symbols-svg/react
```

```tsx
import { Home, Search, Settings } from '@material-symbols-svg/react';

export function App() {
  return (
    <div>
      <Home />
      <Search size={20} color="#2563eb" />
      <Settings />
    </div>
  );
}
```

## Usage

### Basic Import

```tsx
import { Home, Menu, Settings } from '@material-symbols-svg/react';
```

### Weight-Specific Imports

```tsx
import { Home, Settings } from '@material-symbols-svg/react/w100';
import { Search } from '@material-symbols-svg/react/w400';
import { Menu } from '@material-symbols-svg/react/w700';
```

### Individual Icon Imports

```tsx
import { HomeW400 } from '@material-symbols-svg/react/icons/home';
import { SettingsW500 } from '@material-symbols-svg/react/icons/settings';

// or via per-icon subpath
import { HomeW400 as HomeIcon } from '@material-symbols-svg/react/home';
```

### Filled Variants

```tsx
import { HomeFill, SettingsFill } from '@material-symbols-svg/react';
import { HomeFillW500 } from '@material-symbols-svg/react/icons/home';
```

### Style Variants

```tsx
import { Home as OutlinedHome } from '@material-symbols-svg/react/outlined/w500';
import { Home as RoundedHome } from '@material-symbols-svg/react/rounded';
import { Home as SharpHome } from '@material-symbols-svg/react/sharp';
```

### Component Props

All icons accept standard SVG props.

```tsx
import { Home } from '@material-symbols-svg/react';

export function Example() {
  return (
    <Home
      size={24}
      color="blue"
      className="icon"
      style={{ margin: '10px' }}
    />
  );
}
```

### Accessibility

- Decorative icons stay `aria-hidden` by default.
- Use `aria-label`, `aria-labelledby`, or an SVG `<title>` when the icon itself conveys meaning.
- If the icon is inside a button or link, put the accessible name on the interactive wrapper.

```tsx
import { Home, Settings } from '@material-symbols-svg/react';

<Home aria-label="Home" />

<Home>
  <title>Home</title>
</Home>

<button type="button" aria-label="Open settings">
  <Settings />
</button>
```

## Bundle Size Optimization

> Note: Each icon module currently contains multiple variants (weights `W100` to `W700`, filled variants, and metadata). Importing from `icons/*` narrows the module scope to a single icon, but final bundle size still depends on your bundler and production settings.

```tsx
// Good: imports only the icons you use from a weight entry point
import { Home, Settings } from '@material-symbols-svg/react/w400';

// Better: often produces smaller bundles
import { HomeW400 } from '@material-symbols-svg/react/icons/home';

// Avoid: imports the full entry point namespace
import * as Icons from '@material-symbols-svg/react/w400';
```

If you use Next.js, enable `experimental.optimizePackageImports` to reduce development-time module loading:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
  },
};

export default nextConfig;
```

See [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md), [docs/RELEASE_MANAGEMENT.md](./docs/RELEASE_MANAGEMENT.md), and [docs/RELEASE_MANAGEMENT_REFERENCE.md](./docs/RELEASE_MANAGEMENT_REFERENCE.md) for repository operations.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push the branch
5. Open a pull request

## License

This project is licensed under the Apache-2.0 License. See [LICENSE](./LICENSE) for details.

## Acknowledgments

- [Google Material Symbols](https://fonts.google.com/icons) for the original icon designs
- [Lucide](https://lucide.dev/) for architecture and README inspiration
