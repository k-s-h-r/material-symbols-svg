import type { IconProps } from './types';

export function hasA11yProp(props: Record<string, unknown>): boolean {
  for (const prop in props) {
    if (prop.startsWith('aria-') || prop === 'role' || prop === 'title') {
      return true;
    }
  }

  return false;
}

export function mergeStyle(color: IconProps['color'], style: unknown): unknown {
  if (color == null) {
    return style;
  }

  if (style == null || style === false) {
    return { color };
  }

  return [style, { color }];
}
