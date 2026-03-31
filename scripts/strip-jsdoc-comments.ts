#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

function stripJsdocComments(source: string): string {
  return source.replace(/\/\*\*[\s\S]*?\*\/\s*/g, '');
}

function walk(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const resolvedPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(resolvedPath));
      continue;
    }

    if (entry.isFile() && resolvedPath.endsWith('.js')) {
      files.push(resolvedPath);
    }
  }

  return files;
}

function main() {
  const targetDir = process.argv[2];

  if (!targetDir) {
    console.error('Usage: tsx scripts/strip-jsdoc-comments.ts <directory>');
    process.exit(1);
  }

  const files = walk(path.resolve(process.cwd(), targetDir));
  for (const filePath of files) {
    const original = fs.readFileSync(filePath, 'utf8');
    const stripped = stripJsdocComments(original);

    if (stripped !== original) {
      fs.writeFileSync(filePath, stripped);
    }
  }
}

main();
