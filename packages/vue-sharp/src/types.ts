import type { DefineComponent, SVGAttributes } from 'vue';

/**
 * Material Symbols icon component props
 */
export interface IconProps extends /* @vue-ignore */ SVGAttributes {
  /**
   * Icon size in pixels
   * @default 24
   */
  size?: number | string;
  
  /**
   * Icon color
   */
  color?: string;
  
  /**
   * CSS class names
   */
  class?: string;
}

/**
 * Material Symbols icon component type
 */
export type MaterialSymbolsComponent = DefineComponent<IconProps>;