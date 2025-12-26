import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import { createTempDir } from '../../helpers/temp-dir.js';
import { createMockNodeModules, createMockCurrentVersionsData } from '../../helpers/mock-utils.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('scripts/generate-metadata.cjs', () => {
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
    // Create packages/metadata directory
    const metadataDir = path.join(tmpDir, 'packages/metadata');
    await fs.promises.mkdir(metadataDir, { recursive: true });
    
    // Create scripts directory
    const scriptsDir = path.join(tmpDir, 'scripts');
    const templatesDir = path.join(scriptsDir, 'templates');
    await fs.promises.mkdir(templatesDir, { recursive: true });
    
    // Copy common.js to temp location
    const originalCommonPath = path.join(originalCwd, 'scripts/templates/common.js');
    const tempCommonPath = path.join(templatesDir, 'common.js');
    await fs.promises.copyFile(originalCommonPath, tempCommonPath);
    
    // Copy generate-metadata.cjs to temp location
    const originalGenerateMetadataPath = path.join(originalCwd, 'scripts/generate-metadata.cjs');
    const tempGenerateMetadataPath = path.join(scriptsDir, 'generate-metadata.cjs');
    await fs.promises.copyFile(originalGenerateMetadataPath, tempGenerateMetadataPath);
    
    // Create metadata source directory and files
    const sourceDir = path.join(tmpDir, 'metadata/source');
    await fs.promises.mkdir(sourceDir, { recursive: true });
    
    const mockCurrentVersions = createMockCurrentVersionsData(['home', 'search', 'settings', 'star']);
    await fs.promises.writeFile(
      path.join(sourceDir, 'current_versions.json'),
      mockCurrentVersions
    );
    
    // Create search-terms.json (optional)
    const searchTerms = {
      home: ['house', 'building', 'residence'],
      search: ['find', 'look', 'query'],
      settings: ['config', 'preferences', 'options']
    };
    await fs.promises.writeFile(
      path.join(tmpDir, 'metadata/search-terms.json'),
      JSON.stringify(searchTerms, null, 2)
    );
    
    // Create mock node_modules
    await createMockNodeModules(tmpDir, ['home', 'search', 'settings', 'star'], ['outlined', 'rounded', 'sharp'], [400, 500, 600]);
  }

  it('should generate consolidated metadata files', async () => {
    process.chdir(tmpDir);
    
    const scriptPath = path.join(tmpDir, 'scripts/generate-metadata.cjs');
    const { stdout, stderr } = await execAsync(`node "${scriptPath}"`);
    
    expect(stderr).toBe('');
    expect(stdout).toContain('Starting consolidated metadata generation');
    expect(stdout).toContain('Generated consolidated metadata');
    
    // Check that metadata files were generated
    const metadataDir = path.join(tmpDir, 'packages/metadata');
    const files = await fs.promises.readdir(metadataDir);
    
    expect(files).toContain('icon-index.json');
    expect(files).toContain('paths');
    
    // Check paths directory
    const pathsDir = path.join(metadataDir, 'paths');
    const pathFiles = await fs.promises.readdir(pathsDir);
    
    expect(pathFiles).toContain('home.json');
    expect(pathFiles).toContain('search.json');
    expect(pathFiles).toContain('settings.json');
    expect(pathFiles).toContain('star.json');
  });

  it('should generate correct icon index structure', async () => {
    process.chdir(tmpDir);
    
    const scriptPath = path.join(tmpDir, 'scripts/generate-metadata.cjs');
    await execAsync(`node "${scriptPath}"`);
    
    // Check icon-index.json content
    const iconIndexPath = path.join(tmpDir, 'packages/metadata/icon-index.json');
    const iconIndexContent = await fs.promises.readFile(iconIndexPath, 'utf8');
    const iconIndex = JSON.parse(iconIndexContent);
    
    expect(iconIndex).toHaveProperty('home');
    expect(iconIndex.home).toHaveProperty('name', 'home');
    expect(iconIndex.home).toHaveProperty('iconName', 'Home');
    expect(iconIndex.home).toHaveProperty('categories');
    expect(Array.isArray(iconIndex.home.categories)).toBe(true);
    
    // Check search terms inclusion
    expect(iconIndex.home).toHaveProperty('searchTerms');
    expect(iconIndex.home.searchTerms).toContain('house');
    expect(iconIndex.home.searchTerms).toContain('building');
  });

  it('should generate correct path data files', async () => {
    process.chdir(tmpDir);
    
    const scriptPath = path.join(tmpDir, 'scripts/generate-metadata.cjs');
    await execAsync(`node "${scriptPath}"`);
    
    // Check individual path file
    const homePathPath = path.join(tmpDir, 'packages/metadata/paths/home.json');
    const homePathContent = await fs.promises.readFile(homePathPath, 'utf8');
    const homePathData = JSON.parse(homePathContent);
    
    // Should have data for all styles
    expect(homePathData).toHaveProperty('outlined');
    expect(homePathData).toHaveProperty('rounded');
    expect(homePathData).toHaveProperty('sharp');
    
    // Each style should have outline and fill data
    expect(homePathData.outlined).toHaveProperty('outline');
    expect(homePathData.outlined).toHaveProperty('fill');
    
    // Should have weight data
    expect(homePathData.outlined.outline).toHaveProperty('w400');
    expect(homePathData.outlined.outline).toHaveProperty('w500');
    expect(homePathData.outlined.outline).toHaveProperty('w600');
    
    // Path data should be strings
    expect(typeof homePathData.outlined.outline.w400).toBe('string');
  });

  it('should handle icons without search terms', async () => {
    process.chdir(tmpDir);
    
    // Remove search-terms.json to test fallback
    await fs.promises.unlink(path.join(tmpDir, 'metadata/search-terms.json'));
    
    const scriptPath = path.join(tmpDir, 'scripts/generate-metadata.cjs');
    const { stdout } = await execAsync(`node "${scriptPath}"`);
    
    expect(stdout).toContain('No search terms file found');
    
    // Check that icon index still works without search terms
    const iconIndexPath = path.join(tmpDir, 'packages/metadata/icon-index.json');
    const iconIndexContent = await fs.promises.readFile(iconIndexPath, 'utf8');
    const iconIndex = JSON.parse(iconIndexContent);
    
    expect(iconIndex).toHaveProperty('home');
    expect(iconIndex.home).toHaveProperty('name', 'home');
    expect(iconIndex.home).toHaveProperty('iconName', 'Home');
    
    // Should not have searchTerms property
    expect(iconIndex.home).not.toHaveProperty('searchTerms');
  });

  it('should categorize icons correctly', async () => {
    process.chdir(tmpDir);
    
    const scriptPath = path.join(tmpDir, 'scripts/generate-metadata.cjs');
    await execAsync(`node "${scriptPath}"`);
    
    const iconIndexPath = path.join(tmpDir, 'packages/metadata/icon-index.json');
    const iconIndexContent = await fs.promises.readFile(iconIndexPath, 'utf8');
    const iconIndex = JSON.parse(iconIndexContent);
    
    // Check that categories are assigned from current_versions.json
    expect(iconIndex.home.categories).toContain('action'); // From our mock data
    expect(iconIndex.search.categories).toContain('action');
    expect(iconIndex.settings.categories).toContain('action');
  });

  it('should handle missing source data gracefully', async () => {
    process.chdir(tmpDir);
    
    // Remove source data file
    await fs.promises.unlink(path.join(tmpDir, 'metadata/source/current_versions.json'));
    
    const scriptPath = path.join(tmpDir, 'scripts/generate-metadata.cjs');
    
    try {
      await execAsync(`node "${scriptPath}"`);
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.code).toBe(1); // Should exit with error code
    }
  });

  it('should clean existing paths directory before generating', async () => {
    process.chdir(tmpDir);
    
    // Create existing file in paths directory
    const pathsDir = path.join(tmpDir, 'packages/metadata/paths');
    await fs.promises.mkdir(pathsDir, { recursive: true });
    await fs.promises.writeFile(path.join(pathsDir, 'old-file.json'), '{"old": "data"}');
    
    const scriptPath = path.join(tmpDir, 'scripts/generate-metadata.cjs');
    await execAsync(`node "${scriptPath}"`);
    
    // Check that old file was removed
    const pathFiles = await fs.promises.readdir(pathsDir);
    expect(pathFiles).not.toContain('old-file.json');
    
    // Check that new files were generated
    expect(pathFiles).toContain('home.json');
  });

  it('should process correct number of icons', async () => {
    process.chdir(tmpDir);
    
    const scriptPath = path.join(tmpDir, 'scripts/generate-metadata.cjs');
    const { stdout } = await execAsync(`node "${scriptPath}"`);
    
    // Should process 4 icons (home, search, settings, star)
    expect(stdout).toContain('Processing 4 unique icons');
    expect(stdout).toContain('Generated 4 individual metadata files');
    expect(stdout).toContain('Unique icons: 4');
  });

  it('should include search terms when available', async () => {
    process.chdir(tmpDir);
    
    const scriptPath = path.join(tmpDir, 'scripts/generate-metadata.cjs');
    const { stdout } = await execAsync(`node "${scriptPath}"`);
    
    expect(stdout).toContain('Loaded search terms for 3 icons'); // home, search, settings have search terms
    expect(stdout).toContain('Icons with search terms: 3/4'); // 3 out of 4 icons have search terms
  });

  it('should handle invalid search terms file gracefully', async () => {
    process.chdir(tmpDir);
    
    // Create invalid search terms file
    await fs.promises.writeFile(
      path.join(tmpDir, 'metadata/search-terms.json'),
      'invalid json content'
    );
    
    const scriptPath = path.join(tmpDir, 'scripts/generate-metadata.cjs');
    const { stdout } = await execAsync(`node "${scriptPath}"`);
    
    expect(stdout).toContain('Could not parse search terms file');
    
    // Should still generate metadata without search terms
    const iconIndexPath = path.join(tmpDir, 'packages/metadata/icon-index.json');
    const iconIndexContent = await fs.promises.readFile(iconIndexPath, 'utf8');
    const iconIndex = JSON.parse(iconIndexContent);
    
    expect(iconIndex).toHaveProperty('home');
    expect(iconIndex.home).not.toHaveProperty('searchTerms');
  });
});