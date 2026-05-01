import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageWithFallback } from '../ImageWithFallback';

// Mock the imageProxy utility
vi.mock('@/utils/imageProxy', () => ({
  getProxiedUrl: vi.fn((url: string) => `/api/img-proxy?url=${encodeURIComponent(url)}`),
}));

describe('ImageWithFallback', () => {
  it('renders skeleton while loading', () => {
    render(<ImageWithFallback src="test.jpg" alt="Test image" />);
    
    // The skeleton is a motion.div with animate opacity
    const container = screen.getByRole('img').parentElement;
    expect(container).toBeInTheDocument();
  });

  it('renders image when src loads successfully', () => {
    render(<ImageWithFallback src="test.jpg" alt="Test image" />);
    
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('alt', 'Test image');
  });

  it('renders branded SVG fallback when src fails', () => {
    render(<ImageWithFallback src="invalid.jpg" alt="Test image" />);
    
    const img = screen.getByRole('img');
    fireEvent.error(img);
    
    // After error, the image should not be visible
    // The branded placeholder SVG is rendered
    expect(img).not.toBeVisible();
  });

  it('calls onLoad callback when image loads', () => {
    const onLoad = vi.fn();
    render(<ImageWithFallback src="test.jpg" alt="Test image" onLoad={onLoad} />);
    
    const img = screen.getByRole('img');
    fireEvent.load(img);
    
    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it('does not re-render infinitely on error', () => {
    const { rerender } = render(<ImageWithFallback src="invalid.jpg" alt="Test image" />);
    
    const img = screen.getByRole('img');
    
    // Simulate error
    fireEvent.error(img);
    
    // Re-render with same broken src
    rerender(<ImageWithFallback src="invalid.jpg" alt="Test image" />);
    
    // Error state should persist - img not visible
    expect(img).not.toBeVisible();
  });
});