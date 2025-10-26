/**
 * Force-Directed Layout Engine
 *
 * Uses d3-force simulation to position nodes organically
 */

import * as d3 from 'd3-force';
import type { Node, Edge } from 'reactflow';

export interface ForceDirectedParams {
  repulsion: number; // Charge force strength (negative = repulsion)
  attraction: number; // Link force strength
  centerGravity: number; // Center force strength
}

/**
 * Apply force-directed layout to nodes
 *
 * @param nodes - React Flow nodes to position
 * @param edges - React Flow edges defining connections
 * @param params - Force simulation parameters
 * @returns Nodes with updated positions
 */
export function applyForceDirectedLayout(
  nodes: Node[],
  edges: Edge[],
  params: ForceDirectedParams
): Node[] {
  // Handle empty or single node case
  if (nodes.length === 0) {
    return [];
  }

  if (nodes.length === 1) {
    return [{
      ...nodes[0],
      position: { x: 0, y: 0 },
    }];
  }

  // Create simulation nodes (d3-force works with objects having x, y, index)
  const simNodes = nodes.map((node, index) => ({
    id: node.id,
    index,
    x: node.position.x || Math.random() * 500,
    y: node.position.y || Math.random() * 500,
  }));

  // Create simulation links (d3-force needs source/target indices or objects)
  const simLinks = edges.map(edge => ({
    source: simNodes.find(n => n.id === edge.source)!,
    target: simNodes.find(n => n.id === edge.target)!,
  }));

  // Calculate dynamic link distance based on repulsion
  // More repulsion = longer ideal link distance (nodes spread out more)
  const linkDistance = Math.abs(params.repulsion) / 3;

  // Calculate dynamic collision radius based on link distance
  // Prevents overlap while allowing flexible spacing
  const collisionRadius = Math.min(linkDistance / 3, 80);

  // Create force simulation
  const simulation = d3
    .forceSimulation(simNodes)
    .force('charge', d3.forceManyBody().strength(params.repulsion))
    .force('link', d3.forceLink(simLinks).distance(linkDistance).strength(params.attraction))
    .force('center', d3.forceCenter(0, 0).strength(params.centerGravity))
    .force('collision', d3.forceCollide().radius(collisionRadius))
    .stop();

  // Run simulation synchronously to completion
  const iterations = Math.ceil(Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay()));
  for (let i = 0; i < iterations; ++i) {
    simulation.tick();
  }

  // Map simulated positions back to React Flow nodes
  return nodes.map((node, index) => ({
    ...node,
    position: {
      x: simNodes[index].x!,
      y: simNodes[index].y!,
    },
  }));
}
