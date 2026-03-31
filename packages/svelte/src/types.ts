import type { Component, Snippet } from 'svelte';
import type { SVGAttributes } from 'svelte/elements';

/**
 * Material Symbols icon component props.
 */
export interface IconProps extends SVGAttributes<SVGSVGElement> {
  /**
   * Icon size in pixels.
   * @default 24
   */
  size?: number | string;

  /**
   * Icon color.
   */
  color?: string;

  /**
   * CSS class names.
   */
  class?: string;

  /**
   * Child content passed to the icon component.
   */
  children?: Snippet;
}

export interface InternalIconProps extends IconProps {
  iconName?: string;
  pathData: string;
}

export type IconEvents = {
  [eventName: string]: CustomEvent<unknown>;
};

export type IconSlots = {
  default: {};
};

/**
 * Material Symbols icon component type.
 */
export type MaterialSymbolsComponent = Component<IconProps>;
