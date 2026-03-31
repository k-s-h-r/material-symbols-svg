import { ComponentRef, RefAttributes, createElement, forwardRef } from 'react';
import { Path, Svg } from 'react-native-svg';
import { IconProps, MaterialSymbolsComponent } from './types';

export { type IconProps, type MaterialSymbolsComponent };

/**
 * Create a Material Symbol icon component for React Native
 * @param iconName - The name of the icon
 * @param pathData - The SVG path data
 */
export default function createMaterialIcon(
  iconName: string,
  pathData: string
): MaterialSymbolsComponent {
  const MaterialIcon = forwardRef<ComponentRef<typeof Svg>, IconProps>(
    (
      {
        size = 24,
        color,
        fill,
        ...props
      },
      ref
    ) => {
      const svgFill = fill ?? 'none';
      const pathFill = fill ? undefined : 'currentColor';

      return createElement(
        Svg,
        ({
          ref,
          width: size,
          height: size,
          viewBox: '0 -960 960 960',
          fill: svgFill,
          color,
          ...props,
        } as IconProps & RefAttributes<ComponentRef<typeof Svg>>),
        createElement(Path, {
          d: pathData,
          fill: pathFill,
        })
      );
    }
  );

  MaterialIcon.displayName = `MaterialIcon(${iconName})`;

  return MaterialIcon;
}
