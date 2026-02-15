#!/usr/bin/env node
/**
 * このスクリプトの役割:
 * - release:prepare 後のローカル公開工程（build/commit/tag/push/Release/publish）を実行する
 * - バージョン判定・bump・CHANGELOG確定は行わない（release:prepare 側で実施）
 * - タグpush起点の GitHub Actions リリース（.github/workflows/release.yml）からは直接呼ばれない
 *
 * 関連ファイル:
 * - /scripts/prepare-release.cjs
 * - /scripts/release-publish.cjs
 * - /scripts/bump-version.cjs
 * - /CHANGELOG.md
 * - /packages/<package>/package.json
 *
 * 実行元:
 * - package.json: release
 * - 手動: node scripts/release.cjs [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { getCurrentVersionInfo } = require('./bump-version.cjs');

const ROOT_DIR = path.join(__dirname, '..');
const CHANGELOG_PATH = path.join(ROOT_DIR, 'CHANGELOG.md');
const ROOT_PACKAGE_PATH = path.join(ROOT_DIR, 'package.json');
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages');
const REQUIRED_COMMANDS = ['git', 'gh', 'npm', 'pnpm'];

function printHelp() {
  console.log('Usage:');
  console.log('  pnpm run release [-- --dry-run]');
  console.log('');
  console.log('Options:');
  console.log('  --dry-run  Show execution plan without side effects');
  console.log('  -h, --help Show help');
}

function parseArgs(argv) {
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

    throw new Error(`Unknown option: ${arg}`);
  }

  return {
    dryRun,
    showHelp,
  };
}

function runCommand({
  command,
  args,
  step,
  dryRun = false,
  captureOutput = false,
  cwd = ROOT_DIR,
}) {
  const commandText = `${command} ${args.join(' ')}`.trim();

  if (dryRun) {
    console.log(`[dry-run] ${commandText}`);
    return { status: 0, stdout: '', stderr: '' };
  }

  const result = spawnSync(command, args, {
    cwd,
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

function commandExists(command) {
  const result = spawnSync('sh', ['-lc', `command -v ${command}`], {
    cwd: ROOT_DIR,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  return result.status === 0;
}

function ensureRequiredCommands() {
  const missing = REQUIRED_COMMANDS.filter((command) => !commandExists(command));
  if (missing.length > 0) {
    throw new Error(`Missing required commands: ${missing.join(', ')}`);
  }
}

function getCurrentBranch() {
  const result = runCommand({
    command: 'git',
    args: ['rev-parse', '--abbrev-ref', 'HEAD'],
    step: 'preflight',
    captureOutput: true,
  });

  const currentBranch = (result.stdout || '').trim();
  if (!currentBranch || currentBranch === 'HEAD') {
    throw new Error('Release must run on a branch (detached HEAD is not supported).');
  }
  return currentBranch;
}

function ensureAuth() {
  runCommand({
    command: 'gh',
    args: ['auth', 'status'],
    step: 'preflight',
    captureOutput: true,
  });
  runCommand({
    command: 'npm',
    args: ['whoami'],
    step: 'preflight',
    captureOutput: true,
  });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeVersion(version) {
  return String(version).replace('-unreleased', '');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function trimBlankEdges(lines) {
  const output = lines.slice();
  while (output.length > 0 && output[0].trim() === '') output.shift();
  while (output.length > 0 && output[output.length - 1].trim() === '') output.pop();
  return output;
}

function findLineIndex(lines, pattern) {
  return lines.findIndex((line) => pattern.test(line));
}

function getRepositoryHttpsUrl() {
  const rootPackage = readJson(ROOT_PACKAGE_PATH);
  const repositoryUrl = (rootPackage.repository && rootPackage.repository.url) || '';
  if (!repositoryUrl) {
    throw new Error('repository.url is missing in package.json');
  }
  return repositoryUrl.replace(/^git\+/, '').replace(/\.git$/, '');
}

function updateChangelog({
  newVersion,
  previousVersion,
  dryRun,
}) {
  const content = fs.readFileSync(CHANGELOG_PATH, 'utf8');
  const lines = content.split('\n');

  const unreleasedIndex = findLineIndex(lines, /^## \[Unreleased\]$/);
  if (unreleasedIndex < 0) {
    throw new Error('CHANGELOG.md is missing "## [Unreleased]" section');
  }

  let nextSectionIndex = -1;
  for (let i = unreleasedIndex + 1; i < lines.length; i++) {
    if (/^## \[/.test(lines[i])) {
      nextSectionIndex = i;
      break;
    }
  }
  if (nextSectionIndex < 0) {
    throw new Error('Failed to locate next changelog section after Unreleased');
  }

  const unreleasedBody = trimBlankEdges(lines.slice(unreleasedIndex + 1, nextSectionIndex));
  const releaseDate = new Date().toISOString().slice(0, 10);
  const replacement = [
    '## [Unreleased]',
    '',
    `## [${newVersion}] - ${releaseDate}`,
  ];
  if (unreleasedBody.length > 0) {
    replacement.push('', ...unreleasedBody);
  }
  replacement.push('');
  lines.splice(unreleasedIndex, nextSectionIndex - unreleasedIndex, ...replacement);

  const repoUrl = getRepositoryHttpsUrl();
  const unreleasedRefIndex = findLineIndex(lines, /^\[Unreleased\]: /);
  if (unreleasedRefIndex < 0) {
    throw new Error('CHANGELOG.md is missing [Unreleased] reference link');
  }

  const releaseRefLine = `[${newVersion}]: ${repoUrl}/compare/v${previousVersion}...v${newVersion}`;
  lines[unreleasedRefIndex] = `[Unreleased]: ${repoUrl}/compare/v${newVersion}...HEAD`;

  const existingReleaseRefIndex = findLineIndex(
    lines,
    new RegExp(`^\\[${escapeRegExp(newVersion)}\\]: `),
  );
  if (existingReleaseRefIndex >= 0) {
    lines[existingReleaseRefIndex] = releaseRefLine;
  } else {
    lines.splice(unreleasedRefIndex + 1, 0, releaseRefLine);
  }

  const newContent = `${lines.join('\n').replace(/\n{3,}/g, '\n\n').replace(/\s*$/, '')}\n`;
  const notes = extractReleaseNotes(newContent, newVersion);

  if (dryRun) {
    console.log(`[dry-run] would update CHANGELOG.md for v${newVersion} (${releaseDate})`);
  } else {
    fs.writeFileSync(CHANGELOG_PATH, newContent);
  }

  return { notes };
}

function extractReleaseNotes(changelogContent, version) {
  const escapedVersion = escapeRegExp(version);
  const sectionPattern = new RegExp(
    `^## \\[${escapedVersion}\\] - .*\\n([\\s\\S]*?)(?=^## \\[|^\\[Unreleased\\]:|$)`,
    'm',
  );
  const match = changelogContent.match(sectionPattern);
  if (!match) {
    return `Release v${version}`;
  }
  const notes = (match[1] || '').trim();
  return notes.length > 0 ? notes : `Release v${version}`;
}

function assertTagNotExists(tagName) {
  const result = runCommand({
    command: 'git',
    args: ['tag', '--list', tagName],
    step: 'tag-guard',
    captureOutput: true,
  });

  if ((result.stdout || '').trim() === tagName) {
    throw new Error(`Tag already exists locally: ${tagName}`);
  }
}

function assertRemoteTagNotExists(tagName) {
  const result = runCommand({
    command: 'git',
    args: ['ls-remote', '--tags', 'origin', `refs/tags/${tagName}`],
    step: 'tag-guard',
    captureOutput: true,
  });

  if ((result.stdout || '').trim().length > 0) {
    throw new Error(`Tag already exists on origin: ${tagName}`);
  }
}

function assertGitHubReleaseNotExists(tagName) {
  const result = spawnSync('gh', ['release', 'view', tagName, '--json', 'tagName'], {
    cwd: ROOT_DIR,
    encoding: 'utf8',
    stdio: 'pipe',
  });

  if (result.status === 0) {
    throw new Error(`GitHub Release already exists: ${tagName}`);
  }

  const output = `${result.stderr || ''}\n${result.stdout || ''}`;
  if (/not found|HTTP 404|release\s+not\s+found/i.test(output)) {
    return;
  }

  throw new Error(`[github-release-guard] failed to verify release ${tagName}: ${output.trim() || `exit code ${result.status}`}`);
}

function getPublishablePackageNames() {
  const names = [];
  const entries = fs.readdirSync(PACKAGES_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const packageJsonPath = path.join(PACKAGES_DIR, entry.name, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      continue;
    }

    const packageJson = readJson(packageJsonPath);
    if (packageJson.private) {
      continue;
    }

    if (typeof packageJson.name === 'string' && packageJson.name.trim()) {
      names.push(packageJson.name.trim());
    }
  }

  return names.sort();
}

function queryNpmPublishedVersion(packageName) {
  const result = spawnSync('npm', ['view', packageName, 'version', '--json'], {
    cwd: ROOT_DIR,
    encoding: 'utf8',
    stdio: 'pipe',
  });

  if (result.status !== 0) {
    const output = `${result.stderr || ''}\n${result.stdout || ''}`;
    if (/E404|404 Not Found|is not in this registry/i.test(output)) {
      return null;
    }

    throw new Error(`[publish-guard] failed to query npm for ${packageName}: ${output.trim() || `exit code ${result.status}`}`);
  }

  const raw = (result.stdout || '').trim();
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.length > 0 ? String(parsed[parsed.length - 1]) : null;
    }
    return String(parsed);
  } catch {
    return raw.replace(/^"|"$/g, '');
  }
}

function assertVersionNotPublished(targetVersion) {
  const published = [];
  const packages = getPublishablePackageNames();

  for (const packageName of packages) {
    const publishedVersion = queryNpmPublishedVersion(packageName);
    if (publishedVersion === targetVersion) {
      published.push(packageName);
    }
  }

  if (published.length > 0) {
    throw new Error(`Version ${targetVersion} is already published on npm for: ${published.join(', ')}`);
  }
}

function assertReleaseGuards(version) {
  const tagName = `v${version}`;
  assertTagNotExists(tagName);
  assertRemoteTagNotExists(tagName);
  assertGitHubReleaseNotExists(tagName);
  assertVersionNotPublished(version);
}

function hasWorkingTreeChanges() {
  const result = runCommand({
    command: 'git',
    args: ['status', '--porcelain'],
    step: 'detect-diff',
    captureOutput: true,
  });

  return (result.stdout || '').trim().length > 0;
}

function hasStagedChanges() {
  const result = spawnSync('git', ['diff', '--cached', '--quiet'], {
    cwd: ROOT_DIR,
    encoding: 'utf8',
    stdio: 'pipe',
  });

  if (result.status === 0) {
    return false;
  }

  if (result.status === 1) {
    return true;
  }

  const output = `${result.stderr || ''}\n${result.stdout || ''}`.trim();
  throw new Error(`Failed to detect staged changes: ${output || `exit code ${result.status}`}`);
}

function printRecoveryGuide(state) {
  console.log('');
  console.log('Recovery steps:');
  console.log('1. Review repository state: git status --short');

  if (!state.tagCreated) {
    console.log(`2. Create tag manually: git tag v${state.targetVersion}`);
  }
  if (!state.pushed) {
    const branch = state.currentBranch || '<current-branch>';
    console.log(`3. Push release branch/tag: git push origin ${branch} && git push origin v${state.targetVersion}`);
  }
  if (!state.githubReleaseCreated) {
    console.log(`4. Create GitHub release and publish: pnpm run release:publish -- --tag=v${state.targetVersion}`);
  }
  if (!state.packagesPublished && state.githubReleaseCreated) {
    console.log('5. Publish packages manually: pnpm run publish-packages');
  }
}

function resolveReleaseVersion() {
  const versionInfo = getCurrentVersionInfo();

  if (!versionInfo.version) {
    throw new Error('Failed to determine current package version');
  }

  if (versionInfo.hasUnreleased) {
    throw new Error('Current package version is still -unreleased. Run pnpm run release:prepare first.');
  }

  const version = normalizeVersion(versionInfo.version);
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error(`Invalid package version for release: ${versionInfo.version}`);
  }

  return version;
}

function runRelease(options) {
  const state = {
    commitCreated: false,
    tagCreated: false,
    pushed: false,
    githubReleaseCreated: false,
    packagesPublished: false,
    targetVersion: null,
    currentBranch: null,
  };

  const totalSteps = 6;
  const stepLabel = (index, title) => `\n[${index}/${totalSteps}] ${title}`;

  try {
    console.log(`Starting release finalize${options.dryRun ? ' (dry-run)' : ''}...`);

    console.log(stepLabel(1, 'Preflight checks'));
    ensureRequiredCommands();
    state.currentBranch = getCurrentBranch();
    ensureAuth();
    console.log(`release branch: ${state.currentBranch}`);
    console.log('✔ preflight checks passed');

    console.log(stepLabel(2, 'Resolve target version'));
    state.targetVersion = resolveReleaseVersion();
    console.log(`target release version: ${state.targetVersion}`);
    if (hasWorkingTreeChanges()) {
      console.log('working tree has local changes: they will be included in release commit');
    } else {
      console.log('working tree is clean: continuing (for rerun/recovery flow)');
    }

    console.log(stepLabel(3, 'Verify duplicate-release guards'));
    assertReleaseGuards(state.targetVersion);
    console.log('✔ tag/release/npm guards passed');

    console.log(stepLabel(4, 'Build and commit release changes'));
    runCommand({
      command: 'pnpm',
      args: ['run', 'build'],
      step: 'build',
      dryRun: options.dryRun,
    });

    runCommand({
      command: 'git',
      args: ['add', '-A'],
      step: 'commit',
      dryRun: options.dryRun,
    });

    if (options.dryRun || hasStagedChanges()) {
      runCommand({
        command: 'git',
        args: ['commit', '-m', `release: v${state.targetVersion}`],
        step: 'commit',
        dryRun: options.dryRun,
      });
      state.commitCreated = true;
    } else {
      console.log('No staged changes after build. Skip commit step.');
    }

    console.log(stepLabel(5, 'Create and push git tag'));
    runCommand({
      command: 'git',
      args: ['tag', `v${state.targetVersion}`],
      step: 'tag',
      dryRun: options.dryRun,
    });
    state.tagCreated = true;

    runCommand({
      command: 'git',
      args: ['push', 'origin', state.currentBranch],
      step: 'push',
      dryRun: options.dryRun,
    });
    runCommand({
      command: 'git',
      args: ['push', 'origin', `v${state.targetVersion}`],
      step: 'push',
      dryRun: options.dryRun,
    });
    state.pushed = true;

    console.log(stepLabel(6, 'Create GitHub Release and publish packages'));
    const publishArgs = ['scripts/release-publish.cjs', `--tag=v${state.targetVersion}`];
    if (options.dryRun) {
      publishArgs.push('--dry-run');
    }

    runCommand({
      command: 'node',
      args: publishArgs,
      step: 'publish',
      dryRun: false,
    });
    state.githubReleaseCreated = true;
    state.packagesPublished = true;

    console.log(`\n✅ Release ${options.dryRun ? 'plan verified' : 'completed'}: v${state.targetVersion}`);
    if (options.dryRun) {
      console.log('No files or remote resources were modified.');
    }
  } catch (error) {
    console.error(`\n❌ Release failed: ${error.message}`);
    if (state.targetVersion) {
      printRecoveryGuide(state);
    }
    process.exit(1);
  }
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

  runRelease(options);
}

if (require.main === module) {
  main();
}

module.exports = {
  updateChangelog,
  extractReleaseNotes,
};
