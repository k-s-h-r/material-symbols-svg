import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

export default [
  // JavaScript build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'esm',
      sourcemap: true
    },
    external: ['react'],
    plugins: [
      resolve(),
      typescript({
        tsconfig: './tsconfig.json',
        sourceMap: true,
        declaration: false
      })
    ]
  },
  // TypeScript declarations
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'esm'
    },
    external: ['react'],
    plugins: [dts()]
  }
];