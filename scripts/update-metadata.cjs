#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const { promisify } = require('util');

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdir = promisify(fs.mkdir);

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
 * カテゴリ情報を抽出 (例: "action::home" -> "action")
 */
function extractCategory(categoryKey) {
  const parts = categoryKey.split('::');
  return parts.length > 1 ? parts[0] : 'general';
}

/**
 * アイコン名を抽出 (例: "action::home" -> "home")
 */
function extractIconName(categoryKey) {
  const parts = categoryKey.split('::');
  return parts.length > 1 ? parts[1] : parts[0];
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
      changes.added.push({
        name: iconName,
        category: newData[iconName].categories?.[0] || 'general'
      });
    }
  }

  // 更新されたアイコンを検出
  for (const iconName in newData) {
    if (iconName in oldData) {
      const oldIcon = oldData[iconName];
      const newIcon = newData[iconName];
      
      // カテゴリが変更された場合
      if (JSON.stringify(oldIcon.categories) !== JSON.stringify(newIcon.categories)) {
        changes.updated.push({
          name: iconName,
          oldCategories: oldIcon.categories,
          newCategories: newIcon.categories
        });
      }
    }
  }

  // 削除されたアイコンを検出
  for (const iconName in oldData) {
    if (!(iconName in newData)) {
      changes.removed.push({
        name: iconName,
        category: oldData[iconName].categories?.[0] || 'general'
      });
    }
  }

  return changes;
}

/**
 * 更新履歴を記録
 */
async function recordUpdateHistory(changes) {
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

  // 変更がない場合はスキップ
  if (changes.added.length === 0 && changes.updated.length === 0 && changes.removed.length === 0) {
    console.log('No changes detected, skipping history update');
    return;
  }

  // 新しい更新記録を追加
  history.updates.unshift(changes);

  // 履歴を最新100件に制限
  history.updates = history.updates.slice(0, 100);

  // 両方の場所に履歴を保存
  await Promise.all([
    writeFile(historyPath, JSON.stringify(history, null, 2)),
    writeFile(packageHistoryPath, JSON.stringify(history, null, 2))
  ]);
  
  console.log(`Update history recorded: ${changes.added.length} added, ${changes.updated.length} updated, ${changes.removed.length} removed`);
}

/**
 * メイン処理
 */
async function updateMetadata() {
  console.log('Starting metadata update...');

  try {
    // 上流データを取得
    console.log('Fetching upstream metadata...');
    const [currentVersions, versions] = await Promise.all([
      fetchJSON('https://raw.githubusercontent.com/google/material-design-icons/master/update/current_versions.json'),
      fetchJSON('https://raw.githubusercontent.com/marella/material-symbols/main/metadata/versions.json')
    ]);

    console.log(`Fetched ${Object.keys(currentVersions).length} icons from current_versions.json`);
    console.log(`Fetched ${Object.keys(versions).length} icons from versions.json`);

    // 既存のメタデータを読み込み
    const iconIndexPath = path.join(__dirname, '../metadata/icon-index.json');
    const oldIconIndex = await readLocalFile(iconIndexPath);

    // 新しいメタデータを構築
    const newIconIndex = {};
    
    // versions.jsonをベースにアイコン一覧を作成
    for (const iconName in versions) {
      // current_versions.jsonからカテゴリ情報を検索
      const categories = [];
      for (const categoryKey in currentVersions) {
        const extractedIconName = extractIconName(categoryKey);
        if (extractedIconName === iconName) {
          const category = extractCategory(categoryKey);
          if (!categories.includes(category)) {
            categories.push(category);
          }
        }
      }

      // カテゴリが見つからない場合はgeneralを設定
      if (categories.length === 0) {
        categories.push('general');
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
        version: versions[iconName]
      };
    }

    // 変更を検出
    const changes = detectChanges(oldIconIndex, newIconIndex);

    // メタデータディレクトリを作成（存在しない場合）
    await mkdir(path.join(__dirname, '../metadata'), { recursive: true });

    // 新しいメタデータを保存
    await writeFile(iconIndexPath, JSON.stringify(newIconIndex, null, 2));
    console.log(`Updated icon index with ${Object.keys(newIconIndex).length} icons`);

    // 上流データを metadata/source/ に保存
    const sourceDir = path.join(__dirname, '../metadata/source');
    await mkdir(sourceDir, { recursive: true });
    
    const currentVersionsPath = path.join(sourceDir, 'current_versions.json');
    const versionsPath = path.join(sourceDir, 'versions.json');
    
    await Promise.all([
      writeFile(currentVersionsPath, JSON.stringify(currentVersions, null, 2)),
      writeFile(versionsPath, JSON.stringify(versions, null, 2))
    ]);
    console.log('Saved upstream data to metadata/source/ directory');

    // 更新履歴を記録
    await recordUpdateHistory(changes);

    // 統計情報を表示
    console.log('\nUpdate Summary:');
    console.log(`Total icons: ${Object.keys(newIconIndex).length}`);
    console.log(`Added: ${changes.added.length}`);
    console.log(`Updated: ${changes.updated.length}`);
    console.log(`Removed: ${changes.removed.length}`);

    if (changes.added.length > 0) {
      console.log('\nNewly added icons:');
      changes.added.slice(0, 10).forEach(icon => {
        console.log(`  - ${icon.name} (${icon.category})`);
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

module.exports = { updateMetadata };