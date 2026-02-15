#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { promisify } = require('util');

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdir = promisify(fs.mkdir);

const MATERIAL_SYMBOLS_STYLES = ['outlined', 'rounded', 'sharp'];
const REPRESENTATIVE_MATERIAL_SYMBOLS_WEIGHT = 100;
const REPRESENTATIVE_MATERIAL_SYMBOLS_PACKAGE = `@material-symbols/svg-${REPRESENTATIVE_MATERIAL_SYMBOLS_WEIGHT}`;
const REPRESENTATIVE_MATERIAL_SYMBOLS_KEY = `svg-${REPRESENTATIVE_MATERIAL_SYMBOLS_WEIGHT}`;
const DEFAULT_EXISTENCE_CHECK_WEIGHT = REPRESENTATIVE_MATERIAL_SYMBOLS_WEIGHT;

/**
 * HTTPSでJSONデータを取得
 */
async function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error(`Failed to parse JSON from ${url}: ${error.message}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * ローカルファイルを読み取り、存在しない場合は空オブジェクトを返す
 */
async function readLocalFile(filePath) {
  try {
    const data = await readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.log(`File not found or invalid: ${filePath}, creating new one`);
    return {};
  }
}

/**
 * package.jsonからmarella/material-symbolsのバージョンを取得
 */
async function getMarellaVersions() {
  const packageJsonPath = path.join(__dirname, '../package.json');
  
  try {
    const packageData = await readLocalFile(packageJsonPath);
    const dependencies = packageData.dependencies || {};
    
    // material-symbols関連のパッケージを取得
    const materialSymbolsPackages = {};
    const versionSet = new Set();
    
    for (const [packageName, version] of Object.entries(dependencies)) {
      if (packageName.startsWith('@material-symbols/svg-')) {
        const weight = packageName.replace('@material-symbols/svg-', '');
        const cleanVersion = version.replace(/^[\^~]/, ''); // ^0.32.0 -> 0.32.0
        materialSymbolsPackages[`svg-${weight}`] = cleanVersion;
        versionSet.add(cleanVersion);
      }
    }
    
    // バージョンの整合性をチェック
    if (versionSet.size === 0) {
      throw new Error('No @material-symbols/svg-* packages found in dependencies');
    }
    
    if (versionSet.size > 1) {
      console.warn(`Warning: Multiple versions detected for @material-symbols packages:`, Array.from(versionSet));
      console.warn('All packages should use the same version for consistency');
    }
    
    const representativeVersion = materialSymbolsPackages[REPRESENTATIVE_MATERIAL_SYMBOLS_KEY];
    if (!representativeVersion) {
      throw new Error(`${REPRESENTATIVE_MATERIAL_SYMBOLS_PACKAGE} is required in dependencies`);
    }
    
    return {
      version: representativeVersion,
      packages: materialSymbolsPackages,
      hasVersionMismatch: versionSet.size > 1,
      representativePackage: REPRESENTATIVE_MATERIAL_SYMBOLS_PACKAGE,
    };
    
  } catch (error) {
    console.error('Failed to read marella versions from package.json:', error.message);
    return {
      version: 'unknown',
      packages: {},
      hasVersionMismatch: false,
      error: error.message
    };
  }
}

/**
 * node_modules の @material-symbols/svg-* パッケージに実在するアイコン一覧を取得
 * - versions.json に載っていても実パッケージに入っていないケースがあるため、存在チェック用に使用
 */
function getAvailableIconsFromInstalledPackage({ weight = DEFAULT_EXISTENCE_CHECK_WEIGHT } = {}) {
  const availableIcons = new Set();
  const checkedDirs = [];

  for (const style of MATERIAL_SYMBOLS_STYLES) {
    const dirPath = path.join(__dirname, `../node_modules/@material-symbols/svg-${weight}/${style}`);
    if (!fs.existsSync(dirPath)) continue;

    checkedDirs.push(dirPath);

    const files = fs.readdirSync(dirPath);
    for (const fileName of files) {
      if (!fileName.endsWith('.svg')) continue;
      if (fileName.endsWith('-fill.svg')) continue;
      availableIcons.add(fileName.replace(/\.svg$/, ''));
    }
  }

  return { availableIcons, checkedDirs };
}

/**
 * 変更を検出して記録
 */
function detectChanges(oldData, newData) {
  const changes = {
    timestamp: new Date().toISOString(),
    added: [],
    updated: [],
    removed: []
  };

  // 新規追加されたアイコンを検出
  for (const iconName in newData) {
    if (!(iconName in oldData)) {
      changes.added.push(iconName);
    }
  }

  // 更新されたアイコンを検出（カテゴリ差分は対象外）
  for (const iconName in newData) {
    if (iconName in oldData) {
      const oldIcon = oldData[iconName];
      const newIcon = newData[iconName];
      
      // upstream icon version の変更のみを更新として扱う
      if (oldIcon.version !== newIcon.version) {
        changes.updated.push(iconName);
      }
    }
  }

  // 削除されたアイコンを検出
  for (const iconName in oldData) {
    if (!(iconName in newData)) {
      changes.removed.push(iconName);
    }
  }

  return changes;
}

function getMaterialSymbolsVersionTo(update) {
  return update.material_symbols_version_to || update.material_symbols_version || 'unknown';
}

function normalizeHistoryUpdates(updates, materialSymbolsPackage) {
  return updates.map((update, index, allUpdates) => {
    const toVersion = getMaterialSymbolsVersionTo(update);
    const olderUpdate = allUpdates[index + 1];
    const inferredFromVersion = olderUpdate ? getMaterialSymbolsVersionTo(olderUpdate) : 'unknown';
    const fromVersion = update.material_symbols_version_from || inferredFromVersion;

    return {
      ...update,
      material_symbols_package: update.material_symbols_package || materialSymbolsPackage,
      material_symbols_version_from: fromVersion,
      material_symbols_version_to: toVersion,
      // Backward compatibility for existing consumers
      material_symbols_version: toVersion,
    };
  });
}

/**
 * 更新履歴を記録（バージョン情報付き）
 */
async function recordUpdateHistory(changes, { materialSymbolsVersion, materialSymbolsPackage }) {
  const historyPath = path.join(__dirname, '../metadata/update-history.json');
  const packageHistoryPath = path.join(__dirname, '../packages/metadata/update-history.json');
  
  // 既存の履歴を読み込み
  let history = { updates: [] };
  try {
    const existingHistory = await readFile(historyPath, 'utf8');
    history = JSON.parse(existingHistory);
  } catch (error) {
    console.log('Creating new update history file');
  }

  if (!Array.isArray(history.updates)) {
    history.updates = [];
  }
  history.updates = normalizeHistoryUpdates(history.updates, materialSymbolsPackage);

  const previousVersion = history.updates.length > 0 ? getMaterialSymbolsVersionTo(history.updates[0]) : 'unknown';

  // 前回と今回の upstream バージョンが同一なら履歴を追加しない
  if (previousVersion === materialSymbolsVersion) {
    console.log(`Upstream version unchanged (${materialSymbolsVersion}), skipping history update`);
    return false;
  }

  // 変更がない場合はスキップ
  if (changes.added.length === 0 && changes.updated.length === 0 && changes.removed.length === 0) {
    console.log('No changes detected, skipping history update');
    return false; // 変更がなかったことを示す
  }

  // 現在の公開パッケージバージョンを取得（unreleasedサフィックス付き）
  let packageVersion = 'unknown';
  try {
    // 実際の公開パッケージ（metadata）のバージョンを使用
    const metadataPackageData = await readLocalFile(path.join(__dirname, '../packages/metadata/package.json'));
    const currentVersion = metadataPackageData.version;
    // 既にunreleasedでない場合のみサフィックスを追加
    packageVersion = currentVersion.endsWith('-unreleased') ? currentVersion : `${currentVersion}-unreleased`;
  } catch (error) {
    console.warn('Could not determine package version:', error.message);
  }

  // バージョン情報付きの新しい更新記録を作成
  const updateEntry = {
    timestamp: changes.timestamp,
    package_version: packageVersion,
    material_symbols_package: materialSymbolsPackage,
    material_symbols_version_from: previousVersion,
    material_symbols_version_to: materialSymbolsVersion,
    // Backward compatibility
    material_symbols_version: materialSymbolsVersion,
    added: changes.added,
    updated: changes.updated,
    removed: changes.removed
  };

  // 新しい更新記録を追加
  history.updates.unshift(updateEntry);

  // 履歴を最新100件に制限
  history.updates = normalizeHistoryUpdates(history.updates.slice(0, 100), materialSymbolsPackage);

  // 両方の場所に履歴を保存
  await Promise.all([
    writeFile(historyPath, JSON.stringify(history, null, 2)),
    writeFile(packageHistoryPath, JSON.stringify(history, null, 2))
  ]);
  
  console.log(`Update history recorded: ${changes.added.length} added, ${changes.updated.length} updated, ${changes.removed.length} removed`);
  console.log(`Package version: ${packageVersion}, Material Symbols version: ${previousVersion} -> ${materialSymbolsVersion}`);
  return true; // 変更があったことを示す
}

// 注意: setPackagesUnreleased関数は削除されました
// パッケージのバージョン管理はbump-version.cjsで手動で行います

/**
 * メイン処理
 */
async function updateMetadata() {
  console.log('Starting metadata update...');

  try {
    // marella/material-symbolsのバージョン情報を取得してタグを決定
    const marellaVersions = await getMarellaVersions();
    const versionTag = `v${marellaVersions.version}`;
    
    // 上流データを取得 - 指定されたバージョンのversions.jsonを使用
    console.log('Fetching upstream metadata...');
    console.log(`Using marella/material-symbols version tag: ${versionTag}`);
    const versions = await fetchJSON(`https://raw.githubusercontent.com/marella/material-symbols/${versionTag}/metadata/versions.json`);

    console.log(`Fetched ${Object.keys(versions).length} icons from versions.json (${versionTag})`);

    // versions.json に載っていても、実際の @material-symbols/svg-* に含まれていないアイコンを除外
    const existenceCheckWeight = Number.parseInt(
      process.env.MATERIAL_SYMBOLS_EXISTENCE_CHECK_WEIGHT || `${DEFAULT_EXISTENCE_CHECK_WEIGHT}`,
      10,
    );
    const { availableIcons, checkedDirs } = getAvailableIconsFromInstalledPackage({ weight: existenceCheckWeight });

    let filteredVersions = versions;
    let missingFromPackage = [];

    if (checkedDirs.length === 0) {
      console.warn(
        `⚠️  Could not find installed @material-symbols/svg-${existenceCheckWeight} package directories under node_modules; skipping existence check.`,
      );
    } else {
      filteredVersions = {};
      missingFromPackage = [];

      for (const iconName of Object.keys(versions)) {
        if (availableIcons.has(iconName)) {
          filteredVersions[iconName] = versions[iconName];
        } else {
          missingFromPackage.push(iconName);
        }
      }

      if (missingFromPackage.length > 0) {
        console.warn(
          `⚠️  ${missingFromPackage.length} icons exist in versions.json but are missing from installed @material-symbols/svg-${existenceCheckWeight}; they will be excluded from icon-catalog/update-history.`,
        );
        console.warn(`   e.g. ${missingFromPackage.slice(0, 20).join(', ')}${missingFromPackage.length > 20 ? ', ...' : ''}`);
      }
    }

    // 既存のメタデータを読み込み
    const iconCatalogPath = path.join(__dirname, '../metadata/icon-catalog.json');
    const oldIconIndex = await readLocalFile(iconCatalogPath);

    // 新しいメタデータを構築
    const newIconIndex = {};
    
    // versions.json（存在チェック後）をメインデータソースとしてアイコン一覧を作成
    for (const iconName in filteredVersions) {
      // 既存のアイコンからカテゴリ情報を取得、新規の場合のみuncategorized
      let categories = ['uncategorized'];
      if (oldIconIndex[iconName] && oldIconIndex[iconName].categories) {
        // 既存アイコンの場合：既存のカテゴリを保持
        categories = oldIconIndex[iconName].categories;
      }

      // コンポーネント名を生成 (Pascal Case)
      const componentName = iconName
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');

      newIconIndex[iconName] = {
        name: iconName,
        iconName: componentName,
        categories: categories,
        version: filteredVersions[iconName]
      };
    }

    // 変更を検出
    const changes = detectChanges(oldIconIndex, newIconIndex);

    // メタデータディレクトリを作成（存在しない場合）
    await mkdir(path.join(__dirname, '../metadata'), { recursive: true });

    // 新しいメタデータを保存
    await writeFile(iconCatalogPath, JSON.stringify(newIconIndex, null, 2));
    console.log(`Updated icon catalog with ${Object.keys(newIconIndex).length} icons`);

    // 上流データを metadata/source/ に保存
    const sourceDir = path.join(__dirname, '../metadata/source');
    await mkdir(sourceDir, { recursive: true });
    
    const versionsPath = path.join(sourceDir, 'versions.json');
    const upstreamVersionPath = path.join(sourceDir, 'upstream-version.json');
    
    // 既存のupstream-versionを読み込んで比較
    const existingUpstreamVersion = await readLocalFile(upstreamVersionPath);
    const existingPackageVersions = existingUpstreamVersion.marella_package_versions || {};
    
    // パッケージバージョンに変更があるかチェック
    const packageVersionsChanged = JSON.stringify(existingPackageVersions) !== JSON.stringify(marellaVersions.packages);
    const representativePackageChanged = existingUpstreamVersion.marella_material_symbols_package !== marellaVersions.representativePackage;
    const representativeVersionChanged = existingUpstreamVersion.marella_material_symbols_version !== marellaVersions.version;
    
    // versions.jsonは常に保存
    await writeFile(versionsPath, JSON.stringify(versions, null, 2));
    
    // upstream-version.jsonはパッケージバージョンに変更がある場合のみ更新
    if (packageVersionsChanged || representativePackageChanged || representativeVersionChanged || !existingUpstreamVersion.marella_material_symbols_version) {
      const upstreamVersion = {
        timestamp: new Date().toISOString(),
        marella_material_symbols_package: marellaVersions.representativePackage,
        marella_material_symbols_version: marellaVersions.version,
        marella_package_versions: marellaVersions.packages,
        total_icons: Object.keys(versions).length,
        last_updated: new Date().toISOString(),
        version_mismatch_detected: marellaVersions.hasVersionMismatch
      };
      
      // バージョン取得でエラーがあった場合は記録
      if (marellaVersions.error) {
        upstreamVersion.version_error = marellaVersions.error;
      }
      
      await writeFile(upstreamVersionPath, JSON.stringify(upstreamVersion, null, 2));
      console.log('Saved upstream data and updated version info to metadata/source/ directory');
      console.log(`Updated marella/material-symbols version: ${marellaVersions.version}`);
    } else {
      console.log('Saved upstream data to metadata/source/ directory');
      console.log(`Using marella/material-symbols version: ${marellaVersions.version} (no version change detected)`);
    }

    // 更新履歴を記録（バージョン情報付き）
    const hasChanges = await recordUpdateHistory(changes, {
      materialSymbolsVersion: marellaVersions.version,
      materialSymbolsPackage: marellaVersions.representativePackage,
    });

    // 新規アイコンの処理
    const uncategorizedIcons = Object.values(newIconIndex)
      .filter(icon => icon.categories.includes('uncategorized'));
    const uncategorizedCount = uncategorizedIcons.length;
      
    if (uncategorizedCount > 0 && hasChanges) {
      console.log(`\nProcessing ${uncategorizedCount} new uncategorized icons...`);
      
      // OpenAI API Keyが設定されている場合、自動処理を実行
      if (process.env.OPENAI_API_KEY) {
        console.log('OPENAI_API_KEY detected. Running automated processing...');
        
        try {
          // 1. 検索ワード生成（新規アイコンのみ）
          const { generateSearchTermsForNewIcons } = require('./generate-search-terms-new.cjs');
          const searchTermsGenerated = await generateSearchTermsForNewIcons();
          console.log(`✅ Generated search terms for ${searchTermsGenerated} icons`);
          
          // 2. カテゴリ分類
          const { categorizeUncategorizedIcons } = require('./categorize-icons.cjs');
          await categorizeUncategorizedIcons();
          console.log('✅ Auto-categorization completed');
          
        } catch (error) {
          console.warn('⚠️ Automated processing failed:', error.message);
          console.warn('You can run the processes manually:');
          console.warn('  - Categories: node scripts/categorize-icons.cjs');
          console.warn('  - Search terms: node scripts/generate-search-terms-new.cjs');
        }
      } else {
        console.log('To process them automatically, set OPENAI_API_KEY environment variable');
        console.log('Manual processing commands:');
        console.log('  - Categories: node scripts/categorize-icons.cjs');
        console.log('  - Search terms: node scripts/generate-search-terms-new.cjs');
      }
    } else if (uncategorizedCount > 0) {
      console.log(`\nNote: Found ${uncategorizedCount} uncategorized icons (from previous updates).`);
      console.log('Use "node scripts/categorize-icons.cjs" to categorize them.');
    }

    // 統計情報を表示
    console.log('\nUpdate Summary:');
    console.log(`Total icons: ${Object.keys(newIconIndex).length}`);
    console.log(`Added: ${changes.added.length}`);
    console.log(`Updated: ${changes.updated.length}`);
    console.log(`Removed: ${changes.removed.length}`);

    if (changes.added.length > 0) {
      console.log('\nNewly added icons:');
      changes.added.slice(0, 10).forEach(iconName => {
        console.log(`  - ${iconName}`);
      });
      if (changes.added.length > 10) {
        console.log(`  ... and ${changes.added.length - 10} more`);
      }
    }

    console.log('\nMetadata update completed successfully!');

  } catch (error) {
    console.error('Error updating metadata:', error);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合にメイン処理を実行
if (require.main === module) {
  updateMetadata();
}

module.exports = {
  updateMetadata,
  getMarellaVersions,
  detectChanges,
  getMaterialSymbolsVersionTo,
  normalizeHistoryUpdates,
  recordUpdateHistory,
};
