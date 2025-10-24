/**
 * Edge Routing Utilities
 *
 * Smart waypoint calculation for obstacle avoidance in graph edges
 */

import { Position } from 'reactflow';

/**
 * Phase grid configuration
 * Based on app/page.tsx layout parameters
 */
const PHASE_GRID = {
  centerX: 800,
  centerY: 600,
  spacingX: 600,
  spacingY: 400,
  nodeWidth: 300,  // Estimated node width
  nodeHeight: 150, // Estimated node height
};

/**
 * Calculate the bounding box of the phase grid area
 */
export function getPhaseGridBounds() {
  const halfWidth = PHASE_GRID.nodeWidth / 2;
  const halfHeight = PHASE_GRID.nodeHeight / 2;

  // Phase grid is 2x2 centered at (800, 600) with spacing (600, 400)
  // Top-left phase: (500, 400), Top-right: (1100, 400)
  // Bottom-left: (500, 800), Bottom-right: (1100, 800)

  const minX = PHASE_GRID.centerX - PHASE_GRID.spacingX / 2 - halfWidth;
  const maxX = PHASE_GRID.centerX + PHASE_GRID.spacingX / 2 + halfWidth;
  const minY = PHASE_GRID.centerY - PHASE_GRID.spacingY / 2 - halfHeight;
  const maxY = PHASE_GRID.centerY + PHASE_GRID.spacingY / 2 + halfHeight;

  return {
    minX, // ~350
    maxX, // ~1250
    minY, // ~325
    maxY, // ~875
  };
}

/**
 * Safe Y-corridors for routing around phase grid
 */
const SAFE_CORRIDORS = {
  upper: 150,   // Above phase grid
  lower: 1050,  // Below phase grid
  padding: 50,  // Extra padding from obstacles
};

/**
 * Check if a horizontal line segment intersects the phase grid
 */
function lineIntersectsPhaseGrid(
  startX: number,
  endX: number,
  y: number
): boolean {
  const bounds = getPhaseGridBounds();

  // Check if Y coordinate is within phase grid vertical bounds
  if (y < bounds.minY || y > bounds.maxY) {
    return false;
  }

  // Check if line segment overlaps with phase grid horizontal bounds
  const lineMinX = Math.min(startX, endX);
  const lineMaxX = Math.max(startX, endX);

  return lineMaxX >= bounds.minX && lineMinX <= bounds.maxX;
}

/**
 * Calculate waypoints to route around phase grid obstacles
 *
 * Strategy:
 * - If edge would pass through phase grid, route via safe Y-corridor
 * - Choose upper or lower corridor based on which is closer
 * - Create waypoints: [start] -> [safe Y] -> [safe Y at target X] -> [end]
 */
export function calculateWaypointsForObstacleAvoidance(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  sourcePosition: Position,
  targetPosition: Position
): { x: number; y: number }[] {
  const waypoints: { x: number; y: number }[] = [];

  // Check if direct path intersects phase grid
  const bounds = getPhaseGridBounds();

  // Simple heuristic: if both source and target X are outside phase grid bounds,
  // and the Y range overlaps, we need waypoints
  const sourceInGridX = sourceX >= bounds.minX && sourceX <= bounds.maxX;
  const targetInGridX = targetX >= bounds.minX && targetX <= bounds.maxX;
  const minY = Math.min(sourceY, targetY);
  const maxY = Math.max(sourceY, targetY);
  const yRangeOverlapsGrid = maxY >= bounds.minY && minY <= bounds.maxY;

  // Mental models are at X=1800, phases are at ~500-1100
  // Need to route horizontally through phase grid area
  const needsRouting =
    !sourceInGridX &&
    !targetInGridX &&
    sourceX < bounds.maxX &&
    targetX > bounds.minX &&
    yRangeOverlapsGrid;

  if (!needsRouting) {
    // No waypoints needed - clear path
    return waypoints;
  }

  // Determine which safe corridor to use (upper or lower)
  const distToUpper = Math.abs(sourceY - SAFE_CORRIDORS.upper) + Math.abs(targetY - SAFE_CORRIDORS.upper);
  const distToLower = Math.abs(sourceY - SAFE_CORRIDORS.lower) + Math.abs(targetY - SAFE_CORRIDORS.lower);
  const safeY = distToUpper <= distToLower ? SAFE_CORRIDORS.upper : SAFE_CORRIDORS.lower;

  // Create waypoints to route around obstacle
  // Path: source -> (sourceX, safeY) -> (targetX, safeY) -> target

  // First waypoint: go vertical from source to safe corridor
  if (Math.abs(sourceY - safeY) > 10) {
    waypoints.push({ x: sourceX, y: safeY });
  }

  // Second waypoint: horizontal travel in safe corridor
  if (Math.abs(targetX - sourceX) > 10) {
    waypoints.push({ x: targetX, y: safeY });
  }

  return waypoints;
}

/**
 * Build a smooth step path with waypoints
 * ReactFlow's getSmoothStepPath doesn't support custom waypoints,
 * so we'll construct the path manually
 */
export function buildPathWithWaypoints(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  waypoints: { x: number; y: number }[]
): string {
  if (waypoints.length === 0) {
    // No waypoints - simple step path
    return buildSimpleStepPath(sourceX, sourceY, targetX, targetY);
  }

  // Build path through waypoints
  let path = `M ${sourceX},${sourceY}`;

  let currentX = sourceX;
  let currentY = sourceY;

  for (const waypoint of waypoints) {
    // Vertical segment
    if (waypoint.y !== currentY) {
      path += ` L ${currentX},${waypoint.y}`;
      currentY = waypoint.y;
    }

    // Horizontal segment
    if (waypoint.x !== currentX) {
      path += ` L ${waypoint.x},${currentY}`;
      currentX = waypoint.x;
    }
  }

  // Final segments to target
  if (targetY !== currentY) {
    path += ` L ${currentX},${targetY}`;
  }
  path += ` L ${targetX},${targetY}`;

  return path;
}

/**
 * Build a simple step path (vertical then horizontal, or horizontal then vertical)
 */
function buildSimpleStepPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number
): string {
  // For mental model edges (source on left, target on right), go horizontal first then vertical
  const midX = sourceX + (targetX - sourceX) / 2;

  return `M ${sourceX},${sourceY} L ${midX},${sourceY} L ${midX},${targetY} L ${targetX},${targetY}`;
}
