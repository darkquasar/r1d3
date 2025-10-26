/**
 * TypeScript types for layout algorithm engines
 */

export type LayoutAlgorithm = 'force-directed' | 'hierarchical' | 'radial-tree' | 'elk';

export interface LayoutParameters {
  // Force-directed parameters
  repulsion?: number;
  attraction?: number;
  collisionRadius?: number;

  // Hierarchical parameters
  orientation?: 'top-down' | 'left-right' | 'bottom-up' | 'right-left';
  nodeSeparation?: number;
  rankSeparation?: number;

  // Obstacle avoidance parameters
  avoidanceSensitivity?: number;
  personalSpace?: number;
}

export interface LayoutConfig {
  algorithm: LayoutAlgorithm;
  parameters: LayoutParameters;
}

export interface LayoutResult {
  nodes: Array<{
    id: string;
    position: { x: number; y: number };
  }>;
  bounds?: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
}

export interface LayoutEngine {
  name: LayoutAlgorithm;
  calculate(
    nodes: Array<{ id: string; data?: unknown }>,
    edges: Array<{ source: string; target: string }>,
    parameters: LayoutParameters
  ): Promise<LayoutResult>;
}

// UI State types
export interface FilterMenuState {
  isOpen: boolean;
  selectedFlow: string | null; // Flow.id
  layoutAlgorithm: LayoutAlgorithm;
  layoutParameters: LayoutParameters;
  showGrouping: boolean;
  viewMode: 'flow' | 'ontology';
}

export interface SidePanelState {
  isOpen: boolean;
  selectedNodeId: string | null;
  expandedSections: {
    principles: boolean;
    mentalModels: boolean;
    edges: boolean;
    metadata: boolean;
  };
}

export interface CanvasViewportState {
  zoom: number;
  center: { x: number; y: number };
  effectiveViewport: {
    width: number;
    height: number;
    offsetX: number; // Account for side panel
  };
}
