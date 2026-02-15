#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * このスクリプトの役割:
 * - ローカル/CI のリリース工程（判定/バージョン更新/CHANGELOG確定/ビルド/タグ/Release/publish）を一括実行する
 *
 * 関連ファイル:
 * - /scripts/bump-version.cjs
 * - /CHANGELOG.md
 * - /packages/<package>/package.json
 * - /metadata/update-history.json
 *
 * 実行元:
 * - package.json: release:local
 * - package.json: release:ci
 * - 手動: node scripts/release.cjs [--type=patch|minor|major|auto] [--dry-run] [--ci]
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const {
  incrementVersion,
  resolveVersionType,
  getCurrentVersionInfo,
} = require('./bump-version.cjs');

const ROOT_DIR = path.join(__dirname, '..');
const CHANGELOG_PATH = path.join(ROOT_DIR, 'CHANGELOG.md');
const ROOT_PACKAGE_PATH = path.join(ROOT_DIR, 'package.json');
const METADATA_PACKAGE_PATH = path.join(ROOT_DIR, 'packages/metadata/package.json');
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages');
const REQUIRED_COMMANDS = ['git', 'gh', 'npm', 'pnpm'];
const RELEASE_TYPES = ['patch', 'minor', 'major', 'auto'];

function printHelp() {
  console.log('Usage:');
  console.log('  pnpm run release:local [-- --type=patch|minor|major|auto] [--dry-run]');
  console.log('  pnpm run release:ci [-- --dry-run]');
  console.log('');
  console.log('Options:');
  console.log('  --type=patch|minor|major|auto  Release type (default: auto, local mode only)');
  console.log('  --type patch|minor|major|auto  Same as above');
  console.log('  --dry-run                      Show execution plan without side effects');
  console.log('  --ci                           CI mode (no bump/changelog commit/main push)');
  console.log('  -h, --help                     Show help');
}

