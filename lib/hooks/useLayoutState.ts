/**
 * Layout State Management Hook
 *
 * Manages layout algorithm selection and runtime parameter overrides
 */

import { useState, useCallback } from 'react';
import type { LayoutAlgorithm, LayoutConfig } from '../layouts/layout-engine';
import { getDefaultParams } from '../layouts/layout-engine';

export interface UseLayoutStateReturn {
  layoutAlgorithm: LayoutAlgorithm;
  layoutParams: Record<string, any>;
  setLayoutAlgorithm: (algorithm: LayoutAlgorithm) => void;
  updateLayoutParams: (params: Record<string, any>) => void;
  getLayoutConfig: () => LayoutConfig;
}

/**
 * Hook for managing layout state
 *
 * Provides centralized state management for layout algorithm and parameters.
 * Parameters are runtime overrides that reset when algorithm changes.
 *
 * @param initialAlgorithm - Initial layout algorithm (defaults to force-directed)
 * @returns Layout state and setters
 */
export function useLayoutState(
  initialAlgorithm: LayoutAlgorithm = 'force-directed'
): UseLayoutStateReturn {
  const [layoutAlgorithm, setLayoutAlgorithmState] = useState<LayoutAlgorithm>(initialAlgorithm);
  const [layoutParams, setLayoutParams] = useState<Record<string, any>>(
    getDefaultParams(initialAlgorithm)
  );

  /**
   * Change layout algorithm and reset params to defaults
   */
  const setLayoutAlgorithm = useCallback((algorithm: LayoutAlgorithm) => {
    setLayoutAlgorithmState(algorithm);
    setLayoutParams(getDefaultParams(algorithm)); // Reset to new algorithm's defaults
  }, []);

  /**
   * Update layout parameters (partial update, merges with current)
   */
  const updateLayoutParams = useCallback((params: Record<string, any>) => {
    setLayoutParams(current => ({ ...current, ...params }));
  }, []);

  /**
   * Get complete layout configuration for applying layout
   */
  const getLayoutConfig = useCallback((): LayoutConfig => {
    return {
      algorithm: layoutAlgorithm,
      params: layoutParams,
    };
  }, [layoutAlgorithm, layoutParams]);

  return {
    layoutAlgorithm,
    layoutParams,
    setLayoutAlgorithm,
    updateLayoutParams,
    getLayoutConfig,
  };
}
