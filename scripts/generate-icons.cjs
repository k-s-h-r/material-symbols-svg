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

  const iconListPath = path.join(__dirname, '../current_versions.json');
  const iconList = JSON.parse(fs.readFileSync(iconListPath, 'utf8'));
  const allIconNames = Object.keys(iconList).map(key => key.replace(/^[^:]+::/, '')); // Remove prefix like "action::"
  const uniqueIconNames = [...new Set(allIconNames)]; // Remove duplicates
  
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
    const styleToPackage = {
      'outlined': 'react',
      'rounded': 'react-rounded', 
      'sharp': 'react-sharp'
    };
    const packageName = styleToPackage[style];
    const packageMetadataDir = path.join(__dirname, `../packages/${packageName}/src/metadata`);
    
    if (fs.existsSync(packageMetadataDir)) {
      fs.rmSync(packageMetadataDir, { recursive: true, force: true });
    }
    fs.mkdirSync(packageMetadataDir, { recursive: true });
  }
  
  // Also create global metadata directory for consolidated data
  const globalMetadataDir = path.join(__dirname, '../metadata');
  if (fs.existsSync(globalMetadataDir)) {
    fs.rmSync(globalMetadataDir, { recursive: true, force: true });
  }
  fs.mkdirSync(globalMetadataDir, { recursive: true });
  
  // Load category information from current_versions.json
  let categoryData = {};
  try {
    const categoryPath = path.join(__dirname, '../current_versions.json');
    if (fs.existsSync(categoryPath)) {
      categoryData = JSON.parse(fs.readFileSync(categoryPath, 'utf8'));
      console.log(`   📂 Loaded category data from: current_versions.json`);
    } else {
      console.log('   ⚠️ No category data found, icons will be marked as "uncategorized"');
    }
  } catch (error) {
    console.warn('⚠️ Could not load category data:', error.message);
  }
  
  // Helper function to get categories for an icon (returns array of categories)
  function getIconCategories(iconName) {
    // Handle -fill variants by checking the base icon name
    let baseIconName = iconName;
    if (iconName.endsWith('-fill')) {
      baseIconName = iconName.replace('-fill', '');
    }
    
    const categories = [];
    
    // Look for category::icon_name pattern in categoryData
    for (const key in categoryData) {
      if (key.includes('::')) {
        const [category, name] = key.split('::');
        // Skip the generic "symbols" category as it's not useful for categorization
        if (category === 'symbols') continue;
        
        // Check both original name and base name (without -fill)
        if (name === iconName || name.replace(/_/g, '-') === iconName ||
            name === baseIconName || name.replace(/_/g, '-') === baseIconName) {
          if (!categories.includes(category)) {
            categories.push(category);
          }
        }
      }
    }
    
    return categories.length > 0 ? categories : ['uncategorized'];
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
  
  // Write global icon index
  const globalIndexPath = path.join(globalMetadataDir, 'icon-index.json');
  fs.writeFileSync(globalIndexPath, JSON.stringify(iconIndex, null, 2));
  console.log(`   ✅ Generated metadata/icon-index.json`);
  
  // Generate package-specific metadata
  for (const style of STYLES) {
    const styleToPackage = {
      'outlined': 'react',
      'rounded': 'react-rounded', 
      'sharp': 'react-sharp'
    };
    const packageName = styleToPackage[style];
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

  // Generate individual icon path data JSON files
  generateGlobalIconPathData(allGlobalMetadata, globalMetadataDir);
  
  // Generate package-specific path data
  generatePackageIconPathData(allGlobalMetadata);
  
  return iconIndex;
}

/**
 * Generate individual icon path data JSON files (consolidated)
 */
function generateGlobalIconPathData(allGlobalMetadata, metadataDir) {
  console.log('\n📁 Generating consolidated icon path data files...');
  
  // Create paths directory
  const pathsDir = path.join(metadataDir, 'paths');
  if (!fs.existsSync(pathsDir)) {
    fs.mkdirSync(pathsDir, { recursive: true });
  }
  
  // Collect all path data by icon name across all styles
  const iconPathData = {};
  
  for (const style of STYLES) {
    const pathData = allGlobalMetadata[style]?.pathData || {};
    
    for (const [iconName, pathValue] of Object.entries(pathData)) {
      // Determine if this is a fill or outline variant
      const isFill = iconName.endsWith('-fill');
      const baseIconName = isFill ? iconName.replace('-fill', '') : iconName;
      const variant = isFill ? 'fill' : 'outline';
      
      // Initialize structure if needed
      if (!iconPathData[baseIconName]) {
        iconPathData[baseIconName] = {};
      }
      if (!iconPathData[baseIconName][style]) {
        iconPathData[baseIconName][style] = {};
      }
      if (!iconPathData[baseIconName][style][variant]) {
        iconPathData[baseIconName][style][variant] = {};
      }
      
      // Store path data for all weights
      for (const weight of WEIGHTS) {
        if (pathValue[weight]) {
          iconPathData[baseIconName][style][variant][`w${weight}`] = pathValue[weight];
        }
      }
    }
  }
  
  // Write individual JSON files for each icon
  let fileCount = 0;
  for (const [iconName, data] of Object.entries(iconPathData)) {
    const filePath = path.join(pathsDir, `${iconName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    fileCount++;
  }
  
  console.log(`   ✅ Generated ${fileCount} individual path data files in metadata/paths/`);
  return iconPathData;
}

/**
 * Generate package-specific icon path data JSON files
 */
function generatePackageIconPathData(allGlobalMetadata) {
  console.log('\n📦 Generating package-specific icon path data files...');
  
  for (const style of STYLES) {
    const styleToPackage = {
      'outlined': 'react',
      'rounded': 'react-rounded', 
      'sharp': 'react-sharp'
    };
    const packageName = styleToPackage[style];
    const packageMetadataDir = path.join(__dirname, `../packages/${packageName}/src/metadata`);
    const packagePathsDir = path.join(packageMetadataDir, 'paths');
    
    // Create paths directory for this package
    if (!fs.existsSync(packagePathsDir)) {
      fs.mkdirSync(packagePathsDir, { recursive: true });
    }
    
    const pathData = allGlobalMetadata[style]?.pathData || {};
    let fileCount = 0;
    
    // Collect icons for this style only
    const styleIconPathData = {};
    
    for (const [iconName, pathValue] of Object.entries(pathData)) {
      // Determine if this is a fill or outline variant
      const isFill = iconName.endsWith('-fill');
      const baseIconName = isFill ? iconName.replace('-fill', '') : iconName;
      const variant = isFill ? 'fill' : 'outline';
      
      // Initialize structure if needed
      if (!styleIconPathData[baseIconName]) {
        styleIconPathData[baseIconName] = {};
      }
      if (!styleIconPathData[baseIconName][style]) {
        styleIconPathData[baseIconName][style] = {};
      }
      if (!styleIconPathData[baseIconName][style][variant]) {
        styleIconPathData[baseIconName][style][variant] = {};
      }
      
      // Store path data for all weights
      for (const weight of WEIGHTS) {
        if (pathValue[weight]) {
          styleIconPathData[baseIconName][style][variant][`w${weight}`] = pathValue[weight];
        }
      }
    }
    
    // Write individual JSON files for each icon in this style
    for (const [iconName, data] of Object.entries(styleIconPathData)) {
      const filePath = path.join(packagePathsDir, `${iconName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      fileCount++;
    }
    
    console.log(`   ✅ Generated ${fileCount} path data files in packages/${packageName}/src/metadata/paths/`);
  }
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