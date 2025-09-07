# Material Symbols SVG / Vue (Rounded)

Material Symbols as Vue components. This package provides Google's Material Symbols in **Rounded style** as optimized Vue components, using **SVG paths instead of web fonts** for better performance, comprehensive weight support and excellent tree-shaking capabilities.

🌐 **[Documentation](https://material-symbols-svg.com/)**

## Features

- 🎨 **3,340+ Icons** - Complete Material Symbols collection in Rounded style
- ⚖️ **7 Weight Variants** - From 100 (thin) to 700 (bold)
- 🌳 **Perfect Tree-shaking** - Only import what you use
- 📦 **TypeScript Support** - Full type safety out of the box
- ⚡ **Optimized Performance** - Individual icon files prevent bundle bloat
- 🔄 **Hot Reload Friendly** - Fast development experience
- 🎭 **Fill Variants** - Both outlined and filled versions available

## Installation

```bash
npm install @material-symbols-svg/vue-rounded
# or
pnpm add @material-symbols-svg/vue-rounded
# or
yarn add @material-symbols-svg/vue-rounded
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
import { Home, Settings, Search } from '@material-symbols-svg/vue-rounded';
</script>
```

## Usage

### Basic Import (Default Weight 400)

```vue
<script setup lang="ts">
import { Home, Settings, Menu } from '@material-symbols-svg/vue-rounded';
</script>
```

### Weight-Specific Imports

```vue
<script setup lang="ts">
// Thin (100)
import { Home, Settings } from '@material-symbols-svg/vue-rounded/w100';

// Light (200)
import { Home, Settings } from '@material-symbols-svg/vue-rounded/w200';

// Regular (300)
import { Home, Settings } from '@material-symbols-svg/vue-rounded/w300';

// Medium (400) - Default
import { Home, Settings } from '@material-symbols-svg/vue-rounded/w400';

// Semi-bold (500)
import { Home, Settings } from '@material-symbols-svg/vue-rounded/w500';

// Bold (600)
import { Home, Settings } from '@material-symbols-svg/vue-rounded/w600';

// Extra-bold (700)
import { Home, Settings } from '@material-symbols-svg/vue-rounded/w700';
</script>
```

### Individual Icon Imports (Maximum Tree-shaking)

```vue
<script setup lang="ts">
import { HomeW400 } from '@material-symbols-svg/vue-rounded/icons/home';
import { SettingsW500 } from '@material-symbols-svg/vue-rounded/icons/settings';
</script>
```

### Filled Variants

```vue
<script setup lang="ts">
import { HomeFill, SettingsFill } from '@material-symbols-svg/vue-rounded';
// or weight-specific
import { HomeFillW500 } from '@material-symbols-svg/vue-rounded/w500';
// or individual imports
import { HomeFillW400 } from '@material-symbols-svg/vue-rounded/icons/home';
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
import { Home } from '@material-symbols-svg/vue-rounded';

const handleClick = () => {
  console.log('Icon clicked!');
};
</script>
```

## Other Styles

This package provides **Rounded** style icons. For other styles:

### Outlined Style
```bash
npm install @material-symbols-svg/vue
```

```vue
<script setup lang="ts">
import { Home, Settings } from '@material-symbols-svg/vue';
</script>
```

### Sharp Style
```bash
npm install @material-symbols-svg/vue-sharp
```

```vue
<script setup lang="ts">
import { Home, Settings } from '@material-symbols-svg/vue-sharp';
</script>
```

## Bundle Size Optimization

### Tree-shaking Best Practices

```vue
<script setup lang="ts">
// ✅ Good - Only imports specific icons
import { Home, Settings } from '@material-symbols-svg/vue-rounded/w400';

// ✅ Better - Maximum tree-shaking
import { HomeW400 } from '@material-symbols-svg/vue-rounded/icons/home';

// ❌ Avoid - Imports entire weight bundle
import * as Icons from '@material-symbols-svg/vue-rounded/w400';
</script>
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

- **@material-symbols-svg/vue** - Outlined style
  - [npm](https://www.npmjs.com/package/@material-symbols-svg/vue) | [GitHub](../vue)
- **@material-symbols-svg/vue-rounded** - **Rounded style (this package)**
  - [npm](https://www.npmjs.com/package/@material-symbols-svg/vue-rounded) | [GitHub](../vue-rounded)
- **@material-symbols-svg/vue-sharp** - Sharp style
  - [npm](https://www.npmjs.com/package/@material-symbols-svg/vue-sharp) | [GitHub](../vue-sharp)