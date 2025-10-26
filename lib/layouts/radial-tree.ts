/**
 * Radial Tree Layout Engine
 *
 * Positions nodes in a radial tree structure radiating from a center point
 * Uses d3-hierarchy for tree structure calculation
 */

import type { Node, Edge } from 'reactflow';
import * as d3Hierarchy from 'd3-hierarchy';

export interface RadialTreeParams {
  radius: number; // Radius for each level (distance from center)
  angleOffset: number; // Rotation offset in degrees (0-360)
  clusterSpacing?: number; // Distance between disconnected cluster centers (default: 600)
}

/**
 * Find disconnected clusters (connected components) in the graph
 * Uses breadth-first search to identify groups of connected nodes
 *
 * @param nodes - All nodes in the graph
 * @param edges - All edges in the graph
 * @returns Array of node clusters (each cluster is internally connected)
 */
function findConnectedClusters(nodes: Node[], edges: Edge[]): Node[][] {
  // Build adjacency list
  const adjacency = new Map<string, Set<string>>();
  nodes.forEach(n => adjacency.set(n.id, new Set()));

  // Add edges (treat as undirected for clustering)
  edges.forEach(edge => {
    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
  });

  const visited = new Set<string>();
  const clusters: Node[][] = [];

  // BFS to find each cluster
  nodes.forEach(startNode => {
    if (visited.has(startNode.id)) return;

    // Found a new cluster
    const cluster: Node[] = [];
    const queue: string[] = [startNode.id];

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (visited.has(nodeId)) continue;

      visited.add(nodeId);
      const node = nodes.find(n => n.id === nodeId);
      if (node) cluster.push(node);

      // Add connected neighbors to queue
      adjacency.get(nodeId)?.forEach(neighborId => {
        if (!visited.has(neighborId)) {
          queue.push(neighborId);
        }
      });
    }

    if (cluster.length > 0) {
      clusters.push(cluster);
    }
  });

  return clusters;
}

/**
 * Calculate center position for a cluster based on its index
 * Arranges clusters in a grid pattern to avoid overlaps
 *
 * @param clusterIndex - Index of the cluster (0, 1, 2, ...)
 * @param clusterSpacing - Distance between cluster centers
 * @returns {x, y} coordinates for cluster center
 */
function getClusterCenter(clusterIndex: number, clusterSpacing: number): { x: number; y: number } {
  // Arrange clusters in a 2-column grid
  const col = clusterIndex % 2;
  const row = Math.floor(clusterIndex / 2);

  return {
    x: 400 + (col - 0.5) * clusterSpacing, // Offset from center
    y: 300 + (row - 0.5) * clusterSpacing,
  };
}

/**
 * Build a tree structure from React Flow nodes and edges
 */
function buildHierarchy(nodes: Node[], edges: Edge[]): d3Hierarchy.HierarchyNode<Node> | null {
  // Find root node (node with no incoming edges)
  const incomingEdges = new Set(edges.map(e => e.target));
  const rootNodes = nodes.filter(n => !incomingEdges.has(n.id));

  if (rootNodes.length === 0) {
    // No clear root - use first node
    if (nodes.length === 0) return null;
    return buildNodeHierarchy(nodes[0].id, nodes, edges, new Set());
  }

  // Use first root node
  return buildNodeHierarchy(rootNodes[0].id, nodes, edges, new Set());
}

/**
 * Recursively build hierarchy starting from a node
 */
function buildNodeHierarchy(
  nodeId: string,
  nodes: Node[],
  edges: Edge[],
  visited: Set<string>
): d3Hierarchy.HierarchyNode<Node> | null {
  if (visited.has(nodeId)) return null;
  visited.add(nodeId);

  const node = nodes.find(n => n.id === nodeId);
  if (!node) return null;

  // Find children (outgoing edges)
  const childEdges = edges.filter(e => e.source === nodeId);
  const children = childEdges
    .map(e => buildNodeHierarchy(e.target, nodes, edges, visited))
    .filter((child): child is d3Hierarchy.HierarchyNode<Node> => child !== null);

  // Create hierarchy node
  const hierarchyData: any = {
    ...node,
    children: children.length > 0 ? children.map(c => c.data) : undefined,
  };

  return d3Hierarchy.hierarchy(hierarchyData);
}

