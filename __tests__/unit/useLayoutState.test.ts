/**
 * Unit tests for useLayoutState hook (T073)
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLayoutState } from '@/lib/hooks/useLayoutState';

describe('useLayoutState hook (T073)', () => {
  it('should initialize with force-directed layout as default', () => {
    const { result } = renderHook(() => useLayoutState());

    expect(result.current.layoutAlgorithm).toBe('force-directed');
    expect(result.current.layoutParams).toEqual({
      repulsion: -400,
      attraction: 0.1,
      centerGravity: 0.1,
    });
  });

  it('should change layout algorithm', () => {
    const { result } = renderHook(() => useLayoutState());

    act(() => {
      result.current.setLayoutAlgorithm('hierarchical');
    });

    expect(result.current.layoutAlgorithm).toBe('hierarchical');
    expect(result.current.layoutParams).toEqual({
      rankSeparation: 100,
      nodeSeparation: 80,
      direction: 'TB',
    });
  });

  it('should update layout parameters', () => {
    const { result } = renderHook(() => useLayoutState());

    act(() => {
      result.current.updateLayoutParams({ repulsion: -500 });
    });

    expect(result.current.layoutParams).toEqual({
      repulsion: -500,
      attraction: 0.1,
      centerGravity: 0.1,
    });
  });

  it('should merge partial parameter updates', () => {
    const { result } = renderHook(() => useLayoutState());

    act(() => {
      result.current.updateLayoutParams({ repulsion: -400, attraction: 0.2 });
    });

    expect(result.current.layoutParams).toEqual({
      repulsion: -400,
      attraction: 0.2,
      centerGravity: 0.1, // Original value preserved
    });
  });

  it('should reset params to defaults when algorithm changes', () => {
    const { result } = renderHook(() => useLayoutState());

    // Modify force-directed params
    act(() => {
      result.current.updateLayoutParams({ repulsion: -500 });
    });

    expect(result.current.layoutParams.repulsion).toBe(-500);

    // Change algorithm
    act(() => {
      result.current.setLayoutAlgorithm('hierarchical');
    });

    // Should have hierarchical defaults, not modified force-directed params
    expect(result.current.layoutParams).toEqual({
      rankSeparation: 100,
      nodeSeparation: 80,
      direction: 'TB',
    });
  });

  it('should provide layout config object', () => {
    const { result } = renderHook(() => useLayoutState());

    const config = result.current.getLayoutConfig();

    expect(config).toEqual({
      algorithm: 'force-directed',
      params: {
        repulsion: -400,
        attraction: 0.1,
        centerGravity: 0.1,
      },
    });
  });

  it('should handle all three layout algorithms', () => {
    const { result } = renderHook(() => useLayoutState());

    // Force-directed
    expect(result.current.layoutAlgorithm).toBe('force-directed');
    expect(result.current.layoutParams).toHaveProperty('repulsion');

    // Hierarchical
    act(() => {
      result.current.setLayoutAlgorithm('hierarchical');
    });
    expect(result.current.layoutParams).toHaveProperty('rankSeparation');

    // Radial-tree
    act(() => {
      result.current.setLayoutAlgorithm('radial-tree');
    });
    expect(result.current.layoutParams).toHaveProperty('radius');
  });
});
