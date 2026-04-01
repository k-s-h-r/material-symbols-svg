import fs from 'node:fs';
import resolve from '@rollup/plugin-node-resolve';
import esbuild from 'rollup-plugin-esbuild';
import copy from 'rollup-plugin-copy';
import {
  buildStandardMaterialSymbolsInput,
  createMaterialSymbolsRollupConfig
} from '../../scripts/rollup-config-helpers.mjs';

function buildIconEntries(prefix = '') {
  const iconDir = prefix ? `src/${prefix}/icons` : 'src/icons';
  const entries = {};

  for (const fileName of fs.readdirSync(iconDir)) {
    if (!fileName.endsWith('.ts')) {
      continue;
    }

    const iconName = fileName.replace(/\.ts$/, '');
    const entryName = prefix ? `${prefix}/icons/${iconName}` : `icons/${iconName}`;
    entries[entryName] = `${iconDir}/${fileName}`;
  }

  return entries;
}

export default createMaterialSymbolsRollupConfig({
  input: buildStandardMaterialSymbolsInput({
    outlinedExtra: {
      'icon-helpers': 'src/icon-helpers.ts',
      ...buildIconEntries()
    },
    roundedExtra: buildIconEntries('rounded'),
    sharpExtra: buildIconEntries('sharp')
  }),
  external: (id) => id === 'astro/compiler-runtime' || id.endsWith('.astro'),
  resolve,
  esbuild,
  copy,
  copyTargets: [
    { src: 'src/icon.astro', dest: 'dist' },
    { src: 'src/metadata', dest: 'dist' }
  ]
});
