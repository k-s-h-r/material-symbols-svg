#!/usr/bin/env node
/**
 * このスクリプトの役割:
 * - uncategorized アイコンを OpenAI でカテゴリ分類し icon-catalog を更新する
 *
 * 関連ファイル:
 * - /metadata/icon-catalog.json
 * - /scripts/update-metadata.ts
 * - /scripts/generate-search-terms-full.ts
 *
 * 実行元:
 * - 手動: tsx scripts/categorize-icons.ts
 * - scripts/update-metadata.ts から内部呼び出し
 * - scripts/generate-search-terms-full.ts から内部呼び出し
 */

// Load environment variables from .env file
import dotenv from 'dotenv';
import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import { promisify } from 'node:util';
import { isMain } from './utils/is-main.ts';
import { dirnameFromImportMeta } from './utils/module-path.ts';

dotenv.config();

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const SCRIPT_DIR = dirnameFromImportMeta(import.meta.url);

type IconEntry = {
  iconName: string;
  categories: string[];
  version?: string | null;
};

type IconIndex = Record<string, IconEntry>;

type UncategorizedIcon = {
  name: string;
  componentName: string;
  version?: string | null;
};

type CategorizationResponse = Record<string, string[]>;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * OpenAI API client for categorization
 */
class OpenAIClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
  }

  async categorizeIcons(uncategorizedIcons: UncategorizedIcon[]): Promise<CategorizationResponse> {
    const iconNames = uncategorizedIcons.map(icon => icon.name).join(', ');
    
    const prompt = `You are an expert in categorizing Material Design icons. Please categorize the following icon names into appropriate categories.

Available categories: action, alert, av, communication, content, device, editor, file, hardware, home, image, maps, navigation, notification, places, search, social, symbols, toggle

Icon names to categorize: ${iconNames}

Please respond with a JSON object where each icon name is a key and the value is an array of appropriate category names. If an icon could belong to multiple categories, include all relevant ones. If unsure, use "symbols" as the default category.

Example response format:
{
  "icon_name": ["category1", "category2"],
  "another_icon": ["category1"]
}`;

    const data = JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that categorizes Material Design icons accurately.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2000
    });

    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.openai.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Length': data.length
        }
      }, (res) => {
        let responseData = '';
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        res.on('end', () => {
          try {
            const response = JSON.parse(responseData) as {
              error?: { message?: string };
              choices?: Array<{ message?: { content?: string } }>;
            };
            if (response.error?.message) {
              reject(new Error(`OpenAI API error: ${response.error.message}`));
              return;
            }
            
            const content = response.choices?.[0]?.message?.content;
            if (typeof content !== 'string') {
              reject(new Error('OpenAI response did not include message content'));
              return;
            }
            
            // Remove markdown code blocks if present
            let cleanContent = content;
            if (content.includes('```json')) {
              cleanContent = content.replace(/```json\s*/, '').replace(/\s*```$/, '');
            } else if (content.includes('```')) {
              cleanContent = content.replace(/```\s*/, '').replace(/\s*```$/, '');
            }
            
            const parsedCategorization = JSON.parse(cleanContent.trim()) as Record<string, unknown>;
            const categorization: CategorizationResponse = {};
            for (const [iconName, categories] of Object.entries(parsedCategorization)) {
              if (Array.isArray(categories)) {
                categorization[iconName] = categories.map((category) => String(category));
              }
            }
            resolve(categorization);
          } catch (error) {
            reject(new Error(`Failed to parse OpenAI response: ${getErrorMessage(error)}`));
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }
}

/**
 * Find uncategorized icons from icon index
 */
async function findUncategorizedIcons(): Promise<{ iconIndex: IconIndex; uncategorized: UncategorizedIcon[] }> {
  const iconCatalogPath = path.join(SCRIPT_DIR, '../metadata/icon-catalog.json');
  
  try {
    const data = await readFile(iconCatalogPath, 'utf8');
    const parsed = JSON.parse(String(data)) as Record<string, Partial<IconEntry>>;
    const iconIndex: IconIndex = {};
    for (const [iconName, icon] of Object.entries(parsed)) {
      iconIndex[iconName] = {
        iconName: icon.iconName || iconName,
        categories: Array.isArray(icon.categories) ? icon.categories.map((category) => String(category)) : ['uncategorized'],
        version: typeof icon.version === 'string' || icon.version === null ? icon.version : undefined,
      };
    }
    
    const uncategorized: UncategorizedIcon[] = [];
    for (const iconName in iconIndex) {
      const icon = iconIndex[iconName];
      if (icon.categories.includes('uncategorized')) {
        uncategorized.push({
          name: iconName,
          componentName: icon.iconName,
          version: icon.version
        });
      }
    }
    
    return { iconIndex, uncategorized };
  } catch (error) {
    throw new Error(`Failed to read icon index: ${getErrorMessage(error)}`);
  }
}

/**
 * Update icon index with new categories
 */
async function updateIconCategories(iconIndex: IconIndex, categorization: CategorizationResponse): Promise<number> {
  let updatedCount = 0;
  
  for (const iconName in categorization) {
    if (iconIndex[iconName]) {
      const newCategories = categorization[iconName];
      
      // Remove 'uncategorized' and add new categories
      iconIndex[iconName].categories = newCategories.filter(cat => 
        cat !== 'uncategorized' && cat.trim() !== ''
      );
      
      // Ensure at least one category exists
      if (iconIndex[iconName].categories.length === 0) {
        iconIndex[iconName].categories = ['symbols'];
      }
      
      updatedCount++;
    }
  }
  
  return updatedCount;
}

/**
 * Main categorization process
 */
export async function categorizeUncategorizedIcons() {
  console.log('Starting icon categorization process...');
  
  try {
    // Find uncategorized icons
    const { iconIndex, uncategorized } = await findUncategorizedIcons();
    
    if (uncategorized.length === 0) {
      console.log('No uncategorized icons found. All icons are properly categorized.');
      return;
    }
    
    console.log(`Found ${uncategorized.length} uncategorized icons`);
    
    // Initialize OpenAI client
    const openai = new OpenAIClient();
    
    // Process icons in batches of 50 to avoid token limits
    const batchSize = 50;
    let totalUpdated = 0;
    
    for (let i = 0; i < uncategorized.length; i += batchSize) {
      const batch = uncategorized.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(uncategorized.length / batchSize)} (${batch.length} icons)...`);
      
      try {
        // Get categorization from OpenAI
        const categorization = await openai.categorizeIcons(batch);
        
        // Update icon index
        const updatedCount = await updateIconCategories(iconIndex, categorization);
        totalUpdated += updatedCount;
        
        console.log(`Categorized ${updatedCount} icons in this batch`);
        
        // Add small delay to respect API rate limits
        if (i + batchSize < uncategorized.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.warn(`Failed to categorize batch starting at index ${i}: ${getErrorMessage(error)}`);
        console.warn('Continuing with next batch...');
      }
    }
    
    // Save updated icon index
    const iconCatalogPath = path.join(SCRIPT_DIR, '../metadata/icon-catalog.json');
    await writeFile(iconCatalogPath, JSON.stringify(iconIndex, null, 2));
    
    console.log(`\nCategorization complete!`);
    console.log(`Total icons categorized: ${totalUpdated}`);
    console.log('Updated icon index saved');
    
  } catch (error) {
    console.error('Error during categorization:', error);
    process.exit(1);
  }
}

// Run if script is executed directly
if (isMain(import.meta.url)) {
  categorizeUncategorizedIcons();
}
