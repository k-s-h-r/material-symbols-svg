# @material-symbols-svg/metadata

Metadata and path data for Material Symbols icons across all styles (outlined, rounded, sharp).

## Overview

This package provides consolidated metadata for all Material Symbols icons, including:

- **Icon index** with categorization information
- **SVG path data** for all icons across all styles and weights
- **Component mappings** between icon names and React component names

## Installation

```bash
npm install @material-symbols-svg/metadata
# or
pnpm add @material-symbols-svg/metadata
# or
yarn add @material-symbols-svg/metadata
```

## Usage

### Icon Index

Get the main icon index with categories:

```javascript
import iconIndex from '@material-symbols-svg/metadata';
// or
import iconIndex from '@material-symbols-svg/metadata/icon-index.json';

console.log(iconIndex.home);
// {
//   "name": "home",
//   "iconName": "Home", 
//   "categories": ["action"]
// }
```

### Individual Icon Path Data

Access SVG path data for specific icons:

```javascript
// Import path data for a specific icon
import homePathData from '@material-symbols-svg/metadata/paths/home.json';

console.log(homePathData);
// {
//   "outlined": {
//     "100": "M6 19h3v-6h6v6h3v-9l-6-4.5L6 10v9Zm-2 2V9l8-6 8 6v12H4Z",
//     "200": "...",
//     // ... all weights
//   },
//   "rounded": {
//     "100": "...",
//     // ... all weights  
//   },
//   "sharp": {
//     "100": "...",
//     // ... all weights
//   }
// }
```

## Data Structure

### Icon Index Structure

```typescript
type IconIndex = {
  [iconName: string]: {
    name: string;        // Original icon name (snake_case)
    iconName: string;    // React component name (PascalCase)
    categories: string[]; // Categories (e.g., ["action", "navigation"])
  }
}
```

### Path Data Structure

```typescript
type IconPathData = {
  outlined: Record<string, string>; // weight -> SVG path
  rounded: Record<string, string>;  // weight -> SVG path  
  sharp: Record<string, string>;    // weight -> SVG path
}
```

## Available Icons

This package contains metadata for **3,340 unique icons** across:

- **3 styles**: outlined, rounded, sharp
- **7 weights**: 100, 200, 300, 400, 500, 600, 700
- **Categories**: action, navigation, social, toggle, and more

## Companion Packages

- [`@material-symbols-svg/react`](https://www.npmjs.com/package/@material-symbols-svg/react) - Outlined React components
- [`@material-symbols-svg/react-rounded`](https://www.npmjs.com/package/@material-symbols-svg/react-rounded) - Rounded React components  
- [`@material-symbols-svg/react-sharp`](https://www.npmjs.com/package/@material-symbols-svg/react-sharp) - Sharp React components

## License

Apache-2.0

## Repository

https://github.com/k-s-h-r/material-symbols-svg