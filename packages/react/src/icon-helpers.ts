import type { CSSProperties } from 'react';
import type { IconProps } from './types';

export function hasA11yProp(props: Record<string, unknown>): boolean {
  for (const prop in props) {
    if (prop.startsWith('aria-')) {
      return true;
    }
  }

  return false;
}

export function mergeStyle(
  color: IconProps['color'],
  style: IconProps['style'],
): CSSProperties | undefined {
  if (color == null) {
    return style;
  }

  return {
    ...style,
    color,
  };
}
