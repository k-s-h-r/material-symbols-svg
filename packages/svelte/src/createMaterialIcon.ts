import type { ComponentConstructorOptions } from 'svelte';
import { asClassComponent } from 'svelte/legacy';
import Icon from './icon.svelte';
import type { IconProps, InternalIconProps, MaterialSymbolsComponent } from './types';

export { type IconProps, type MaterialSymbolsComponent };

/**
 * Create a Material Symbol icon component for Svelte.
 * @param iconName - The name of the icon
 * @param pathData - The SVG path data
 */
export default function createMaterialIcon(
  iconName: string,
  pathData: string,
): MaterialSymbolsComponent {
  const BaseIcon = asClassComponent(Icon);

  class MaterialIcon extends BaseIcon {
    constructor(options: ComponentConstructorOptions<IconProps>) {
      const props: InternalIconProps = {
        iconName,
        pathData,
        ...(options.props ?? {})
      };

      super({
        ...options,
        props
      });
    }
  }

  return MaterialIcon as unknown as MaterialSymbolsComponent;
}
