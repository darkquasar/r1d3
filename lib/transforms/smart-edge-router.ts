/**
 * Smart Edge Router
 *
 * Calculates optimal handle selection for edges based on node positions
 * to minimize edge/node-body intersections
 */

import type { Node, Edge } from 'reactflow';

/**
 * Calculate smart edge routing for all edges
 *
 * For each edge, determines the optimal source and target handles
 * based on the relative positions of the connected nodes.
 *
 * @param nodes - React Flow nodes with positions
 * @param edges - React Flow edges to route
 * @returns Edges with sourceHandle and targetHandle assigned
 */
export function applySmartEdgeRouting(nodes: Node[], edges: Edge[]): Edge[] {
  console.log('[SmartRouter] Processing', edges.length, 'edges with', nodes.length, 'nodes');

  // Create position map for quick lookups
  const nodePositions = new Map<string, { x: number; y: number }>();
  nodes.forEach(node => {
    nodePositions.set(node.id, node.position);
  });

  // Calculate optimal handles for each edge
  const routedEdges = edges.map(edge => {
    const handles = calculateOptimalHandles(
      edge.source,
      edge.target,
      nodePositions
    );

    console.log(`[SmartRouter] Edge ${edge.id}: ${edge.source} (${handles.sourceHandle}) -> ${edge.target} (${handles.targetHandle})`);

    return {
      ...edge,
      sourceHandle: handles.sourceHandle,
      targetHandle: handles.targetHandle,
    };
  });

  return routedEdges;
}

/**
 * Calculate optimal handles based on angular direction between nodes
 *
 * Uses angle-based quadrant selection:
 * - Right: 315-45° → right to left
 * - Bottom: 45-135° → bottom to top
 * - Left: 135-225° → left to right
 * - Top: 225-315° → top to bottom
 *
 * @param sourceId - Source node ID
 * @param targetId - Target node ID
 * @param positions - Map of node positions
 * @returns Optimal source and target handle IDs
 */
function calculateOptimalHandles(
  sourceId: string,
  targetId: string,
  positions: Map<string, { x: number; y: number }>
): { sourceHandle: string; targetHandle: string } {
  const sourcePos = positions.get(sourceId);
  const targetPos = positions.get(targetId);

  // Default to right→left if positions unknown
  if (!sourcePos || !targetPos) {
    return { sourceHandle: 'right', targetHandle: 'left' };
  }

  // Calculate angle from source to target
  const dx = targetPos.x - sourcePos.x;
  const dy = targetPos.y - sourcePos.y;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Normalize to 0-360°
  const normalizedAngle = (angle + 360) % 360;

  // Select handles based on quadrant
  // Source handles: 'right', 'bottom', 'left-source', 'top-source'
  // Target handles: 'left', 'top', 'right-target', 'bottom-target'

  if (normalizedAngle >= 315 || normalizedAngle < 45) {
    // Target is to the RIGHT
    return { sourceHandle: 'right', targetHandle: 'left' };
  } else if (normalizedAngle >= 45 && normalizedAngle < 135) {
    // Target is BELOW
    return { sourceHandle: 'bottom', targetHandle: 'top' };
  } else if (normalizedAngle >= 135 && normalizedAngle < 225) {
    // Target is to the LEFT
    return { sourceHandle: 'left-source', targetHandle: 'right-target' };
  } else {
    // Target is ABOVE
    return { sourceHandle: 'top-source', targetHandle: 'bottom-target' };
  }
}
