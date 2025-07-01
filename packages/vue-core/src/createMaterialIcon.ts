import { defineComponent, h } from 'vue';
import type { IconProps, MaterialSymbolsComponent } from './types';

/**
 * Create a Material Symbol icon component for Vue 3
 * @param iconName - The name of the icon
 * @param pathData - The SVG path data
 */
export default function createMaterialIcon(
  iconName: string,
  pathData: string
): MaterialSymbolsComponent {
  const MaterialIcon = defineComponent({
    name: `MaterialIcon(${iconName})`,
    props: {
      size: {
        type: [Number, String] as any,
        default: 24
      },
      color: {
        type: String,
        default: undefined
      },
      class: {
        type: String,
        default: undefined
      },
      fill: {
        type: String,
        default: undefined
      }
    },
    setup(props, { attrs }) {
      return () => {
        const svgFill = props.fill ?? 'none';
        const pathFill = props.fill ? undefined : 'currentColor';

        const combinedClassName = [
          'material-symbols', 
          `material-symbols_${iconName}`, 
          props.class
        ].filter(Boolean).join(' ');

        return h(
          'svg',
          {
            width: props.size,
            height: props.size,
            viewBox: '0 -960 960 960',
            fill: svgFill,
            xmlns: 'http://www.w3.org/2000/svg',
            'aria-hidden': 'true',
            class: combinedClassName,
            style: {
              color: props.color,
              ...(attrs.style as any)
            },
            ...attrs
          },
          [
            h('path', {
              d: pathData,
              fill: pathFill
            })
          ]
        );
      };
    }
  });

  return MaterialIcon;
}