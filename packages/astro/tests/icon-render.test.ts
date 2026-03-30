import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, it } from 'vitest';
import createMaterialIcon from '../src/createMaterialIcon';

const Icon = createMaterialIcon('custom-home', 'M0 0z');

let container: AstroContainer;

beforeAll(async () => {
  container = await AstroContainer.create();
});

describe('astro icon rendering', () => {
  it('renders without crashing', async () => {
    const html = await container.renderToString(Icon);
    expect(html).toContain('<svg');
  });

  it('applies custom size', async () => {
    const html = await container.renderToString(Icon, {
      props: { size: 32 },
    });

    expect(html).toContain('width="32"');
    expect(html).toContain('height="32"');
  });

  it('applies custom color', async () => {
    const html = await container.renderToString(Icon, {
      props: { color: 'red' },
    });

    expect(html).toContain('style="color: red;"');
  });

  it('keeps decorative icons hidden by default and exposes labeled icons', async () => {
    const decorative = await container.renderToString(Icon);
    const labeled = await container.renderToString(Icon, {
      props: { 'aria-label': 'Home icon' },
    });

    expect(decorative).toContain('aria-hidden="true"');
    expect(labeled).not.toContain('aria-hidden="true"');
  });

  it('renders default slot content and does not hide icons when slots are provided', async () => {
    const html = await container.renderToString(Icon, {
      slots: {
        default: '<title>Home icon</title>',
      },
    });

    expect(html).not.toContain('aria-hidden="true"');
    expect(html).toContain('<title>Home icon</title>');
  });
});
