import React from 'react';
import { render, screen } from '@testing-library/react';
import { Home } from '../src/w400';

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
});
