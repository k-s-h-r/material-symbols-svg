import { ComponentRef, ForwardRefExoticComponent, RefAttributes } from 'react';
import { SvgProps } from 'react-native-svg';

type SvgElement = ComponentRef<typeof import('react-native-svg').Svg>;

/**
 * Material Symbols icon component props
 */
export interface IconProps extends SvgProps {
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
  Omit<IconProps, 'ref'> & RefAttributes<SvgElement>
>;
