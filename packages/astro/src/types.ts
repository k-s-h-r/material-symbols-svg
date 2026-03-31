import type { HTMLAttributes, SvgComponent } from 'astro/types';

export type SVGAttributes = HTMLAttributes<'svg'>;

export interface IconProps extends SVGAttributes {
  size?: number | string;
  color?: string;
  class?: string;
  title?: string;
}

export type MaterialSymbolsComponent = (_props: IconProps) => ReturnType<SvgComponent>;
export type AstroComponent = MaterialSymbolsComponent;
