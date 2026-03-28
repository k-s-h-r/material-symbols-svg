import type { HTMLAttributes } from 'astro/types';

export type SVGAttributes = HTMLAttributes<'svg'>;

export interface IconProps extends SVGAttributes {
  size?: number | string;
  color?: string;
  fill?: string;
  class?: string;
}

export type MaterialSymbolsComponent = (props: IconProps) => unknown;
