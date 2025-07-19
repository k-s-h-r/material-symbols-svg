#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// パッケージディレクトリのパス
const PACKAGES_DIR = path.join(__dirname, '../packages');
const ROOT_PACKAGE_JSON = path.join(__dirname, '../package.json');

// バージョンタイプの定義
const VERSION_TYPES = {
  patch: 'patch',
  minor: 'minor',
  major: 'major'
};

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
function getCurrentVersionInfo() {
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
 * 全パッケージのバージョンを更新する
 * @param {string} versionType - バージョンタイプ
 */
function bumpAllPackages(versionType) {
  if (!VERSION_TYPES[versionType]) {
    console.error(`❌ 無効なバージョンタイプ: ${versionType}`);
    console.error('使用可能なタイプ: patch, minor, major');
    process.exit(1);
  }
  
  const versionInfo = getCurrentVersionInfo();
  if (!versionInfo.version) {
    console.error('❌ 現在のバージョンを取得できませんでした');
    process.exit(1);
  }
  
  const currentVersion = versionInfo.version;
  const newVersion = incrementVersion(currentVersion, versionType, versionInfo.hasUnreleased);
  
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
  
  console.log(`\n次のコマンドで公開できます:`);
  console.log(`  pnpm run publish-packages`);
}

// メイン実行
function main() {
  const versionType = process.argv[2];
  
  if (!versionType) {
    console.error('❌ バージョンタイプを指定してください');
    console.error('使用方法: node bump-version.cjs <patch|minor|major>');
    console.error('');
    console.error('例:');
    console.error('  node bump-version.cjs patch  # 0.1.6 → 0.1.7');
    console.error('  node bump-version.cjs minor  # 0.1.6 → 0.2.0');
    console.error('  node bump-version.cjs major  # 0.1.6 → 1.0.0');
    process.exit(1);
  }
  
  bumpAllPackages(versionType);
}

if (require.main === module) {
  main();
}

module.exports = { incrementVersion, updatePackageVersion, bumpAllPackages, getCurrentVersionInfo };