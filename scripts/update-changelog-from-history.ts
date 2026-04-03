#!/usr/bin/env node
/**
 * This script populates CHANGELOG.md's Unreleased section from the latest
 * metadata/update-history.json entry. It is intended for the automated weekly
 * icon update workflow before release:prepare finalizes the versioned section.
 */

import fs from 'node:fs';
import path from 'node:path';
import { isMain } from './utils/is-main.ts';
import { dirnameFromImportMeta } from './utils/module-path.ts';

const SCRIPT_DIR = dirnameFromImportMeta(import.meta.url);
const DEFAULT_CHANGELOG_PATH = path.join(SCRIPT_DIR, '../CHANGELOG.md');
const DEFAULT_HISTORY_PATH = path.join(SCRIPT_DIR, '../metadata/update-history.json');

type ParsedArgs = {
  changelogPath: string;
  historyPath: string;
  allowReleased: boolean;
  dryRun: boolean;
};

type HistoryUpdateEntry = {
  package_version?: string;
  material_symbols_version_from?: string;
  material_symbols_version_to?: string;
  material_symbols_version?: string;
  added?: string[];
  updated?: string[];
  removed?: string[];
};

const AUTO_SECTION_START = '<!-- weekly-icon-update:start -->';
const AUTO_SECTION_END = '<!-- weekly-icon-update:end -->';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    changelogPath: DEFAULT_CHANGELOG_PATH,
    historyPath: DEFAULT_HISTORY_PATH,
    allowReleased: false,
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--') {
      continue;
    }

    if (argument === '--allow-released') {
      parsed.allowReleased = true;
      continue;
    }

    if (argument === '--dry-run') {
      parsed.dryRun = true;
      continue;
    }

    if (argument.startsWith('--changelog-path=')) {
      parsed.changelogPath = path.resolve(argument.slice('--changelog-path='.length));
      continue;
    }

    if (argument === '--changelog-path') {
      parsed.changelogPath = path.resolve(argv[index + 1] || '');
      index += 1;
      continue;
    }

    if (argument.startsWith('--history-path=')) {
      parsed.historyPath = path.resolve(argument.slice('--history-path='.length));
      continue;
    }

    if (argument === '--history-path') {
      parsed.historyPath = path.resolve(argv[index + 1] || '');
      index += 1;
      continue;
    }

    throw new Error(`Unknown option: ${argument}`);
  }

  return parsed;
}

function findLineIndex(lines: string[], pattern: RegExp): number {
  return lines.findIndex((line) => pattern.test(line));
}

function trimBlankEdges(lines: string[]): string[] {
  let start = 0;
  let end = lines.length;

  while (start < end && lines[start].trim() === '') {
    start += 1;
  }

  while (end > start && lines[end - 1].trim() === '') {
    end -= 1;
  }

  return lines.slice(start, end);
}

function loadLatestHistoryEntry(historyPath: string): HistoryUpdateEntry | null {
  const history = JSON.parse(fs.readFileSync(historyPath, 'utf8')) as { updates?: HistoryUpdateEntry[] };
  const updates = Array.isArray(history.updates) ? history.updates : [];
  return updates.length > 0 ? updates[0] : null;
}

function formatIconChunks(icons: string[], prefix: string): string[] {
  const chunkSize = 20;
  const lines: string[] = [];

  for (let index = 0; index < icons.length; index += chunkSize) {
    const chunk = icons.slice(index, index + chunkSize);
    const label = index === 0 ? prefix : `${prefix} (cont.)`;
    lines.push(`- ${label}: ${chunk.map((icon) => `\`${icon}\``).join(', ')}`);
  }

  return lines;
}

function buildManagedSection(entry: HistoryUpdateEntry): string[] {
  const fromVersion = entry.material_symbols_version_from || entry.material_symbols_version || 'unknown';
  const toVersion = entry.material_symbols_version_to || entry.material_symbols_version || 'unknown';
  const added = Array.isArray(entry.added) ? entry.added : [];
  const updated = Array.isArray(entry.updated) ? entry.updated : [];
  const removed = Array.isArray(entry.removed) ? entry.removed : [];
  const body: string[] = [];

  body.push(AUTO_SECTION_START);
  body.push('### Changed');
  body.push(`- Sync upstream Material Symbols from \`${fromVersion}\` to \`${toVersion}\`.`);
  body.push('');

  if (added.length > 0) {
    body.push('### Added');
    body.push(...formatIconChunks(added, 'Icons'));
    body.push('');
  }

  if (updated.length > 0) {
    body.push('### Changed');
    body.push(...formatIconChunks(updated, 'Updated icons'));
    body.push('');
  }

  if (removed.length > 0) {
    body.push('### Removed');
    body.push(...formatIconChunks(removed, 'Icons'));
    body.push('');
  }

  body.push(AUTO_SECTION_END);
  return trimBlankEdges(body);
}

