#!/usr/bin/env node
/**
 * このスクリプトの役割:
 * - リリース公開前の準備（version bump + CHANGELOG 確定）を実行する
 * - build / tag / publish は行わない（PR作成前の差分準備専用）
 * - GitHub Actions では GITHUB_OUTPUT に判定結果（release_type など）を出力する
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
const { getCurrentVersionInfo, resolveVersionType } = require('./bump-version.cjs');
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
    stdio: 'pipe',
  });

  if (result.error) {
    throw new Error(`[${step}] command failed: ${command} ${args.join(' ')}\n${result.error.message}`);
  }

  if (result.status !== 0) {
    const stderr = (result.stderr || '').trim();
    const stdout = (result.stdout || '').trim();
    const output = stderr || stdout || `exit code ${result.status}`;
    throw new Error(`[${step}] command failed: ${command} ${args.join(' ')}\n${output}`);
  }

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  return (result.stdout || '').trim();
}

function appendGitHubOutput(name, value) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) {
    return;
  }

  const fs = require('fs');
  fs.appendFileSync(outputPath, `${name}=${String(value)}\n`);
}

function hasWorkingTreeChanges() {
  const output = runCommand('git', ['diff', '--name-only'], 'detect-diff');
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .length > 0;
}

function resolveReleaseType(requestedType) {
  const decision = resolveVersionType(requestedType);

  if (decision.mode !== 'auto') {
    return {
      effectiveType: decision.resolvedType,
      reason: 'manual override',
      decision,
    };
  }

  const counts = decision.changeCounts || { added: 0, updated: 0, removed: 0, total: 0 };
  const precondition = decision.autoReason || 'auto decision';

  return {
    effectiveType: decision.resolvedType,
    reason: `${precondition}; history change counts: added=${counts.added}, updated=${counts.updated}, removed=${counts.removed}`,
    decision,
  };
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

  if (!hasWorkingTreeChanges()) {
    console.log('No local changes detected. Skip release preparation.');
    appendGitHubOutput('has_changes', 'false');
    appendGitHubOutput('release_type', 'none');
    appendGitHubOutput('release_reason', 'no local changes');
    return;
  }

  const { effectiveType, reason } = resolveReleaseType(options.requestedType);

  const versionInfo = getCurrentVersionInfo();
  const previousVersion = normalizeVersion(versionInfo.version);
  if (!previousVersion) {
    throw new Error('Failed to determine current package version');
  }

  console.log(`Preparing release files with requestedType="${options.requestedType}" effectiveType="${effectiveType}"...`);
  console.log(`Release type reason: ${reason}`);
  console.log(`Current version: ${versionInfo.version}`);

  runCommand('node', ['scripts/bump-version.cjs', `--type=${effectiveType}`], 'bump');

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
  appendGitHubOutput('has_changes', 'true');
  appendGitHubOutput('release_type', effectiveType);
  appendGitHubOutput('release_reason', reason);
  appendGitHubOutput('previous_version', previousVersion);
  appendGitHubOutput('new_version', newVersion);
  appendGitHubOutput('release_tag', `v${newVersion}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}
