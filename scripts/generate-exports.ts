#!/usr/bin/env node
/**
 * このスクリプトの役割:
 * - 各パッケージの weight 別エントリ (w100〜w700, index.ts) を生成する
 *
 * 関連ファイル:
 * - /scripts/templates/*-template.ts
 * - /packages/<package>/src/icons/*.ts
 * - /packages/<package>/src/w*.ts, /packages/<package>/src/index.ts
 *
 * 実行元:
 * - 各 packages/<package>/package.json の build / build:dev スクリプト
 * - 手動: tsx scripts/generate-exports.ts <outlined|rounded|sharp> [react|vue|react-native]
 */

import fs from 'node:fs';
import path from 'node:path';
import { dirnameFromImportMeta } from './utils/module-path.ts';

// --- 設定 ---
const WEIGHTS = [100, 200, 300, 400, 500, 600, 700] as const;
const STYLES = ['outlined', 'rounded', 'sharp'] as const;
const SCRIPT_DIR = dirnameFromImportMeta(import.meta.url);

type FrameworkTemplate = {
  generateExportFileContent: (
    iconFiles: string[],
    weight: number,
    options?: { typeExportPath?: string }
  ) => string;
  getTypeExportBasePath?: () => string;
};

type ScriptOptions = {
  targetPackage: string;
  outputSubdir: string;
};

type ParsedArgs = {
  style?: string;
  framework: string;
  options: ScriptOptions;
};

// Framework template loader - will be set dynamically
let frameworkTemplate: FrameworkTemplate | null = null;

function normalizeSubdir(subdir?: string) {
  if (!subdir) {
    return '';
  }
  return String(subdir).replace(/^\/+|\/+$/g, '');
}

function resolveTypeExportPath(basePath: string, outputSubdir?: string) {
  const normalizedSubdir = normalizeSubdir(outputSubdir);
  const normalizedBasePath = String(basePath || './createMaterialIcon').replace(/^\/+|\/+$/g, '');
  if (!normalizedSubdir) {
    return normalizedBasePath;
  }
  const depth = normalizedSubdir.split('/').filter(Boolean).length;
  if (normalizedBasePath.startsWith('./')) {
    return `${'../'.repeat(depth)}${normalizedBasePath.slice(2)}`;
  }
  return `${'../'.repeat(depth)}${normalizedBasePath}`;
}

function parseArgs(argv: string[]): ParsedArgs {
  const positional = [];
  const options = {
    targetPackage: '',
    outputSubdir: ''
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--') {
      continue;
    }

    if (arg.startsWith('--target-package=')) {
      options.targetPackage = arg.slice('--target-package='.length).trim();
      continue;
    }
    if (arg === '--target-package') {
      options.targetPackage = (argv[i + 1] || '').trim();
      i++;
      continue;
    }

    if (arg.startsWith('--output-subdir=')) {
      options.outputSubdir = arg.slice('--output-subdir='.length).trim();
      continue;
    }
    if (arg === '--output-subdir') {
      options.outputSubdir = (argv[i + 1] || '').trim();
      i++;
      continue;
    }

    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    }

    positional.push(arg);
  }

  return {
    style: positional[0],
    framework: positional[1] || 'react',
    options
  };
}

// --- メインロジック ---

async function main() {
  let args: ParsedArgs;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }

  const { style, framework, options } = args;
  
  if (!style) {
    console.error('❌ Error: Style argument is missing. e.g., `node generate-exports.ts outlined react`');
    process.exit(1);
  }
  if (!STYLES.includes(style as (typeof STYLES)[number])) {
    console.error(`❌ Error: Unknown style: ${style}. Supported styles: ${STYLES.join(', ')}`);
    process.exit(1);
  }

  // Load framework template
  try {
    frameworkTemplate = (await import(`./templates/${framework}-template.ts`)) as FrameworkTemplate;
  } catch (error) {
    console.error(`❌ Error: Unknown framework: ${framework}. Supported frameworks: react, vue, react-native`);
    process.exit(1);
  }

  console.log(`🚀 Generating export entry points for style: ${style} (${framework})...`);

  // パッケージディレクトリを決定
  const packageName = options.targetPackage || framework;

  const outputSubdir = normalizeSubdir(options.outputSubdir);
  const packageSrcDir = path.join(SCRIPT_DIR, `../packages/${packageName}/src`);
  const SRC_DIR = outputSubdir ? path.join(packageSrcDir, outputSubdir) : packageSrcDir;
  const ICONS_DIR = path.join(SRC_DIR, 'icons');
  const template = frameworkTemplate;
  if (!template) {
    throw new Error('Framework template is not loaded');
  }
  const typeExportBasePath = typeof template.getTypeExportBasePath === 'function'
    ? template.getTypeExportBasePath()
    : './createMaterialIcon';
  const typeExportPath = resolveTypeExportPath(typeExportBasePath, outputSubdir);

  const iconFiles = fs.readdirSync(ICONS_DIR).filter(f => f.endsWith('.ts'));

  for (const weight of WEIGHTS) {
    const exportsContent = template.generateExportFileContent(iconFiles, weight, {
      typeExportPath
    });
    fs.writeFileSync(path.join(SRC_DIR, `w${weight}.ts`), exportsContent);
    console.log(`✅ Generated w${weight}.ts`);
  }

  // Create default export (w400)
  fs.copyFileSync(path.join(SRC_DIR, 'w400.ts'), path.join(SRC_DIR, 'index.ts'));
  console.log(`✅ Generated index.ts (aliased to w400.ts)`);

  console.log(`🎉 Successfully generated all export entry points for style: ${style} (${framework})`);
}

main().catch((error) => {
  console.error(`❌ Error: ${error.message}`);
  process.exit(1);
});
