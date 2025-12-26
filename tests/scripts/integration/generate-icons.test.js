import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import { createTempDir } from '../../helpers/temp-dir.js';
import { createMockNodeModules, createMockCurrentVersionsData } from '../../helpers/mock-utils.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('scripts/generate-icons.cjs', () => {
  let tmpDir;
  let originalCwd;
  let originalEnv;
  
  beforeEach(async () => {
    tmpDir = await createTempDir();
    originalCwd = process.cwd();
    originalEnv = { ...process.env };
    
    // Create mock project structure
    await createMockProjectStructure(tmpDir);
  });
  
  afterEach(() => {
    process.chdir(originalCwd);
    process.env = originalEnv;
  });

  async function createMockProjectStructure(tmpDir) {
    // Create packages directories
    const reactDir = path.join(tmpDir, 'packages/react/src');
    const reactRoundedDir = path.join(tmpDir, 'packages/react-rounded/src');
    const reactSharpDir = path.join(tmpDir, 'packages/react-sharp/src');
    
    await fs.promises.mkdir(reactDir, { recursive: true });
    await fs.promises.mkdir(reactRoundedDir, { recursive: true });
    await fs.promises.mkdir(reactSharpDir, { recursive: true });
    
    // Create scripts directory and copy common.js
    const scriptsDir = path.join(tmpDir, 'scripts');
    const templatesDir = path.join(scriptsDir, 'templates');
    await fs.promises.mkdir(templatesDir, { recursive: true });
    
    // Copy common.js to temp location
    const originalCommonPath = path.join(originalCwd, 'scripts/templates/common.js');
    const tempCommonPath = path.join(templatesDir, 'common.js');
    await fs.promises.copyFile(originalCommonPath, tempCommonPath);
    
    // Copy react-template.js to temp location
    const originalReactTemplatePath = path.join(originalCwd, 'scripts/templates/react-template.js');
    const tempReactTemplatePath = path.join(templatesDir, 'react-template.js');
    await fs.promises.copyFile(originalReactTemplatePath, tempReactTemplatePath);
    
    // Copy generate-icons.cjs to temp location
    const originalGenerateIconsPath = path.join(originalCwd, 'scripts/generate-icons.cjs');
    const tempGenerateIconsPath = path.join(scriptsDir, 'generate-icons.cjs');
    await fs.promises.copyFile(originalGenerateIconsPath, tempGenerateIconsPath);
    
    // Copy dev-icons.js to temp location
    const originalDevIconsPath = path.join(originalCwd, 'scripts/dev-icons.js');
    const tempDevIconsPath = path.join(scriptsDir, 'dev-icons.js');
    await fs.promises.copyFile(originalDevIconsPath, tempDevIconsPath);
    
    // Create metadata directory and source data
    const metadataDir = path.join(tmpDir, 'metadata/source');
    await fs.promises.mkdir(metadataDir, { recursive: true });
    
    const mockCurrentVersions = createMockCurrentVersionsData(['home', 'search', 'settings']);
    await fs.promises.writeFile(
      path.join(metadataDir, 'current_versions.json'),
      mockCurrentVersions
    );
    
    // Create mock node_modules
    await createMockNodeModules(tmpDir, ['home', 'search', 'settings'], ['outlined', 'rounded', 'sharp'], [400, 500]);
  }

  it('should generate icon files for a single style', async () => {
    process.chdir(tmpDir);
    
    // Run generate-icons.cjs for outlined style
    const scriptPath = path.join(tmpDir, 'scripts/generate-icons.cjs');
    const { stdout, stderr } = await execAsync(`node "${scriptPath}" outlined react`);
    
    expect(stderr).toBe('');
    expect(stdout).toContain('Processing outlined style');
    
    // Check that icon files were generated
    const iconsDir = path.join(tmpDir, 'packages/react/src/icons');
    const iconFiles = await fs.promises.readdir(iconsDir);
    
    expect(iconFiles).toContain('home.ts');
    expect(iconFiles).toContain('search.ts');
    expect(iconFiles).toContain('settings.ts');
    
    // Check file content
    const homeIconContent = await fs.promises.readFile(
      path.join(iconsDir, 'home.ts'),
      'utf8'
    );
    
    expect(homeIconContent).toContain('export default createMaterialIcon');
    expect(homeIconContent).toContain('pathData');
    expect(homeIconContent).toContain('regular:');
  });

  it('should generate metadata files', async () => {
    process.chdir(tmpDir);
    
    const scriptPath = path.join(tmpDir, 'scripts/generate-icons.cjs');
    await execAsync(`node "${scriptPath}" outlined react`);
    
    // Check metadata directory
    const metadataDir = path.join(tmpDir, 'packages/react/src/metadata');
    const metadataFiles = await fs.promises.readdir(metadataDir);
    
    expect(metadataFiles).toContain('icon-index.json');
    
    // Check metadata content
    const iconIndexContent = await fs.promises.readFile(
      path.join(metadataDir, 'icon-index.json'),
      'utf8'
    );
    
    const iconIndex = JSON.parse(iconIndexContent);
    expect(iconIndex).toHaveProperty('home');
    expect(iconIndex.home).toHaveProperty('name', 'home');
    expect(iconIndex.home).toHaveProperty('iconName', 'Home');
    expect(iconIndex.home).toHaveProperty('categories');
  });

  it('should work in development mode with limited icons', async () => {
    process.chdir(tmpDir);
    process.env.NODE_ENV = 'development';
    
    const scriptPath = path.join(tmpDir, 'scripts/generate-icons.cjs');
    const { stdout } = await execAsync(`node "${scriptPath}" outlined react`);
    
    expect(stdout).toContain('Processing'); // Should still process but with limited icons
    
    // Check that some icon files were generated (but limited)
    const iconsDir = path.join(tmpDir, 'packages/react/src/icons');
    const iconFiles = await fs.promises.readdir(iconsDir);
    
    // Should have generated files but limited in development
    expect(iconFiles.length).toBeGreaterThan(0);
    expect(iconFiles.length).toBeLessThanOrEqual(10); // Dev limit
  });

  it('should handle missing style argument', async () => {
    process.chdir(tmpDir);
    
    const scriptPath = path.join(tmpDir, 'scripts/generate-icons.cjs');
    
    // Run without style argument - should process all styles
    const { stdout } = await execAsync(`node "${scriptPath}"`);
    
    expect(stdout).toContain('Starting Material Symbols icon generation for all styles');
    expect(stdout).toContain('Processing outlined style');
    expect(stdout).toContain('Processing rounded style');
    expect(stdout).toContain('Processing sharp style');
  });

  it('should handle invalid style argument', async () => {
    process.chdir(tmpDir);
    
    const scriptPath = path.join(tmpDir, 'scripts/generate-icons.cjs');
    
    try {
      await execAsync(`node "${scriptPath}" invalid-style react`);
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).toContain('Unknown style: invalid-style');
    }
  });

  it('should handle invalid framework argument', async () => {
    process.chdir(tmpDir);
    
    const scriptPath = path.join(tmpDir, 'scripts/generate-icons.cjs');
    
    try {
      await execAsync(`node "${scriptPath}" outlined invalid-framework`);
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).toContain('Unknown framework: invalid-framework');
    }
  });

  it('should clean existing icons directory before generating', async () => {
    process.chdir(tmpDir);
    
    // Create existing file
    const iconsDir = path.join(tmpDir, 'packages/react/src/icons');
    await fs.promises.mkdir(iconsDir, { recursive: true });
    await fs.promises.writeFile(path.join(iconsDir, 'old-file.ts'), 'old content');
    
    const scriptPath = path.join(tmpDir, 'scripts/generate-icons.cjs');
    await execAsync(`node "${scriptPath}" outlined react`);
    
    // Check that old file was removed
    const iconFiles = await fs.promises.readdir(iconsDir);
    expect(iconFiles).not.toContain('old-file.ts');
    
    // Check that new files were generated
    expect(iconFiles).toContain('home.ts');
  });

  it('should generate different content for different styles', async () => {
    process.chdir(tmpDir);
    
    const scriptPath = path.join(tmpDir, 'scripts/generate-icons.cjs');
    
    // Generate outlined style
    await execAsync(`node "${scriptPath}" outlined react`);
    const outlinedContent = await fs.promises.readFile(
      path.join(tmpDir, 'packages/react/src/icons/home.ts'),
      'utf8'
    );
    
    // Generate rounded style
    await execAsync(`node "${scriptPath}" rounded react`);
    const roundedContent = await fs.promises.readFile(
      path.join(tmpDir, 'packages/react-rounded/src/icons/home.ts'),
      'utf8'
    );
    
    // Content should be different (different path data)
    expect(outlinedContent).not.toBe(roundedContent);
    
    // Both should have the same structure
    expect(outlinedContent).toContain('export default createMaterialIcon');
    expect(roundedContent).toContain('export default createMaterialIcon');
  });
});