import fs from 'node:fs';
import resolve from '@rollup/plugin-node-resolve';
import esbuild from 'rollup-plugin-esbuild';
import copy from 'rollup-plugin-copy';

const weights = [100, 200, 300, 400, 500, 600, 700];

function buildWeightEntries(prefix = '') {
  const entries = {};

  for (const weight of weights) {
    const entryName = prefix ? `${prefix}/w${weight}` : `w${weight}`;
    const sourcePath = prefix ? `src/${prefix}/w${weight}.ts` : `src/w${weight}.ts`;
    entries[entryName] = sourcePath;
  }

  return entries;
}

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

const outlinedInput = {
  index: 'src/index.ts',
  createMaterialIcon: 'src/createMaterialIcon.ts',
  types: 'src/types.ts',
  ...buildIconEntries(),
  ...buildWeightEntries()
};

const roundedInput = {
  'rounded/index': 'src/rounded/index.ts',
  ...buildIconEntries('rounded'),
  ...buildWeightEntries('rounded')
};

const sharpInput = {
  'sharp/index': 'src/sharp/index.ts',
  ...buildIconEntries('sharp'),
  ...buildWeightEntries('sharp')
};

const jsInput = {
  ...outlinedInput,
  ...roundedInput,
  ...sharpInput
};

function createJsConfig() {
  return {
    input: jsInput,
    output: {
      dir: 'dist',
      format: 'esm',
      entryFileNames: '[name].js',
      preserveModules: true,
      preserveModulesRoot: 'src'
    },
    external: (id) => id === 'astro/compiler-runtime' || id.endsWith('.astro'),
    plugins: [
      resolve(),
      esbuild({
        tsconfig: './tsconfig.json'
      }),
      copy({
        targets: [
          { src: 'src/icon.astro', dest: 'dist' },
          { src: 'src/metadata', dest: 'dist' }
        ]
      })
    ]
  };
}

export default createJsConfig();
