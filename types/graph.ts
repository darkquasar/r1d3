/**
 * ReactFlow Graph Types
 *
 * Types for ReactFlow integration with the framework data model.
 *
 * @packageDocumentation
 */

import type { Node as ReactFlowNode, Edge as ReactFlowEdge } from 'reactflow';
import type { FrameworkNode, Edge } from './framework';

/**
 * Extended ReactFlow node with framework data
 */
export type ReactFlowFrameworkNode = ReactFlowNode & {
  id: string;
  type: string; // 'phase' | 'sub-phase' | 'sub-phase-component' | 'mental-model'
  position: { x: number; y: number };
  data: FrameworkNode & {
    label: string; // Display name
    description?: string;
  };
};

/**
 * Extended ReactFlow edge with framework data
 */
export type ReactFlowFrameworkEdge = ReactFlowEdge & {
  id: string;
  source: string;
  target: string;
  type?: string; // Custom edge type for rendering
  label?: string; // Relationship type label
  data: Edge;
  animated?: boolean;
  style?: React.CSSProperties;
};

/**
 * ReactFlow-compatible graph structure
 */
export interface ReactFlowGraph {
  nodes: ReactFlowFrameworkNode[];
  edges: ReactFlowFrameworkEdge[];
}

/**
 * Layout algorithm options
 */
export interface LayoutOptions {
  direction: 'TB' | 'LR' | 'BT' | 'RL'; // Top-Bottom, Left-Right, etc.
  nodeSpacing: {
    horizontal: number;
    vertical: number;
  };
  rankSeparation: number;
  edgeSeparation: number;
}

/**
 * Graph viewport state
 */
export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}
