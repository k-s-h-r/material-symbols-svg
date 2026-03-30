import { Children, forwardRef, createElement } from 'react';
import { IconProps, MaterialSymbolsComponent } from './types';
import { hasA11yProp, mergeStyle } from './icon-helpers';

export { type IconProps, type MaterialSymbolsComponent };

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
        children,
        ...props
      },
      ref
    ) => {
      const svgFill = fill ?? 'none';
      const pathFill = fill ? undefined : 'currentColor';
      const svgChildren = Children.toArray(children);
      const hasChildren = svgChildren.length > 0;

      const combinedClassName = ['material-symbols', `material-symbols_${iconName}`, className].filter(Boolean).join(' ');
      const mergedStyle = mergeStyle(color, inlineStyle);

      return createElement(
        'svg',
        {
          ref,
          width: size,
          height: size,
          viewBox: '0 -960 960 960',
          fill: svgFill,
          xmlns: 'http://www.w3.org/2000/svg',
          className: combinedClassName,
          ...(!hasChildren && !hasA11yProp(props) && { 'aria-hidden': 'true' }),
          style: mergedStyle,
          ...props,
        },
        [
          createElement('path', {
            key: 'icon-path',
            d: pathData,
            fill: pathFill,
          }),
          ...svgChildren,
        ]
      );
    }
  );

  MaterialIcon.displayName = `MaterialIcon(${iconName})`;

  return MaterialIcon;
}
