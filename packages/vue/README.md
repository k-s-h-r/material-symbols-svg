# Material Symbols SVG / Vue

Material Symbols as Vue components. This package provides Google's Material Symbols in **Outlined (default), Rounded, and Sharp** styles as optimized Vue components, using **SVG paths instead of web fonts** for better performance, comprehensive weight support and tree-shaking-friendly output.

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
import { HomeW400 } from '@material-symbols-svg/vue/icons/home';
import { SettingsW500 } from '@material-symbols-svg/vue/icons/settings';
</script>
```

### Filled Variants

```vue
<script setup lang="ts">
import { HomeFill, SettingsFill } from '@material-symbols-svg/vue';
// or weight-specific
import { HomeFillW500 } from '@material-symbols-svg/vue/w500';
// or individual imports
import { HomeFillW400 } from '@material-symbols-svg/vue/icons/home';
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
    @click="handleClick"
  />
</template>

<script setup lang="ts">
import { Home } from '@material-symbols-svg/vue';

const handleClick = () => {
  console.log('Icon clicked!');
};
</script>
```

## Bundle Size Optimization

### Tree-shaking Best Practices

> Note: Each icon module currently exports multiple variants (weights `W100`–`W700`, filled variants, and metadata). Importing from `icons/*` narrows the module scope to a single icon, but final bundle size still depends on your bundler and production configuration.

```vue
<script setup lang="ts">
// ✅ Good - Only imports specific icons
import { Home, Settings } from '@material-symbols-svg/vue/w400';

// ✅ Better - Often smaller bundles (bundler-dependent)
import { HomeW400 } from '@material-symbols-svg/vue/icons/home';

// ❌ Avoid - Imports entire weight bundle
import * as Icons from '@material-symbols-svg/vue/w400';
</script>
```

### Import Optimizer Configuration (Framework-dependent)

If your framework/bundler supports package import optimization, include only the package paths and subpaths you actually use.

Example (when you import `/w500` paths):

```js
optimizePackageImports: [
  '@material-symbols-svg/vue',
  '@material-symbols-svg/vue/outlined',
  '@material-symbols-svg/vue/rounded',
  '@material-symbols-svg/vue/sharp',
  '@material-symbols-svg/vue/w500',
  '@material-symbols-svg/vue/rounded/w500',
  '@material-symbols-svg/vue/sharp/w500',
]
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

- **@material-symbols-svg/vue** - Vue components (Outlined / Rounded / Sharp)
  - [npm](https://www.npmjs.com/package/@material-symbols-svg/vue) | [GitHub](../vue)
- **@material-symbols-svg/react** - React components (Outlined / Rounded / Sharp)
  - [npm](https://www.npmjs.com/package/@material-symbols-svg/react) | [GitHub](../react)
