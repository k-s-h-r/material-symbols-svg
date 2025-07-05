import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import { createTempDir } from '../../helpers/temp-dir.js';
import { createMockCurrentVersionsData, createMockVersionsData } from '../../helpers/mock-utils.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import nock from 'nock';

const execAsync = promisify(exec);

describe('scripts/update-metadata.cjs', () => {
  let tmpDir;
  let originalCwd;
  
  beforeEach(async () => {
    tmpDir = await createTempDir();
    originalCwd = process.cwd();
    
    await createMockProjectStructure(tmpDir);
    setupNockMocks();
  });
  
  afterEach(() => {
    process.chdir(originalCwd);
    nock.cleanAll();
  });

  function setupNockMocks() {
    // Mock current_versions.json from Google
    const mockCurrentVersions = JSON.parse(createMockCurrentVersionsData(['home', 'search', 'settings']));
    nock('https://raw.githubusercontent.com')
      .get('/google/material-design-icons/master/update/current_versions.json')
      .reply(200, mockCurrentVersions);

    // Mock versions.json from marella
    const mockVersions = JSON.parse(createMockVersionsData(['home', 'search', 'settings']));
    nock('https://raw.githubusercontent.com')
      .get('/marella/material-symbols/main/metadata/versions.json')
      .reply(200, mockVersions);
  }

  async function createMockProjectStructure(tmpDir) {
    // Create scripts directory
    const scriptsDir = path.join(tmpDir, 'scripts');
    await fs.promises.mkdir(scriptsDir, { recursive: true });
    
    // Copy update-metadata.cjs to temp location
    const originalUpdateMetadataPath = path.join(originalCwd, 'scripts/update-metadata.cjs');
    const tempUpdateMetadataPath = path.join(scriptsDir, 'update-metadata.cjs');
    await fs.promises.copyFile(originalUpdateMetadataPath, tempUpdateMetadataPath);
    
    // Create metadata directory
    const metadataDir = path.join(tmpDir, 'metadata');
    await fs.promises.mkdir(metadataDir, { recursive: true });
    
    // Create packages/metadata directory
    const packagesMetadataDir = path.join(tmpDir, 'packages/metadata');
    await fs.promises.mkdir(packagesMetadataDir, { recursive: true });
    
    // Create existing icon-index.json
    const existingIconIndex = {
      home: {
        name: 'home',
        iconName: 'Home',
        categories: ['places'],
        version: '0.9.0'
      },
      old_icon: {
        name: 'old_icon',
        iconName: 'OldIcon',
        categories: ['action'],
        version: '0.9.0'
      }
    };
    await fs.promises.writeFile(
      path.join(metadataDir, 'icon-index.json'),
      JSON.stringify(existingIconIndex, null, 2)
    );
  }

  it('should fetch and update metadata from upstream sources', async () => {
    process.chdir(tmpDir);
    
    const scriptPath = path.join(tmpDir, 'scripts/update-metadata.cjs');
    const { stdout, stderr } = await execAsync(`node "${scriptPath}"`);
    
    expect(stderr).toBe('');
    expect(stdout).toContain('Starting metadata update');
    expect(stdout).toContain('Fetching upstream metadata');
    expect(stdout).toContain('Updated icon index');
    expect(stdout).toContain('Metadata update completed successfully');
    
    // Verify all nock interceptors were called
    expect(nock.isDone()).toBe(true);
  });

  it('should save upstream data to source directory', async () => {
    process.chdir(tmpDir);
    
    const scriptPath = path.join(tmpDir, 'scripts/update-metadata.cjs');
    await execAsync(`node "${scriptPath}"`);
    
    // Check that source files were saved
    const sourceDir = path.join(tmpDir, 'metadata/source');
    const sourceFiles = await fs.promises.readdir(sourceDir);
    
    expect(sourceFiles).toContain('current_versions.json');
    expect(sourceFiles).toContain('versions.json');
    
    // Verify content
    const currentVersionsContent = await fs.promises.readFile(
      path.join(sourceDir, 'current_versions.json'),
      'utf8'
    );
    const currentVersions = JSON.parse(currentVersionsContent);
    expect(currentVersions).toHaveProperty('action::home');
  });

  it('should update icon index with new metadata', async () => {
    process.chdir(tmpDir);
    
    const scriptPath = path.join(tmpDir, 'scripts/update-metadata.cjs');
    await execAsync(`node "${scriptPath}"`);
    
    // Check updated icon index
    const iconIndexPath = path.join(tmpDir, 'metadata/icon-index.json');
    const iconIndexContent = await fs.promises.readFile(iconIndexPath, 'utf8');
    const iconIndex = JSON.parse(iconIndexContent);
    
    // Should have new icons
    expect(iconIndex).toHaveProperty('home');
    expect(iconIndex).toHaveProperty('search');
    expect(iconIndex).toHaveProperty('settings');
    
    // Should not have old icon that was removed
    expect(iconIndex).not.toHaveProperty('old_icon');
    
    // Check icon structure
    expect(iconIndex.home).toHaveProperty('name', 'home');
    expect(iconIndex.home).toHaveProperty('iconName', 'Home');
    expect(iconIndex.home).toHaveProperty('categories');
    expect(iconIndex.home).toHaveProperty('version', '1.0.0');
  });

  it('should detect and record changes', async () => {
    process.chdir(tmpDir);
    
    const scriptPath = path.join(tmpDir, 'scripts/update-metadata.cjs');
    const { stdout } = await execAsync(`node "${scriptPath}"`);
    
    // Should report changes
    expect(stdout).toContain('Update Summary:');
    expect(stdout).toContain('Added:');
    expect(stdout).toContain('Removed:');
    
    // Check update history file
    const historyPath = path.join(tmpDir, 'metadata/update-history.json');
    const historyContent = await fs.promises.readFile(historyPath, 'utf8');
    const history = JSON.parse(historyContent);
    
    expect(history).toHaveProperty('updates');
    expect(Array.isArray(history.updates)).toBe(true);
    expect(history.updates.length).toBeGreaterThan(0);
    
    const latestUpdate = history.updates[0];
    expect(latestUpdate).toHaveProperty('timestamp');
    expect(latestUpdate).toHaveProperty('added');
    expect(latestUpdate).toHaveProperty('updated');
    expect(latestUpdate).toHaveProperty('removed');
    
    // Should have detected new icons
    expect(latestUpdate.added).toContainEqual(
      expect.objectContaining({ name: 'search' })
    );
    expect(latestUpdate.added).toContainEqual(
      expect.objectContaining({ name: 'settings' })
    );
    
    // Should have detected removed icon
    expect(latestUpdate.removed).toContainEqual(
      expect.objectContaining({ name: 'old_icon' })
    );
  });

  it('should copy update history to packages/metadata', async () => {
    process.chdir(tmpDir);
    
    const scriptPath = path.join(tmpDir, 'scripts/update-metadata.cjs');
    await execAsync(`node "${scriptPath}"`);
    
    // Check that history was copied to packages/metadata
    const packageHistoryPath = path.join(tmpDir, 'packages/metadata/update-history.json');
    const packageHistoryContent = await fs.promises.readFile(packageHistoryPath, 'utf8');
    
    const metadataHistoryPath = path.join(tmpDir, 'metadata/update-history.json');
    const metadataHistoryContent = await fs.promises.readFile(metadataHistoryPath, 'utf8');
    
    // Both files should have the same content
    expect(packageHistoryContent).toBe(metadataHistoryContent);
  });

  it('should handle HTTP errors gracefully', async () => {
    // Override mocks to return error
    nock.cleanAll();
    nock('https://raw.githubusercontent.com')
      .get('/google/material-design-icons/master/update/current_versions.json')
      .reply(404, 'Not Found');
    
    process.chdir(tmpDir);
    
    const scriptPath = path.join(tmpDir, 'scripts/update-metadata.cjs');
    
    try {
      await execAsync(`node "${scriptPath}"`);
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.code).toBe(1); // Should exit with error code
      expect(error.message).toContain('Error updating metadata');
    }
  });

  it('should skip history update when no changes detected', async () => {
    process.chdir(tmpDir);
    
    // Set up mocks to return same data as existing
    nock.cleanAll();
    
    const existingData = {
      'action::home': '0.9.0',
      'action::old_icon': '0.9.0'
    };
    
    const versionsData = {
      home: '0.9.0',
      old_icon: '0.9.0'
    };
    
    nock('https://raw.githubusercontent.com')
      .get('/google/material-design-icons/master/update/current_versions.json')
      .reply(200, existingData);
    
    nock('https://raw.githubusercontent.com')
      .get('/marella/material-symbols/main/metadata/versions.json')
      .reply(200, versionsData);
    
    const scriptPath = path.join(tmpDir, 'scripts/update-metadata.cjs');
    const { stdout } = await execAsync(`node "${scriptPath}"`);
    
    expect(stdout).toContain('No changes detected, skipping history update');
    expect(stdout).toContain('Added: 0');
    expect(stdout).toContain('Updated: 0');
    expect(stdout).toContain('Removed: 0');
  });

  it('should categorize icons correctly from current_versions', async () => {
    process.chdir(tmpDir);
    
    const scriptPath = path.join(tmpDir, 'scripts/update-metadata.cjs');
    await execAsync(`node "${scriptPath}"`);
    
    const iconIndexPath = path.join(tmpDir, 'metadata/icon-index.json');
    const iconIndexContent = await fs.promises.readFile(iconIndexPath, 'utf8');
    const iconIndex = JSON.parse(iconIndexContent);
    
    // Icons should be categorized as 'action' based on our mock data
    expect(iconIndex.home.categories).toContain('action');
    expect(iconIndex.search.categories).toContain('action');
    expect(iconIndex.settings.categories).toContain('action');
  });

  it('should handle icons without categories gracefully', async () => {
    // Override mocks to return minimal data
    nock.cleanAll();
    
    const mockCurrentVersions = {}; // No category data
    const mockVersions = { uncategorized_icon: '1.0.0' };
    
    nock('https://raw.githubusercontent.com')
      .get('/google/material-design-icons/master/update/current_versions.json')
      .reply(200, mockCurrentVersions);
    
    nock('https://raw.githubusercontent.com')
      .get('/marella/material-symbols/main/metadata/versions.json')
      .reply(200, mockVersions);
    
    process.chdir(tmpDir);
    
    const scriptPath = path.join(tmpDir, 'scripts/update-metadata.cjs');
    await execAsync(`node "${scriptPath}"`);
    
    const iconIndexPath = path.join(tmpDir, 'metadata/icon-index.json');
    const iconIndexContent = await fs.promises.readFile(iconIndexPath, 'utf8');
    const iconIndex = JSON.parse(iconIndexContent);
    
    // Icon without category should get 'general' category
    expect(iconIndex.uncategorized_icon.categories).toContain('general');
  });

  it('should limit update history to 100 entries', async () => {
    process.chdir(tmpDir);
    
    // Create existing history with many entries
    const existingHistory = {
      updates: Array.from({ length: 105 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 1000).toISOString(),
        added: [],
        updated: [],
        removed: []
      }))
    };
    
    await fs.promises.writeFile(
      path.join(tmpDir, 'metadata/update-history.json'),
      JSON.stringify(existingHistory, null, 2)
    );
    
    const scriptPath = path.join(tmpDir, 'scripts/update-metadata.cjs');
    await execAsync(`node "${scriptPath}"`);
    
    const historyPath = path.join(tmpDir, 'metadata/update-history.json');
    const historyContent = await fs.promises.readFile(historyPath, 'utf8');
    const history = JSON.parse(historyContent);
    
    // Should be limited to 100 entries
    expect(history.updates.length).toBe(100);
  });
});