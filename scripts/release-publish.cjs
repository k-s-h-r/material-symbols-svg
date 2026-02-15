#!/usr/bin/env node
/**
 * このスクリプトの役割:
 * - タグを基準に GitHub Release を作成/更新し、npm publish を実行する
 * - リリース公開処理（Release + publish）をローカル/CIで共通化する
 *
 * 関連ファイル:
 * - /CHANGELOG.md
 * - /scripts/release.cjs
 * - /package.json
 *
 * 実行元:
 * - package.json: release:publish
 * - scripts/release.cjs（内部で呼び出し）
 * - .github/workflows/release.yml
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { extractReleaseNotes } = require('./release.cjs');

const ROOT_DIR = path.join(__dirname, '..');
const CHANGELOG_PATH = path.join(ROOT_DIR, 'CHANGELOG.md');

function printHelp() {
  console.log('Usage:');
  console.log('  pnpm run release:publish -- --tag=vX.Y.Z [--dry-run]');
  console.log('');
  console.log('Options:');
  console.log('  --tag=vX.Y.Z   Release tag to publish (required)');
  console.log('  --tag vX.Y.Z   Same as above');
  console.log('  --dry-run      Show commands without side effects');
  console.log('  -h, --help     Show help');
}

function parseArgs(argv) {
  let tag = '';
  let dryRun = false;
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

    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }

    if (arg.startsWith('--tag=')) {
      tag = arg.slice('--tag='.length).trim();
      continue;
    }

    if (arg === '--tag') {
      tag = (argv[i + 1] || '').trim();
      i++;
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  if (!showHelp) {
    if (!tag) {
      throw new Error('--tag is required');
    }
    if (!/^v\d+\.\d+\.\d+$/.test(tag)) {
      throw new Error(`Invalid --tag value: ${tag}`);
    }
  }

  return {
    tag,
    dryRun,
    showHelp,
  };
}

function runCommand({ command, args, step, dryRun = false, captureOutput = false }) {
  const commandText = `${command} ${args.join(' ')}`.trim();

  if (dryRun) {
    console.log(`[dry-run] ${commandText}`);
    return { status: 0, stdout: '', stderr: '' };
  }

  const result = spawnSync(command, args, {
    cwd: ROOT_DIR,
    encoding: 'utf8',
    stdio: captureOutput ? 'pipe' : 'inherit',
  });

  if (result.error) {
    throw new Error(`[${step}] command failed: ${commandText}\n${result.error.message}`);
  }

  if (result.status !== 0) {
    const stderr = (result.stderr || '').trim();
    const stdout = (result.stdout || '').trim();
    const output = stderr || stdout || `exit code ${result.status}`;
    throw new Error(`[${step}] command failed: ${commandText}\n${output}`);
  }

  return result;
}

function writeTempReleaseNotes(notes) {
  const filePath = path.join(os.tmpdir(), `material-symbols-release-${Date.now()}.md`);
  fs.writeFileSync(filePath, `${notes}\n`);
  return filePath;
}

function releaseExists(tag) {
  const result = spawnSync('gh', ['release', 'view', tag, '--json', 'tagName'], {
    cwd: ROOT_DIR,
    encoding: 'utf8',
    stdio: 'pipe',
  });

  if (result.status === 0) {
    return true;
  }

  const output = `${result.stderr || ''}\n${result.stdout || ''}`;
  if (/not found|HTTP 404|release\s+not\s+found/i.test(output)) {
    return false;
  }

  throw new Error(`[github-release-check] failed to verify release ${tag}: ${output.trim() || `exit code ${result.status}`}`);
}

function runReleasePublish({ tag, dryRun }) {
  const version = tag.replace(/^v/, '');
  const changelog = fs.readFileSync(CHANGELOG_PATH, 'utf8');
  const notes = extractReleaseNotes(changelog, version);
  const notesFilePath = writeTempReleaseNotes(notes);

  console.log(`Release publish target: ${tag}${dryRun ? ' (dry-run)' : ''}`);

  if (dryRun) {
    runCommand({
      command: 'gh',
      args: ['release', 'create', tag, '--title', tag, '--notes-file', notesFilePath],
      step: 'github-release',
      dryRun: true,
    });
  } else if (releaseExists(tag)) {
    runCommand({
      command: 'gh',
      args: ['release', 'edit', tag, '--title', tag, '--notes-file', notesFilePath],
      step: 'github-release',
    });
  } else {
    runCommand({
      command: 'gh',
      args: ['release', 'create', tag, '--title', tag, '--notes-file', notesFilePath],
      step: 'github-release',
    });
  }

  runCommand({
    command: 'pnpm',
    args: ['run', 'publish-packages'],
    step: 'publish',
    dryRun,
  });

  console.log(`✅ Release publish ${dryRun ? 'plan verified' : 'completed'}: ${tag}`);
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    printHelp();
    process.exit(1);
  }

  if (options.showHelp) {
    printHelp();
    return;
  }

  try {
    runReleasePublish(options);
  } catch (error) {
    console.error(`\n❌ Release publish failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
