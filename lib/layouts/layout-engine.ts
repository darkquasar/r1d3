/**
 * Unified Layout Engine Interface
 *
 * Provides a consistent API for applying all layout algorithms
 */

import type { Node, Edge } from 'reactflow';
import { applyForceDirectedLayout, type ForceDirectedParams } from './force-directed';
import { applyHierarchicalLayout, type HierarchicalParams } from './hierarchical';
import { applyRadialTreeLayout, type RadialTreeParams } from './radial-tree';
import { applyElkLayout, type ElkParams } from './elk';

export type LayoutAlgorithm = 'force-directed' | 'hierarchical' | 'radial-tree' | 'elk';

export interface LayoutConfig {
  algorithm: LayoutAlgorithm;
  params: Partial<ForceDirectedParams> | Partial<HierarchicalParams> | Partial<RadialTreeParams> | Partial<ElkParams>;
}

export interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
}

/**
 * Default parameters for each layout algorithm
 */
const DEFAULT_PARAMS = {
  'force-directed': {
    repulsion: -400,
    attraction: 0.1,
    centerGravity: 0.1,
  } as ForceDirectedParams,

  'hierarchical': {
    rankSeparation: 100,
    nodeSeparation: 80,
    direction: 'TB' as const,
  } as HierarchicalParams,

  'radial-tree': {
    radius: 150,
    angleOffset: 0,
    clusterSpacing: 600,
  } as RadialTreeParams,

  'elk': {
    algorithm: 'layered' as const,
    nodeSpacing: 80,
    layerSpacing: 100,
    direction: 'TB' as const,
  } as ElkParams,
};

/**
 * Apply a layout algorithm to nodes and edges
 *
 * This is the unified entry point for all layout operations.
 * It routes to the appropriate layout engine based on the algorithm specified.
 *
 * NOTE: This function is async to support ELK.js layout computation.
 * Non-ELK algorithms complete synchronously but are wrapped in Promise.resolve.
 *
 * @param nodes - React Flow nodes to position
 * @param edges - React Flow edges
 * @param config - Layout configuration (algorithm + parameters)
 * @returns Promise resolving to layout result with positioned nodes and edges
 */
export async function applyLayout(
  nodes: Node[],
  edges: Edge[],
  config: LayoutConfig
): Promise<LayoutResult> {
  const { algorithm, params } = config;

  // Merge user params with defaults
  const mergedParams = { ...DEFAULT_PARAMS[algorithm], ...params };

  switch (algorithm) {
    case 'force-directed':
      return {
        nodes: applyForceDirectedLayout(nodes, edges, mergedParams as ForceDirectedParams),
        edges,
      };

    case 'hierarchical':
      return {
        nodes: applyHierarchicalLayout(nodes, edges, mergedParams as HierarchicalParams),
        edges,
      };

    case 'radial-tree':
      return {
        nodes: applyRadialTreeLayout(nodes, edges, mergedParams as RadialTreeParams),
        edges,
      };

    case 'elk':
      return {
        nodes: await applyElkLayout(nodes, edges, mergedParams as ElkParams),
        edges,
      };

    default:
      throw new Error(`Unknown layout algorithm: ${algorithm}`);
  }
}

/**
 * Get default parameters for a layout algorithm
 */
export function getDefaultParams(algorithm: LayoutAlgorithm) {
  return DEFAULT_PARAMS[algorithm];
}
