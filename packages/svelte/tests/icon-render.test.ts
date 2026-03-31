import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import Icon from '../src/icon.svelte';
import GeneratedIconUsage from './fixtures/GeneratedIconUsage.svelte';
import GeneratedIconWithSlot from './fixtures/GeneratedIconWithSlot.svelte';
import IconWithTitleSlot from './fixtures/IconWithTitleSlot.svelte';

describe('svelte icon rendering', () => {
  it('renders without crashing', () => {
    const { body } = render(Icon, {
      props: {
        iconName: 'custom-home',
        pathData: 'M0 0z',
      },
    });

    expect(body).toContain('<svg');
  });

  it('renders generated icons with Svelte 5 component syntax', () => {
    const { body } = render(GeneratedIconUsage);

    expect(body).toContain('<svg');
    expect(body).toContain('material-symbols_custom-home');
  });

  it('applies custom size', () => {
    const { body } = render(Icon, {
      props: {
        iconName: 'custom-home',
        pathData: 'M0 0z',
        size: 32,
      },
    });

    expect(body).toContain('width="32"');
    expect(body).toContain('height="32"');
  });

  it('applies custom color', () => {
    const { body } = render(Icon, {
      props: {
        iconName: 'custom-home',
        pathData: 'M0 0z',
        color: 'red',
      },
    });

    expect(body).toContain('style="color: red;"');
  });

  it('keeps decorative icons hidden by default and exposes labeled icons', () => {
    const decorative = render(Icon, {
      props: {
        iconName: 'custom-home',
        pathData: 'M0 0z',
      },
    }).body;
    const labeled = render(Icon, {
      props: {
        iconName: 'custom-home',
        pathData: 'M0 0z',
        'aria-label': 'Home icon',
      } as Record<string, unknown>,
    }).body;

    expect(decorative).toContain('aria-hidden="true"');
    expect(labeled).not.toContain('aria-hidden="true"');
  });

  it('renders title props as svg title elements and exposes the icon', () => {
    const { body } = render(Icon, {
      props: {
        iconName: 'custom-home',
        pathData: 'M0 0z',
        title: 'Home icon',
      } as Record<string, unknown>,
    });

    expect(body).not.toContain('aria-hidden="true"');
    expect(body).toContain('<title>Home icon</title>');
  });

  it('renders slot content and does not hide icons when slots are provided', () => {
    const { body } = render(IconWithTitleSlot);

    expect(body).not.toContain('aria-hidden="true"');
    expect(body).toContain('<title>Home icon</title>');
  });

  it('forwards child content through generated icons', () => {
    const { body } = render(GeneratedIconWithSlot);

    expect(body).not.toContain('aria-hidden="true"');
    expect(body).toContain('<title>Home icon</title>');
  });
});
