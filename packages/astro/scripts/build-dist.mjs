import fs from 'node:fs';
import path from 'node:path';

const packageDir = process.cwd();
const srcDir = path.join(packageDir, 'src');
const distDir = path.join(packageDir, 'dist');

function copyFile(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function copyDirectory(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true });
}

function writeIconEntryDeclaration() {
  const filePath = path.join(distDir, 'icon-entry.d.ts');
  const contents = `import type { MaterialSymbolsComponent } from './types';

declare const MaterialSymbolIcon: MaterialSymbolsComponent;

export default MaterialSymbolIcon;
`;

  fs.writeFileSync(filePath, contents);
}

function main() {
  fs.mkdirSync(distDir, { recursive: true });

  copyFile(path.join(srcDir, 'icon.astro'), path.join(distDir, 'icon.astro'));
  copyFile(path.join(srcDir, 'path.astro'), path.join(distDir, 'path.astro'));
  copyFile(path.join(srcDir, 'types.ts'), path.join(distDir, 'types.ts'));
  copyFile(path.join(srcDir, 'types.ts'), path.join(distDir, 'types.d.ts'));

  copyDirectory(path.join(srcDir, 'icons'), path.join(distDir, 'icons'));
  copyDirectory(path.join(srcDir, 'metadata'), path.join(distDir, 'metadata'));

  for (const fileName of fs.readdirSync(srcDir)) {
    if (!/^((index|w\d+)\.(ts|d\.ts))$/.test(fileName)) {
      continue;
    }

    copyFile(path.join(srcDir, fileName), path.join(distDir, fileName));
  }

  writeIconEntryDeclaration();

  for (const fileName of fs.readdirSync(srcDir)) {
    if (/^((index|w\d+)\.d\.ts)$/.test(fileName)) {
      fs.rmSync(path.join(srcDir, fileName), { force: true });
    }
  }
}

main();
