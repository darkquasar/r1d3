/**
 * Visualization Types
 *
 * Types for different visualization strategies (magic quadrant, sunburst, etc.)
 *
 * @packageDocumentation
 */

import type { VisualizationType, QuadrantConfig } from './framework';

/**
 * Visualization mode state
 */
export interface VisualizationMode {
  /** Current visualization type */
  mode: 'graph' | VisualizationType;

  /** Mental model being visualized (if applicable) */
  focusedMentalModel: string | null;
}

/**
 * Magic Quadrant visualization props
 */
export interface MagicQuadrantProps {
  config: QuadrantConfig;
  width: number;
  height: number;
  onQuadrantClick?: (position: string) => void;
}

/**
 * D3 Hierarchy node for sunburst/radial tree
 */
export interface D3HierarchyNode {
  id: string;
  name: string;
  children?: D3HierarchyNode[];
  value?: number;
}

/**
 * Sunburst diagram props
 */
export interface SunburstProps {
  data: D3HierarchyNode;
  width: number;
  height: number;
  onNodeClick?: (nodeId: string) => void;
}

/**
 * Radial tree props
 */
export interface RadialTreeProps {
  data: D3HierarchyNode;
  width: number;
  height: number;
  onNodeClick?: (nodeId: string) => void;
}
