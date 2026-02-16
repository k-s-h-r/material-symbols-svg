#!/usr/bin/env node
/**
 * このスクリプトの役割:
 * - 新規（主に uncategorized）アイコンだけを対象に検索語を生成して保存する
 * - 入力として packages/metadata/paths/*.json を利用するため、build:metadata 後の実行が前提
 *
 * 関連ファイル:
 * - /metadata/icon-catalog.json
 * - /metadata/search-terms.json
 * - /packages/metadata/paths/*.json
 * - /scripts/update-metadata.cjs
 *
 * 実行元:
 * - 手動: node scripts/generate-search-terms-incremental.cjs
 * - scripts/update-metadata.cjs から内部呼び出し
 */

// Load environment variables from .env file
require('dotenv').config();

const fs = require('fs');
const path = require('path');

/**
 * Search Terms Generator for New Material Symbols Icons
 * 
 * Processes only uncategorized icons to generate search terms
 */

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const REQUEST_DELAY = 1100; // 1.1 seconds between requests
const MAX_RETRIES = 3;

/**
 * Call OpenAI API to generate search terms for an icon
 */
async function generateSearchTerms(iconName, categories, svgPath, apiKey) {
  const completeSvg = `<svg viewBox="0 -960 960 960" xmlns="http://www.w3.org/2000/svg">
  <path d="${svgPath}" fill="currentColor"/>
</svg>`;

  const prompt = `You are helping generate search terms for a Material Symbols icon.

Icon name: "${iconName}"
Categories: ${categories.join(', ')}
SVG representation:
${completeSvg}

Based on the icon name, categories, and visual appearance from the SVG, generate 5-8 relevant English search terms that users might use to find this icon. Include:
- Synonyms and related words
- Common alternative names
- Action words if applicable
- Industry-specific terms if relevant
- Visual descriptors if helpful

Focus on terms that would help users discover this icon when searching. Return ONLY a JSON array of strings, no other text:
["term1", "term2", "term3", ...]`;

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that generates search terms for icons accurately and concisely.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 300
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content.trim();
  
  // Parse JSON response
  const searchTerms = JSON.parse(content);
  
  if (!Array.isArray(searchTerms)) {
    throw new Error('Invalid response format - expected array of strings');
  }
  
  return searchTerms;
}

/**
 * Load SVG path for an icon
 */
function loadIconSvgPath(iconName) {
  try {
    const pathFile = path.join(__dirname, '../packages/metadata/paths', `${iconName}.json`);
    
    if (!fs.existsSync(pathFile)) {
      return null;
    }
    
    const pathData = JSON.parse(fs.readFileSync(pathFile, 'utf8'));
    return pathData.outlined?.outline?.w400 || null;
  } catch (error) {
    console.warn(`   ⚠️ Failed to load SVG path for ${iconName}: ${error.message}`);
    return null;
  }
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Process an icon with retries
 */
async function processIconWithRetries(iconName, iconData, apiKey) {
  const svgPath = loadIconSvgPath(iconName);
  
  if (!svgPath) {
    console.warn(`   ⚠️ No SVG path found for ${iconName}, skipping`);
    return null; // Return null to indicate skipping
  }
  
  let lastError = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const searchTerms = await generateSearchTerms(
        iconName, 
        iconData.categories, 
        svgPath, 
        apiKey
      );
      
      return searchTerms;
    } catch (error) {
      lastError = error;
      
      if (attempt < MAX_RETRIES) {
        console.warn(`   ⚠️ Attempt ${attempt} failed for ${iconName}, retrying...`);
        await sleep(REQUEST_DELAY * 2); // Longer delay on retry
      }
    }
  }
  
  console.error(`   ❌ Failed to process ${iconName} after ${MAX_RETRIES} attempts: ${lastError.message}`);
  return null; // Return null on failure
}

/**
 * Generate search terms for new (uncategorized) icons only
 */
