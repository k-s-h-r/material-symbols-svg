import { forwardRef, createElement } from 'react';
import { IconProps } from './types';

/**
 * Create a Material Symbol icon component (Lucide-style)
 * @param iconName - The name of the icon
 * @param pathData - The SVG path data
 */
export default function createMaterialIcon(
  iconName: string,
  pathData: string
) {
  const MaterialIcon = forwardRef<SVGSVGElement, IconProps>(
    (
      {
        size = 24,
        color,
        className,
        style: inlineStyle,
        fill,
        ...props
      },
      ref
    ) => {
      const svgFill = fill ?? 'none';
      const pathFill = fill ? undefined : 'currentColor';

      const combinedClassName = ['material-symbols', className].filter(Boolean).join(' ');

      return createElement(
        'svg',
        {
          ref,
          width: size,
          height: size,
          viewBox: '0 -960 960 960',
          fill: svgFill,
          xmlns: 'http://www.w3.org/2000/svg',
          'aria-hidden': 'true',
          className: combinedClassName,
          style: {
            color,
            ...inlineStyle,
          },
          ...props,
        },
        createElement('path', {
          d: pathData,
          fill: pathFill,
        })
      );
    }
  );

  MaterialIcon.displayName = `MaterialIcon(${iconName})`;

  return MaterialIcon;
}