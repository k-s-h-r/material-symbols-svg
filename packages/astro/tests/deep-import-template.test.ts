import { describe, expect, it } from 'vitest';
import { generateIconFileContent } from '../../../scripts/templates/astro-template.ts';
import type { IconPathsResult } from '../../../scripts/templates/common.ts';

const samplePaths: IconPathsResult = {
  regular: {
    100: 'M0 0h1',
    200: 'M0 0h2',
    300: 'M0 0h3',
    400: 'M0 0h4',
    500: 'M0 0h5',
    600: 'M0 0h6',
    700: 'M0 0h7',
  },
  filled: {
    100: 'M1 0h1',
    200: 'M1 0h2',
    300: 'M1 0h3',
    400: 'M1 0h4',
    500: 'M1 0h5',
    600: 'M1 0h6',
    700: 'M1 0h7',
  },
  previews: {
    regular: {
      100: 'preview-100',
      200: 'preview-200',
      300: 'preview-300',
      400: 'preview-400',
      500: 'preview-500',
      600: 'preview-600',
      700: 'preview-700',
    },
    filled: {
      100: 'filled-preview-100',
      200: 'filled-preview-200',
      300: 'filled-preview-300',
      400: 'filled-preview-400',
      500: 'filled-preview-500',
      600: 'filled-preview-600',
      700: 'filled-preview-700',
    },
  },
  hasFilledVariant: true,
  hasActualFilledFile: true,
  name: 'home',
};

describe('astro deep import aliases', () => {
  it('exports W400 aliases', () => {
    const content = generateIconFileContent('home', 'outlined', samplePaths, false, {
      createIconPath: '../createMaterialIcon',
      typeExportPath: '../types',
    });

    expect(content).toContain('export { HomeW400 as Home, HomeFillW400 as HomeFill };');
  });
});
