#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * このスクリプトの役割:
 * - リリース公開前の準備（version bump + CHANGELOG 確定）を実行する
 *
 * 関連ファイル:
 * - /scripts/bump-version.cjs
 * - /scripts/release.cjs
 * - /CHANGELOG.md
 * - /packages/metadata/package.json
 *
 * 実行元:
 * - package.json: release:prepare
 * - .github/workflows/icon-update.yml
 */

const path = require('path');
const { spawnSync } = require('child_process');
const { getCurrentVersionInfo } = require('./bump-version.cjs');
const { updateChangelog } = require('./release.cjs');

const ROOT_DIR = path.join(__dirname, '..');
const RELEASE_TYPES = ['patch', 'minor', 'major', 'auto'];

function printHelp() {
  console.log('Usage: pnpm run release:prepare [-- --type=patch|minor|major|auto]');
  console.log('');
  console.log('Options:');
  console.log('  --type=patch|minor|major|auto  Release type (default: auto)');
  console.log('  --type patch|minor|major|auto  Same as above');
  console.log('  -h, --help                     Show help');
}

function parseArgs(argv) {
  let requestedType = 'auto';
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
      requestedType = arg.slice('--type='.length).trim();
      continue;
    }

    if (arg === '--type') {
      requestedType = (argv[i + 1] || '').trim();
      i++;
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  if (!RELEASE_TYPES.includes(requestedType)) {
    throw new Error(`Invalid --type value: ${requestedType}`);
  }

  return {
    requestedType,
    showHelp,
  };
}

function normalizeVersion(version) {
  return String(version || '').replace('-unreleased', '').trim();
}

function runCommand(command, args, step) {
  const result = spawnSync(command, args, {
    cwd: ROOT_DIR,
    encoding: 'utf8',
    stdio: 'inherit',
  });

  if (result.error) {
    throw new Error(`[${step}] command failed: ${command} ${args.join(' ')}\n${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(`[${step}] command failed: ${command} ${args.join(' ')}`);
  }
}

function main(argv = process.argv.slice(2)) {
  let options;
  try {
    options = parseArgs(argv);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    printHelp();
    process.exit(1);
  }

  if (options.showHelp) {
    printHelp();
    return;
  }

  const versionInfo = getCurrentVersionInfo();
  const previousVersion = normalizeVersion(versionInfo.version);
  if (!previousVersion) {
    throw new Error('Failed to determine current package version');
  }

  console.log(`Preparing release files with type="${options.requestedType}"...`);
  console.log(`Current version: ${versionInfo.version}`);

  runCommand('node', ['scripts/bump-version.cjs', `--type=${options.requestedType}`], 'bump');

  const nextVersionInfo = getCurrentVersionInfo();
  const newVersion = normalizeVersion(nextVersionInfo.version);
  if (!newVersion) {
    throw new Error('Failed to determine bumped package version');
  }

  updateChangelog({
    newVersion,
    previousVersion,
    dryRun: false,
  });

  console.log(`Prepared release: ${previousVersion} -> ${newVersion}`);
  console.log(`Next tag (manual): v${newVersion}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  parseArgs,
  normalizeVersion,
  main,
};
