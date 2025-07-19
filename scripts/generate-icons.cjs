#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { getIconPaths, arePathsIdentical, toPascalCase } = require('./templates/common');

/**
 * Material Symbols Icon Data Generator (Package-specific with Global Metadata)
 * 
 * Generates individual icon files per package and consolidated global metadata
 * for memory-efficient builds and optimal tree-shaking
 */

const STYLES = ['outlined', 'rounded', 'sharp'];
const WEIGHTS = [100, 200, 300, 400, 500, 600, 700];

// 開発時のアイコン制限設定
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development' || process.env.ICON_LIMIT === 'true';

// 開発時に使用するアイコンリスト（一元管理から取得）
let DEV_ICONS = [];

// 非同期でESMモジュールをロード
async function loadDevIcons() {
  try {
    const { getKebabSnakeCaseIcons } = await import('./dev-icons.js');
    DEV_ICONS = getKebabSnakeCaseIcons();
  } catch (error) {
    console.warn('⚠️ Could not load dev-icons.js, using fallback list');
    DEV_ICONS = ['home', 'settings', 'star', 'favorite', 'person', 'search', 'menu', 'close', 'check', 'arrow_forward'];
  }
}

// Framework template loader - will be set dynamically
let frameworkTemplate = null;

/**
 * Process icons for a specific style - stores metadata globally
 */
