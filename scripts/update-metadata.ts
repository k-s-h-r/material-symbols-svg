#!/usr/bin/env node
/**
 * このスクリプトの役割:
 * - upstream versions.json を同期し、icon-catalog/update-history/source を更新する
 * - from/to バージョン差分（added/updated/removed）を算出して履歴に記録する
 *
 * 関連ファイル:
 * - /package.json（@material-symbols/svg-*）
 * - /metadata/icon-catalog.json
 * - /metadata/update-history.json
 * - /packages/metadata/update-history.json
 * - /metadata/source/versions.json, /metadata/source/upstream-version.json
 *
 * 実行元:
 * - package.json: sync:upstream
 * - package.json: update:icons（内部で sync:upstream を実行）
 * - .github/workflows/icon-update.yml
 */

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { promisify } from 'node:util';
import { isMain } from './utils/is-main.ts';
import { dirnameFromImportMeta } from './utils/module-path.ts';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdir = promisify(fs.mkdir);
const SCRIPT_DIR = dirnameFromImportMeta(import.meta.url);

const MATERIAL_SYMBOLS_STYLES = ['outlined', 'rounded', 'sharp'] as const;
const REPRESENTATIVE_MATERIAL_SYMBOLS_WEIGHT = 100;
const REPRESENTATIVE_MATERIAL_SYMBOLS_PACKAGE = `@material-symbols/svg-${REPRESENTATIVE_MATERIAL_SYMBOLS_WEIGHT}`;
const REPRESENTATIVE_MATERIAL_SYMBOLS_KEY = `svg-${REPRESENTATIVE_MATERIAL_SYMBOLS_WEIGHT}`;
const DEFAULT_EXISTENCE_CHECK_WEIGHT = REPRESENTATIVE_MATERIAL_SYMBOLS_WEIGHT;
const AVAILABLE_ICONS_CACHE = new Map<string, { availableIcons: Set<string>; source: string }>();

type VersionMap = Record<string, string | null>;

type DiffIndex = Record<string, { version: string | null }>;

type Changes = {
  timestamp: string;
  added: string[];
  updated: string[];
  removed: string[];
};

type MarellaVersions = {
  version: string;
  packages: Record<string, string>;
  hasVersionMismatch: boolean;
  representativePackage: string;
  error?: string;
};

type UpstreamVersionFile = {
  timestamp?: string;
  marella_material_symbols_package?: string;
  marella_material_symbols_version?: string;
  marella_package_versions?: Record<string, string>;
  total_icons?: number;
  last_updated?: string;
  version_mismatch_detected?: boolean;
  version_error?: string;
};

type HistoryUpdate = {
  timestamp?: string;
  package_version?: string;
  material_symbols_package?: string;
  material_symbols_version_from?: string;
  material_symbols_version_to?: string;
  material_symbols_version?: string;
  added?: string[];
  updated?: string[];
  removed?: string[];
};

type IconCatalogEntry = {
  name: string;
  iconName: string;
  categories: string[];
  version: string | null;
};

type IconCatalog = Record<string, IconCatalogEntry>;

/**
 * HTTPSでJSONデータを取得
 */
