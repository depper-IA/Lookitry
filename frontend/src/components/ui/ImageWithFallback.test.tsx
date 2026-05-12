import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageWithFallback } from './ImageWithFallback';

describe('ImageWithFallback', () => {
  it('should render img with correct src and alt', () => {
    render(<ImageWithFallback src="test.jpg" alt="Test image" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'test.jpg');
    expect(img).toHaveAttribute('alt', 'Test image');
  });

  it('should show img when src loads successfully', () => {
    render(<ImageWithFallback src="test.jpg" alt="Test image" />);
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
  });

  it('should show SVG fallback when img error occurs', () => {
    render(<ImageWithFallback src="invalid.jpg" alt="Test image" />);
    const img = screen.getByRole('img');

    // Simulate error
    fireEvent.error(img);

    // The img should no longer be visible (replaced by fallback)
    // The fallback is a div with background #eeebe7
    expect(img).not.toBeVisible();
  });

  it('should apply custom className', () => {
    render(<ImageWithFallback src="test.jpg" alt="Test" className="custom-class" />);
    const img = screen.getByRole('img');
    expect(img).toHaveClass('custom-class');
  });

  it('should not reset error state on re-renders', () => {
    const { rerender } = render(<ImageWithFallback src="invalid.jpg" alt="Test" />);
    const img = screen.getByRole('img');

    // Trigger error
    fireEvent.error(img);

    // Re-render with same broken src
    rerender(<ImageWithFallback src="invalid.jpg" alt="Test" />);

    // Error state should persist - img not visible
    expect(img).not.toBeVisible();
  });
});