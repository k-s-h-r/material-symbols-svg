import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function isMain(importMetaUrl: string): boolean {
  if (!process.argv[1]) {
    return false;
  }

  const currentFilePath = path.resolve(fileURLToPath(importMetaUrl));
  const entryFilePath = path.resolve(process.argv[1]);
  return currentFilePath === entryFilePath;
}
