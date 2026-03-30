import React from 'react';
import { render } from '@testing-library/react';
import createMaterialIcon from '../src/createMaterialIcon';

const Home = createMaterialIcon('home', 'M0 0z');
const RoundedHome = createMaterialIcon('rounded-home', 'M1 1z');
const SharpSettings = createMaterialIcon('sharp-settings', 'M2 2z');

describe('Home Icon', () => {
  it('renders without crashing', () => {
    const { container } = render(<Home />);
    const svgElement = container.querySelector('svg');
    expect(svgElement).toBeInTheDocument();
  });

  it('applies custom size', () => {
    const { container } = render(<Home size={32} />);
    const svgElement = container.querySelector('svg');
    expect(svgElement).toHaveAttribute('width', '32');
    expect(svgElement).toHaveAttribute('height', '32');
  });

  it('applies custom color', () => {
    const { container } = render(<Home color="red" />);
    const svgElement = container.querySelector('svg');
    expect(svgElement).toHaveStyle({ color: 'rgb(255, 0, 0)' });
  });

  it('keeps decorative icons hidden by default and exposes labeled icons', () => {
    const { container, rerender } = render(<Home />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');

    rerender(<Home aria-label="Home icon" />);
    expect(container.querySelector('svg')).not.toHaveAttribute('aria-hidden');
  });

  it('renders title props as svg title elements and exposes the icon', () => {
    const { container } = render(<Home title="Home icon" />);

    const svgElement = container.querySelector('svg');
    expect(svgElement).not.toHaveAttribute('aria-hidden');
    expect(container.querySelector('title')).toHaveTextContent('Home icon');
  });

  it('renders children and does not hide icons when children are provided', () => {
    const { container } = render(
      <Home>
        <title>Home icon</title>
      </Home>
    );

    const svgElement = container.querySelector('svg');
    expect(svgElement).not.toHaveAttribute('aria-hidden');
    expect(container.querySelector('title')).toHaveTextContent('Home icon');
  });

  it('preserves color when style is also provided', () => {
    const { container } = render(<Home color="red" style={{ display: 'block' }} />);
    const svgElement = container.querySelector('svg');

    expect(svgElement).toHaveStyle({
      color: 'rgb(255, 0, 0)',
      display: 'block',
    });
  });

  it('applies custom className', () => {
    const { container } = render(<Home className="custom-icon" />);
    const svgElement = container.querySelector('svg');
    expect(svgElement).toHaveClass('custom-icon');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<SVGSVGElement>();
    render(<Home ref={ref} />);
    expect(ref.current).toBeInstanceOf(SVGSVGElement);
  });

  it('renders independently generated icons with their own path data', () => {
    const rounded = render(<RoundedHome size={20} />);
    const sharp = render(<SharpSettings size={28} color="royalblue" />);
    const roundedPath = rounded.container.querySelector('path');
    const sharpPath = sharp.container.querySelector('path');

    expect(rounded.container.querySelector('svg')).toHaveAttribute('width', '20');
    expect(sharp.container.querySelector('svg')).toHaveAttribute('width', '28');
    expect(sharp.container.querySelector('svg')).toHaveStyle({
      color: 'rgb(65, 105, 225)',
    });
    expect(roundedPath).toHaveAttribute('d', 'M1 1z');
    expect(sharpPath).toHaveAttribute('d', 'M2 2z');
  });
});
