import resolve from '@rollup/plugin-node-resolve';
import esbuild from 'rollup-plugin-esbuild';
import copy from 'rollup-plugin-copy';
import {
  buildStandardMaterialSymbolsInput,
  createMaterialSymbolsRollupConfig
} from '../../scripts/rollup-config-helpers.mjs';

export default createMaterialSymbolsRollupConfig({
  input: buildStandardMaterialSymbolsInput(),
  external: ['vue'],
  resolve,
  esbuild,
  copy,
  esbuildOptions: {
    target: 'es2019',
    sourceMap: true
  },
  copyTargets: [{ src: 'src/metadata', dest: 'dist' }]
});
