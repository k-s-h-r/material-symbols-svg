import * as path from 'path';

/**
 * Mock SVG file content
 */
export function createMockSvgContent(iconName, pathData = 'M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z') {
  return `<svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48" fill="currentColor">
  <path d="${pathData}"/>
</svg>`;
}

/**
 * Mock metadata file content
 */
export function createMockMetadata(icons = ['home', 'search', 'settings']) {
  const metadata = {};
  icons.forEach(icon => {
    metadata[`action::${icon}`] = {
      name: icon,
      category: 'action',
      version: '1.0.0'
    };
  });
  return JSON.stringify(metadata, null, 2);
}

/**
 * Mock versions.json content
 */
export function createMockVersionsData(icons = ['home', 'search', 'settings']) {
  const versions = {};
  icons.forEach(icon => {
    versions[icon] = '1.0.0';
  });
  return JSON.stringify(versions, null, 2);
}

/**
 * Mock current_versions.json content
 */
export function createMockCurrentVersionsData(icons = ['home', 'search', 'settings']) {
  const currentVersions = {};
  icons.forEach(icon => {
    currentVersions[`action::${icon}`] = '1.0.0';
  });
  return JSON.stringify(currentVersions, null, 2);
}

/**
 * Create mock node_modules structure for testing
 */
export async function createMockNodeModules(tmpDir, icons = ['home', 'search'], styles = ['outlined'], weights = [400]) {
  const fs = await import('fs');
  
  for (const weight of weights) {
    const packageDir = path.join(tmpDir, `node_modules/@material-symbols/svg-${weight}`);
    
    for (const style of styles) {
      const styleDir = path.join(packageDir, style);
      await fs.promises.mkdir(styleDir, { recursive: true });
      
      for (const icon of icons) {
        // Regular variant
        const regularPath = path.join(styleDir, `${icon}.svg`);
        await fs.promises.writeFile(regularPath, createMockSvgContent(icon));
        
        // Filled variant (for some icons)
        if (icon === 'home') {
          const filledPath = path.join(styleDir, `${icon}-fill.svg`);
          await fs.promises.writeFile(filledPath, createMockSvgContent(`${icon}-fill`, 'M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2Z'));
        }
      }
    }
  }
}