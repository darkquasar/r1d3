/**
 * Unit Tests for Graph Builder
 *
 * Tests YAML to ReactFlow conversion
 */

import { describe, it, expect } from 'vitest';
import { buildReactFlowNode, buildReactFlowEdge, buildReactFlowGraph } from '@/lib/graph-builder';
import type { Phase, Edge } from '@/types/framework';

describe('Graph Builder', () => {
  const mockPhase: Phase = {
    id: 'test-phase',
    node_type: 'phase',
    name: 'Test Phase',
    version: '1.0',
    description: 'Test description',
  };

  const mockEdge: Edge = {
    id: 'test-edge',
    from_node: 'node-1',
    to_node: 'node-2',
    relationship_type: 'contains',
  };

  describe('buildReactFlowNode', () => {
    it('should convert framework node to ReactFlow format', () => {
      const position = { x: 100, y: 200 };
      const reactFlowNode = buildReactFlowNode(mockPhase, position);

      expect(reactFlowNode.id).toBe('test-phase');
      expect(reactFlowNode.type).toBe('phase');
      expect(reactFlowNode.position).toEqual(position);
      expect(reactFlowNode.data.label).toBe('Test Phase');
    });

    it('should preserve all node data', () => {
      const reactFlowNode = buildReactFlowNode(mockPhase, { x: 0, y: 0 });

      expect(reactFlowNode.data.id).toBe(mockPhase.id);
      expect(reactFlowNode.data.name).toBe(mockPhase.name);
      expect(reactFlowNode.data.version).toBe(mockPhase.version);
      expect(reactFlowNode.data.description).toBe(mockPhase.description);
    });
  });

  describe('buildReactFlowEdge', () => {
    it('should convert framework edge to ReactFlow format', () => {
      const reactFlowEdge = buildReactFlowEdge(mockEdge);

      expect(reactFlowEdge.id).toBe('test-edge');
      expect(reactFlowEdge.source).toBe('node-1');
      expect(reactFlowEdge.target).toBe('node-2');
      expect(reactFlowEdge.label).toBe('contains');
    });

    it('should apply styling based on relationship type', () => {
      const reactFlowEdge = buildReactFlowEdge(mockEdge);

      expect(reactFlowEdge.style).toBeDefined();
      expect(reactFlowEdge.style?.stroke).toBeDefined();
    });

    it('should animate precedes relationships', () => {
      const precedesEdge: Edge = {
        ...mockEdge,
        relationship_type: 'precedes',
      };

      const reactFlowEdge = buildReactFlowEdge(precedesEdge);
      expect(reactFlowEdge.animated).toBe(true);
    });
  });

  describe('buildReactFlowGraph', () => {
    it('should build complete graph with nodes and edges', () => {
      const nodes = [mockPhase];
      const edges = [mockEdge];

      const graph = buildReactFlowGraph(nodes, edges);

      expect(graph.nodes).toHaveLength(1);
      expect(graph.edges).toHaveLength(1);
    });

    it('should apply positions from position map', () => {
      const positions = new Map([['test-phase', { x: 50, y: 75 }]]);

      const graph = buildReactFlowGraph([mockPhase], [], positions);

      expect(graph.nodes[0].position).toEqual({ x: 50, y: 75 });
    });
  });
});
