import resolve from '@rollup/plugin-node-resolve';
import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';

export default [
  // JavaScript build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'esm'
    },
    external: ['vue'],
    plugins: [
      resolve(),
      esbuild({
        tsconfig: './tsconfig.json',
        target: 'es2019',
        sourceMap: true
      })
    ]
  },
  // TypeScript declarations build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'esm'
    },
    external: ['vue'],
    plugins: [dts()]
  }
];