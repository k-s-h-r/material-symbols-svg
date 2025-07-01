const fs = require('fs');
const path = require('path');

// --- 定数 ---
const WEIGHTS = [100, 200, 300, 400, 500, 600, 700];

/**
 * Convert kebab-case to PascalCase and ensure valid JavaScript identifier
 */
function toPascalCase(str) {
  let result = str
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
  
  // If the name starts with a number, prefix with 'Icon'
  if (/^\d/.test(result)) {
    result = 'Icon' + result;
  }
  
  return result;
}

/**
 * Generate base64 encoded SVG for preview
 */
function base64SVG(svgContents) {
  return Buffer.from(
    svgContents
      .replace('<svg', '<svg style="background-color: #fff;"')
      .replace('width="48"', 'width="24"')
      .replace('height="48"', 'height="24"')
      .replace('\n', '')
      .replace(
        'fill="currentColor"',
        'fill="#000"',
      ),
  ).toString('base64');
}

/**
 * Get icon paths and metadata for all weights
 */
function getIconPaths(iconName, style) {
  const paths = { regular: {}, filled: {} };
  const previews = { regular: {}, filled: {} };
  let hasFilledVariant = false;
  let hasActualFilledFile = false;

  for (const weight of WEIGHTS) {
    const basePath = path.join(__dirname, `../../node_modules/@material-symbols/svg-${weight}/${style}`);
    const regularPath = path.join(basePath, `${iconName}.svg`);
    const filledPath = path.join(basePath, `${iconName}-fill.svg`); // Material Symbols uses -fill suffix

    if (fs.existsSync(regularPath)) {
      const regularSvg = fs.readFileSync(regularPath, 'utf8');
      paths.regular[weight] = regularSvg.match(/ d="(.*?)"/)?.[1];
      previews.regular[weight] = base64SVG(regularSvg);
    }

    if (fs.existsSync(filledPath)) {
      const filledSvg = fs.readFileSync(filledPath, 'utf8');
      paths.filled[weight] = filledSvg.match(/ d="(.*?)"/)?.[1];
      previews.filled[weight] = base64SVG(filledSvg);
      hasFilledVariant = true;
      hasActualFilledFile = true;
    } else {
      // Always create filled data (fallback to regular for individual package files)
      paths.filled[weight] = paths.regular[weight];
      previews.filled[weight] = previews.regular[weight];
      hasFilledVariant = true; // Material Symbols conceptually always has fill variants
    }
  }
  return { ...paths, previews, hasFilledVariant, hasActualFilledFile };
}

/**
 * Check if regular and filled paths are identical
 */
function arePathsIdentical(paths) {
  for (const weight of WEIGHTS) {
    if (paths.regular[weight] !== paths.filled[weight]) {
      return false;
    }
  }
  return true;
}

/**
 * Generate common metadata for an icon
 */
function generateIconMetadata(iconName, style) {
  const componentName = toPascalCase(iconName);
  
  return {
    name: iconName,
    componentName: componentName,
    style: style,
    category: iconName.includes('arrow') ? 'navigation' : 
              iconName.includes('home') ? 'places' : 
              iconName.includes('person') || iconName.includes('account') ? 'social' : 'action',
    weights: WEIGHTS
  };
}

/**
 * Generate path data string (common for both React and Vue)
 */
function generatePathDataString(componentName, style, paths, isIdentical) {
  const metadata = generateIconMetadata(paths.name || componentName.toLowerCase(), style);
  
  let pathDataString = `/**
 * ${componentName} - Material Symbol (${style})
 * @category ${metadata.category}
 * @style ${style}
 * @weights ${WEIGHTS.join(', ')}
 * @filled ${paths.hasFilledVariant ? 'Available' : 'Uses regular variant'}
 */
const pathData = {\n  regular: ${JSON.stringify(paths.regular, null, 2)}`;
  
  if (!isIdentical) {
    pathDataString += `,\n  filled: ${JSON.stringify(paths.filled, null, 2)}`;
  }
  pathDataString += `\n};\n\n`;

  const metadataString = `const metadata = ${JSON.stringify({
    ...metadata,
    hasFilledVariant: paths.hasFilledVariant
  }, null, 2)};\n\n`;

  return { pathDataString, metadataString, metadata };
}

module.exports = {
  WEIGHTS,
  toPascalCase,
  base64SVG,
  getIconPaths,
  arePathsIdentical,
  generateIconMetadata,
  generatePathDataString
};