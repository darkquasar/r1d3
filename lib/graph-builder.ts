/**
 * Graph Builder
 *
 * Converts YAML data to ReactFlow node and edge format with styling
 *
 * @packageDocumentation
 */

import type { FrameworkNode, Edge } from '../types/framework';
import type { ReactFlowFrameworkNode, ReactFlowFrameworkEdge } from '../types/graph';
import { getNodeColor, getEdgeColor, getEdgeStyle } from './theme';
import { calculateSmartEdgeRouting } from './layout-algorithms';

/**
 * Convert framework node to ReactFlow node format
 */
export function buildReactFlowNode(
  node: FrameworkNode,
  position: { x: number; y: number }
): ReactFlowFrameworkNode {
  return {
    id: node.id,
    type: node.node_type,
    position,
    data: {
      ...node,
      label: node.name,
    },
  };
}

/**
 * Convert framework edge to ReactFlow edge format with smart handle routing
 */
export function buildReactFlowEdge(
  edge: Edge,
  positions?: Map<string, { x: number; y: number }>
): ReactFlowFrameworkEdge {
  const color = getEdgeColor(edge.relationship_type);
  const strokeDasharray = getEdgeStyle(edge.relationship_type) === 'dashed' ? '5,5' :
                          getEdgeStyle(edge.relationship_type) === 'dotted' ? '2,2' : undefined;

  // Convert "precedes" to "followed by" for better UX
  const displayLabel = edge.relationship_type === 'precedes' ? 'followed by' : edge.relationship_type;

  // Use smart routing if positions are available
  let sourceHandle: string | undefined;
  let targetHandle: string | undefined;

  if (positions) {
    const routing = calculateSmartEdgeRouting(edge.from_node, edge.to_node, positions);
    sourceHandle = routing.sourceHandle;
    targetHandle = routing.targetHandle;
  }

  return {
    id: edge.id,
    source: edge.from_node,
    target: edge.to_node,
    sourceHandle,
    targetHandle,
    label: displayLabel,
    type: 'default',
    data: edge,
    animated: edge.relationship_type === 'precedes',
    style: {
      stroke: color,
      strokeWidth: 2,
      strokeDasharray,
    },
  };
}

/**
 * Build complete ReactFlow graph from framework data
 */
export function buildReactFlowGraph(
  nodes: FrameworkNode[],
  edges: Edge[],
  positions?: Map<string, { x: number; y: number }>
): { nodes: ReactFlowFrameworkNode[]; edges: ReactFlowFrameworkEdge[] } {
  const reactFlowNodes = nodes.map((node) => {
    const position = positions?.get(node.id) || { x: 0, y: 0 };
    return buildReactFlowNode(node, position);
  });

  // Pass positions to edge builder for smart routing
  const reactFlowEdges = edges.map(edge => buildReactFlowEdge(edge, positions));

  return {
    nodes: reactFlowNodes,
    edges: reactFlowEdges,
  };
}
