import resolve from '@rollup/plugin-node-resolve';
import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';
import copy from 'rollup-plugin-copy';

const weights = [100, 200, 300, 400, 500, 600, 700];

const input = {
  'index': 'src/index.ts'
};

// weight別ファイルを追加
weights.forEach(weight => {
  input[`w${weight}`] = `src/w${weight}.ts`;
});

export default [
  // JavaScript build
  {
    input: input,
    output: {
      dir: 'dist',
      format: 'esm',
      entryFileNames: '[name].js',
      preserveModules: true,
      preserveModulesRoot: 'src'
    },
    external: ['vue'],
    plugins: [
      resolve(),
      esbuild({
        tsconfig: './tsconfig.json',
        target: 'es2019',
        sourceMap: true
      }),
      copy({
        targets: [
          { src: 'src/metadata', dest: 'dist' }
        ]
      })
    ]
  },
  // TypeScript declarations build
  {
    input: input,
    output: {
      dir: 'dist',
      format: 'esm',
      entryFileNames: '[name].d.ts',
      preserveModules: true,
      preserveModulesRoot: 'src'
    },
    external: ['vue'],
    plugins: [dts()]
  }
];