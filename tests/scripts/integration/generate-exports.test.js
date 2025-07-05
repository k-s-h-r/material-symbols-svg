import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import { createTempDir } from '../../helpers/temp-dir.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('scripts/generate-exports.cjs', () => {
  let tmpDir;
  let originalCwd;
  
  beforeEach(async () => {
    tmpDir = await createTempDir();
    originalCwd = process.cwd();
    
    await createMockProjectStructure(tmpDir);
  });
  
  afterEach(() => {
    process.chdir(originalCwd);
  });

  async function createMockProjectStructure(tmpDir) {
    // Create packages directories
    const reactDir = path.join(tmpDir, 'packages/react/src');
    await fs.promises.mkdir(reactDir, { recursive: true });
    
    // Create scripts directory
    const scriptsDir = path.join(tmpDir, 'scripts');
    const templatesDir = path.join(scriptsDir, 'templates');
    await fs.promises.mkdir(templatesDir, { recursive: true });
    
    // Copy react-template.js to temp location
    const originalReactTemplatePath = path.join(originalCwd, 'scripts/templates/react-template.js');
    const tempReactTemplatePath = path.join(templatesDir, 'react-template.js');
    await fs.promises.copyFile(originalReactTemplatePath, tempReactTemplatePath);
    
    // Copy generate-exports.cjs to temp location
    const originalGenerateExportsPath = path.join(originalCwd, 'scripts/generate-exports.cjs');
    const tempGenerateExportsPath = path.join(scriptsDir, 'generate-exports.cjs');
    await fs.promises.copyFile(originalGenerateExportsPath, tempGenerateExportsPath);
    
    // Create mock icon files
    const iconsDir = path.join(reactDir, 'icons');
    await fs.promises.mkdir(iconsDir, { recursive: true });
    
    const mockIconFiles = ['home.ts', 'search.ts', 'settings.ts', 'star.ts'];
    for (const file of mockIconFiles) {
      await fs.promises.writeFile(
        path.join(iconsDir, file),
        `export default createMaterialIcon(/* mock content */);`
      );
    }
  }

  it('should generate weight export files', async () => {
    process.chdir(tmpDir);
    
    const scriptPath = path.join(tmpDir, 'scripts/generate-exports.cjs');
    const { stdout, stderr } = await execAsync(`node "${scriptPath}" outlined react`);
    
    expect(stderr).toBe('');
    expect(stdout).toContain('Generating export entry points for style: outlined');
    
    // Check that weight files were generated
    const srcDir = path.join(tmpDir, 'packages/react/src');
    const files = await fs.promises.readdir(srcDir);
    
    expect(files).toContain('w100.ts');
    expect(files).toContain('w200.ts');
    expect(files).toContain('w300.ts');
    expect(files).toContain('w400.ts');
    expect(files).toContain('w500.ts');
    expect(files).toContain('w600.ts');
    expect(files).toContain('w700.ts');
    expect(files).toContain('index.ts');
  });

  it('should generate correct export content for weight files', async () => {
    process.chdir(tmpDir);
    
    const scriptPath = path.join(tmpDir, 'scripts/generate-exports.cjs');
    await execAsync(`node "${scriptPath}" outlined react`);
    
    // Check content of w400.ts
    const w400Content = await fs.promises.readFile(
      path.join(tmpDir, 'packages/react/src/w400.ts'),
      'utf8'
    );
    
    expect(w400Content).toContain('export { default as Home }');
    expect(w400Content).toContain('export { default as Search }');
    expect(w400Content).toContain('export { default as Settings }');
    expect(w400Content).toContain('export { default as Star }');
    
    // Each export should specify the weight (400)
    expect(w400Content).toContain('from \'./icons/home\';');
    expect(w400Content.match(/400/g)).toBeTruthy(); // Should contain weight reference
  });

  it('should generate different weight files with correct weight values', async () => {
    process.chdir(tmpDir);
    
    const scriptPath = path.join(tmpDir, 'scripts/generate-exports.cjs');
    await execAsync(`node "${scriptPath}" outlined react`);
    
    // Check content of different weight files
    const w100Content = await fs.promises.readFile(
      path.join(tmpDir, 'packages/react/src/w100.ts'),
      'utf8'
    );
    
    const w700Content = await fs.promises.readFile(
      path.join(tmpDir, 'packages/react/src/w700.ts'),
      'utf8'
    );
    
    // Both should have same exports but different weights
    expect(w100Content).toContain('export { default as Home }');
    expect(w700Content).toContain('export { default as Home }');
    
    // But they should reference different weights
    expect(w100Content).toContain('100');
    expect(w700Content).toContain('700');
    
    expect(w100Content).not.toContain('700');
    expect(w700Content).not.toContain('100');
  });

  it('should create index.ts as copy of w400.ts', async () => {
    process.chdir(tmpDir);
    
    const scriptPath = path.join(tmpDir, 'scripts/generate-exports.cjs');
    await execAsync(`node "${scriptPath}" outlined react`);
    
    // Check that index.ts exists and has same content as w400.ts
    const w400Content = await fs.promises.readFile(
      path.join(tmpDir, 'packages/react/src/w400.ts'),
      'utf8'
    );
    
    const indexContent = await fs.promises.readFile(
      path.join(tmpDir, 'packages/react/src/index.ts'),
      'utf8'
    );
    
    expect(indexContent).toBe(w400Content);
  });

  it('should handle kebab-case icon names correctly', async () => {
    process.chdir(tmpDir);
    
    // Create icon with kebab-case name
    const iconsDir = path.join(tmpDir, 'packages/react/src/icons');
    await fs.promises.writeFile(
      path.join(iconsDir, 'arrow-forward.ts'),
      `export default createMaterialIcon(/* mock content */);`
    );
    
    const scriptPath = path.join(tmpDir, 'scripts/generate-exports.cjs');
    await execAsync(`node "${scriptPath}" outlined react`);
    
    const w400Content = await fs.promises.readFile(
      path.join(tmpDir, 'packages/react/src/w400.ts'),
      'utf8'
    );
    
    // Should convert kebab-case to PascalCase
    expect(w400Content).toContain('export { default as ArrowForward }');
    expect(w400Content).toContain('from \'./icons/arrow-forward\';');
  });

  it('should require style argument', async () => {
    process.chdir(tmpDir);
    
    const scriptPath = path.join(tmpDir, 'scripts/generate-exports.cjs');
    
    try {
      await execAsync(`node "${scriptPath}"`);
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).toContain('Style argument is missing');
    }
  });

  it('should handle invalid style argument', async () => {
    process.chdir(tmpDir);
    
    const scriptPath = path.join(tmpDir, 'scripts/generate-exports.cjs');
    
    try {
      await execAsync(`node "${scriptPath}" invalid-style react`);
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).toContain('Unknown style: invalid-style');
    }
  });

  it('should handle invalid framework argument', async () => {
    process.chdir(tmpDir);
    
    const scriptPath = path.join(tmpDir, 'scripts/generate-exports.cjs');
    
    try {
      await execAsync(`node "${scriptPath}" outlined invalid-framework`);
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).toContain('Unknown framework: invalid-framework');
    }
  });

  it('should handle missing icons directory', async () => {
    process.chdir(tmpDir);
    
    // Remove icons directory
    const iconsDir = path.join(tmpDir, 'packages/react/src/icons');
    await fs.promises.rm(iconsDir, { recursive: true, force: true });
    
    const scriptPath = path.join(tmpDir, 'scripts/generate-exports.cjs');
    
    try {
      await execAsync(`node "${scriptPath}" outlined react`);
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.code).toBe(1); // Should exit with error code
    }
  });

  it('should filter out non-TypeScript files', async () => {
    process.chdir(tmpDir);
    
    // Add non-TypeScript files to icons directory
    const iconsDir = path.join(tmpDir, 'packages/react/src/icons');
    await fs.promises.writeFile(path.join(iconsDir, 'readme.md'), 'README');
    await fs.promises.writeFile(path.join(iconsDir, 'config.json'), '{}');
    await fs.promises.writeFile(path.join(iconsDir, 'script.js'), 'console.log()');
    
    const scriptPath = path.join(tmpDir, 'scripts/generate-exports.cjs');
    await execAsync(`node "${scriptPath}" outlined react`);
    
    const w400Content = await fs.promises.readFile(
      path.join(tmpDir, 'packages/react/src/w400.ts'),
      'utf8'
    );
    
    // Should only include .ts files
    expect(w400Content).toContain('export { default as Home }');
    expect(w400Content).not.toContain('readme');
    expect(w400Content).not.toContain('config');
    expect(w400Content).not.toContain('script');
  });

  it('should handle empty icons directory', async () => {
    process.chdir(tmpDir);
    
    // Remove all icon files
    const iconsDir = path.join(tmpDir, 'packages/react/src/icons');
    const files = await fs.promises.readdir(iconsDir);
    for (const file of files) {
      await fs.promises.unlink(path.join(iconsDir, file));
    }
    
    const scriptPath = path.join(tmpDir, 'scripts/generate-exports.cjs');
    await execAsync(`node "${scriptPath}" outlined react`);
    
    // Should generate empty export files
    const w400Content = await fs.promises.readFile(
      path.join(tmpDir, 'packages/react/src/w400.ts'),
      'utf8'
    );
    
    // Should have basic structure but no exports
    expect(w400Content).toBeTruthy();
    expect(w400Content).not.toContain('export { default as');
  });
});