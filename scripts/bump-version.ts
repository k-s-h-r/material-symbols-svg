#!/usr/bin/env node
/**
 * このスクリプトの役割:
 * - packages 配下の全 package.json の version を一括更新する
 * - metadata/update-history.json の最新 package_version をリリース版へ確定する
 *
 * 関連ファイル:
 * - /packages/<package>/package.json
 * - /metadata/update-history.json
 * - /packages/metadata/update-history.json
 * - /scripts/release.ts
 *
 * 実行元:
 * - package.json: bump:patch / bump:minor / bump:major / bump:auto
 * - package.json: release:prepare（内部で bump-version を呼び出す）
 * - scripts/release.ts から内部呼び出し
 */

import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { isMain } from './utils/is-main.ts';
import { dirnameFromImportMeta } from './utils/module-path.ts';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const SCRIPT_DIR = dirnameFromImportMeta(import.meta.url);

// パッケージディレクトリのパス
const PACKAGES_DIR = path.join(SCRIPT_DIR, '../packages');
const HISTORY_PATH = path.join(SCRIPT_DIR, '../metadata/update-history.json');

// バージョンタイプの定義
const VERSION_TYPES = {
  patch: 'patch',
  minor: 'minor',
  major: 'major'
};

const INPUT_VERSION_TYPES = {
  ...VERSION_TYPES,
  auto: 'auto',
};

function printHelp() {
  console.log('使用方法: tsx scripts/bump-version.ts [patch|minor|major|auto] [--type=<type>]');
  console.log('');
  console.log('オプション:');
  console.log('  --type=patch|minor|major|auto  バージョンタイプを指定（位置引数より優先）');
  console.log('  --type patch|minor|major|auto  同上');
  console.log('  -h, --help                     ヘルプを表示');
}

function parseArgs(argv) {
  let positionalType = null;
  let optionType = null;
  let showHelp = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--') {
      continue;
    }

    if (arg === '-h' || arg === '--help') {
      showHelp = true;
      continue;
    }

    if (arg.startsWith('--type=')) {
      optionType = arg.slice('--type='.length).trim();
      continue;
    }

    if (arg === '--type') {
      optionType = (argv[i + 1] || '').trim();
      i++;
      continue;
    }

    if (arg.startsWith('-')) {
      throw new Error(`不明なオプションです: ${arg}`);
    }

    if (!positionalType) {
      positionalType = arg.trim();
      continue;
    }

    throw new Error(`余分な引数です: ${arg}`);
  }

  return {
    requestedType: optionType || positionalType || null,
    showHelp,
  };
}

function loadLatestUpdateEntry(historyPath = HISTORY_PATH) {
  if (!fs.existsSync(historyPath)) {
    throw new Error(`update-history が見つかりません: ${historyPath}`);
  }

  const raw = fs.readFileSync(historyPath, 'utf8');
  const history = JSON.parse(raw);
  const updates = Array.isArray(history.updates) ? history.updates : [];
  if (updates.length === 0) {
    throw new Error('update-history に更新履歴がありません');
  }

  return updates[0];
}

function getChangeCounts(updateEntry) {
  const added = Array.isArray(updateEntry.added) ? updateEntry.added.length : 0;
  const updated = Array.isArray(updateEntry.updated) ? updateEntry.updated.length : 0;
  const removed = Array.isArray(updateEntry.removed) ? updateEntry.removed.length : 0;
  return {
    added,
    updated,
    removed,
    total: added + updated + removed,
  };
}

function isUnreleasedHistoryEntry(updateEntry) {
  const packageVersion = typeof updateEntry.package_version === 'string'
    ? updateEntry.package_version.trim()
    : '';
  return packageVersion.endsWith('-unreleased');
}

