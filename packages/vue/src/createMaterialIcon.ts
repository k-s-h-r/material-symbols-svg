import { defineComponent, h } from 'vue';
import type { PropType } from 'vue';
import type { IconProps, MaterialSymbolsComponent } from './types';
import { hasA11yProp, mergeStyle } from './icon-helpers';

/**
 * Create a Material Symbol icon component for Vue 3
 * @param iconName - The name of the icon
 * @param pathData - The SVG path data
 */
export function createMaterialIcon(
  iconName: string,
  pathData: string
) {
  const MaterialIcon = defineComponent({
    name: `MaterialIcon(${iconName})`,
    props: {
      size: {
        type: [Number, String] as PropType<number | string>,
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
    setup(props, { attrs, slots }) {
      return () => {
        const svgFill = props.fill ?? 'none';
        const pathFill = props.fill ? undefined : 'currentColor';
        const combinedClassName = [
          'material-symbols', 
          `material-symbols_${iconName}`, 
          props.class
        ].filter(Boolean).join(' ');
        const hasAccessibleAttrs = hasA11yProp(attrs as Record<string, unknown>);
        const mergedStyle = mergeStyle(props.color, attrs.style);

        return h(
          'svg',
          {
            ...(!slots.default && !hasAccessibleAttrs ? { 'aria-hidden': 'true' } : undefined),
            ...attrs,
            width: props.size,
            height: props.size,
            viewBox: '0 -960 960 960',
            fill: svgFill,
            xmlns: 'http://www.w3.org/2000/svg',
            class: combinedClassName,
            style: mergedStyle
          },
          [
            h('path', {
              d: pathData,
              fill: pathFill
            }),
            ...(slots.default ? slots.default() : [])
          ]
        );
      };
    }
  });

  return MaterialIcon;
}

export { type IconProps, type MaterialSymbolsComponent };
