import { defineComponent, h } from 'vue';
import type { PropType } from 'vue';
import type { IconProps, MaterialSymbolsComponent } from './types';
import { mergeStyle, shouldHideIcon } from './icon-helpers';

/**
 * Create a Material Symbol icon component for Vue 3
 * @param iconName - The name of the icon
 * @param pathData - The SVG path data
 */
export function createMaterialIcon(
  iconName: string,
  pathData: string
): MaterialSymbolsComponent {
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
        const { title, ...restAttrs } = attrs as Record<string, unknown>;
        const svgFill = props.fill ?? 'none';
        const pathFill = props.fill ? undefined : 'currentColor';
        const accessibleTitle = title == null ? undefined : String(title);
        const combinedClassName = [
          'material-symbols', 
          `material-symbols_${iconName}`, 
          props.class
        ].filter(Boolean).join(' ');
        const mergedStyle = mergeStyle(props.color, restAttrs.style);

        return h(
          'svg',
          {
            ...(shouldHideIcon(restAttrs, Boolean(slots.default) || Boolean(accessibleTitle)) ? { 'aria-hidden': 'true' } : undefined),
            ...restAttrs,
            width: props.size,
            height: props.size,
            viewBox: '0 -960 960 960',
            fill: svgFill,
            xmlns: 'http://www.w3.org/2000/svg',
            class: combinedClassName,
            style: mergedStyle
          },
          [
            ...(accessibleTitle ? [h('title', accessibleTitle)] : []),
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

  return MaterialIcon as unknown as MaterialSymbolsComponent;
}

export { type IconProps, type MaterialSymbolsComponent };
