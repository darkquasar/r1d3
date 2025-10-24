/**
 * Group Manager
 *
 * Generates ReactFlow nodes for visual groups and boundary obstacles
 * based on grouping configuration from topology.yaml.
 *
 * Responsibilities:
 * - Find nodes that belong to a group
 * - Calculate bounding box around group members
 * - Generate group container node (visual box)
 * - Generate boundary nodes (pathfinding obstacles)
 */

import type { Node } from 'reactflow';
import type { ReactFlowFrameworkNode } from '@/types/graph';
import type { GroupConfig } from './grouping-config';

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Generate ReactFlow nodes for a group and its boundaries
 *
 * @param groupConfig - Configuration from topology.yaml
 * @param nodes - All current ReactFlow nodes
 * @returns Array of nodes: [groupNode, ...boundaryNodes]
 */
export function generateGroupNodes(
  groupConfig: GroupConfig,
  nodes: Node[]
): Node[] {
  // 1. Find member nodes
  const memberNodes = findMemberNodes(groupConfig, nodes);
  if (memberNodes.length === 0) {
    return [];
  }

  // 2. Calculate bounding box
  const bbox = calculateBoundingBox(memberNodes, groupConfig.style.padding);

  // 3. Create group node (visual container)
  const groupNode = createGroupNode(groupConfig, bbox);

  // 4. Create boundary nodes (pathfinding obstacles)
  const boundaryNodes = groupConfig.boundary.enabled
    ? createBoundaryNodes(groupConfig, bbox)
    : [];

  return [groupNode, ...boundaryNodes];
}

/**
 * Find nodes that belong to this group
 */
function findMemberNodes(
  groupConfig: GroupConfig,
  nodes: Node[]
): Node[] {
  if (groupConfig.members.filter === 'all') {
    // All nodes of specified type
    return nodes.filter(node => node.type === groupConfig.members.nodeType);
  } else {
    // Specific node IDs
    return nodes.filter(node =>
      groupConfig.members.nodeIds?.includes(node.id)
    );
  }
}

/**
 * Calculate bounding box around member nodes with padding
 */
function calculateBoundingBox(
  nodes: Node[],
  padding: number
): BoundingBox {
  const positions = nodes.map(n => ({
    x: n.position.x,
    y: n.position.y,
    width: (n.style?.width as number) || 280,
    height: (n.style?.height as number) || 160,
  }));

  const minX = Math.min(...positions.map(p => p.x));
  const minY = Math.min(...positions.map(p => p.y));
  const maxX = Math.max(...positions.map(p => p.x + p.width));
  const maxY = Math.max(...positions.map(p => p.y + p.height));

  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
}

/**
 * Create the visual group container node
 */
function createGroupNode(
  groupConfig: GroupConfig,
  bbox: BoundingBox
): Node {
  return {
    id: `__group-${groupConfig.id}`,
    type: 'group-container',
    position: { x: bbox.x, y: bbox.y },
    style: {
      width: bbox.width,
      height: bbox.height,
      zIndex: -10, // Behind all content nodes
    },
    data: { groupConfig },
    draggable: false,
    selectable: false,
    focusable: false,
  } as Node;
}

/**
 * Create boundary nodes for pathfinding obstacle avoidance
 *
 * Strategies:
 * - perimeter: 8 nodes (4 corners + 4 midpoints)
 * - corners: 4 nodes (corners only)
 */
function createBoundaryNodes(
  groupConfig: GroupConfig,
  bbox: BoundingBox
): Node[] {
  const { strategy, obstacleSize } = groupConfig.boundary;
  const halfSize = obstacleSize / 2;

  let positions: Array<{ id: string; x: number; y: number }>;

  if (strategy === 'perimeter') {
    // PERIMETER: 8 nodes (4 corners + 4 midpoints)
    positions = [
      // Corners
      { id: 'tl', x: bbox.x - halfSize, y: bbox.y - halfSize },
      { id: 'tr', x: bbox.x + bbox.width - halfSize, y: bbox.y - halfSize },
      { id: 'bl', x: bbox.x - halfSize, y: bbox.y + bbox.height - halfSize },
      { id: 'br', x: bbox.x + bbox.width - halfSize, y: bbox.y + bbox.height - halfSize },

      // Midpoints
      { id: 't', x: bbox.x + bbox.width / 2 - halfSize, y: bbox.y - halfSize },
      { id: 'r', x: bbox.x + bbox.width - halfSize, y: bbox.y + bbox.height / 2 - halfSize },
      { id: 'b', x: bbox.x + bbox.width / 2 - halfSize, y: bbox.y + bbox.height - halfSize },
      { id: 'l', x: bbox.x - halfSize, y: bbox.y + bbox.height / 2 - halfSize },
    ];
  } else {
    // CORNERS: 4 nodes
    positions = [
      { id: 'tl', x: bbox.x - halfSize, y: bbox.y - halfSize },
      { id: 'tr', x: bbox.x + bbox.width - halfSize, y: bbox.y - halfSize },
      { id: 'bl', x: bbox.x - halfSize, y: bbox.y + bbox.height - halfSize },
      { id: 'br', x: bbox.x + bbox.width - halfSize, y: bbox.y + bbox.height - halfSize },
    ];
  }

  return positions.map(pos => ({
    id: `__boundary-${groupConfig.id}-${pos.id}`,
    type: 'boundary-obstacle',
    position: { x: pos.x, y: pos.y },
    style: {
      width: obstacleSize,
      height: obstacleSize,
      opacity: 0,
      pointerEvents: 'none',
      zIndex: -5, // Above group box, below content
    },
    data: { invisible: true },
    draggable: false,
    selectable: false,
    focusable: false,
  } as Node));
}
