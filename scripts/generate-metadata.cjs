#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { getIconPaths, arePathsIdentical } = require('./templates/common');

/**
 * Consolidated Icon Metadata Generator
 * 
 * Generates centralized metadata files for all Material Symbols styles and weights
 * Outputs to packages/metadata/paths/ with one JSON file per icon
 */

const STYLES = ['outlined', 'rounded', 'sharp'];
const WEIGHTS = [100, 200, 300, 400, 500, 600, 700];

/**
 * Generate consolidated icon path data JSON files
 */
function generateConsolidatedMetadata() {
  console.log('\n📁 Generating consolidated icon metadata files...');
  
  // Create metadata directory
  const metadataDir = path.join(__dirname, '../packages/metadata');
  const pathsDir = path.join(metadataDir, 'paths');
  
  if (fs.existsSync(pathsDir)) {
    fs.rmSync(pathsDir, { recursive: true, force: true });
  }
  fs.mkdirSync(pathsDir, { recursive: true });
  
  // Load icon list
  const iconListPath = path.join(__dirname, '../metadata/source/current_versions.json');
  const iconList = JSON.parse(fs.readFileSync(iconListPath, 'utf8'));
  const allIconNames = Object.keys(iconList).map(key => key.replace(/^[^:]+::/, '')); // Remove prefix like "action::"
  const iconNames = [...new Set(allIconNames)]; // Remove duplicates

  console.log(`   Processing ${iconNames.length} unique icons across ${STYLES.length} styles`);

  // Collect all path data by icon name across all styles
  const iconPathData = {};
  let processedCount = 0;
  
  for (const iconName of iconNames) {
    const iconData = {};
    let hasValidPaths = false;
    
    for (const style of STYLES) {
      const paths = getIconPaths(iconName, style);
      if (!Object.keys(paths.regular).length) continue; // Skip if no regular paths found
      
      hasValidPaths = true;
      iconData[style] = {
        outline: {},
        fill: {}
      };
      
      // Store path data for all weights
      for (const weight of WEIGHTS) {
        if (paths.regular[weight]) {
          iconData[style].outline[`w${weight}`] = paths.regular[weight];
        }
        if (paths.filled[weight]) {
          iconData[style].fill[`w${weight}`] = paths.filled[weight];
        }
      }
    }
    
    // Only write file if we have valid paths for at least one style
    if (hasValidPaths) {
      const filePath = path.join(pathsDir, `${iconName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(iconData, null, 2));
      processedCount++;
    }
  }
  
  console.log(`   ✅ Generated ${processedCount} individual metadata files in packages/metadata/paths/`);
  return processedCount;
}

/**
 * Generate global icon index metadata
 */
function generateGlobalIconIndex() {
  console.log('\n📝 Generating global icon index...');
  
  const metadataDir = path.join(__dirname, '../packages/metadata');
  
  // Load category information from current_versions.json
  let categoryData = {};
  try {
    const categoryPath = path.join(__dirname, '../metadata/source/current_versions.json');
    if (fs.existsSync(categoryPath)) {
      categoryData = JSON.parse(fs.readFileSync(categoryPath, 'utf8'));
      console.log(`   📂 Loaded category data from: metadata/source/current_versions.json`);
    } else {
      console.log('   ⚠️ No category data found, icons will be marked as "uncategorized"');
    }
  } catch (error) {
    console.warn('⚠️ Could not load category data:', error.message);
  }
  
  // Helper function to get categories for an icon (returns array of categories)
  function getIconCategories(iconName) {
    const categories = [];
    
    // Look for category::icon_name pattern in categoryData
    for (const key in categoryData) {
      if (key.includes('::')) {
        const [category, name] = key.split('::');
        
        // Check both original name and kebab-case version
        if (name === iconName || name.replace(/_/g, '-') === iconName) {
          if (!categories.includes(category)) {
            categories.push(category);
          }
        }
      }
    }
    
    return categories.length > 0 ? categories : ['general'];
  }
  
  // Load icon list
  const iconListPath = path.join(__dirname, '../metadata/source/current_versions.json');
  const iconList = JSON.parse(fs.readFileSync(iconListPath, 'utf8'));
  const allIconNames = Object.keys(iconList).map(key => key.replace(/^[^:]+::/, '')); // Remove prefix like "action::"
  const iconNames = [...new Set(allIconNames)]; // Remove duplicates
  
  // Generate consolidated icon index
  const iconIndex = {};
  
  for (const iconName of iconNames) {
    // Convert snake_case to PascalCase for component name
    const componentName = iconName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    
    iconIndex[iconName] = {
      name: iconName,          // 元のアイコン名
      iconName: componentName, // Reactコンポーネント名
      categories: getIconCategories(iconName) // カテゴリ情報（配列）
    };
  }
  
  // Write global icon index
  const globalIndexPath = path.join(metadataDir, 'icon-index.json');
  fs.writeFileSync(globalIndexPath, JSON.stringify(iconIndex, null, 2));
  console.log(`   ✅ Generated packages/metadata/icon-index.json`);
  
  return iconIndex;
}

// --- メインロジック ---

function main() {
  console.log('🚀 Starting consolidated metadata generation...\n');
  
  // Generate consolidated metadata
  const pathCount = generateConsolidatedMetadata();
  const iconIndex = generateGlobalIconIndex();
  
  // Summary
  const totalIcons = Object.keys(iconIndex).length;
  
  console.log(`\n🎉 Successfully generated consolidated metadata!`);
  console.log(`   📊 Summary:`);
  console.log(`      Unique icons: ${totalIcons}`);
  console.log(`      Path files: ${pathCount}`);
  console.log(`      Styles: ${STYLES.join(', ')}`);
  console.log(`      Weights: ${WEIGHTS.join(', ')}`);
  console.log(`      Output: packages/metadata/`);
}

try {
  main();
} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}