import { SVGProps, ForwardRefExoticComponent, RefAttributes } from 'react';

type SVGAttributes = Partial<SVGProps<SVGSVGElement>>;
type ElementAttributes = RefAttributes<SVGSVGElement> & SVGAttributes;

/**
 * Material Symbols icon component props
 */
export interface IconProps extends ElementAttributes {
  /**
   * Icon size in pixels
   * @default 24
   */
  size?: number | string;
  
  /**
   * Icon color
   */
  color?: string;
  
}

/**
 * Material Symbols icon component type
 */
export type MaterialSymbolsComponent = ForwardRefExoticComponent<
  Omit<IconProps, 'ref'> & RefAttributes<SVGSVGElement>
>;
