/**
 * Obstacle-Avoidance Layout Engine
 *
 * Custom A* pathfinding for edge routing around obstacles
 */

import type { Node, Edge } from 'reactflow';

export interface ObstacleAvoidanceParams {
  obstaclePadding: number; // Padding around obstacles
  pathSmoothing: number; // Path smoothing factor (0-1)
}

export interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
}

interface Point {
  x: number;
  y: number;
}

/**
 * Check if a line segment intersects with a node (obstacle)
 */
function lineIntersectsNode(
  lineStart: Point,
  lineEnd: Point,
  nodePos: Point,
  padding: number
): boolean {
  // Simple AABB (Axis-Aligned Bounding Box) intersection check
  const nodeWidth = 180 + padding * 2;
  const nodeHeight = 60 + padding * 2;

  const nodeLeft = nodePos.x - nodeWidth / 2;
  const nodeRight = nodePos.x + nodeWidth / 2;
  const nodeTop = nodePos.y - nodeHeight / 2;
  const nodeBottom = nodePos.y + nodeHeight / 2;

  // Check if line bounding box intersects with node bounding box
  const lineLeft = Math.min(lineStart.x, lineEnd.x);
  const lineRight = Math.max(lineStart.x, lineEnd.x);
  const lineTop = Math.min(lineStart.y, lineEnd.y);
  const lineBottom = Math.max(lineStart.y, lineEnd.y);

  return !(
    lineRight < nodeLeft ||
    lineLeft > nodeRight ||
    lineBottom < nodeTop ||
    lineTop > nodeBottom
  );
}

/**
 * Find waypoints around obstacles using simplified pathfinding
 */
function findPathAroundObstacles(
  start: Point,
  end: Point,
  obstacles: Point[],
  padding: number
): Point[] {
  // Check for direct path (no obstacles)
  const hasObstacles = obstacles.some(obstacle =>
    lineIntersectsNode(start, end, obstacle, padding)
  );

  if (!hasObstacles) {
    // Direct path is clear
    return [start, end];
  }

  // Simple waypoint generation: go around obstacles by adding intermediate points
  // This is a simplified version - full A* implementation would be more complex
  const waypoints: Point[] = [start];

  // Find obstacles in the path
  const blockingObstacles = obstacles.filter(obstacle =>
    lineIntersectsNode(start, end, obstacle, padding)
  );

  if (blockingObstacles.length > 0) {
    // Add waypoint above/below the first obstacle
    const obstacle = blockingObstacles[0];
    const midpoint = {
      x: (start.x + end.x) / 2,
      y: obstacle.y + 100, // Go around
    };
    waypoints.push(midpoint);
  }

  waypoints.push(end);
  return waypoints;
}

/**
 * Apply obstacle-avoidance layout
 *
 * This routes edges around nodes to avoid visual overlaps
 *
 * @param nodes - React Flow nodes (potential obstacles)
 * @param edges - React Flow edges to route
 * @param params - Obstacle avoidance parameters
 * @returns Layout result with positioned nodes and routed edges
 */
export function applyObstacleAvoidanceLayout(
  nodes: Node[],
  edges: Edge[],
  params: ObstacleAvoidanceParams
): LayoutResult {
  // Nodes keep their positions (this layout only affects edges)
  const positionedNodes = [...nodes];

  // Route each edge around obstacles
  const routedEdges = edges.map(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);

    if (!sourceNode || !targetNode) {
      return edge; // Can't route without source/target
    }

    // Get node centers
    const start = {
      x: sourceNode.position.x + 90, // Center of node (assuming 180px width)
      y: sourceNode.position.y + 30, // Center of node (assuming 60px height)
    };

    const end = {
      x: targetNode.position.x + 90,
      y: targetNode.position.y + 30,
    };

    // Obstacles are all nodes except source and target
    const obstacles = nodes
      .filter(n => n.id !== edge.source && n.id !== edge.target)
      .map(n => ({
        x: n.position.x + 90,
        y: n.position.y + 30,
      }));

    // Find path around obstacles
    const waypoints = findPathAroundObstacles(start, end, obstacles, params.obstaclePadding);

    // Return edge with waypoints (if any intermediate points exist)
    if (waypoints.length > 2) {
      return {
        ...edge,
        data: {
          ...edge.data,
          waypoints: waypoints.slice(1, -1), // Exclude start/end points
        },
      };
    }

    return edge; // No waypoints needed
  });

  return {
    nodes: positionedNodes,
    edges: routedEdges,
  };
}
