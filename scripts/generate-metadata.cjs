#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { getIconPaths, toPascalCase } = require('./templates/common');

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
  
  // Load icon list from icon-catalog.json
  const iconCatalogPath = path.join(__dirname, '../metadata/icon-catalog.json');
  const iconIndex = JSON.parse(fs.readFileSync(iconCatalogPath, 'utf8'));
  const iconNames = Object.keys(iconIndex);

  console.log(`   Processing ${iconNames.length} unique icons across ${STYLES.length} styles`);

  // Process icons and generate path files
  let processedCount = 0;
  const validIconNames = [];
  
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
      validIconNames.push(iconName);
      processedCount++;
    }
  }
  
  console.log(`   ✅ Generated ${processedCount} individual metadata files in packages/metadata/paths/`);
  return { processedCount, validIconNames };
}

/**
 * Load search terms from metadata/search-terms.json
 */
function loadSearchTerms() {
  const searchTermsPath = path.join(__dirname, '../metadata/search-terms.json');
  
  if (!fs.existsSync(searchTermsPath)) {
    console.log('   📝 No search terms file found, icons will have empty search terms');
    return {};
  }
  
  try {
    const searchTermsData = JSON.parse(fs.readFileSync(searchTermsPath, 'utf8'));
    console.log(`   🔍 Loaded search terms for ${Object.keys(searchTermsData).length} icons`);
    return searchTermsData;
  } catch (error) {
    console.warn('⚠️ Could not parse search terms file:', error.message);
    return {};
  }
}

/**
 * Get search terms for an icon
 */
function getSearchTerms(iconName, searchTermsData) {
  return searchTermsData[iconName] || [];
}

/**
 * Generate global icon index metadata
 */
function generateGlobalIconIndex(validIconNames = null) {
  console.log('\n📝 Generating global icon index...');
  
  const metadataDir = path.join(__dirname, '../packages/metadata');
  
  // Load search terms data
  const searchTermsData = loadSearchTerms();
  
  // Load existing icon catalog (contains category information)
  let existingIconIndex = {};
  try {
    const iconCatalogPath = path.join(__dirname, '../metadata/icon-catalog.json');
    if (fs.existsSync(iconCatalogPath)) {
      existingIconIndex = JSON.parse(fs.readFileSync(iconCatalogPath, 'utf8'));
      console.log(`   📂 Loaded existing icon catalog with ${Object.keys(existingIconIndex).length} icons`);
    }
  } catch (error) {
    console.warn('⚠️ Could not load existing icon catalog:', error.message);
  }
  
  // Helper function to get categories for an icon (returns array of categories)
  function getIconCategories(iconName) {
    if (existingIconIndex[iconName] && existingIconIndex[iconName].categories) {
      return existingIconIndex[iconName].categories;
    }
    return ['uncategorized'];
  }
  
  // Use existing icon index for icon list
  const iconNames = Array.isArray(validIconNames) ? validIconNames : Object.keys(existingIconIndex);
  
  // Generate consolidated icon index
  const iconIndex = {};
  
  for (const iconName of iconNames) {
    // Convert icon name to component name using the same logic as actual components
    const componentName = toPascalCase(iconName);
    
    const searchTerms = getSearchTerms(iconName, searchTermsData);
    
    iconIndex[iconName] = {
      name: iconName,          // 元のアイコン名
      iconName: componentName, // Reactコンポーネント名
      categories: getIconCategories(iconName), // カテゴリ情報（配列）
      ...(searchTerms.length > 0 && { searchTerms }) // 検索ワード（存在する場合のみ）
    };
  }
  
  // Write global icon index
  const globalIndexPath = path.join(metadataDir, 'icon-index.json');
  fs.writeFileSync(globalIndexPath, JSON.stringify(iconIndex, null, 2));
  
  // Count icons with search terms
  const iconsWithSearchTerms = Object.values(iconIndex).filter(icon => icon.searchTerms && icon.searchTerms.length > 0).length;
  
  console.log(`   ✅ Generated packages/metadata/icon-index.json`);
  console.log(`   🔍 Icons with search terms: ${iconsWithSearchTerms}/${Object.keys(iconIndex).length}`);
  
  return iconIndex;
}

// --- メインロジック ---

function main() {
  console.log('🚀 Starting consolidated metadata generation...\n');
  
  // Generate consolidated metadata
  const { processedCount, validIconNames } = generateConsolidatedMetadata();
  const iconIndex = generateGlobalIconIndex(validIconNames);
  
  // Summary
  const totalIcons = Object.keys(iconIndex).length;
  
  console.log(`\n🎉 Successfully generated consolidated metadata!`);
  console.log(`   📊 Summary:`);
  console.log(`      Unique icons: ${totalIcons}`);
  console.log(`      Path files: ${processedCount}`);
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
