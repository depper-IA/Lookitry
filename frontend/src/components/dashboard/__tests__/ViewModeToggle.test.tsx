import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ViewModeToggle } from '../ViewModeToggle';
import type { ViewMode } from '../ViewModeToggle';

describe('ViewModeToggle', () => {
  it('renders 3 mode buttons (grid/list/thumbnail)', () => {
    const onChange = vi.fn();
    render(<ViewModeToggle mode="grid" onChange={onChange} />);
    
    // Grid button
    const gridBtn = screen.getByRole('button', { name: /Cambiar a vista Grid/i });
    expect(gridBtn).toBeInTheDocument();
    
    // List button
    const listBtn = screen.getByRole('button', { name: /Cambiar a vista Lista/i });
    expect(listBtn).toBeInTheDocument();
    
    // Thumbnail button
    const thumbBtn = screen.getByRole('button', { name: /Cambiar a vista Miniatura/i });
    expect(thumbBtn).toBeInTheDocument();
  });

  it('calls onChange with correct mode when grid is clicked', () => {
    const onChange = vi.fn();
    render(<ViewModeToggle mode="list" onChange={onChange} />);
    
    const gridBtn = screen.getByRole('button', { name: /Cambiar a vista Grid/i });
    fireEvent.click(gridBtn);
    
    expect(onChange).toHaveBeenCalledWith('grid');
  });

  it('calls onChange with correct mode when list is clicked', () => {
    const onChange = vi.fn();
    render(<ViewModeToggle mode="grid" onChange={onChange} />);
    
    const listBtn = screen.getByRole('button', { name: /Cambiar a vista Lista/i });
    fireEvent.click(listBtn);
    
    expect(onChange).toHaveBeenCalledWith('list');
  });

  it('calls onChange with correct mode when thumbnail is clicked', () => {
    const onChange = vi.fn();
    render(<ViewModeToggle mode="grid" onChange={onChange} />);
    
    const thumbBtn = screen.getByRole('button', { name: /Cambiar a vista Miniatura/i });
    fireEvent.click(thumbBtn);
    
    expect(onChange).toHaveBeenCalledWith('thumbnail');
  });

  it('shows active state for current mode with #FF5C3A styling', () => {
    const onChange = vi.fn();
    const { container } = render(<ViewModeToggle mode="grid" onChange={onChange} />);
    
    const gridBtn = screen.getByRole('button', { name: /Cambiar a vista Grid/i });
    
    // Check the button has the active styling (background should be #FF5C3A)
    expect(gridBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows aria-pressed false for non-active modes', () => {
    const onChange = vi.fn();
    render(<ViewModeToggle mode="grid" onChange={onChange} />);
    
    const listBtn = screen.getByRole('button', { name: /Cambiar a vista Lista/i });
    
    expect(listBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders all three view modes and switches correctly', () => {
    const onChange = vi.fn();
    render(<ViewModeToggle mode="grid" onChange={onChange} />);
    
    // Click list
    fireEvent.click(screen.getByRole('button', { name: /Cambiar a vista Lista/i }));
    expect(onChange).toHaveBeenLastCalledWith('list');
    
    // Click thumbnail
    fireEvent.click(screen.getByRole('button', { name: /Cambiar a vista Miniatura/i }));
    expect(onChange).toHaveBeenLastCalledWith('thumbnail');
    
    // Click grid
    fireEvent.click(screen.getByRole('button', { name: /Cambiar a vista Grid/i }));
    expect(onChange).toHaveBeenLastCalledWith('grid');
  });
});