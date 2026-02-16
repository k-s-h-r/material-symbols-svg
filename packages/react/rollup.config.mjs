import resolve from '@rollup/plugin-node-resolve';
import dts from 'rollup-plugin-dts';
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

const outlinedInput = {
  index: 'src/index.ts',
  createMaterialIcon: 'src/createMaterialIcon.ts',
  types: 'src/types.ts',
  ...buildWeightEntries()
};

const roundedInput = {
  'rounded/index': 'src/rounded/index.ts',
  ...buildWeightEntries('rounded')
};

const sharpInput = {
  'sharp/index': 'src/sharp/index.ts',
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
    external: ['react', 'prop-types'],
    plugins: [
      resolve(),
      esbuild({
        tsconfig: './tsconfig.json'
      }),
      copy({
        targets: [
          { src: 'src/metadata', dest: 'dist' }
        ]
      })
    ]
  };
}

function createDtsConfig(input) {
  return {
    input,
    output: {
      dir: 'dist',
      format: 'esm',
      entryFileNames: '[name].d.ts',
      preserveModules: true,
      preserveModulesRoot: 'src'
    },
    external: ['react', 'prop-types'],
    plugins: [dts()]
  };
}

export default [
  createJsConfig(),
  createDtsConfig(outlinedInput),
  createDtsConfig(roundedInput),
  createDtsConfig(sharpInput)
];
