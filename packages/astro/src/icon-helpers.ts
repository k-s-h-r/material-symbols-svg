import type { IconProps } from './types';

type StyleValue = IconProps['style'];

export function hasA11yProps(props: Record<string, unknown>): boolean {
  for (const prop in props) {
    if (prop.startsWith('aria-')) {
      return true;
    }
  }

  return false;
}

export function shouldHideIcon(props: Record<string, unknown>, hasDefaultSlot: boolean): boolean {
  return !hasDefaultSlot && !hasA11yProps(props);
}

export function mergeStyle(color: IconProps['color'], style: StyleValue): StyleValue {
  if (color == null) {
    return style;
  }

  if (style == null) {
    return `color: ${String(color)};`;
  }

  if (typeof style === 'string') {
    return `${style}${style.trim().endsWith(';') ? ' ' : '; '}color: ${String(color)};`;
  }

  if (typeof style === 'object' && style !== null && !Array.isArray(style)) {
    return {
      ...style,
      color,
    };
  }

  return style;
}
