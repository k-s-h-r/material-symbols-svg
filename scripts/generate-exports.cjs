#!/usr/bin/env node
/**
 * このスクリプトの役割:
 * - 各パッケージの weight 別エントリ (w100〜w700, index.ts) を生成する
 *
 * 関連ファイル:
 * - /scripts/templates/*-template.js
 * - /packages/<package>/src/icons/*.ts
 * - /packages/<package>/src/w*.ts, /packages/<package>/src/index.ts
 *
 * 実行元:
 * - 各 packages/<package>/package.json の build / build:dev スクリプト
 * - 手動: node scripts/generate-exports.cjs <outlined|rounded|sharp> [react|vue]
 */

const fs = require('fs');
const path = require('path');

// --- 設定 ---
const WEIGHTS = [100, 200, 300, 400, 500, 600, 700];

// Framework template loader - will be set dynamically
let frameworkTemplate = null;

function normalizeSubdir(subdir) {
  if (!subdir) {
    return '';
  }
  return String(subdir).replace(/^\/+|\/+$/g, '');
}

function resolveTypeExportPath(basePath, outputSubdir) {
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

function parseArgs(argv) {
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

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }

  const { style, framework, options } = args;
  
  if (!style) {
    console.error('❌ Error: Style argument is missing. e.g., `node generate-exports.cjs outlined react`');
    process.exit(1);
  }

  // Load framework template
  try {
    frameworkTemplate = require(`./templates/${framework}-template`);
  } catch (error) {
    console.error(`❌ Error: Unknown framework: ${framework}. Supported frameworks: react, vue`);
    process.exit(1);
  }

  console.log(`🚀 Generating export entry points for style: ${style} (${framework})...`);

  // パッケージディレクトリを決定
  const styleToPackage = frameworkTemplate.getPackageMapping();
  const packageName = options.targetPackage || styleToPackage[style];
  if (!packageName) {
    console.error(`❌ Error: Unknown style: ${style}. Supported styles: outlined, rounded, sharp`);
    process.exit(1);
  }

  const outputSubdir = normalizeSubdir(options.outputSubdir);
  const packageSrcDir = path.join(__dirname, `../packages/${packageName}/src`);
  const SRC_DIR = outputSubdir ? path.join(packageSrcDir, outputSubdir) : packageSrcDir;
  const ICONS_DIR = path.join(SRC_DIR, 'icons');
  const typeExportBasePath = typeof frameworkTemplate.getTypeExportBasePath === 'function'
    ? frameworkTemplate.getTypeExportBasePath()
    : './createMaterialIcon';
  const typeExportPath = resolveTypeExportPath(typeExportBasePath, outputSubdir);

  const iconFiles = fs.readdirSync(ICONS_DIR).filter(f => f.endsWith('.ts'));

  for (const weight of WEIGHTS) {
    const exportsContent = frameworkTemplate.generateExportFileContent(iconFiles, weight, {
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

main();