async function fetchJSON(url: string): Promise<VersionMap> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data) as VersionMap);
        } catch (error) {
          reject(new Error(`Failed to parse JSON from ${url}: ${error.message}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * ローカルファイルを読み取り、存在しない場合は空オブジェクトを返す
 */
async function readLocalFile<T>(filePath: string): Promise<T> {
  try {
    const data = await readFile(filePath, 'utf8');
    return JSON.parse(String(data)) as T;
  } catch (error) {
    console.log(`File not found or invalid: ${filePath}, creating new one`);
    return {} as T;
  }
}

/**
 * package.jsonからmarella/material-symbolsのバージョンを取得
 */
async function getMarellaVersions(): Promise<MarellaVersions> {
  const packageJsonPath = path.join(SCRIPT_DIR, '../package.json');
  
  try {
    const packageData = await readLocalFile<{ dependencies?: Record<string, string> }>(packageJsonPath);
    const dependencies = packageData.dependencies || {};
    
    // material-symbols関連のパッケージを取得
    const materialSymbolsPackages: Record<string, string> = {};
    const versionSet = new Set<string>();
    
    for (const [packageName, version] of Object.entries(dependencies)) {
      if (packageName.startsWith('@material-symbols/svg-')) {
        const weight = packageName.replace('@material-symbols/svg-', '');
        const cleanVersion = version.replace(/^[\^~]/, ''); // ^0.32.0 -> 0.32.0
        materialSymbolsPackages[`svg-${weight}`] = cleanVersion;
        versionSet.add(cleanVersion);
      }
    }
    
    // バージョンの整合性をチェック
    if (versionSet.size === 0) {
      throw new Error('No @material-symbols/svg-* packages found in dependencies');
    }
    
    if (versionSet.size > 1) {
      console.warn(`Warning: Multiple versions detected for @material-symbols packages:`, Array.from(versionSet));
      console.warn('All packages should use the same version for consistency');
    }
    
    const representativeVersion = materialSymbolsPackages[REPRESENTATIVE_MATERIAL_SYMBOLS_KEY];
    if (!representativeVersion) {
      throw new Error(`${REPRESENTATIVE_MATERIAL_SYMBOLS_PACKAGE} is required in dependencies`);
    }
    
    return {
      version: representativeVersion,
      packages: materialSymbolsPackages,
      hasVersionMismatch: versionSet.size > 1,
      representativePackage: REPRESENTATIVE_MATERIAL_SYMBOLS_PACKAGE,
    };
    
  } catch (error) {
    console.error('Failed to read marella versions from package.json:', error.message);
    return {
      version: 'unknown',
      packages: {},
      hasVersionMismatch: false,
      representativePackage: REPRESENTATIVE_MATERIAL_SYMBOLS_PACKAGE,
      error: error.message
    };
  }
}

/**
 * node_modules の @material-symbols/svg-* パッケージに実在するアイコン一覧を取得
 * - versions.json に載っていても実パッケージに入っていないケースがあるため、存在チェック用に使用
 */
function getAvailableIconsFromInstalledPackage({ weight = DEFAULT_EXISTENCE_CHECK_WEIGHT } = {}): {
  availableIcons: Set<string>;
  checkedDirs: string[];
} {
  const availableIcons = new Set<string>();
  const checkedDirs = [];

  for (const style of MATERIAL_SYMBOLS_STYLES) {
    const dirPath = path.join(SCRIPT_DIR, `../node_modules/@material-symbols/svg-${weight}/${style}`);
    if (!fs.existsSync(dirPath)) continue;

    checkedDirs.push(dirPath);

    const files = fs.readdirSync(dirPath);
    for (const fileName of files) {
      if (!fileName.endsWith('.svg')) continue;
      if (fileName.endsWith('-fill.svg')) continue;
      availableIcons.add(fileName.replace(/\.svg$/, ''));
    }
  }

  return { availableIcons, checkedDirs };
}

function parseTarEntriesToIconSet(entriesText: string): Set<string> {
  const availableIcons = new Set<string>();
  const entryLines = entriesText.split('\n').map((line) => line.trim()).filter(Boolean);

  for (const entry of entryLines) {
    for (const style of MATERIAL_SYMBOLS_STYLES) {
      const prefix = `package/${style}/`;
      if (!entry.startsWith(prefix)) continue;
      if (!entry.endsWith('.svg') || entry.endsWith('-fill.svg')) continue;
      availableIcons.add(path.basename(entry, '.svg'));
    }
  }

  return availableIcons;
}

function getNpmTarballPathForVersion(version: string, packageName = REPRESENTATIVE_MATERIAL_SYMBOLS_PACKAGE): {
  tempDir: string;
  tarballPath: string;
} {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'material-symbols-pack-'));

  try {
    const packResult = spawnSync(
      'npm',
      ['pack', `${packageName}@${version}`, '--pack-destination', tempDir, '--json'],
      { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 },
    );

    if (packResult.error) {
      throw new Error(`npm pack failed: ${packResult.error.message}`);
    }
    if (packResult.status !== 0) {
      throw new Error(packResult.stderr.trim() || packResult.stdout.trim() || `npm pack exit code ${packResult.status}`);
    }

    const parsed = JSON.parse(packResult.stdout.trim());
    const filename = Array.isArray(parsed) && parsed[0] && parsed[0].filename;
    if (!filename) {
      throw new Error('Could not determine tarball filename from npm pack output');
    }

    return { tempDir, tarballPath: path.join(tempDir, filename) };
  } catch (error) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    throw error;
  }
}

function getAvailableIconsFromNpmPackageVersion(
  version: string,
  packageName = REPRESENTATIVE_MATERIAL_SYMBOLS_PACKAGE,
): { availableIcons: Set<string>; source: string } {
  const { tempDir, tarballPath } = getNpmTarballPathForVersion(version, packageName);

  try {
    const tarResult = spawnSync('tar', ['-tzf', tarballPath], { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
    if (tarResult.error) {
      throw new Error(`tar listing failed: ${tarResult.error.message}`);
    }
    if (tarResult.status !== 0) {
      throw new Error(tarResult.stderr.trim() || tarResult.stdout.trim() || `tar exit code ${tarResult.status}`);
    }

    const availableIcons = parseTarEntriesToIconSet(tarResult.stdout);
    return {
      availableIcons,
      source: `npm package ${packageName}@${version}`,
    };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function getAvailableIconsForVersion({
  version,
  installedVersion,
  weight = DEFAULT_EXISTENCE_CHECK_WEIGHT,
  packageName = REPRESENTATIVE_MATERIAL_SYMBOLS_PACKAGE,
}: {
  version: string;
  installedVersion: string;
  weight?: number;
  packageName?: string;
}): { availableIcons: Set<string>; source: string } {
  if (!version || version === 'unknown') {
    return { availableIcons: new Set(), source: 'none' };
  }

  if (AVAILABLE_ICONS_CACHE.has(version)) {
    return AVAILABLE_ICONS_CACHE.get(version);
  }

  if (version === installedVersion) {
    const installedResult = getAvailableIconsFromInstalledPackage({ weight });
    if (installedResult.checkedDirs.length > 0) {
      const result = {
        availableIcons: installedResult.availableIcons,
        source: `installed ${packageName}@${version}`,
      };
      AVAILABLE_ICONS_CACHE.set(version, result);
      return result;
    }
  }

  const packedResult = getAvailableIconsFromNpmPackageVersion(version, packageName);
  AVAILABLE_ICONS_CACHE.set(version, packedResult);
  return packedResult;
}

function filterVersionsByAvailableIcons(versions: VersionMap, availableIcons: Set<string>): {
  filteredVersions: VersionMap;
  missingIcons: string[];
} {
  const filteredVersions: VersionMap = {};
  const missingIcons: string[] = [];

  for (const iconName of Object.keys(versions)) {
    if (availableIcons.has(iconName)) {
      filteredVersions[iconName] = versions[iconName];
    } else {
      missingIcons.push(iconName);
    }
  }

  return { filteredVersions, missingIcons };
}

function alignVersionsToAvailableIcons(versions: VersionMap, availableIcons: Set<string>): {
  alignedVersions: VersionMap;
  missingInVersions: string[];
} {
  const alignedVersions: VersionMap = {};
  const missingInVersions: string[] = [];
  const sortedAvailableIcons = Array.from(availableIcons).sort();

  for (const iconName of sortedAvailableIcons) {
    if (Object.prototype.hasOwnProperty.call(versions, iconName)) {
      alignedVersions[iconName] = versions[iconName];
    } else {
      alignedVersions[iconName] = null;
      missingInVersions.push(iconName);
    }
  }

  return { alignedVersions, missingInVersions };
}

function buildDiffIndexFromVersions(versions: VersionMap): DiffIndex {
  const diffIndex: DiffIndex = {};
  for (const [iconName, version] of Object.entries(versions)) {
    diffIndex[iconName] = { version };
  }
  return diffIndex;
}

/**
 * 変更を検出して記録
 */
function detectChanges(oldData: DiffIndex, newData: DiffIndex): Changes {
  const changes: Changes = {
    timestamp: new Date().toISOString(),
    added: [],
    updated: [],
    removed: []
  };

  // 新規追加されたアイコンを検出
  for (const iconName in newData) {
    if (!(iconName in oldData)) {
      changes.added.push(iconName);
    }
  }

  // 更新されたアイコンを検出（カテゴリ差分は対象外）
  for (const iconName in newData) {
    if (iconName in oldData) {
      const oldIcon = oldData[iconName];
      const newIcon = newData[iconName];
      
      // upstream icon version の変更のみを更新として扱う
      if (oldIcon.version !== newIcon.version) {
        changes.updated.push(iconName);
      }
    }
  }

  // 削除されたアイコンを検出
  for (const iconName in oldData) {
    if (!(iconName in newData)) {
      changes.removed.push(iconName);
    }
  }

  return changes;
}

function getMaterialSymbolsVersionTo(update: HistoryUpdate): string {
  return update.material_symbols_version_to || update.material_symbols_version || 'unknown';
}

function normalizeHistoryUpdates(updates: HistoryUpdate[], materialSymbolsPackage: string): HistoryUpdate[] {
  return updates.map((update, index, allUpdates) => {
    const toVersion = getMaterialSymbolsVersionTo(update);
    const olderUpdate = allUpdates[index + 1];
    const inferredFromVersion = olderUpdate ? getMaterialSymbolsVersionTo(olderUpdate) : 'unknown';
    const fromVersion = update.material_symbols_version_from || inferredFromVersion;

    return {
      ...update,
      material_symbols_package: update.material_symbols_package || materialSymbolsPackage,
      material_symbols_version_from: fromVersion,
      material_symbols_version_to: toVersion,
      // Backward compatibility for existing consumers
      material_symbols_version: toVersion,
    };
  });
}

/**
 * 更新履歴を記録（バージョン情報付き）
 */
async function recordUpdateHistory(
  changes: Changes,
  {
    materialSymbolsVersion,
    materialSymbolsPackage,
    materialSymbolsVersionFrom
  }: {
    materialSymbolsVersion: string;
    materialSymbolsPackage: string;
    materialSymbolsVersionFrom?: string;
  },
): Promise<boolean> {
  const historyPath = path.join(SCRIPT_DIR, '../metadata/update-history.json');
  const packageHistoryPath = path.join(SCRIPT_DIR, '../packages/metadata/update-history.json');
  
  // 既存の履歴を読み込み
  let history: { updates: HistoryUpdate[] } = { updates: [] };
  try {
    const existingHistory = await readFile(historyPath, 'utf8');
    history = JSON.parse(existingHistory);
  } catch (error) {
    console.log('Creating new update history file');
  }

  if (!Array.isArray(history.updates)) {
    history.updates = [];
  }
  history.updates = normalizeHistoryUpdates(history.updates, materialSymbolsPackage);

  const recordedPreviousVersion = history.updates.length > 0 ? getMaterialSymbolsVersionTo(history.updates[0]) : 'unknown';
  const previousVersion = materialSymbolsVersionFrom || recordedPreviousVersion;

  if (materialSymbolsVersionFrom && recordedPreviousVersion !== 'unknown' && recordedPreviousVersion !== materialSymbolsVersionFrom) {
    console.warn(
      `Warning: history latest version (${recordedPreviousVersion}) differs from computed from-version (${materialSymbolsVersionFrom})`,
    );
  }

  // 前回と今回の upstream バージョンが同一なら履歴を追加しない
  if (previousVersion === materialSymbolsVersion) {
    console.log(`Upstream version unchanged (${materialSymbolsVersion}), skipping history update`);
    return false;
  }

  // 変更がない場合はスキップ
  if (changes.added.length === 0 && changes.updated.length === 0 && changes.removed.length === 0) {
    console.log('No changes detected, skipping history update');
    return false; // 変更がなかったことを示す
  }

  // 現在の公開パッケージバージョンを取得（unreleasedサフィックス付き）
  let packageVersion = 'unknown';
  try {
    // 実際の公開パッケージ（metadata）のバージョンを使用
    const metadataPackageData = await readLocalFile<{ version: string }>(path.join(SCRIPT_DIR, '../packages/metadata/package.json'));
    const currentVersion = metadataPackageData.version;
    // 既にunreleasedでない場合のみサフィックスを追加
    packageVersion = currentVersion.endsWith('-unreleased') ? currentVersion : `${currentVersion}-unreleased`;
  } catch (error) {
    console.warn('Could not determine package version:', error.message);
  }

  // バージョン情報付きの新しい更新記録を作成
  const updateEntry = {
    timestamp: changes.timestamp,
    package_version: packageVersion,
    material_symbols_package: materialSymbolsPackage,
    material_symbols_version_from: previousVersion,
    material_symbols_version_to: materialSymbolsVersion,
    // Backward compatibility
    material_symbols_version: materialSymbolsVersion,
    added: changes.added,
    updated: changes.updated,
    removed: changes.removed
  };

  // 新しい更新記録を追加
  history.updates.unshift(updateEntry);

  // 履歴を最新100件に制限
  history.updates = normalizeHistoryUpdates(history.updates.slice(0, 100), materialSymbolsPackage);

  // 両方の場所に履歴を保存
  await Promise.all([
    writeFile(historyPath, JSON.stringify(history, null, 2)),
    writeFile(packageHistoryPath, JSON.stringify(history, null, 2))
  ]);
  
  console.log(`Update history recorded: ${changes.added.length} added, ${changes.updated.length} updated, ${changes.removed.length} removed`);
  console.log(`Package version: ${packageVersion}, Material Symbols version: ${previousVersion} -> ${materialSymbolsVersion}`);
  return true; // 変更があったことを示す
}

// 注意: setPackagesUnreleased関数は削除されました
// パッケージのバージョン管理はbump-version.tsで手動で行います

/**
 * メイン処理
 */
async function updateMetadata() {
  console.log('Starting metadata update...');

  try {
    // marella/material-symbolsのバージョン情報を取得
    const marellaVersions = await getMarellaVersions();
    const toVersion = marellaVersions.version;
    const toVersionTag = `v${toVersion}`;

    const sourceDir = path.join(SCRIPT_DIR, '../metadata/source');
    await mkdir(sourceDir, { recursive: true });
    const versionsPath = path.join(sourceDir, 'versions.json');
    const upstreamVersionPath = path.join(sourceDir, 'upstream-version.json');

    // 前回バージョンを決定（履歴の最新 to-version を優先）
    const existingUpstreamVersion = await readLocalFile<UpstreamVersionFile>(upstreamVersionPath);
    const existingHistory = await readLocalFile<{ updates?: HistoryUpdate[] }>(path.join(SCRIPT_DIR, '../metadata/update-history.json'));
    const normalizedHistoryUpdates = normalizeHistoryUpdates(
      Array.isArray(existingHistory.updates) ? existingHistory.updates : [],
      marellaVersions.representativePackage,
    );
    const latestHistoryToVersion = normalizedHistoryUpdates.length > 0 ? getMaterialSymbolsVersionTo(normalizedHistoryUpdates[0]) : null;
    const fromVersion = latestHistoryToVersion || existingUpstreamVersion.marella_material_symbols_version || 'unknown';
    const fromVersionTag = fromVersion !== 'unknown' ? `v${fromVersion}` : null;

    // 上流データを取得 - from/to の versions.json を直接比較
    console.log('Fetching upstream metadata...');
    console.log(`Comparing upstream versions: ${fromVersion} -> ${toVersion}`);
    console.log(`Using to-version tag: ${toVersionTag}`);
    const toVersions = await fetchJSON(`https://raw.githubusercontent.com/marella/material-symbols/${toVersionTag}/metadata/versions.json`);
    console.log(`Fetched ${Object.keys(toVersions).length} icons from versions.json (${toVersionTag})`);

    let fromVersions: VersionMap = {};
    if (fromVersion === 'unknown') {
      console.log('No previous upstream version detected; using empty baseline for diff');
    } else if (fromVersion === toVersion) {
      fromVersions = toVersions;
      console.log(`from-version equals to-version (${toVersion}); reusing the same versions.json for diff`);
    } else {
      console.log(`Using from-version tag: ${fromVersionTag}`);
      fromVersions = await fetchJSON(`https://raw.githubusercontent.com/marella/material-symbols/${fromVersionTag}/metadata/versions.json`);
      console.log(`Fetched ${Object.keys(fromVersions).length} icons from versions.json (${fromVersionTag})`);
    }

    // versions.json に載っていても、実際のアイコンが存在するものだけに絞る
    const existenceCheckWeight = Number.parseInt(
      process.env.MATERIAL_SYMBOLS_EXISTENCE_CHECK_WEIGHT || `${DEFAULT_EXISTENCE_CHECK_WEIGHT}`,
      10,
    );

    const toAvailableIconsResult = getAvailableIconsForVersion({
      version: toVersion,
      installedVersion: toVersion,
      weight: existenceCheckWeight,
      packageName: marellaVersions.representativePackage,
    });
    const {
      missingIcons: missingToIcons,
    } = filterVersionsByAvailableIcons(toVersions, toAvailableIconsResult.availableIcons);
    const {
      alignedVersions: alignedToVersions,
      missingInVersions: missingToVersionEntries,
    } = alignVersionsToAvailableIcons(toVersions, toAvailableIconsResult.availableIcons);

    console.log(`Resolved existing icons for to-version from ${toAvailableIconsResult.source}`);
    if (missingToIcons.length > 0) {
      console.warn(
        `⚠️  ${missingToIcons.length} icons exist in versions.json (${toVersion}) but not in actual package data; excluded from icon-catalog/update-history.`,
      );
      console.warn(`   e.g. ${missingToIcons.slice(0, 20).join(', ')}${missingToIcons.length > 20 ? ', ...' : ''}`);
    }
    if (missingToVersionEntries.length > 0) {
      console.warn(
        `⚠️  ${missingToVersionEntries.length} icons exist in actual package data (${toVersion}) but not in versions.json; included in icon-catalog with null version.`,
      );
      console.warn(`   e.g. ${missingToVersionEntries.slice(0, 20).join(', ')}${missingToVersionEntries.length > 20 ? ', ...' : ''}`);
    }

    let alignedFromVersions: VersionMap = {};
    if (fromVersion !== 'unknown') {
      const fromAvailableIconsResult = fromVersion === toVersion
        ? toAvailableIconsResult
        : getAvailableIconsForVersion({
          version: fromVersion,
          installedVersion: toVersion,
          weight: existenceCheckWeight,
          packageName: marellaVersions.representativePackage,
        });
      const {
        missingIcons: missingFromIcons,
      } = filterVersionsByAvailableIcons(fromVersions, fromAvailableIconsResult.availableIcons);
      const {
        alignedVersions,
        missingInVersions: missingFromVersionEntries,
      } = alignVersionsToAvailableIcons(fromVersions, fromAvailableIconsResult.availableIcons);
      alignedFromVersions = alignedVersions;

      console.log(`Resolved existing icons for from-version from ${fromAvailableIconsResult.source}`);
      if (missingFromIcons.length > 0) {
        console.warn(
          `⚠️  ${missingFromIcons.length} icons exist in versions.json (${fromVersion}) but not in actual package data; excluded from diff baseline.`,
        );
        console.warn(`   e.g. ${missingFromIcons.slice(0, 20).join(', ')}${missingFromIcons.length > 20 ? ', ...' : ''}`);
      }
      if (missingFromVersionEntries.length > 0) {
        console.warn(
          `⚠️  ${missingFromVersionEntries.length} icons exist in actual package data (${fromVersion}) but not in versions.json; included in diff baseline with null version.`,
        );
        console.warn(`   e.g. ${missingFromVersionEntries.slice(0, 20).join(', ')}${missingFromVersionEntries.length > 20 ? ', ...' : ''}`);
      }
    }

    // 既存のメタデータを読み込み
    const iconCatalogPath = path.join(SCRIPT_DIR, '../metadata/icon-catalog.json');
    const oldIconIndex = await readLocalFile<Record<string, Partial<IconCatalogEntry>>>(iconCatalogPath);

    // 新しいメタデータを構築
    const newIconIndex: IconCatalog = {};
    
    // to-version の実在アイコン一覧（svg-100）をメインデータソースとしてアイコン一覧を作成
    for (const iconName in alignedToVersions) {
      // 既存のアイコンからカテゴリ情報を取得、新規の場合のみuncategorized
      let categories: string[] = ['uncategorized'];
      if (oldIconIndex[iconName] && oldIconIndex[iconName].categories) {
        // 既存アイコンの場合：既存のカテゴリを保持
        categories = oldIconIndex[iconName].categories;
      }

      // コンポーネント名を生成 (Pascal Case)
      const componentName = iconName
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');

      newIconIndex[iconName] = {
        name: iconName,
        iconName: componentName,
        categories: categories,
        version: alignedToVersions[iconName]
      };
    }

    // from/to の upstream versions 差分から変更を検出
    const changes = detectChanges(
      buildDiffIndexFromVersions(alignedFromVersions),
      buildDiffIndexFromVersions(alignedToVersions),
    );

    // メタデータディレクトリを作成（存在しない場合）
    await mkdir(path.join(SCRIPT_DIR, '../metadata'), { recursive: true });

    // 新しいメタデータを保存
    await writeFile(iconCatalogPath, JSON.stringify(newIconIndex, null, 2));
    console.log(`Updated icon catalog with ${Object.keys(newIconIndex).length} icons`);

    // 上流データを metadata/source/ に保存
    const existingPackageVersions = existingUpstreamVersion.marella_package_versions || {};
    
    // パッケージバージョンに変更があるかチェック
    const packageVersionsChanged = JSON.stringify(existingPackageVersions) !== JSON.stringify(marellaVersions.packages);
    const representativePackageChanged = existingUpstreamVersion.marella_material_symbols_package !== marellaVersions.representativePackage;
    const representativeVersionChanged = existingUpstreamVersion.marella_material_symbols_version !== marellaVersions.version;
    
    // versions.jsonは常に保存
    await writeFile(versionsPath, JSON.stringify(toVersions, null, 2));
    
    // upstream-version.jsonはパッケージバージョンに変更がある場合のみ更新
    if (packageVersionsChanged || representativePackageChanged || representativeVersionChanged || !existingUpstreamVersion.marella_material_symbols_version) {
      const upstreamVersion: UpstreamVersionFile = {
        timestamp: new Date().toISOString(),
        marella_material_symbols_package: marellaVersions.representativePackage,
        marella_material_symbols_version: marellaVersions.version,
        marella_package_versions: marellaVersions.packages,
        total_icons: Object.keys(toVersions).length,
        last_updated: new Date().toISOString(),
        version_mismatch_detected: marellaVersions.hasVersionMismatch
      };
      
      // バージョン取得でエラーがあった場合は記録
      if (marellaVersions.error) {
        upstreamVersion.version_error = marellaVersions.error;
      }
      
      await writeFile(upstreamVersionPath, JSON.stringify(upstreamVersion, null, 2));
      console.log('Saved upstream data and updated version info to metadata/source/ directory');
      console.log(`Updated marella/material-symbols version: ${marellaVersions.version}`);
    } else {
      console.log('Saved upstream data to metadata/source/ directory');
      console.log(`Using marella/material-symbols version: ${marellaVersions.version} (no version change detected)`);
    }

    // 更新履歴を記録（バージョン情報付き）
    const hasChanges = await recordUpdateHistory(changes, {
      materialSymbolsVersion: marellaVersions.version,
      materialSymbolsPackage: marellaVersions.representativePackage,
      materialSymbolsVersionFrom: fromVersion,
    });

    // 新規アイコンの処理
    const uncategorizedIcons = Object.values(newIconIndex)
      .filter(icon => icon.categories.includes('uncategorized'));
    const uncategorizedCount = uncategorizedIcons.length;
      
    if (uncategorizedCount > 0 && hasChanges) {
      console.log(`\nProcessing ${uncategorizedCount} new uncategorized icons...`);
      
      // OpenAI API Keyが設定されている場合、自動処理を実行
      if (process.env.OPENAI_API_KEY) {
        console.log('OPENAI_API_KEY detected. Running automated processing...');
        
        try {
          // 1. 検索ワード生成（新規アイコンのみ）
          const { generateSearchTermsForNewIcons } = await import('./generate-search-terms-incremental.ts');
          const searchTermsGenerated = await generateSearchTermsForNewIcons();
          console.log(`✅ Generated search terms for ${searchTermsGenerated} icons`);
          
          // 2. カテゴリ分類
          const { categorizeUncategorizedIcons } = await import('./categorize-icons.ts');
          await categorizeUncategorizedIcons();
          console.log('✅ Auto-categorization completed');
          
        } catch (error) {
          console.warn('⚠️ Automated processing failed:', error.message);
          console.warn('You can run the processes manually:');
          console.warn('  - Categories: tsx scripts/categorize-icons.ts');
          console.warn('  - Search terms: tsx scripts/generate-search-terms-incremental.ts');
        }
      } else {
        console.log('To process them automatically, set OPENAI_API_KEY environment variable');
        console.log('Manual processing commands:');
        console.log('  - Categories: tsx scripts/categorize-icons.ts');
        console.log('  - Search terms: tsx scripts/generate-search-terms-incremental.ts');
      }
    } else if (uncategorizedCount > 0) {
      console.log(`\nNote: Found ${uncategorizedCount} uncategorized icons (from previous updates).`);
      console.log('Use "tsx scripts/categorize-icons.ts" to categorize them.');
    }

    // 統計情報を表示
    console.log('\nUpdate Summary:');
    console.log(`Total icons: ${Object.keys(newIconIndex).length}`);
    console.log(`Added: ${changes.added.length}`);
    console.log(`Updated: ${changes.updated.length}`);
    console.log(`Removed: ${changes.removed.length}`);

    if (changes.added.length > 0) {
      console.log('\nNewly added icons:');
      changes.added.slice(0, 10).forEach(iconName => {
        console.log(`  - ${iconName}`);
      });
      if (changes.added.length > 10) {
        console.log(`  ... and ${changes.added.length - 10} more`);
      }
    }

    console.log('\nMetadata update completed successfully!');

  } catch (error) {
    console.error('Error updating metadata:', error);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合にメイン処理を実行
if (isMain(import.meta.url)) {
  updateMetadata();
}
