import { createComponent, render, renderComponent, renderSlot } from 'astro/compiler-runtime';
import Icon from './icon.astro';
import type { MaterialSymbolsComponent } from './types';

export default function createMaterialIcon(
  iconName: string,
  pathData: string,
): MaterialSymbolsComponent {
  const MaterialIcon = createComponent(
    ($$result, $$props: Record<string, unknown>, $$slots) => render`${renderComponent(
      $$result,
      'Icon',
      Icon,
      {
        iconName,
        pathData,
        ...$$props,
      },
      {
        default: () => render`${renderSlot($$result, $$slots.default)}`
      }
    )}`,
    undefined,
    'none',
  );

  return MaterialIcon as MaterialSymbolsComponent;
}
