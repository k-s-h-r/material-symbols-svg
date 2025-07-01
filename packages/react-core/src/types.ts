import { SVGProps, ForwardRefExoticComponent, RefAttributes } from 'react';

/**
 * Material Symbols icon component props
 */
export interface IconProps extends SVGProps<SVGSVGElement> {
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
  IconProps & RefAttributes<SVGSVGElement>
>;