export function resolveVersionType(requestedType) {
  if (!requestedType) {
    throw new Error('バージョンタイプを指定してください（patch|minor|major|auto）');
  }

  if (!INPUT_VERSION_TYPES[requestedType]) {
    throw new Error(`無効なバージョンタイプ: ${requestedType}`);
  }

  if (requestedType !== 'auto') {
    return {
      requestedType,
      resolvedType: requestedType,
      mode: 'manual',
    };
  }

  const latestUpdate = loadLatestUpdateEntry();
  const changeCounts = getChangeCounts(latestUpdate);
  const hasPendingUnreleasedUpdate = isUnreleasedHistoryEntry(latestUpdate);
  const resolvedType = hasPendingUnreleasedUpdate && changeCounts.total > 0
    ? VERSION_TYPES.minor
    : VERSION_TYPES.patch;
  const autoReason = hasPendingUnreleasedUpdate
    ? 'latest update-history entry is unreleased'
    : 'latest update-history entry is already released';

  return {
    requestedType,
    resolvedType,
    mode: 'auto',
    latestUpdate,
    changeCounts,
    hasPendingUnreleasedUpdate,
    autoReason,
  };
}

/**
 * セマンティックバージョンをインクリメントする
 * @param {string} version - 現在のバージョン (例: "0.1.6" または "0.1.6-unreleased")
 * @param {string} type - インクリメントタイプ ("patch", "minor", "major")
 * @param {boolean} hasUnreleased - unreleased状態かどうか
 * @returns {string} - 新しいバージョン
 */
function incrementVersion(version, type, hasUnreleased = false) {
  // unreleasedサフィックスを削除
  const cleanVersion = version.replace('-unreleased', '');
  
  // unreleased状態の場合はサフィックスを削除するだけでリリース
  if (hasUnreleased && version.endsWith('-unreleased')) {
    return cleanVersion;
  }
  
  // 通常のバージョンアップ
  const parts = cleanVersion.split('.').map(Number);
  
  switch (type) {
    case 'major':
      parts[0] += 1;
      parts[1] = 0;
      parts[2] = 0;
      break;
    case 'minor':
      parts[1] += 1;
      parts[2] = 0;
      break;
    case 'patch':
      parts[2] += 1;
      break;
    default:
      throw new Error(`無効なバージョンタイプ: ${type}`);
  }
  
  return parts.join('.');
}

/**
 * 指定されたパッケージのバージョンを更新する
 * @param {string} packagePath - package.jsonのパス
 * @param {string} newVersion - 新しいバージョン
 */
function updatePackageVersion(packagePath, newVersion) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const oldVersion = packageJson.version;
    
    packageJson.version = newVersion;
    
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
    
    console.log(`✓ ${path.basename(path.dirname(packagePath))}: ${oldVersion} → ${newVersion}`);
  } catch (error) {
    console.error(`❌ ${packagePath} の更新に失敗:`, error.message);
    process.exit(1);
  }
}

/**
 * 全パッケージのバージョンを取得し、統一されているかチェックする
 * @returns {Object} - バージョン情報
 */
