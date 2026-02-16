#!/usr/bin/env node
/**
 * このスクリプトの役割:
 * - ルート package.json の @material-symbols/svg-* 依存を各パッケージへ同期する
 *
 * 関連ファイル:
 * - /package.json
 * - /packages/<package>/package.json
 * - /scripts/update-upstream-deps.cjs
 *
 * 実行元:
 * - 各 packages/<package>/package.json の build / build:dev スクリプト
 * - 手動: node scripts/sync-dependencies.cjs
 */

const fs = require('fs');
const path = require('path');

/**
 * Sync @material-symbols/svg-* dependencies from root package.json to all packages
 */

function syncDependencies() {
  console.log('🔄 Syncing @material-symbols/svg-* dependencies to packages...');

  // Read root package.json
  const rootPackageJsonPath = path.join(__dirname, '../package.json');
  const rootPackageJson = JSON.parse(fs.readFileSync(rootPackageJsonPath, 'utf8'));
  
  // Extract @material-symbols/svg-* dependencies
  const materialSymbolsDeps = {};
  if (rootPackageJson.dependencies) {
    for (const [name, version] of Object.entries(rootPackageJson.dependencies)) {
      if (name.startsWith('@material-symbols/svg-')) {
        materialSymbolsDeps[name] = version;
      }
    }
  }
  
  if (Object.keys(materialSymbolsDeps).length === 0) {
    console.log('⚠️  No @material-symbols/svg-* dependencies found in root package.json');
    return;
  }
  
  console.log(`📦 Found ${Object.keys(materialSymbolsDeps).length} @material-symbols/svg-* dependencies:`);
  Object.entries(materialSymbolsDeps).forEach(([name, version]) => {
    console.log(`   ${name}: ${version}`);
  });

  // Update each package
  const packagesDir = path.join(__dirname, '../packages');
  const packageDirs = fs.readdirSync(packagesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  let updatedCount = 0;
  
  for (const packageDir of packageDirs) {
    const packageJsonPath = path.join(packagesDir, packageDir, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      continue;
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Initialize dependencies if it doesn't exist
    if (!packageJson.dependencies) {
      packageJson.dependencies = {};
    }
    
    // Update dependencies with @material-symbols/svg-* packages
    let hasChanges = false;
    for (const [name, version] of Object.entries(materialSymbolsDeps)) {
      if (packageJson.dependencies[name] !== version) {
        packageJson.dependencies[name] = version;
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      // Sort dependencies alphabetically
      const sortedDeps = {};
      Object.keys(packageJson.dependencies)
        .sort()
        .forEach(key => {
          sortedDeps[key] = packageJson.dependencies[key];
        });
      packageJson.dependencies = sortedDeps;
      
      // Write updated package.json
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
      console.log(`   ✅ Updated ${packageDir}/package.json`);
      updatedCount++;
    } else {
      console.log(`   ⏭️  ${packageDir}/package.json already up to date`);
    }
  }
  
  console.log(`\n🎉 Dependency sync completed! Updated ${updatedCount}/${packageDirs.length} packages`);
}

// Run if script is executed directly
if (require.main === module) {
  syncDependencies();
}
