import { createApp, h } from 'vue';
import { afterEach, describe, expect, it } from 'vitest';
import { createMaterialIcon } from '../src/createMaterialIcon';

const Icon = createMaterialIcon('custom-home', 'M0 0z');
const mountedApps: ReturnType<typeof createApp>[] = [];

function mountIcon(
  props: Record<string, unknown> = {},
  slots?: Record<string, () => unknown>,
): SVGSVGElement {
  const target = document.createElement('div');
  document.body.appendChild(target);

  const app = createApp({
    render: () => h(Icon, props, slots),
  });

  mountedApps.push(app);
  app.mount(target);

  const svg = target.querySelector('svg');
  if (!svg) {
    throw new Error('Expected icon to render an svg element');
  }

  return svg;
}

afterEach(() => {
  while (mountedApps.length > 0) {
    mountedApps.pop()?.unmount();
  }
  document.body.innerHTML = '';
});

describe('vue icon rendering', () => {
  it('renders without crashing', () => {
    expect(mountIcon()).toBeInstanceOf(SVGSVGElement);
  });

  it('applies custom size', () => {
    const svg = mountIcon({ size: 32 });
    expect(svg.getAttribute('width')).toBe('32');
    expect(svg.getAttribute('height')).toBe('32');
  });

  it('applies custom color', () => {
    const svg = mountIcon({ color: 'red' });
    expect(svg.style.color).toBe('red');
  });

  it('keeps decorative icons hidden by default and exposes labeled icons', () => {
    const decorative = mountIcon();
    expect(decorative.getAttribute('aria-hidden')).toBe('true');

    const labeled = mountIcon({ 'aria-label': 'Home icon' });
    expect(labeled.hasAttribute('aria-hidden')).toBe(false);
  });

  it('renders title props as svg title elements and exposes the icon', () => {
    const svg = mountIcon({ title: 'Home icon' });

    expect(svg.hasAttribute('aria-hidden')).toBe(false);
    expect(svg.querySelector('title')?.textContent).toBe('Home icon');
  });

  it('renders default slot content and does not hide icons when slots are provided', () => {
    const svg = mountIcon({}, {
      default: () => h('title', 'Home icon'),
    });

    expect(svg.hasAttribute('aria-hidden')).toBe(false);
    expect(svg.querySelector('title')?.textContent).toBe('Home icon');
  });

  it('preserves color when style is also provided', () => {
    const svg = mountIcon({ color: 'red', style: 'display: block' });
    expect(svg.style.display).toBe('block');
    expect(svg.style.color).toBe('red');
  });
});
