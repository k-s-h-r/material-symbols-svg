#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// --- 設定 ---
const WEIGHTS = [100, 200, 300, 400, 500, 600, 700];

// Framework template loader - will be set dynamically
let frameworkTemplate = null;

// --- メインロジック ---

function main() {
  const style = process.argv[2];
  const framework = process.argv[3] || 'react';
  
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
  const packageName = styleToPackage[style];
  if (!packageName) {
    console.error(`❌ Error: Unknown style: ${style}. Supported styles: outlined, rounded, sharp`);
    process.exit(1);
  }

  const ICONS_DIR = path.join(__dirname, `../packages/${packageName}/src/icons`);
  const SRC_DIR = path.join(__dirname, `../packages/${packageName}/src`);

  const iconFiles = fs.readdirSync(ICONS_DIR).filter(f => f.endsWith('.ts'));

  for (const weight of WEIGHTS) {
    const exportsContent = frameworkTemplate.generateExportFileContent(iconFiles, weight);
    fs.writeFileSync(path.join(SRC_DIR, `w${weight}.ts`), exportsContent);
    console.log(`✅ Generated w${weight}.ts`);
  }

  // Create default export (w400)
  fs.copyFileSync(path.join(SRC_DIR, 'w400.ts'), path.join(SRC_DIR, 'index.ts'));
  console.log(`✅ Generated index.ts (aliased to w400.ts)`);

  console.log(`🎉 Successfully generated all export entry points for style: ${style} (${framework})`);
}

main();
