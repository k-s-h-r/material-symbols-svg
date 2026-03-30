import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import createMaterialIcon from '../src/createMaterialIcon';
import { Home } from '../src/w400';
import { HomeW400 } from '../src/icons/home';
import { Home as HomeRounded } from '../src/rounded';
import { Home as HomeSharp } from '../src/sharp';
import { SettingsW500 } from '../src/sharp/icons/settings';

function render(element: React.ReactElement) {
  let renderer!: TestRenderer.ReactTestRenderer;

  act(() => {
    renderer = TestRenderer.create(element);
  });

  return renderer;
}

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

  it('keeps the default export alias in sync with deep icon exports', () => {
    expect(Home).toBe(HomeW400);
  });

  it('renders alternate style entry points and deep sharp icon imports', () => {
    const rounded = render(<HomeRounded size={20} />);
    const sharp = render(<HomeSharp size={28} />);
    const deepSharp = render(<SettingsW500 color="royalblue" />);

    expect(rounded.root.findByType('svg').props.width).toBe(20);
    expect(sharp.root.findByType('svg').props.width).toBe(28);
    expect(deepSharp.root.findByType('svg').props.color).toBe('royalblue');
  });
});