function parseArgs(argv) {
  let requestedType = 'auto';
  let dryRun = false;
  let showHelp = false;
  let ci = false;

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

    if (arg === '--ci') {
      ci = true;
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

  if (ci && requestedType !== 'auto') {
    throw new Error('--type is not supported with --ci (version must already be prepared)');
  }

  return {
    requestedType,
    dryRun,
    showHelp,
    ci,
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

function ensureCleanWorkingTree({ reason = 'preflight' } = {}) {
  const result = runCommand({
    command: 'git',
    args: ['status', '--porcelain'],
    step: reason,
    captureOutput: true,
  });

  if ((result.stdout || '').trim().length > 0) {
    throw new Error('Working tree is not clean. Commit or stash changes before release.');
  }
}

function ensureMainBranch({ allowDetachedHead = false } = {}) {
  const result = runCommand({
    command: 'git',
    args: ['rev-parse', '--abbrev-ref', 'HEAD'],
    step: 'preflight',
    captureOutput: true,
  });

  const currentBranch = (result.stdout || '').trim();
  if (currentBranch === 'main') {
    return;
  }

  if (allowDetachedHead && currentBranch === 'HEAD') {
    const refName = (process.env.GITHUB_REF_NAME || '').trim();
    if (refName && refName !== 'main') {
      throw new Error(`Release must target main branch. Current GITHUB_REF_NAME: ${refName}`);
    }
    return;
  }

  throw new Error(`Release must run on main branch. Current branch: ${currentBranch}`);
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

function readCurrentMetadataPackageVersion() {
  const metadataPackage = readJson(METADATA_PACKAGE_PATH);
  return normalizeVersion(metadataPackage.version);
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

function readReleaseNotesForVersion(version) {
  const changelogContent = fs.readFileSync(CHANGELOG_PATH, 'utf8');
  return extractReleaseNotes(changelogContent, version);
}

function writeTempReleaseNotes(notes) {
  const filePath = path.join(os.tmpdir(), `material-symbols-release-${Date.now()}.md`);
  fs.writeFileSync(filePath, `${notes}\n`);
  return filePath;
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

function printRecoveryGuide(state) {
  console.log('');
  console.log('Recovery steps:');

  if (state.ciMode) {
    console.log('1. Confirm main branch and authentication: gh auth status / npm whoami');
    console.log(`2. Check duplicates: git tag --list v${state.newVersion || '<version>'}, gh release view v${state.newVersion || '<version>'}, npm view <package> version`);
    console.log('3. If duplicate publish already happened, skip rerun and verify package contents on npm.');
    console.log('4. Otherwise fix the cause and rerun: pnpm run release:ci');
    return;
  }

  if (!state.bumpCompleted) {
    console.log('1. Fix preflight issue and rerun: pnpm run release:local -- --type=<patch|minor|major|auto>');
    return;
  }

  console.log('1. Review changed files: git status --short');

  if (!state.commitCompleted) {
    console.log(`2. Build artifacts: pnpm run build`);
    console.log(`3. Commit release changes manually: git add -A && git commit -m "release: v${state.newVersion}"`);
    console.log(`4. Continue manually: git tag v${state.newVersion} && git push origin main && git push origin v${state.newVersion}`);
    console.log(`5. Create GitHub release and publish: gh release create v${state.newVersion} --title v${state.newVersion} --notes "<notes>" && pnpm run publish-packages`);
    return;
  }

  if (!state.tagCreated) {
    console.log(`2. Create tag manually: git tag v${state.newVersion}`);
  }
  if (!state.pushed) {
    console.log(`3. Push release branch/tag: git push origin main && git push origin v${state.newVersion}`);
  }
  if (!state.githubReleaseCreated) {
    console.log(`4. Create GitHub release: gh release create v${state.newVersion} --title v${state.newVersion} --notes "<notes>"`);
  }
  if (!state.packagesPublished) {
    console.log('5. Publish packages: pnpm run publish-packages');
  }
}

function runRelease(options) {
  const state = {
    ciMode: options.ci,
    bumpCompleted: false,
    commitCompleted: false,
    tagCreated: false,
    pushed: false,
    githubReleaseCreated: false,
    packagesPublished: false,
    requestedType: options.requestedType,
    resolvedType: null,
    newVersion: null,
    previousVersion: null,
  };

  const totalSteps = options.ci ? 6 : 9;
  const stepLabel = (index, title) => `\n[${index}/${totalSteps}] ${title}`;

  try {
    console.log(`Starting ${options.ci ? 'CI ' : ''}release${options.dryRun ? ' (dry-run)' : ''}...`);

    console.log(stepLabel(1, 'Preflight checks'));
    ensureRequiredCommands();
    ensureMainBranch({ allowDetachedHead: options.ci });
    if (!options.ci) {
      ensureCleanWorkingTree();
    }
    ensureAuth();
    console.log('✔ preflight checks passed');

    let notes;

    if (options.ci) {
      console.log(stepLabel(2, 'Load release version from repository'));
      state.newVersion = readCurrentMetadataPackageVersion();
      state.previousVersion = state.newVersion;
      state.resolvedType = 'ci';
      notes = readReleaseNotesForVersion(state.newVersion);
      console.log(`release version from repository: ${state.newVersion}`);

      console.log(stepLabel(3, 'Build release artifacts'));
      runCommand({
        command: 'pnpm',
        args: ['run', 'build'],
        step: 'build',
        dryRun: options.dryRun,
      });
      ensureCleanWorkingTree({ reason: 'build-check' });

      console.log(stepLabel(4, 'Verify duplicate-release guards'));
      assertReleaseGuards(state.newVersion);
      console.log('✔ tag/release/npm guards passed');

      const notesFilePath = writeTempReleaseNotes(notes);

      console.log(stepLabel(5, 'Create and push git tag'));
      runCommand({
        command: 'git',
        args: ['tag', `v${state.newVersion}`],
        step: 'tag',
        dryRun: options.dryRun,
      });
      state.tagCreated = true;
      runCommand({
        command: 'git',
        args: ['push', 'origin', `v${state.newVersion}`],
        step: 'push',
        dryRun: options.dryRun,
      });
      state.pushed = true;

      console.log(stepLabel(6, 'Create GitHub Release and publish packages'));
      runCommand({
        command: 'gh',
        args: [
          'release',
          'create',
          `v${state.newVersion}`,
          '--title',
          `v${state.newVersion}`,
          '--notes-file',
          notesFilePath,
        ],
        step: 'github-release',
        dryRun: options.dryRun,
      });
      state.githubReleaseCreated = true;

      runCommand({
        command: 'pnpm',
        args: ['run', 'publish-packages'],
        step: 'publish',
        dryRun: options.dryRun,
      });
      state.packagesPublished = true;
    } else {
      console.log(stepLabel(2, 'Resolve release type'));
      const decision = resolveVersionType(options.requestedType);
      state.resolvedType = decision.resolvedType;

      if (decision.mode === 'auto') {
        const c = decision.changeCounts;
        console.log(`auto decision from update-history: added=${c.added}, updated=${c.updated}, removed=${c.removed}, total=${c.total}`);
        console.log(`resolved type: ${state.resolvedType}`);
      } else {
        console.log(`manual override: ${state.resolvedType}`);
      }

      const currentVersionInfo = getCurrentVersionInfo();
      if (!currentVersionInfo.version) {
        throw new Error('Failed to determine current package version');
      }
      state.previousVersion = normalizeVersion(currentVersionInfo.version);
      state.newVersion = normalizeVersion(
        incrementVersion(currentVersionInfo.version, state.resolvedType, currentVersionInfo.hasUnreleased),
      );
      console.log(`version plan: ${state.previousVersion} -> ${state.newVersion}`);

      console.log(stepLabel(3, 'Bump package versions'));
      runCommand({
        command: 'node',
        args: ['scripts/bump-version.cjs', `--type=${state.resolvedType}`],
        step: 'bump',
        dryRun: options.dryRun,
      });
      state.bumpCompleted = true;
      if (!options.dryRun) {
        state.newVersion = readCurrentMetadataPackageVersion();
        console.log(`current version after bump: ${state.newVersion}`);
      }

      console.log(stepLabel(4, 'Finalize CHANGELOG'));
      const result = updateChangelog({
        newVersion: state.newVersion,
        previousVersion: state.previousVersion,
        dryRun: options.dryRun,
      });
      notes = result.notes;

      console.log(stepLabel(5, 'Build release artifacts'));
      runCommand({
        command: 'pnpm',
        args: ['run', 'build'],
        step: 'build',
        dryRun: options.dryRun,
      });

      console.log(stepLabel(6, 'Commit release changes'));
      runCommand({
        command: 'git',
        args: ['add', '-A'],
        step: 'commit',
        dryRun: options.dryRun,
      });
      runCommand({
        command: 'git',
        args: ['commit', '-m', `release: v${state.newVersion}`],
        step: 'commit',
        dryRun: options.dryRun,
      });
      state.commitCompleted = true;

      console.log(stepLabel(7, 'Verify duplicate-release guards'));
      assertReleaseGuards(state.newVersion);
      console.log('✔ tag/release/npm guards passed');

      const notesFilePath = writeTempReleaseNotes(notes);

      console.log(stepLabel(8, 'Create and push git tag'));
      runCommand({
        command: 'git',
        args: ['tag', `v${state.newVersion}`],
        step: 'tag',
        dryRun: options.dryRun,
      });
      state.tagCreated = true;
      runCommand({
        command: 'git',
        args: ['push', 'origin', 'main'],
        step: 'push',
        dryRun: options.dryRun,
      });
      runCommand({
        command: 'git',
        args: ['push', 'origin', `v${state.newVersion}`],
        step: 'push',
        dryRun: options.dryRun,
      });
      state.pushed = true;

      console.log(stepLabel(9, 'Create GitHub Release and publish packages'));
      runCommand({
        command: 'gh',
        args: [
          'release',
          'create',
          `v${state.newVersion}`,
          '--title',
          `v${state.newVersion}`,
          '--notes-file',
          notesFilePath,
        ],
        step: 'github-release',
        dryRun: options.dryRun,
      });
      state.githubReleaseCreated = true;

      runCommand({
        command: 'pnpm',
        args: ['run', 'publish-packages'],
        step: 'publish',
        dryRun: options.dryRun,
      });
      state.packagesPublished = true;
    }

    console.log(`\n✅ Release ${options.dryRun ? 'plan verified' : 'completed'}: v${state.newVersion}`);
    if (options.dryRun) {
      console.log('No files or remote resources were modified.');
    }
  } catch (error) {
    console.error(`\n❌ Release failed: ${error.message}`);
    printRecoveryGuide(state);
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
  parseArgs,
  runRelease,
  updateChangelog,
  extractReleaseNotes,
  assertReleaseGuards,
};