async function processStyle(style, allGlobalMetadata, framework = 'react') {
  console.log(`🚀 Processing ${style} style for ${framework}...`);

  // パッケージディレクトリを決定
  const packageName = frameworkTemplate.getPackageMapping()[style];

  const ICONS_DIR = path.join(__dirname, `../packages/${packageName}/src/icons`);
  
  if (fs.existsSync(ICONS_DIR)) {
    fs.rmSync(ICONS_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(ICONS_DIR, { recursive: true });

  // Load icon list from icon-index.json
  const iconIndexPath = path.join(__dirname, '../metadata/icon-index.json');
  const iconIndex = JSON.parse(fs.readFileSync(iconIndexPath, 'utf8'));
  const uniqueIconNames = Object.keys(iconIndex);
  
  // 開発時制限（環境変数で制御）
  const iconNames = IS_DEVELOPMENT 
    ? uniqueIconNames.filter(name => DEV_ICONS.includes(name)).slice(0, 10)
    : uniqueIconNames;

  console.log(`   Processing ${iconNames.length} unique icons for ${style} style`);

  let count = 0;
  const rawIconNames = [];
  const rawToComponentMapping = new Map();
  const pathData = {};
  
  for (const iconName of iconNames) {
    const paths = getIconPaths(iconName, style);
    if (!Object.keys(paths.regular).length) continue; // Skip if no regular paths found

    // For package files: only include fill data if it's different from regular
    const isIdentical = arePathsIdentical(paths);
    const shouldIncludeFillInPackage = paths.hasActualFilledFile && !isIdentical;
    const fileContent = frameworkTemplate.generateIconFileContent(iconName, style, paths, isIdentical);
    const kebabCaseName = iconName.replace(/_/g, '-');
    fs.writeFileSync(path.join(ICONS_DIR, `${kebabCaseName}.ts`), fileContent);
    
    // Store raw icon name and mapping for global metadata
    const componentName = toPascalCase(iconName);
    rawIconNames.push(iconName);
    rawToComponentMapping.set(iconName, componentName);
    
    // Store path data for global metadata - always include both regular and fill
    pathData[iconName] = paths.regular;
    pathData[`${iconName}-fill`] = paths.filled; // Use -fill to match Material Symbols convention
    // Add fill variant to mapping
    rawIconNames.push(`${iconName}-fill`);
    rawToComponentMapping.set(`${iconName}-fill`, `${componentName}Fill`);
    
    count++;
  }

  // Store in global metadata
  allGlobalMetadata[style] = {
    rawIconNames,
    rawToComponentMapping,
    pathData,
    processedCount: count
  };

  console.log(`   ✅ Processed ${count} ${style} icons`);
  return count;
}

/**
 * Generate consolidated global metadata (like confirmation file)
 */
function generateGlobalMetadata(allGlobalMetadata) {
  console.log('\n📝 Generating consolidated global metadata...');
  
  // Create metadata directories for each package
  for (const style of STYLES) {
    const styleToPackage = frameworkTemplate.getPackageMapping();
    const packageName = styleToPackage[style];
    const packageMetadataDir = path.join(__dirname, `../packages/${packageName}/src/metadata`);
    
    if (fs.existsSync(packageMetadataDir)) {
      fs.rmSync(packageMetadataDir, { recursive: true, force: true });
    }
    fs.mkdirSync(packageMetadataDir, { recursive: true });
  }
  
  // NOTE: Global metadata directory (packages/metadata) is managed by scripts/generate-metadata.cjs
  // Do not create or modify it here
  
  // Load existing icon index (contains category information)
  let existingIconIndex = {};
  try {
    const iconIndexPath = path.join(__dirname, '../metadata/icon-index.json');
    if (fs.existsSync(iconIndexPath)) {
      existingIconIndex = JSON.parse(fs.readFileSync(iconIndexPath, 'utf8'));
      console.log(`   📂 Loaded existing icon index with ${Object.keys(existingIconIndex).length} icons`);
    }
  } catch (error) {
    console.warn('⚠️ Could not load existing icon index:', error.message);
  }
  
  // Helper function to get categories for an icon (returns array of categories)
  function getIconCategories(iconName) {
    // Handle -fill variants by checking the base icon name
    let baseIconName = iconName;
    if (iconName.endsWith('-fill')) {
      baseIconName = iconName.replace('-fill', '');
    }
    
    // Check existing icon index first
    if (existingIconIndex[iconName] && existingIconIndex[iconName].categories) {
      return existingIconIndex[iconName].categories;
    }
    
    // Check base icon name if fill variant
    if (baseIconName !== iconName && existingIconIndex[baseIconName] && existingIconIndex[baseIconName].categories) {
      return existingIconIndex[baseIconName].categories;
    }
    
    return ['uncategorized'];
  }
  
  // Generate consolidated icon index
  const iconIndex = {};
  const rawIconNames = new Set();
  const rawToComponentMapping = new Map();
  
  // First pass: collect all raw to component mappings
  for (const style of STYLES) {
    const mapping = allGlobalMetadata[style]?.rawToComponentMapping;
    if (mapping) {
      for (const [rawName, componentName] of mapping) {
        rawToComponentMapping.set(rawName, componentName);
      }
    }
  }
  
  // Second pass: build icon index
  for (const style of STYLES) {
    const rawNames = allGlobalMetadata[style]?.rawIconNames || [];
    
    // Add raw icon names to the set
    rawNames.forEach(rawName => rawIconNames.add(rawName));
    
    for (const rawIconName of rawNames) {
      // Skip -fill variants for icon-index.json (they'll be handled separately)
      if (rawIconName.endsWith('-fill')) {
        continue;
      }
      
      const componentName = rawToComponentMapping.get(rawIconName);
      
      if (!iconIndex[rawIconName]) {
        iconIndex[rawIconName] = {
          name: rawIconName,          // 元のアイコン名
          iconName: componentName,    // Reactコンポーネント名
          categories: getIconCategories(rawIconName) // カテゴリ情報（配列）
        };
      }
      
    }
  }
  
  // NOTE: Global icon index (packages/metadata/icon-index.json) is managed by scripts/generate-metadata.cjs
  // Do not generate it here
  
  // Generate package-specific metadata only for styles that have data
  for (const style in allGlobalMetadata) {
    const styleToPackage = frameworkTemplate.getPackageMapping();
    const packageName = styleToPackage[style];
    
    if (!packageName) continue; // Skip if package mapping doesn't exist
    
    const packageMetadataDir = path.join(__dirname, `../packages/${packageName}/src/metadata`);
    
    // Filter icons for this specific style/package
    const packageIconIndex = {};
    const styleRawNames = allGlobalMetadata[style]?.rawIconNames || [];
    
    for (const rawIconName of styleRawNames) {
      // Skip -fill variants for icon-index.json
      if (rawIconName.endsWith('-fill')) {
        continue;
      }
      
      if (iconIndex[rawIconName]) {
        packageIconIndex[rawIconName] = iconIndex[rawIconName];
      }
    }
    
    // Write package-specific icon index
    const packageIndexPath = path.join(packageMetadataDir, 'icon-index.json');
    fs.writeFileSync(packageIndexPath, JSON.stringify(packageIconIndex, null, 2));
    console.log(`   ✅ Generated packages/${packageName}/src/metadata/icon-index.json`);
  }
  
  // Generate component names list (including Fill variants)
  const componentNames = [];
  
  // Add component names from iconIndex (non-fill variants)
  for (const iconData of Object.values(iconIndex)) {
    if (iconData.iconName && !componentNames.includes(iconData.iconName)) {
      componentNames.push(iconData.iconName);
    }
  }
  
  // Add Fill variant component names from rawToComponentMapping
  for (const [rawName, componentName] of rawToComponentMapping) {
    if (rawName.endsWith('-fill') && !componentNames.includes(componentName)) {
      componentNames.push(componentName);
    }
  }

  // NOTE: Global icon path data generation has been moved to scripts/generate-metadata.cjs
  // Use 'pnpm build:metadata' to generate consolidated metadata files
  
  return iconIndex;
}



// --- メインロジック ---

async function main() {
  const style = process.argv[2];
  const framework = process.argv[3] || 'react';
  
  // Load framework template
  try {
    frameworkTemplate = require(`./templates/${framework}-template`);
  } catch (error) {
    console.error(`❌ Error: Unknown framework: ${framework}. Supported frameworks: react, vue`);
    process.exit(1);
  }
  
  // 開発アイコンリストをロード
  if (IS_DEVELOPMENT) {
    await loadDevIcons();
  }

  if (style) {
    // Single style mode
    console.log(`🚀 Generating icons for style: ${style} (${framework})...`);
    
    const styleToPackage = frameworkTemplate.getPackageMapping();
    
    if (!styleToPackage[style]) {
      console.error(`❌ Error: Unknown style: ${style}. Supported styles: outlined, rounded, sharp`);
      process.exit(1);
    }

    const allGlobalMetadata = {};
    await processStyle(style, allGlobalMetadata, framework);
    
    // Generate metadata for single style
    generateGlobalMetadata(allGlobalMetadata);
    
    console.log(`✅ Successfully generated icons for style: ${style} (${framework})`);
  } else {
    // All styles mode
    console.log(`🚀 Starting Material Symbols icon generation for all styles (${framework})...\n`);
    
    const allGlobalMetadata = {};
    
    // Process each style
    for (const style of STYLES) {
      await processStyle(style, allGlobalMetadata, framework);
    }
    
    // Generate consolidated global metadata
    const iconIndex = generateGlobalMetadata(allGlobalMetadata);
    
    // Summary
    const totalIcons = Object.keys(iconIndex).length;
    
    console.log(`\n🎉 Successfully generated icon data for all styles (${framework})!`);
    console.log(`   📊 Summary:`);
    console.log(`      Unique icons: ${totalIcons}`);
    console.log(`      Styles: ${STYLES.join(', ')}`);
    console.log(`      Framework: ${framework}`);
    console.log(`      Memory approach: On-demand loading`);
    console.log(`      Bundle size: Minimal (tree-shakable)`);
  }
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});