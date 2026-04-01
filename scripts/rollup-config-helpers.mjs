/** @type {readonly number[]} */
export const weights = [100, 200, 300, 400, 500, 600, 700];

/**
 * @param {string} [prefix]
 * @returns {Record<string, string>}
 */
export function buildWeightEntries(prefix = '') {
  const entries = {};
  for (const weight of weights) {
    const entryName = prefix ? `${prefix}/w${weight}` : `w${weight}`;
    const sourcePath = prefix ? `src/${prefix}/w${weight}.ts` : `src/w${weight}.ts`;
    entries[entryName] = sourcePath;
  }
  return entries;
}

const outlinedBase = {
  index: 'src/index.ts',
  createMaterialIcon: 'src/createMaterialIcon.ts',
  types: 'src/types.ts'
};

/**
 * Builds the merged Rollup `input` map for outlined, rounded, and sharp variants.
 * Optional per-variant extras are spread before weight entries (same relative order as inline configs).
 *
 * @param {{
 *   outlinedExtra?: Record<string, string>;
 *   roundedExtra?: Record<string, string>;
 *   sharpExtra?: Record<string, string>;
 * }} [options]
 * @returns {Record<string, string>}
 */
export function buildStandardMaterialSymbolsInput(options = {}) {
  const { outlinedExtra = {}, roundedExtra = {}, sharpExtra = {} } = options;

  const outlinedInput = {
    ...outlinedBase,
    ...outlinedExtra,
    ...buildWeightEntries()
  };

  const roundedInput = {
    'rounded/index': 'src/rounded/index.ts',
    ...roundedExtra,
    ...buildWeightEntries('rounded')
  };

  const sharpInput = {
    'sharp/index': 'src/sharp/index.ts',
    ...sharpExtra,
    ...buildWeightEntries('sharp')
  };

  return {
    ...outlinedInput,
    ...roundedInput,
    ...sharpInput
  };
}

const materialSymbolsRollupOutput = {
  dir: 'dist',
  format: 'esm',
  entryFileNames: '[name].js',
  preserveModules: true,
  preserveModulesRoot: 'src'
};

/**
 * Rollup plugins are passed from each package config so resolution uses that package's dependencies.
 *
 * @param {{
 *   input: Record<string, string>;
 *   external: unknown;
 *   resolve: typeof import('@rollup/plugin-node-resolve').default;
 *   esbuild: typeof import('rollup-plugin-esbuild').default;
 *   copy: typeof import('rollup-plugin-copy').default;
 *   esbuildOptions?: Record<string, unknown>;
 *   copyTargets: Array<{ src: string | string[]; dest: string }>;
 * }} options
 */
export function createMaterialSymbolsRollupConfig({
  input,
  external,
  resolve,
  esbuild,
  copy,
  esbuildOptions = {},
  copyTargets
}) {
  return {
    input,
    output: materialSymbolsRollupOutput,
    external,
    plugins: [
      resolve(),
      esbuild({
        tsconfig: './tsconfig.json',
        ...esbuildOptions
      }),
      copy({
        targets: copyTargets
      })
    ]
  };
}
