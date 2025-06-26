import React from 'react';
import { render, screen } from '@testing-library/react';
import { Home } from 'material-symbols-react/outlined';

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
    expect(svgElement).toHaveStyle({ color: 'red' });
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