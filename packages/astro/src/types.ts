import type { HTMLAttributes, SvgComponent } from 'astro/types';

export type SVGAttributes = HTMLAttributes<'svg'>;
export type AstroComponent = (_props: IconProps) => ReturnType<SvgComponent>;

export interface IconProps extends SVGAttributes {
  size?: number | string;
  color?: string;
  fill?: string;
  class?: string;
}

export type MaterialSymbolsComponent = AstroComponent;
