import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import Icon from '../src/icon.svelte';
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

  it('renders slot content and does not hide icons when slots are provided', () => {
    const { body } = render(IconWithTitleSlot);

    expect(body).not.toContain('aria-hidden="true"');
    expect(body).toContain('<title>Home icon</title>');
  });
});
