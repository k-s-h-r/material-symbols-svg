import resolve from '@rollup/plugin-node-resolve';
import esbuild from 'rollup-plugin-esbuild';
import copy from 'rollup-plugin-copy';
import {
  buildStandardMaterialSymbolsInput,
  createMaterialSymbolsRollupConfig
} from '../../scripts/rollup-config-helpers.mjs';

export default createMaterialSymbolsRollupConfig({
  input: buildStandardMaterialSymbolsInput(),
  external: ['react', 'prop-types'],
  resolve,
  esbuild,
  copy,
  copyTargets: [{ src: 'src/metadata', dest: 'dist' }]
});
