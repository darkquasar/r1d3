/**
 * Unit tests for Phase 5 layout engines (Force-Directed, Hierarchical, Obstacle-Avoidance)
 * Feature: 002-yaml-flow-ontology-ux
 */

import { describe, it, expect } from 'vitest';
import type { Node, Edge } from 'reactflow';
import { applyForceDirectedLayout } from '@/lib/layouts/force-directed';
import { applyHierarchicalLayout } from '@/lib/layouts/hierarchical';
import { applyObstacleAvoidanceLayout } from '@/lib/layouts/obstacle-avoidance';
import { applyLayout, type LayoutConfig } from '@/lib/layouts/layout-engine';

describe('Force-Directed Layout (T061)', () => {
  it('should position nodes using force simulation', () => {
    const nodes: Node[] = [
      { id: '1', data: { label: 'Node 1' }, position: { x: 0, y: 0 } },
      { id: '2', data: { label: 'Node 2' }, position: { x: 0, y: 0 } },
      { id: '3', data: { label: 'Node 3' }, position: { x: 0, y: 0 } },
    ];

    const edges: Edge[] = [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e2-3', source: '2', target: '3' },
    ];

    const positioned = applyForceDirectedLayout(nodes, edges, {
      repulsion: -300,
      attraction: 0.1,
      centerGravity: 0.1,
    });

    // All nodes should have updated positions
    expect(positioned.length).toBe(3);

    // Nodes should be spread out (not all at origin)
    const allAtOrigin = positioned.every(n => n.position.x === 0 && n.position.y === 0);
    expect(allAtOrigin).toBe(false);

    // Connected nodes should be relatively close
    const node1 = positioned.find(n => n.id === '1')!;
    const node2 = positioned.find(n => n.id === '2')!;
    const distance = Math.sqrt(
      Math.pow(node2.position.x - node1.position.x, 2) +
      Math.pow(node2.position.y - node1.position.y, 2)
    );
    expect(distance).toBeLessThan(500); // Reasonable distance threshold
  });

  it('should handle single node', () => {
    const nodes: Node[] = [
      { id: '1', data: { label: 'Solo' }, position: { x: 0, y: 0 } },
    ];

    const positioned = applyForceDirectedLayout(nodes, [], {
      repulsion: -300,
      attraction: 0.1,
      centerGravity: 0.1,
    });

    expect(positioned.length).toBe(1);
    expect(positioned[0].id).toBe('1');
    // Single node should be centered or near origin
    expect(Math.abs(positioned[0].position.x)).toBeLessThan(100);
    expect(Math.abs(positioned[0].position.y)).toBeLessThan(100);
  });

  it('should apply custom parameters', () => {
    const nodes: Node[] = [
      { id: '1', data: {}, position: { x: 0, y: 0 } },
      { id: '2', data: {}, position: { x: 0, y: 0 } },
    ];

    const edges: Edge[] = [
      { id: 'e1-2', source: '1', target: '2' },
    ];

    // High repulsion should spread nodes farther apart
    const highRepulsion = applyForceDirectedLayout(nodes, edges, {
      repulsion: -1000,
      attraction: 0.1,
      centerGravity: 0.1,
    });

    const lowRepulsion = applyForceDirectedLayout(nodes, edges, {
      repulsion: -100,
      attraction: 0.1,
      centerGravity: 0.1,
    });

    const highDistance = Math.sqrt(
      Math.pow(highRepulsion[1].position.x - highRepulsion[0].position.x, 2) +
      Math.pow(highRepulsion[1].position.y - highRepulsion[0].position.y, 2)
    );

    const lowDistance = Math.sqrt(
      Math.pow(lowRepulsion[1].position.x - lowRepulsion[0].position.x, 2) +
      Math.pow(lowRepulsion[1].position.y - lowRepulsion[0].position.y, 2)
    );

    expect(highDistance).toBeGreaterThan(lowDistance);
  });
});

describe('Hierarchical Layout (T063)', () => {
  it('should position nodes in hierarchical structure', () => {
    const nodes: Node[] = [
      { id: 'root', data: { label: 'Root' }, position: { x: 0, y: 0 } },
      { id: 'child1', data: { label: 'Child 1' }, position: { x: 0, y: 0 } },
      { id: 'child2', data: { label: 'Child 2' }, position: { x: 0, y: 0 } },
    ];

    const edges: Edge[] = [
      { id: 'e-root-1', source: 'root', target: 'child1' },
      { id: 'e-root-2', source: 'root', target: 'child2' },
    ];

    const positioned = applyHierarchicalLayout(nodes, edges, {
      rankSeparation: 100,
      nodeSeparation: 80,
      direction: 'TB', // Top to Bottom
    });

    expect(positioned.length).toBe(3);

    const root = positioned.find(n => n.id === 'root')!;
    const child1 = positioned.find(n => n.id === 'child1')!;
    const child2 = positioned.find(n => n.id === 'child2')!;

    // Root should be higher (lower Y) than children in TB direction
    expect(root.position.y).toBeLessThan(child1.position.y);
    expect(root.position.y).toBeLessThan(child2.position.y);

    // Children should be at same level (similar Y)
    expect(Math.abs(child1.position.y - child2.position.y)).toBeLessThan(10);

    // Children should be horizontally separated
    expect(Math.abs(child1.position.x - child2.position.x)).toBeGreaterThan(50);
  });

  it('should handle LR (Left-Right) direction', () => {
    const nodes: Node[] = [
      { id: 'root', data: {}, position: { x: 0, y: 0 } },
      { id: 'child', data: {}, position: { x: 0, y: 0 } },
    ];

    const edges: Edge[] = [
      { id: 'e', source: 'root', target: 'child' },
    ];

    const positioned = applyHierarchicalLayout(nodes, edges, {
      rankSeparation: 100,
      nodeSeparation: 80,
      direction: 'LR',
    });

    const root = positioned.find(n => n.id === 'root')!;
    const child = positioned.find(n => n.id === 'child')!;

    // In LR, root should be to the left (lower X) of child
    expect(root.position.x).toBeLessThan(child.position.x);
  });
});

