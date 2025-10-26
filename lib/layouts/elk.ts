/**
 * ELK.js Layout Engine
 *
 * Production-grade graph layout using Eclipse Layout Kernel
 * Provides automatic overlap prevention and multiple layout algorithms
 */

import type { Node, Edge } from 'reactflow';
import ELK from 'elkjs/lib/elk.bundled.js';

const elk = new ELK();

export type ElkAlgorithm = 'layered' | 'force' | 'stress' | 'mrtree' | 'radial' | 'box';

export interface ElkParams {
  algorithm: ElkAlgorithm; // ELK algorithm to use
  nodeSpacing: number; // Space between nodes on same layer (default: 80)
  layerSpacing: number; // Space between layers/ranks (default: 100)
  direction: 'TB' | 'BT' | 'LR' | 'RL'; // Direction of layout (Top-Bottom, Bottom-Top, Left-Right, Right-Left)
}

/**
 * Map React Flow direction to ELK direction format
 * React Flow uses: TB (Top-Bottom), BT (Bottom-Top), LR (Left-Right), RL (Right-Left)
 * ELK uses: DOWN, UP, RIGHT, LEFT
 */
function mapDirectionToElk(direction: 'TB' | 'BT' | 'LR' | 'RL'): string {
  const mapping = {
    'TB': 'DOWN',   // Top to Bottom → DOWN
    'BT': 'UP',     // Bottom to Top → UP
    'LR': 'RIGHT',  // Left to Right → RIGHT
    'RL': 'LEFT',   // Right to Left → LEFT
  };
  return mapping[direction];
}

/**
 * Default node dimensions (conservative fallback values)
 * These account for actual rendered node size with padding, borders, etc.
 *
 * Actual CustomFlowNode dimensions:
 * - minWidth: 180px + padding (32px) + border (4px) = ~220px
 * - Height: ~70-80px with padding and content
 */
const DEFAULT_NODE_WIDTH = 220;
const DEFAULT_NODE_HEIGHT = 80;

/**
 * Transform React Flow nodes and edges to ELK graph format
 *
 * @param nodes - React Flow nodes
 * @param edges - React Flow edges
 * @param params - ELK layout parameters
 * @returns ELK graph structure
 */
function toElkGraph(nodes: Node[], edges: Edge[], params: ElkParams) {
  // Determine if layout is horizontal (LR/RL) or vertical (TB/BT)
  const isHorizontal = params.direction === 'LR' || params.direction === 'RL';

  return {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': params.algorithm,
      'org.eclipse.elk.direction': mapDirectionToElk(params.direction),
      'elk.spacing.nodeNode': String(params.nodeSpacing),
      'elk.layered.spacing.nodeNodeBetweenLayers': String(params.layerSpacing),

      // HIGH PRIORITY: Critical spacing and routing options
      'elk.padding': '[top=50,left=50,bottom=50,right=50]', // Space around graph content
      'elk.edgeRouting': 'ORTHOGONAL', // Clean, professional orthogonal edge routing
      'elk.layered.spacing.edgeNodeBetweenLayers': '20', // Prevent edge-node collisions
      'elk.separateConnectedComponents': 'true', // Handle disconnected subgraphs properly

      // MEDIUM PRIORITY: Fine-tuning options
      'elk.spacing.edgeEdge': '15', // Space between parallel edges
      'elk.layered.nodePlacement.favorStraightEdges': '0.0', // Balance straight edges vs compactness
      'elk.layered.considerModelOrder.strategy': 'NONE', // Don't enforce input order constraints

      // Additional options for better layout quality
      'elk.layered.thoroughness': '100', // More iterations for better results
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP', // Reduce edge crossings
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN', // Handle nested nodes properly
    },
    children: nodes.map((node) => ({
      ...node,
      // ELK requires these position hints for edge routing
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      // ELK requires explicit dimensions
      // Priority: 1) measured (actual DOM), 2) data.width (explicit), 3) defaults
      width: ((node as any).measured?.width) || (node.data?.width as number) || DEFAULT_NODE_WIDTH,
      height: ((node as any).measured?.height) || (node.data?.height as number) || DEFAULT_NODE_HEIGHT,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };
}

/**
 * Transform ELK layout result back to React Flow nodes
 *
 * @param layoutedGraph - ELK graph with calculated positions
 * @param originalNodes - Original React Flow nodes (to preserve data)
 * @returns React Flow nodes with updated positions
 */
function fromElkGraph(layoutedGraph: any, originalNodes: Node[]): Node[] {
  return layoutedGraph.children.map((elkNode: any) => {
    const originalNode = originalNodes.find((n) => n.id === elkNode.id);
    if (!originalNode) {
      throw new Error(`ELK returned node ${elkNode.id} not found in original nodes`);
    }

    return {
      ...originalNode,
      position: { x: elkNode.x, y: elkNode.y },
    };
  });
}

/**
 * Apply ELK layout to nodes and edges
 *
 * This is an async function because ELK computation can take time for large graphs
 *
 * @param nodes - React Flow nodes to position
 * @param edges - React Flow edges
 * @param params - ELK layout parameters
 * @returns Positioned nodes
 */
export async function applyElkLayout(
  nodes: Node[],
  edges: Edge[],
  params: ElkParams
): Promise<Node[]> {
  if (nodes.length === 0) return [];

  // Handle single node case (no layout needed)
  if (nodes.length === 1) {
    return [{ ...nodes[0], position: { x: 400, y: 300 } }];
  }

  // Transform to ELK format
  const elkGraph = toElkGraph(nodes, edges, params);

  try {
    // Run ELK layout algorithm (async)
    const layoutedGraph = await elk.layout(elkGraph);

    // Transform back to React Flow format
    return fromElkGraph(layoutedGraph, nodes);
  } catch (error) {
    console.error('ELK layout failed:', error);
    // Fallback to original positions on error
    return nodes;
  }
}