async function generateSearchTermsForNewIcons() {
  console.log('🔍 Generating search terms for new icons...\n');
  
  // Check for API key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: OPENAI_API_KEY environment variable is required');
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  
  // Load existing icon catalog
  const iconCatalogPath = path.join(__dirname, '../metadata/icon-catalog.json');
  if (!fs.existsSync(iconCatalogPath)) {
    console.error('❌ Error: metadata/icon-catalog.json not found');
    throw new Error('metadata/icon-catalog.json not found');
  }
  
  const iconIndex = JSON.parse(fs.readFileSync(iconCatalogPath, 'utf8'));
  
  // Find uncategorized icons
  const uncategorizedIcons = Object.keys(iconIndex).filter(iconName => {
    const icon = iconIndex[iconName];
    return icon.categories.includes('uncategorized');
  });
  
  if (uncategorizedIcons.length === 0) {
    console.log('✅ No uncategorized icons found. All icons have search terms.');
    return 0;
  }
  
  console.log(`🎯 Found ${uncategorizedIcons.length} uncategorized icons to process`);
  console.log(`⏱️ Estimated time: ${Math.ceil(uncategorizedIcons.length / 55)} minutes (with rate limiting)\n`);
  
  // Load existing search terms
  const searchTermsPath = path.join(__dirname, '../metadata/search-terms.json');
  let searchTermsData = {};
  
  if (fs.existsSync(searchTermsPath)) {
    try {
      searchTermsData = JSON.parse(fs.readFileSync(searchTermsPath, 'utf8'));
      console.log(`📖 Loaded existing search terms database`);
    } catch (error) {
      console.warn(`⚠️ Could not parse existing search terms file: ${error.message}`);
    }
  }
  
  let successCount = 0;
  
  for (let i = 0; i < uncategorizedIcons.length; i++) {
    const iconName = uncategorizedIcons[i];
    const iconData = iconIndex[iconName];
    
    console.log(`   🔄 [${i + 1}/${uncategorizedIcons.length}] Processing ${iconName}...`);
    
    try {
      const searchTerms = await processIconWithRetries(iconName, iconData, apiKey);
      
      if (searchTerms) {
        searchTermsData[iconName] = searchTerms;
        successCount++;
        console.log(`   ✅ Generated ${searchTerms.length} terms for ${iconName}`);
      } else {
        console.log(`   ⏭️ Skipped ${iconName}`);
      }
      
      // Rate limiting - wait between requests
      if (i < uncategorizedIcons.length - 1) {
        await sleep(REQUEST_DELAY);
      }
      
    } catch (error) {
      console.error(`   ❌ Error processing ${iconName}: ${error.message}`);
    }
  }
  
  // Save updated search terms
  try {
    const searchTermsDir = path.dirname(searchTermsPath);
    const packageSearchTermsPath = path.join(__dirname, '../packages/metadata/search-terms.json');
    const packageSearchTermsDir = path.dirname(packageSearchTermsPath);
    
    // Create directories if they don't exist
    if (!fs.existsSync(searchTermsDir)) {
      fs.mkdirSync(searchTermsDir, { recursive: true });
    }
    if (!fs.existsSync(packageSearchTermsDir)) {
      fs.mkdirSync(packageSearchTermsDir, { recursive: true });
    }
    
    // Save to both locations
    const searchTermsJson = JSON.stringify(searchTermsData, null, 2);
    fs.writeFileSync(searchTermsPath, searchTermsJson);
    fs.writeFileSync(packageSearchTermsPath, searchTermsJson);
    
    console.log(`\n✅ Search terms generation complete!`);
    console.log(`📊 Generated terms for ${successCount}/${uncategorizedIcons.length} new icons`);
    console.log(`💾 Saved to ${searchTermsPath} and ${packageSearchTermsPath}`);
    
    return successCount;
    
  } catch (error) {
    console.error(`❌ Failed to save search terms: ${error.message}`);
    throw error;
  }
}

// Export functions for use in other scripts
module.exports = {
  generateSearchTermsForNewIcons,
};

// Run if script is executed directly
if (require.main === module) {
  generateSearchTermsForNewIcons().catch(error => {
    console.error('Script failed:', error.message);
    process.exit(1);
  });
}
