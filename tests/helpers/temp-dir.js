import { dirSync } from 'tmp';
import * as path from 'path';

/**
 * Create a temporary directory for testing
 */
export async function createTempDir() {
  const tmpDir = dirSync({ unsafeCleanup: true });
  
  // Track temp directories for cleanup
  if (!global.testTmpDirs) {
    global.testTmpDirs = [];
  }
  global.testTmpDirs.push(tmpDir.name);
  
  return tmpDir.name;
}

/**
 * Create a temporary directory structure
 */
export async function createTempDirStructure(structure) {
  const tmpDir = await createTempDir();
  const fs = await import('fs');
  
  for (const [filePath, content] of Object.entries(structure)) {
    const fullPath = path.join(tmpDir, filePath);
    const dir = path.dirname(fullPath);
    
    // Create directory structure
    await fs.promises.mkdir(dir, { recursive: true });
    
    // Write file content
    if (typeof content === 'string') {
      await fs.promises.writeFile(fullPath, content);
    } else if (content === null) {
      // Just create directory
      await fs.promises.mkdir(fullPath, { recursive: true });
    }
  }
  
  return tmpDir;
}