export function getCurrentVersionInfo() {
  const packageDirs = fs.readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  const versions = new Set();
  let hasUnreleased = false;
  
  for (const dir of packageDirs) {
    const packagePath = path.join(PACKAGES_DIR, dir, 'package.json');
    if (fs.existsSync(packagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const version = packageJson.version;
      versions.add(version);
      
      if (version && version.endsWith('-unreleased')) {
        hasUnreleased = true;
      }
    }
  }
  
  if (versions.size > 1) {
    console.warn('⚠️  パッケージ間でバージョンが統一されていません:');
    console.warn('   バージョン:', Array.from(versions).join(', '));
  }
  
  const currentVersion = Array.from(versions)[0];
  
  return {
    version: currentVersion,
    hasUnreleased: hasUnreleased,
    allVersions: Array.from(versions)
  };
}

/**
 * update-history.json の最新エントリのpackage_versionを更新
 */
async function updateHistoryVersions(newVersion) {
  const historyPath = path.join(SCRIPT_DIR, '../metadata/update-history.json');
  const packageHistoryPath = path.join(SCRIPT_DIR, '../packages/metadata/update-history.json');
  
  for (const filePath of [historyPath, packageHistoryPath]) {
    try {
      if (!fs.existsSync(filePath)) {
        console.log(`History file not found: ${filePath}`);
        continue;
      }
      
      const data = await readFile(filePath, 'utf8');
      const history = JSON.parse(data);
      
      if (history.updates && history.updates.length > 0) {
        const latestUpdate = history.updates[0];
        
        // package_versionがunreleasedサフィックス付きの場合のみ更新
        if (latestUpdate.package_version && latestUpdate.package_version.endsWith('-unreleased')) {
          const oldVersion = latestUpdate.package_version;
          latestUpdate.package_version = newVersion;
          
          await writeFile(filePath, JSON.stringify(history, null, 2));
          console.log(`📝 Updated history version: ${oldVersion} → ${newVersion}`);
        } else {
          console.log(`📝 History version already released: ${latestUpdate.package_version}`);
        }
      }
    } catch (error) {
      console.warn(`⚠️ Failed to update history file ${filePath}:`, error.message);
    }
  }
}

/**
 * 全パッケージのバージョンを更新する
 * @param {string} versionType - バージョンタイプ
 */
async function bumpAllPackages(versionType) {
  const decision = resolveVersionType(versionType);
  const resolvedVersionType = decision.resolvedType;

  if (decision.mode === 'auto') {
    const c = decision.changeCounts;
    console.log('🔎 リリースタイプ自動判定:');
    console.log(`   latest update timestamp: ${decision.latestUpdate.timestamp || 'unknown'}`);
    console.log(`   latest update package_version: ${decision.latestUpdate.package_version || 'unknown'}`);
    console.log(`   status: ${decision.autoReason}`);
    console.log(`   added=${c.added}, updated=${c.updated}, removed=${c.removed}, total=${c.total}`);
    console.log(`   decision: ${resolvedVersionType}`);
  } else {
    console.log(`🔎 リリースタイプ指定: ${resolvedVersionType} (manual override)`);
  }
  
  const versionInfo = getCurrentVersionInfo();
  if (!versionInfo.version) {
    console.error('❌ 現在のバージョンを取得できませんでした');
    process.exit(1);
  }
  
  const currentVersion = versionInfo.version;
  const newVersion = incrementVersion(currentVersion, resolvedVersionType, versionInfo.hasUnreleased);
  
  // unreleasedの状態を表示
  if (versionInfo.hasUnreleased) {
    console.log('📦 Unreleased状態のパッケージが検出されました');
    console.log(`   ${currentVersion} → ${newVersion} としてリリースします\n`);
  } else {
    console.log(`バージョンを ${currentVersion} → ${newVersion} に更新します\n`);
  }
  
  // パッケージディレクトリ内の全パッケージを更新
  const packageDirs = fs.readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  for (const dir of packageDirs) {
    const packagePath = path.join(PACKAGES_DIR, dir, 'package.json');
    if (fs.existsSync(packagePath)) {
      updatePackageVersion(packagePath, newVersion);
    }
  }
  
  if (versionInfo.hasUnreleased) {
    console.log(`\n✅ Unreleased状態を解除し、バージョンを ${newVersion} に更新しました`);
  } else {
    console.log(`\n✅ 全パッケージのバージョンを ${newVersion} に更新しました`);
  }
  
  // update-history.json の最新エントリを更新
  console.log('\n📝 Updating release history...');
  await updateHistoryVersions(newVersion);
  
  console.log('\n次の手順:');
  console.log('  - PR準備: pnpm run release:prepare -- --type=auto');
  console.log('  - ローカル公開: pnpm run release');
}

// メイン実行
function main() {
  let requestedType;
  let showHelp;

  try {
    ({ requestedType, showHelp } = parseArgs(process.argv.slice(2)));
  } catch (error) {
    console.error(`❌ ${error.message}`);
    printHelp();
    process.exit(1);
  }

  if (showHelp) {
    printHelp();
    return;
  }

  if (!requestedType) {
    console.error('❌ バージョンタイプを指定してください（patch|minor|major|auto）');
    printHelp();
    process.exit(1);
  }
  
  bumpAllPackages(requestedType).catch(error => {
    console.error('❌ バージョン更新中にエラーが発生しました:', error.message);
    process.exit(1);
  });
}

if (isMain(import.meta.url)) {
  main();
}
