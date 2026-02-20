import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function dirnameFromImportMeta(importMetaUrl: string): string {
  return path.dirname(fileURLToPath(importMetaUrl));
}
