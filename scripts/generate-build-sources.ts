import { generatePackageExports } from './generate-exports.ts';
import { generatePackageIcons } from './generate-icons.ts';
import { generateMetadata } from './generate-metadata.ts';
import { getIconPaths, type IconPathsResult } from './templates/common.ts';

const frameworks = ['astro', 'react', 'react-native', 'svelte', 'vue'];

async function generateBuildSources(framework?: string): Promise<void> {
  if (framework && !frameworks.includes(framework)) {
    throw new Error(`Unknown framework: ${framework}. Supported frameworks: ${frameworks.join(', ')}`);
  }

  const pathCache = new Map<string, IconPathsResult>();
  // Keep previews and paths in memory for this build so each SVG is read once.
  const readIconPaths: typeof getIconPaths = framework ? getIconPaths : (iconName, style) => {
    const key = `${style}/${iconName}`;
    const cached = pathCache.get(key);
    if (cached) {
      return cached;
    }
    const paths = getIconPaths(iconName, style);
    pathCache.set(key, paths);
    return paths;
  };

  if (!framework) {
    generateMetadata(readIconPaths);
  }

  for (const target of framework ? [framework] : frameworks) {
    await generatePackageIcons(target, readIconPaths);
    await generatePackageExports(target);
  }
}

generateBuildSources(process.argv[2]).catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
