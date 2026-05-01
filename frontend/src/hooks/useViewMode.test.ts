import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useViewMode } from './useViewMode';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useViewMode', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should return default grid view mode on initial mount', () => {
    const { result } = renderHook(() => useViewMode());
    const [viewMode] = result.current;
    expect(viewMode).toBe('grid');
  });

  it('should return persisted view mode from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('thumbnails');
    const { result } = renderHook(() => useViewMode());
    const [viewMode] = result.current;
    expect(viewMode).toBe('thumbnails');
  });

  it('should update view mode and persist to localStorage', async () => {
    const { result } = renderHook(() => useViewMode());
    const [, setViewMode] = result.current;

    await act(async () => {
      setViewMode('list');
    });

    expect(result.current[0]).toBe('list');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('products-view-mode', 'list');
  });

  it('should ignore invalid localStorage values', () => {
    localStorageMock.getItem.mockReturnValue('invalid-value');
    const { result } = renderHook(() => useViewMode());
    const [viewMode] = result.current;
    expect(viewMode).toBe('grid');
  });

  it('should accept all valid view modes: grid, thumbnails, list', () => {
    const { result } = renderHook(() => useViewMode());
    const [, setViewMode] = result.current;

    const validModes: Array<'grid' | 'thumbnails' | 'list'> = ['grid', 'thumbnails', 'list'];

    for (const mode of validModes) {
      act(() => {
        setViewMode(mode);
      });
      expect(result.current[0]).toBe(mode);
    }
  });

  it('should return a stable setter function', async () => {
    const { result } = renderHook(() => useViewMode());
    const [, setViewMode1] = result.current;

    // Trigger a re-render
    await act(async () => {
      result.current[1]('thumbnails');
    });

    const [, setViewMode2] = result.current;
    expect(setViewMode1).toBe(setViewMode2);
  });
});