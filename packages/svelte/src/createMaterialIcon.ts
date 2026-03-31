import Icon from './icon.svelte';
import type { InternalIconProps, MaterialSymbolsComponent } from './types';

export type { IconProps, MaterialSymbolsComponent } from './types';

/**
 * Create a Material Symbol icon component for Svelte.
 * @param iconName - The name of the icon
 * @param pathData - The SVG path data
 */
export default function createMaterialIcon(
  iconName: string,
  pathData: string,
): MaterialSymbolsComponent {
  const MaterialIcon: MaterialSymbolsComponent = ((internals, props) => {
    const mergedProps: InternalIconProps = {
      iconName,
      pathData,
      ...props
    };

    return Icon(internals, mergedProps);
  }) as MaterialSymbolsComponent;

  return MaterialIcon;
}
