import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import createMaterialIcon from '../src/createMaterialIcon';

function render(element: React.ReactElement) {
  let renderer!: TestRenderer.ReactTestRenderer;

  act(() => {
    renderer = TestRenderer.create(element);
  });

  return renderer;
}

const Home = createMaterialIcon('home', 'M0 0z');
const RoundedHome = createMaterialIcon('rounded-home', 'M1 1z');
const SharpSettings = createMaterialIcon('sharp-settings', 'M2 2z');

describe('react-native icons', () => {
  it('renders a generated icon with default svg props', () => {
    const renderer = render(<Home />);
    const svg = renderer.root.findByType('svg');
    const path = renderer.root.findByType('path');

    expect(svg.props.width).toBe(24);
    expect(svg.props.height).toBe(24);
    expect(svg.props.viewBox).toBe('0 -960 960 960');
    expect(svg.props.fill).toBe('none');
    expect(svg.props.accessibilityRole).toBe('image');
    expect(path.props.fill).toBe('currentColor');
  });

  it('forwards size, color, and fill props to react-native-svg', () => {
    const renderer = render(<Home size={32} color="tomato" fill="#123456" testID="home-icon" />);
    const svg = renderer.root.findByType('svg');
    const path = renderer.root.findByType('path');

    expect(svg.props.width).toBe(32);
    expect(svg.props.height).toBe(32);
    expect(svg.props.color).toBe('tomato');
    expect(svg.props.fill).toBe('#123456');
    expect(svg.props.testID).toBe('home-icon');
    expect(path.props.fill).toBeUndefined();
  });

  it('sets a readable display name for generated icons', () => {
    expect(Home.displayName).toBe('MaterialIcon(home)');
  });

  it('forwards refs to the underlying Svg component', () => {
    const Icon = createMaterialIcon('custom-home', 'M0 0z');
    const ref = React.createRef<{ kind: string; props: { width: number } }>();

    render(<Icon ref={ref} size={48} />);

    expect(ref.current).toMatchObject({
      kind: 'svg',
      props: {
        width: 48,
      },
    });
  });

  it('renders independently generated icons with their own path data', () => {
    const rounded = render(<RoundedHome size={20} />);
    const sharp = render(<SharpSettings size={28} color="royalblue" />);
    const roundedPath = rounded.root.findByType('path');
    const sharpPath = sharp.root.findByType('path');

    expect(rounded.root.findByType('svg').props.width).toBe(20);
    expect(sharp.root.findByType('svg').props.width).toBe(28);
    expect(sharp.root.findByType('svg').props.color).toBe('royalblue');
    expect(roundedPath.props.d).toBe('M1 1z');
    expect(sharpPath.props.d).toBe('M2 2z');
  });
});
