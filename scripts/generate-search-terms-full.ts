#!/usr/bin/env node
/**
 * このスクリプトの役割:
 * - アイコン全体に対して OpenAI で検索語を生成し search-terms を更新する
 * - 入力として packages/metadata/paths/*.json を利用するため、build:metadata 後の実行が前提
 *
 * 関連ファイル:
 * - /metadata/icon-catalog.json
 * - /metadata/search-terms.json
 * - /packages/metadata/paths/*.json
 * - /scripts/categorize-icons.ts
 *
 * 実行元:
 * - package.json: generate:search-terms
 * - package.json: update:icons（内部で generate:search-terms を実行）
 * - 手動: tsx scripts/generate-search-terms-full.ts
 */

// Load environment variables from .env file
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { dirnameFromImportMeta } from './utils/module-path.ts';

dotenv.config();
const SCRIPT_DIR = dirnameFromImportMeta(import.meta.url);

/**
 * Search Terms Generator for Material Symbols Icons
 * 
 * Uses OpenAI GPT-4o-mini API to generate English search terms for each icon
 * based on SVG path data, icon name, and category information.
 */

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const REQUEST_DELAY = 1100; // 1.1 seconds between requests (safer than 1000ms for 60/min limit)
const MAX_RETRIES = 3;
const BATCH_SAVE_SIZE = 20; // Save to file every N successful generations

type IconCatalogEntry = {
  categories: string[];
  searchTerms?: string[];
};

type IconCatalog = Record<string, IconCatalogEntry>;
type SearchTermsMap = Record<string, string[]>;