describe('Obstacle-Avoidance Layout (T065)', () => {
  it('should route edges around obstacles', () => {
    const nodes: Node[] = [
      { id: '1', data: {}, position: { x: 0, y: 0 } },
      { id: '2', data: {}, position: { x: 200, y: 200 } },
      { id: 'obstacle', data: {}, position: { x: 100, y: 100 } },
    ];

    const edges: Edge[] = [
      { id: 'e1-2', source: '1', target: '2' },
    ];

    const result = applyObstacleAvoidanceLayout(nodes, edges, {
      obstaclePadding: 20,
      pathSmoothing: 0.5,
    });

    // Should return edges with waypoints
    expect(result.edges.length).toBe(1);
    expect(result.edges[0].id).toBe('e1-2');

    // Edge should have data with waypoints for routing around obstacle
    if (result.edges[0].data?.waypoints) {
      expect(Array.isArray(result.edges[0].data.waypoints)).toBe(true);
      expect(result.edges[0].data.waypoints.length).toBeGreaterThan(0);
    }
  });

  it('should handle direct path when no obstacles', () => {
    const nodes: Node[] = [
      { id: '1', data: {}, position: { x: 0, y: 0 } },
      { id: '2', data: {}, position: { x: 200, y: 0 } },
    ];

    const edges: Edge[] = [
      { id: 'e1-2', source: '1', target: '2' },
    ];

    const result = applyObstacleAvoidanceLayout(nodes, edges, {
      obstaclePadding: 20,
      pathSmoothing: 0.5,
    });

    expect(result.edges.length).toBe(1);

    // Direct path should have minimal or no waypoints
    const waypoints = result.edges[0].data?.waypoints || [];
    expect(waypoints.length).toBeLessThanOrEqual(2);
  });
});

describe('Unified Layout Engine Interface (T067)', () => {
  const mockNodes: Node[] = [
    { id: '1', data: {}, position: { x: 0, y: 0 } },
    { id: '2', data: {}, position: { x: 0, y: 0 } },
  ];

  const mockEdges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2' },
  ];

  it('should apply force-directed layout via unified interface', async () => {
    const config: LayoutConfig = {
      algorithm: 'force-directed',
      params: {
        repulsion: -300,
        attraction: 0.1,
        centerGravity: 0.1,
      },
    };

    const result = await applyLayout(mockNodes, mockEdges, config);

    expect(result.nodes.length).toBe(2);
    expect(result.edges).toEqual(mockEdges);

    // Nodes should have updated positions
    const allAtOrigin = result.nodes.every(n => n.position.x === 0 && n.position.y === 0);
    expect(allAtOrigin).toBe(false);
  });

  it('should apply hierarchical layout via unified interface', async () => {
    const config: LayoutConfig = {
      algorithm: 'hierarchical',
      params: {
        rankSeparation: 100,
        nodeSeparation: 80,
        direction: 'TB',
      },
    };

    const result = await applyLayout(mockNodes, mockEdges, config);

    expect(result.nodes.length).toBe(2);
    expect(result.edges).toEqual(mockEdges);

    // Nodes should have updated positions
    const allAtOrigin = result.nodes.every(n => n.position.x === 0 && n.position.y === 0);
    expect(allAtOrigin).toBe(false);
  });

  it('should apply radial-tree layout via unified interface', async () => {
    const config: LayoutConfig = {
      algorithm: 'radial-tree',
      params: {
        radius: 150,
        angleOffset: 0,
      },
    };

    const result = await applyLayout(mockNodes, mockEdges, config);

    expect(result.nodes.length).toBe(2);
    expect(result.edges.length).toBe(1);
    // Nodes should have positions (radial tree positions them)
    const allAtOrigin = result.nodes.every(n => n.position.x === 0 && n.position.y === 0);
    expect(allAtOrigin).toBe(false);
  });

  it('should apply ELK layout via unified interface', async () => {
    const config: LayoutConfig = {
      algorithm: 'elk',
      params: {
        algorithm: 'layered',
        nodeSpacing: 80,
        layerSpacing: 100,
        direction: 'TB',
      },
    };

    const result = await applyLayout(mockNodes, mockEdges, config);

    expect(result.nodes.length).toBe(2);
    expect(result.edges.length).toBe(1);
    // Nodes should have positions
    const allAtOrigin = result.nodes.every(n => n.position.x === 0 && n.position.y === 0);
    expect(allAtOrigin).toBe(false);
  });

  it('should throw error for unknown algorithm', async () => {
    const config: LayoutConfig = {
      algorithm: 'unknown-algo' as any,
      params: {},
    };

    await expect(applyLayout(mockNodes, mockEdges, config)).rejects.toThrow();
  });

  it('should provide default parameters if not specified', async () => {
    const config: LayoutConfig = {
      algorithm: 'force-directed',
      params: {}, // Empty params should use defaults
    };

    const result = await applyLayout(mockNodes, mockEdges, config);

    expect(result.nodes.length).toBe(2);
    // Should not throw and should produce positioned nodes
    const allAtOrigin = result.nodes.every(n => n.position.x === 0 && n.position.y === 0);
    expect(allAtOrigin).toBe(false);
  });
});
