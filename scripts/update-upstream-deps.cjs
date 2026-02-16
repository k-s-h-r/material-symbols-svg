#!/usr/bin/env node
/**
 * このスクリプトの役割:
 * - @material-symbols/svg-100〜700 の依存バージョンを一括更新する
 * - 既定では npm の latest を取得し、--version で固定値更新も可能
 *
 * 関連ファイル:
 * - /package.json
 * - /scripts/sync-dependencies.cjs
 * - /scripts/update-metadata.cjs
 *
 * 実行元:
 * - package.json: update:upstream-deps
 * - package.json: update:icons:auto（内部で update:upstream-deps を実行）
 * - .github/workflows/icon-update.yml
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const TARGET_WEIGHTS = [100, 200, 300, 400, 500, 600, 700];
const TARGET_PACKAGES = TARGET_WEIGHTS.map((weight) => `@material-symbols/svg-${weight}`);
const PACKAGE_JSON_PATH = path.join(__dirname, '../package.json');

function printHelp() {
  console.log('Usage: pnpm run update:upstream-deps [-- --version=x.y.z]');
  console.log('');
  console.log('Options:');
  console.log('  --version=x.y.z   Update to the specified upstream version');
  console.log('  --version x.y.z   Same as above');
  console.log('  -h, --help        Show this help');
}

function parseArgs(argv) {
  let specifiedVersion = null;
  let showHelp = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--') {
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      showHelp = true;
      continue;
    }

    if (arg.startsWith('--version=')) {
      specifiedVersion = arg.slice('--version='.length).trim();
      continue;
    }

    if (arg === '--version') {
      specifiedVersion = (argv[i + 1] || '').trim();
      i++;
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  return { specifiedVersion, showHelp };
}

function assertValidVersion(version) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error(`Invalid version "${version}". Expected format: x.y.z`);
  }
}

function resolveLatestVersion() {
  const result = spawnSync('npm', ['view', '@material-symbols/svg-100', 'version'], {
    encoding: 'utf8',
  });

  if (result.error) {
    throw new Error(`Failed to execute npm view: ${result.error.message}`);
  }

  if (result.status !== 0) {
    const message = result.stderr.trim() || result.stdout.trim() || `exit code ${result.status}`;
    throw new Error(`Failed to fetch latest upstream version: ${message}`);
  }

  const latestVersion = result.stdout.trim();
  assertValidVersion(latestVersion);

  return latestVersion;
}

function loadPackageJson() {
  const raw = fs.readFileSync(PACKAGE_JSON_PATH, 'utf8');
  return JSON.parse(raw);
}

function savePackageJson(packageJson) {
  fs.writeFileSync(PACKAGE_JSON_PATH, `${JSON.stringify(packageJson, null, 2)}\n`);
}

function updateDependencies(packageJson, targetVersion) {
  if (!packageJson.dependencies) {
    packageJson.dependencies = {};
  }

  const targetRange = `^${targetVersion}`;
  const changes = [];

  for (const packageName of TARGET_PACKAGES) {
    const before = packageJson.dependencies[packageName] || '(missing)';
    const after = targetRange;

    if (before !== after) {
      packageJson.dependencies[packageName] = after;
      changes.push({ packageName, before, after });
    }
  }

  return changes;
}

function logCurrentVersions(packageJson) {
  console.log('Current dependency versions:');
  for (const packageName of TARGET_PACKAGES) {
    const version = packageJson.dependencies?.[packageName] || '(missing)';
    console.log(`  ${packageName}: ${version}`);
  }
}

function updateUpstreamDeps(argv = process.argv.slice(2)) {
  const { specifiedVersion, showHelp } = parseArgs(argv);

  if (showHelp) {
    printHelp();
    return 0;
  }

  let targetVersion = specifiedVersion;
  if (targetVersion) {
    assertValidVersion(targetVersion);
    console.log(`Using specified upstream version: ${targetVersion}`);
  } else {
    console.log('Resolving latest upstream version from npm...');
    targetVersion = resolveLatestVersion();
    console.log(`Latest upstream version: ${targetVersion}`);
  }

  const packageJson = loadPackageJson();
  logCurrentVersions(packageJson);

  const changes = updateDependencies(packageJson, targetVersion);

  if (changes.length === 0) {
    console.log('\nNo changes required. package.json is already up to date.');
    return 0;
  }

  savePackageJson(packageJson);

  console.log('\nUpdated dependencies:');
  for (const change of changes) {
    console.log(`  ${change.packageName}: ${change.before} -> ${change.after}`);
  }
  console.log(`\nUpdated ${changes.length} dependencies to ^${targetVersion}`);

  return 0;
}

if (require.main === module) {
  try {
    const code = updateUpstreamDeps();
    process.exit(code);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}