type PathFileData = {
  outlined?: {
    outline?: {
      w400?: string;
    };
  };
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Call OpenAI API to generate search terms for an icon
 */
async function generateSearchTerms(
  iconName: string,
  categories: string[],
  svgPath: string,
  apiKey: string,
): Promise<string[]> {
  // Create a complete SVG for better visual context
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
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('OpenAI response did not contain message content');
  }
  
  try {
    const searchTerms = JSON.parse(content) as unknown;
    if (Array.isArray(searchTerms) && searchTerms.every(term => typeof term === 'string')) {
      return searchTerms;
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.warn(`   ⚠️ Failed to parse response for ${iconName}: ${content}`);
    return []; // Return empty array on parse error
  }
}

/**
 * Load SVG path data for an icon
 */
function loadIconSvgPath(iconName: string): string | null {
  const pathFile = path.join(SCRIPT_DIR, '../packages/metadata/paths', `${iconName}.json`);
  
  if (!fs.existsSync(pathFile)) {
    return null;
  }
  
  try {
    const pathData = JSON.parse(fs.readFileSync(pathFile, 'utf8')) as PathFileData;
    // Get w400 outlined path (most common weight and style)
    return pathData.outlined?.outline?.w400 || null;
  } catch (error) {
    console.warn(`   ⚠️ Failed to load SVG path for ${iconName}: ${getErrorMessage(error)}`);
    return null;
  }
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Process an icon with retries
 */
async function processIconWithRetries(
  iconName: string,
  iconData: IconCatalogEntry,
  apiKey: string,
): Promise<IconCatalogEntry> {
  const svgPath = loadIconSvgPath(iconName);
  
  if (!svgPath) {
    console.warn(`   ⚠️ No SVG path found for ${iconName}, skipping`);
    return iconData; // Return unchanged
  }
  
  let lastError: unknown = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const searchTerms = await generateSearchTerms(
        iconName, 
        iconData.categories, 
        svgPath, 
        apiKey
      );
      
      return {
        ...iconData,
        searchTerms
      };
    } catch (error) {
      lastError = error;
      
      if (attempt < MAX_RETRIES) {
        console.warn(`   ⚠️ Attempt ${attempt} failed for ${iconName}, retrying...`);
        await sleep(REQUEST_DELAY * 2); // Longer delay on retry
      }
    }
  }
  
  console.error(`   ❌ Failed to process ${iconName} after ${MAX_RETRIES} attempts: ${getErrorMessage(lastError)}`);
  return iconData; // Return unchanged on failure
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Starting search terms generation...\n');
  
  // Check for API key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: OPENAI_API_KEY environment variable is required');
    process.exit(1);
  }
  
  // Load existing icon catalog
  const iconCatalogPath = path.join(SCRIPT_DIR, '../metadata/icon-catalog.json');
  if (!fs.existsSync(iconCatalogPath)) {
    console.error('❌ Error: metadata/icon-catalog.json not found');
    process.exit(1);
  }
  
  const iconIndex = JSON.parse(fs.readFileSync(iconCatalogPath, 'utf8')) as IconCatalog;
  const iconNames = Object.keys(iconIndex);
  
  // Define search terms file paths
  const searchTermsPath = path.join(SCRIPT_DIR, '../metadata/search-terms.json');
  const searchTermsDir = path.dirname(searchTermsPath);
  
  // Create metadata directory if it doesn't exist
  if (!fs.existsSync(searchTermsDir)) {
    fs.mkdirSync(searchTermsDir, { recursive: true });
  }
  
  // Load existing search terms and create processed icons set
  let existingSearchTerms: SearchTermsMap = {};
  const processedIconsSet = new Set<string>();
  
  if (fs.existsSync(searchTermsPath)) {
    try {
      existingSearchTerms = JSON.parse(fs.readFileSync(searchTermsPath, 'utf8'));
      
      // Create a Set of processed icons for fast lookup
      for (const [iconName, terms] of Object.entries(existingSearchTerms)) {
        if (Array.isArray(terms) && terms.length > 0) {
          processedIconsSet.add(iconName);
        }
      }
      
      console.log(`📖 Loaded existing search terms for ${processedIconsSet.size} icons`);
      
    } catch (error) {
      console.warn(`⚠️ Could not parse existing search terms file: ${getErrorMessage(error)}`);
    }
  }
  
  // Filter icons to only those that need processing AND have SVG files
  const iconsToProcess = iconNames.filter(iconName => {
    // Skip if already processed
    if (processedIconsSet.has(iconName)) {
      return false;
    }
    
    // Skip if no SVG path file exists
    const pathFile = path.join(SCRIPT_DIR, '../packages/metadata/paths', `${iconName}.json`);
    if (!fs.existsSync(pathFile)) {
      return false;
    }
    
    return true;
  });
  
  const skippedCount = iconNames.length - iconsToProcess.length;
  
  const alreadyProcessedCount = processedIconsSet.size;
  const noSvgFileCount = iconNames.length - processedIconsSet.size - iconsToProcess.length;
  
  console.log(`📊 Total icons: ${iconNames.length}`);
  console.log(`✅ Already processed: ${alreadyProcessedCount}`);
  console.log(`❌ No SVG file: ${noSvgFileCount}`);
  console.log(`🎯 Processing ${iconsToProcess.length} new icons`);
  console.log(`⏱️ Estimated time: ${Math.ceil(iconsToProcess.length / 55)} minutes (with rate limiting)\n`);
  
  // Work with search terms data
  const searchTermsData = { ...existingSearchTerms };
  let successCount = processedIconsSet.size; // Start with already processed count
  
  let newlyProcessedCount = 0;
  
  for (let i = 0; i < iconsToProcess.length; i++) {
    const iconName = iconsToProcess[i];
    const iconData = iconIndex[iconName];
    
    console.log(`   🔄 [${i + 1}/${iconsToProcess.length}] Processing ${iconName}...`);
    
    try {
      const updatedIconData = await processIconWithRetries(iconName, iconData, apiKey);
      
      // Store search terms in dedicated data structure
      if (updatedIconData.searchTerms && updatedIconData.searchTerms.length > 0) {
        searchTermsData[iconName] = updatedIconData.searchTerms;
        successCount++;
        newlyProcessedCount++;
        console.log(`   ✅ [${i + 1}/${iconsToProcess.length}] ${iconName} - Generated ${updatedIconData.searchTerms.length} terms`);
        
        // Batch save: save every BATCH_SAVE_SIZE successful generations
        if (newlyProcessedCount % BATCH_SAVE_SIZE === 0) {
          fs.writeFileSync(searchTermsPath, JSON.stringify(searchTermsData, null, 2));
          console.log(`   💾 Batch saved after ${newlyProcessedCount} new generations`);
        }
      } else {
        console.log(`   ⚠️ [${i + 1}/${iconsToProcess.length}] ${iconName} - No terms generated`);
      }
      
      // Add delay to respect rate limits
      if (i < iconsToProcess.length - 1) {
        await sleep(REQUEST_DELAY);
      }
      
    } catch (error) {
      console.error(`   ❌ [${i + 1}/${iconsToProcess.length}] ${iconName} - Error: ${getErrorMessage(error)}`);
    }
    
    // Progress checkpoint every 50 icons
    if ((i + 1) % 50 === 0) {
      console.log(`   📊 Progress checkpoint: ${i + 1}/${iconsToProcess.length} processed, ${newlyProcessedCount} new terms generated`);
    }
  }
  
  // Save final results
  fs.writeFileSync(searchTermsPath, JSON.stringify(searchTermsData, null, 2));
  
  console.log(`\n🎉 Search terms generation completed!`);
  console.log(`   📊 Summary:`);
  console.log(`      Total icons: ${iconNames.length}`);
  console.log(`      Icons with search terms: ${successCount}`);
  console.log(`      Newly processed: ${newlyProcessedCount}`);
  console.log(`      Skipped (already done): ${skippedCount}`);
  console.log(`      Failed: ${iconsToProcess.length - newlyProcessedCount}`);
  console.log(`      Coverage: ${Math.round((successCount / iconNames.length) * 100)}%`);
  console.log(`      Search terms file: metadata/search-terms.json`);
  if (fs.existsSync(path.join(SCRIPT_DIR, '../metadata/search-terms.backup.json'))) {
    console.log(`      Backup file: metadata/search-terms.backup.json`);
  }
  
  // 🔥 NEW: カテゴリ自動生成を同じタイミングで実行
  console.log(`\n🏷️ Starting automatic categorization for uncategorized icons...`);
  try {
    const { categorizeUncategorizedIcons } = await import('./categorize-icons.ts');
    await categorizeUncategorizedIcons();
    console.log(`✅ Auto-categorization completed successfully!`);
  } catch (error) {
    console.warn(`⚠️ Auto-categorization failed: ${getErrorMessage(error)}`);
    console.warn(`You can run categorization manually:`);
    console.warn(`  tsx scripts/categorize-icons.ts`);
  }
}

// Run main function
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
