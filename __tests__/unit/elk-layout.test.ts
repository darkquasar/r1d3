/**
 * Unit tests for ELK.js Layout Engine
 * Feature: 002-yaml-flow-ontology-ux - Phase 5A
 */

import { describe, it, expect } from 'vitest';
import type { Node, Edge } from 'reactflow';
import { applyElkLayout, type ElkParams } from '@/lib/layouts/elk';

describe('ELK Layout Engine (T087a-T092a)', () => {
  it('should position nodes using ELK layered algorithm', async () => {
    const nodes: Node[] = [
      { id: '1', data: { label: 'Node 1' }, position: { x: 0, y: 0 } },
      { id: '2', data: { label: 'Node 2' }, position: { x: 0, y: 0 } },
      { id: '3', data: { label: 'Node 3' }, position: { x: 0, y: 0 } },
    ];

    const edges: Edge[] = [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e2-3', source: '2', target: '3' },
    ];

    const params: ElkParams = {
      algorithm: 'layered',
      nodeSpacing: 80,
      layerSpacing: 100,
      direction: 'TB',
    };

    const positioned = await applyElkLayout(nodes, edges, params);

    // All nodes should have updated positions
    expect(positioned.length).toBe(3);

    // Nodes should not all be at origin
    const allAtOrigin = positioned.every(n => n.position.x === 0 && n.position.y === 0);
    expect(allAtOrigin).toBe(false);

    // ELK should have positioned nodes with valid coordinates
    positioned.forEach(node => {
      expect(typeof node.position.x).toBe('number');
      expect(typeof node.position.y).toBe('number');
      expect(Number.isFinite(node.position.x)).toBe(true);
      expect(Number.isFinite(node.position.y)).toBe(true);
    });
  });

  it('should handle single node case', async () => {
    const nodes: Node[] = [
      { id: '1', data: { label: 'Solo' }, position: { x: 0, y: 0 } },
    ];

    const params: ElkParams = {
      algorithm: 'layered',
      nodeSpacing: 80,
      layerSpacing: 100,
      direction: 'TB',
    };

    const positioned = await applyElkLayout(nodes, [], params);

    expect(positioned.length).toBe(1);
    expect(positioned[0].id).toBe('1');
    // Single node should be centered
    expect(positioned[0].position.x).toBe(400);
    expect(positioned[0].position.y).toBe(300);
  });

  it('should handle empty node array', async () => {
    const positioned = await applyElkLayout([], [], {
      algorithm: 'layered',
      nodeSpacing: 80,
      layerSpacing: 100,
      direction: 'TB',
    });

    expect(positioned.length).toBe(0);
  });

  it('should support LR (Left-Right) direction', async () => {
    const nodes: Node[] = [
      { id: 'root', data: {}, position: { x: 0, y: 0 } },
      { id: 'child', data: {}, position: { x: 0, y: 0 } },
    ];

    const edges: Edge[] = [
      { id: 'e', source: 'root', target: 'child' },
    ];

    const params: ElkParams = {
      algorithm: 'layered',
      nodeSpacing: 80,
      layerSpacing: 100,
      direction: 'LR',
    };

    const positioned = await applyElkLayout(nodes, edges, params);

    const root = positioned.find(n => n.id === 'root')!;
    const child = positioned.find(n => n.id === 'child')!;

    // In LR, root should be to the left (lower X) of child
    expect(root.position.x).toBeLessThan(child.position.x);
  });

  it('should support force algorithm', async () => {
    const nodes: Node[] = [
      { id: '1', data: {}, position: { x: 0, y: 0 } },
      { id: '2', data: {}, position: { x: 0, y: 0 } },
      { id: '3', data: {}, position: { x: 0, y: 0 } },
    ];

    const edges: Edge[] = [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e2-3', source: '2', target: '3' },
    ];

    const params: ElkParams = {
      algorithm: 'force',
      nodeSpacing: 80,
      layerSpacing: 100,
      direction: 'TB',
    };

    const positioned = await applyElkLayout(nodes, edges, params);

    expect(positioned.length).toBe(3);

    // Nodes should be positioned (not at origin)
    const allAtOrigin = positioned.every(n => n.position.x === 0 && n.position.y === 0);
    expect(allAtOrigin).toBe(false);
  });

  it('should support stress algorithm', async () => {
    const nodes: Node[] = [
      { id: '1', data: {}, position: { x: 0, y: 0 } },
      { id: '2', data: {}, position: { x: 0, y: 0 } },
    ];

    const edges: Edge[] = [
      { id: 'e1-2', source: '1', target: '2' },
    ];

    const params: ElkParams = {
      algorithm: 'stress',
      nodeSpacing: 80,
      layerSpacing: 100,
      direction: 'TB',
    };

    const positioned = await applyElkLayout(nodes, edges, params);

    expect(positioned.length).toBe(2);
    const allAtOrigin = positioned.every(n => n.position.x === 0 && n.position.y === 0);
    expect(allAtOrigin).toBe(false);
  });

  it('should apply custom node spacing', async () => {
    const nodes: Node[] = [
      { id: '1', data: {}, position: { x: 0, y: 0 } },
      { id: '2', data: {}, position: { x: 0, y: 0 } },
      { id: '3', data: {}, position: { x: 0, y: 0 } },
    ];

    const edges: Edge[] = [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e1-3', source: '1', target: '3' },
    ];

    const tightSpacing = await applyElkLayout(nodes, edges, {
      algorithm: 'layered',
      nodeSpacing: 20,
      layerSpacing: 50,
      direction: 'TB',
    });

    const wideSpacing = await applyElkLayout(nodes, edges, {
      algorithm: 'layered',
      nodeSpacing: 200,
      layerSpacing: 300,
      direction: 'TB',
    });

    // Calculate vertical span for each layout
    const tightYs = tightSpacing.map(n => n.position.y);
    const wideYs = wideSpacing.map(n => n.position.y);

    const tightSpan = Math.max(...tightYs) - Math.min(...tightYs);
    const wideSpan = Math.max(...wideYs) - Math.min(...wideYs);

    // Wider spacing should result in larger vertical span
    expect(wideSpan).toBeGreaterThan(tightSpan);
  });

  it('should preserve node data and IDs', async () => {
    const nodes: Node[] = [
      { id: 'custom-1', data: { label: 'Custom Node', foo: 'bar' }, position: { x: 0, y: 0 } },
      { id: 'custom-2', data: { label: 'Another', baz: 123 }, position: { x: 0, y: 0 } },
    ];

    const edges: Edge[] = [
      { id: 'e', source: 'custom-1', target: 'custom-2' },
    ];

    const positioned = await applyElkLayout(nodes, edges, {
      algorithm: 'layered',
      nodeSpacing: 80,
      layerSpacing: 100,
      direction: 'TB',
    });

    // IDs should be preserved
    expect(positioned.find(n => n.id === 'custom-1')).toBeDefined();
    expect(positioned.find(n => n.id === 'custom-2')).toBeDefined();

    // Data should be preserved
    const node1 = positioned.find(n => n.id === 'custom-1')!;
    expect(node1.data.label).toBe('Custom Node');
    expect(node1.data.foo).toBe('bar');

    const node2 = positioned.find(n => n.id === 'custom-2')!;
    expect(node2.data.baz).toBe(123);
  });

  it('should handle complex graphs without overlaps', async () => {
    // Create a more complex graph (6 nodes, multiple connections)
    const nodes: Node[] = [
      { id: 'A', data: {}, position: { x: 0, y: 0 } },
      { id: 'B', data: {}, position: { x: 0, y: 0 } },
      { id: 'C', data: {}, position: { x: 0, y: 0 } },
      { id: 'D', data: {}, position: { x: 0, y: 0 } },
      { id: 'E', data: {}, position: { x: 0, y: 0 } },
      { id: 'F', data: {}, position: { x: 0, y: 0 } },
    ];

    const edges: Edge[] = [
      { id: 'e1', source: 'A', target: 'B' },
      { id: 'e2', source: 'A', target: 'C' },
      { id: 'e3', source: 'B', target: 'D' },
      { id: 'e4', source: 'C', target: 'E' },
      { id: 'e5', source: 'D', target: 'F' },
      { id: 'e6', source: 'E', target: 'F' },
    ];

    const positioned = await applyElkLayout(nodes, edges, {
      algorithm: 'layered',
      nodeSpacing: 80,
      layerSpacing: 100,
      direction: 'TB',
    });

    expect(positioned.length).toBe(6);

    // Check for overlaps (simple bounding box check)
    // Assuming default node size of 150x50
    const nodeWidth = 150;
    const nodeHeight = 50;

    for (let i = 0; i < positioned.length; i++) {
      for (let j = i + 1; j < positioned.length; j++) {
        const node1 = positioned[i];
        const node2 = positioned[j];

        // Check if bounding boxes overlap
        const xOverlap = Math.abs(node1.position.x - node2.position.x) < nodeWidth;
        const yOverlap = Math.abs(node1.position.y - node2.position.y) < nodeHeight;

        // If both x and y overlap, nodes are overlapping
        const overlapping = xOverlap && yOverlap;

        expect(overlapping).toBe(false);
      }
    }
  });
});
