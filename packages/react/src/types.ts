import { SVGProps } from 'react';

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
 * Icon component type
 */
export type IconComponent = React.ForwardRefExoticComponent<
  IconProps & React.RefAttributes<SVGSVGElement>
>;

