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
    external: ['react', 'react-native-svg'],
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

export default createJsConfig();