function mergeManagedSection(existingBody: string[], managedSection: string[]): string[] {
  const startIndex = existingBody.findIndex((line) => line.trim() === AUTO_SECTION_START);
  const endIndex = existingBody.findIndex((line) => line.trim() === AUTO_SECTION_END);

  if (startIndex >= 0 && endIndex >= startIndex) {
    const before = trimBlankEdges(existingBody.slice(0, startIndex));
    const after = trimBlankEdges(existingBody.slice(endIndex + 1));
    const merged = [
      ...before,
      ...(before.length > 0 ? [''] : []),
      ...managedSection,
      ...(after.length > 0 ? [''] : []),
      ...after,
    ];
    return trimBlankEdges(merged);
  }

  const preservedBody = trimBlankEdges(existingBody);
  return trimBlankEdges([
    ...preservedBody,
    ...(preservedBody.length > 0 ? [''] : []),
    ...managedSection,
  ]);
}

export function updateChangelogFromHistory({
  changelogPath,
  historyPath,
  allowReleased,
  dryRun,
}: ParsedArgs): { updated: boolean; reason: string } {
  const latestEntry = loadLatestHistoryEntry(historyPath);
  if (!latestEntry) {
    return { updated: false, reason: 'No update-history entry found' };
  }

  const packageVersion = String(latestEntry.package_version || '').trim();
  if (!allowReleased && !packageVersion.endsWith('-unreleased')) {
    return { updated: false, reason: `Latest history entry is already released (${packageVersion || 'unknown'})` };
  }

  const added = Array.isArray(latestEntry.added) ? latestEntry.added : [];
  const updated = Array.isArray(latestEntry.updated) ? latestEntry.updated : [];
  const removed = Array.isArray(latestEntry.removed) ? latestEntry.removed : [];
  if (added.length === 0 && updated.length === 0 && removed.length === 0) {
    return { updated: false, reason: 'Latest history entry has no icon changes' };
  }

  const content = fs.readFileSync(changelogPath, 'utf8');
  const lines = content.split('\n');
  const unreleasedIndex = findLineIndex(lines, /^## \[Unreleased\]$/);
  if (unreleasedIndex < 0) {
    throw new Error('CHANGELOG.md is missing "## [Unreleased]" section');
  }

  let nextSectionIndex = -1;
  for (let index = unreleasedIndex + 1; index < lines.length; index += 1) {
    if (/^## \[/.test(lines[index])) {
      nextSectionIndex = index;
      break;
    }
  }

  if (nextSectionIndex < 0) {
    throw new Error('Failed to locate next changelog section after Unreleased');
  }

  const existingBody = trimBlankEdges(lines.slice(unreleasedIndex + 1, nextSectionIndex));
  const mergedBody = mergeManagedSection(existingBody, buildManagedSection(latestEntry));
  const replacement = ['## [Unreleased]', '', ...mergedBody, ''];
  lines.splice(unreleasedIndex, nextSectionIndex - unreleasedIndex, ...replacement);
  const nextContent = `${lines.join('\n').replace(/\n{3,}/g, '\n\n').replace(/\s*$/, '')}\n`;

  if (dryRun) {
    console.log(nextContent);
  } else {
    fs.writeFileSync(changelogPath, nextContent);
  }

  return { updated: true, reason: 'Updated managed weekly icon update block in CHANGELOG.md' };
}

function main(argv: string[] = process.argv.slice(2)): void {
  const options = parseArgs(argv);
  const result = updateChangelogFromHistory(options);
  console.log(result.reason);
}

if (isMain(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(`Error: ${getErrorMessage(error)}`);
    process.exit(1);
  }
}