/**
 * Apply radial tree layout to a single cluster
 *
 * @param clusterNodes - Nodes in this cluster
 * @param clusterEdges - Edges within this cluster
 * @param centerX - X coordinate of cluster center
 * @param centerY - Y coordinate of cluster center
 * @param params - Radial tree parameters
 * @returns Positioned nodes for this cluster
 */
function layoutCluster(
  clusterNodes: Node[],
  clusterEdges: Edge[],
  centerX: number,
  centerY: number,
  params: RadialTreeParams
): Node[] {
  if (clusterNodes.length === 1) {
    // Single node - place at cluster center
    return [{ ...clusterNodes[0], position: { x: centerX, y: centerY } }];
  }

  // Build tree hierarchy for this cluster
  const root = buildHierarchy(clusterNodes, clusterEdges);
  if (!root) {
    // Fallback to circular layout if hierarchy can't be built
    return applyCircularLayoutAtCenter(clusterNodes, centerX, centerY, params.radius);
  }

  // Calculate tree layout
  const treeLayout = d3Hierarchy.tree<Node>()
    .size([2 * Math.PI, params.radius]) // Full circle, with specified radius per level
    .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);

  const treeRoot = treeLayout(root);

  const angleOffsetRad = (params.angleOffset * Math.PI) / 180;
  const positionedNodes: Node[] = [];

  treeRoot.each((node: any) => {
    const originalNode = clusterNodes.find(n => n.id === node.data.id);
    if (!originalNode) return;

    if (node.depth === 0) {
      // Root node at cluster center
      positionedNodes.push({
        ...originalNode,
        position: { x: centerX, y: centerY },
      });
    } else {
      // Convert polar coordinates (angle, radius) to cartesian (x, y)
      const angle = node.x + angleOffsetRad;
      const radius = node.y;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      positionedNodes.push({
        ...originalNode,
        position: { x, y },
      });
    }
  });

  return positionedNodes;
}

/**
 * Apply radial tree layout to nodes with cluster detection
 *
 * Detects disconnected subgraphs and positions each cluster separately
 * to avoid overlaps between clusters.
 *
 * @param nodes - React Flow nodes to position
 * @param edges - React Flow edges (used to build hierarchy)
 * @param params - Radial tree parameters
 * @returns Positioned nodes
 */
export function applyRadialTreeLayout(
  nodes: Node[],
  edges: Edge[],
  params: RadialTreeParams
): Node[] {
  if (nodes.length === 0) return [];
  if (nodes.length === 1) {
    // Single node - place at center
    return [{ ...nodes[0], position: { x: 400, y: 300 } }];
  }

  // Find disconnected clusters
  const clusters = findConnectedClusters(nodes, edges);
  const clusterSpacing = params.clusterSpacing ?? 600;

  // Position each cluster independently
  const allPositionedNodes: Node[] = [];

  clusters.forEach((clusterNodes, index) => {
    // Get cluster center position
    const { x: centerX, y: centerY } = getClusterCenter(index, clusterSpacing);

    // Get edges for this cluster
    const clusterNodeIds = new Set(clusterNodes.map(n => n.id));
    const clusterEdges = edges.filter(
      e => clusterNodeIds.has(e.source) && clusterNodeIds.has(e.target)
    );

    // Apply radial layout to this cluster
    const positionedCluster = layoutCluster(
      clusterNodes,
      clusterEdges,
      centerX,
      centerY,
      params
    );

    allPositionedNodes.push(...positionedCluster);
  });

  return allPositionedNodes;
}

/**
 * Fallback: Circular layout around a specific center point
 */
function applyCircularLayoutAtCenter(
  nodes: Node[],
  centerX: number,
  centerY: number,
  radius: number
): Node[] {
  const angleStep = (2 * Math.PI) / nodes.length;

  return nodes.map((node, index) => {
    const angle = index * angleStep;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    return {
      ...node,
      position: { x, y },
    };
  });
}
