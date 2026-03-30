import { createComponent, render, renderComponent, renderSlot } from 'astro/compiler-runtime';
import Icon from './icon.astro';
import type { MaterialSymbolsComponent } from './types';

export default function createMaterialIcon(
  iconName: string,
  pathData: string,
): MaterialSymbolsComponent {
  const MaterialIcon = createComponent(
    ($$result, $$props: Record<string, unknown>, $$slots) => {
      const slots = $$slots.default
        ? {
            default: () => render`${renderSlot($$result, $$slots.default)}`,
          }
        : undefined;

      return render`${renderComponent(
        $$result,
        'Icon',
        Icon,
        {
          iconName,
          pathData,
          ...$$props,
        },
        slots,
      )}`;
    },
    undefined,
    'none',
  );

  return MaterialIcon as MaterialSymbolsComponent;
}
