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
 * @param {string} version - 現在のバージョン (例: "0.1.6")
 * @param {string} type - インクリメントタイプ ("patch", "minor", "major")
 * @returns {string} - 新しいバージョン
 */
function incrementVersion(version, type) {
  const parts = version.split('.').map(Number);
  
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
 * @returns {string} - 現在のバージョン
 */
function getCurrentVersion() {
  const packageDirs = fs.readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  const versions = new Set();
  
  for (const dir of packageDirs) {
    const packagePath = path.join(PACKAGES_DIR, dir, 'package.json');
    if (fs.existsSync(packagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      versions.add(packageJson.version);
    }
  }
  
  if (versions.size > 1) {
    console.warn('⚠️  パッケージ間でバージョンが統一されていません:');
    console.warn('   バージョン:', Array.from(versions).join(', '));
  }
  
  return Array.from(versions)[0];
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
  
  const currentVersion = getCurrentVersion();
  if (!currentVersion) {
    console.error('❌ 現在のバージョンを取得できませんでした');
    process.exit(1);
  }
  
  const newVersion = incrementVersion(currentVersion, versionType);
  
  console.log(`バージョンを ${currentVersion} → ${newVersion} に更新します\n`);
  
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
  
  console.log(`\n✅ 全パッケージのバージョンを ${newVersion} に更新しました`);
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

module.exports = { incrementVersion, updatePackageVersion, bumpAllPackages };