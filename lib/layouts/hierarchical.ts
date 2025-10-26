/**
 * Hierarchical Layout Engine
 *
 * Uses d3-hierarchy + dagre to position nodes in tree/DAG structures
 */

import type { Node, Edge } from 'reactflow';
import dagre from 'dagre';

export interface HierarchicalParams {
  rankSeparation: number; // Vertical spacing between ranks
  nodeSeparation: number; // Horizontal spacing between nodes
  direction: 'TB' | 'BT' | 'LR' | 'RL'; // Top-Bottom, Bottom-Top, Left-Right, Right-Left
}

/**
 * Apply hierarchical layout to nodes
 *
 * @param nodes - React Flow nodes to position
 * @param edges - React Flow edges defining hierarchy
 * @param params - Hierarchical layout parameters
 * @returns Nodes with updated positions
 */
export function applyHierarchicalLayout(
  nodes: Node[],
  edges: Edge[],
  params: HierarchicalParams
): Node[] {
  if (nodes.length === 0) {
    return [];
  }

  // Create dagre graph
  const graph = new dagre.graphlib.Graph();

  // Set graph configuration
  graph.setGraph({
    rankdir: params.direction,
    ranksep: params.rankSeparation,
    nodesep: params.nodeSeparation,
  });

  // Default node and edge settings
  graph.setDefaultEdgeLabel(() => ({}));

  // Add nodes to graph with dimensions
  nodes.forEach(node => {
    graph.setNode(node.id, {
      width: 180, // Default node width
      height: 60,  // Default node height
    });
  });

  // Add edges to graph
  edges.forEach(edge => {
    graph.setEdge(edge.source, edge.target);
  });

  // Run dagre layout
  dagre.layout(graph);

  // Map dagre positions back to React Flow nodes
  return nodes.map(node => {
    const dagreNode = graph.node(node.id);

    return {
      ...node,
      position: {
        x: dagreNode.x - 90, // Center node (dagre uses center, React Flow uses top-left)
        y: dagreNode.y - 30,
      },
    };
  });
}
