/**
 * Unit Tests: Topology Manager
 *
 * Tests for topology validation and query functions
 */

import { describe, it, expect } from 'vitest';
import { TopologyManager, type GraphEdge, type GraphNode } from '@/lib/topology-manager';

describe('TopologyManager', () => {
  describe('shouldNodeBeVisible', () => {
    it('should return true for nodes with no required parents', () => {
      const phaseNode = { id: 'phase-1', type: 'phase' as const };
      const edges: GraphEdge[] = [];
      const visibleNodes = new Set<string>();

      const result = TopologyManager.shouldNodeBeVisible(
        'phase-1',
        'phase',
        edges,
        visibleNodes
      );

      expect(result).toBe(true);
    });

    it('should return false for visualization without parent mental model', () => {
      const edges: GraphEdge[] = [];
      const visibleNodes = new Set<string>();

      const result = TopologyManager.shouldNodeBeVisible(
        'viz-model-1',
        'visualization',
        edges,
        visibleNodes
      );

      expect(result).toBe(false);
    });

    it('should return false when required parent exists but is not visible', () => {
      const edges: GraphEdge[] = [
        { from: 'model-1', to: 'viz-model-1', type: 'visualizes' },
      ];
      const visibleNodes = new Set<string>(); // model-1 not visible

      const result = TopologyManager.shouldNodeBeVisible(
        'viz-model-1',
        'visualization',
        edges,
        visibleNodes
      );

      expect(result).toBe(false);
    });

    it('should return true when required parent exists and is visible', () => {
      const edges: GraphEdge[] = [
        { from: 'model-1', to: 'viz-model-1', type: 'visualizes' },
      ];
      const visibleNodes = new Set(['model-1']); // model-1 IS visible

      const result = TopologyManager.shouldNodeBeVisible(
        'viz-model-1',
        'visualization',
        edges,
        visibleNodes
      );

      expect(result).toBe(true);
    });

    it('should return true for mental model with at least one visible parent (any mode)', () => {
      const edges: GraphEdge[] = [
        { from: 'phase-1', to: 'model-1', type: 'linked-to' },
        { from: 'phase-2', to: 'model-1', type: 'linked-to' },
      ];
      const visibleNodes = new Set(['phase-1']); // Only phase-1 visible

      const result = TopologyManager.shouldNodeBeVisible(
        'model-1',
        'mental-model',
        edges,
        visibleNodes
      );

      expect(result).toBe(true);
    });

    it('should return false for mental model with no visible parents', () => {
      const edges: GraphEdge[] = [
        { from: 'phase-1', to: 'model-1', type: 'linked-to' },
      ];
      const visibleNodes = new Set<string>(); // phase-1 not visible

      const result = TopologyManager.shouldNodeBeVisible(
        'model-1',
        'mental-model',
        edges,
        visibleNodes
      );

      expect(result).toBe(false);
    });
  });

  describe('getCascadeDeleteNodes', () => {
    it('should return empty array for nodes with no cascade rules', () => {
      const edges: GraphEdge[] = [];

      const result = TopologyManager.getCascadeDeleteNodes('phase-1', 'phase', edges);

      expect(result).toEqual([]);
    });

    it('should return visualization IDs when mental model is deleted', () => {
      const edges: GraphEdge[] = [
        { from: 'model-1', to: 'viz-model-1', type: 'visualizes' },
        { from: 'phase-1', to: 'model-1', type: 'linked-to' },
      ];

      const result = TopologyManager.getCascadeDeleteNodes('model-1', 'mental-model', edges);

      expect(result).toEqual(['viz-model-1']);
    });

    it('should return multiple dependent nodes', () => {
      const edges: GraphEdge[] = [
        { from: 'model-1', to: 'viz-model-1', type: 'visualizes' },
        { from: 'model-1', to: 'viz-model-1-alt', type: 'visualizes' },
      ];

      const result = TopologyManager.getCascadeDeleteNodes('model-1', 'mental-model', edges);

      expect(result).toContain('viz-model-1');
      expect(result).toContain('viz-model-1-alt');
    });
  });

  describe('shouldRecalculatePosition', () => {
    it('should return false for non-physics-controlled nodes', () => {
      const result = TopologyManager.shouldRecalculatePosition(
        'phase-1',
        'phase',
        { type: 'edge-added', edgeId: 'edge-1' },
        new Set()
      );

      expect(result).toBe(false);
    });

    it('should return false for user-dragged mental models', () => {
      const userDraggedNodes = new Set(['model-1']);

      const result = TopologyManager.shouldRecalculatePosition(
        'model-1',
        'mental-model',
        { type: 'edge-added', edgeId: 'edge-1' },
        userDraggedNodes
      );

      expect(result).toBe(false);
    });

    it('should return true for mental model when edge is added', () => {
      const result = TopologyManager.shouldRecalculatePosition(
        'model-1',
        'mental-model',
        { type: 'edge-added', edgeId: 'edge-1' },
        new Set()
      );

      expect(result).toBe(true);
    });

    it('should return true for mental model when edge is removed', () => {
      const result = TopologyManager.shouldRecalculatePosition(
        'model-1',
        'mental-model',
        { type: 'edge-removed', edgeId: 'edge-1' },
        new Set()
      );

      expect(result).toBe(true);
    });

    it('should return true for visualization when parent moves', () => {
      const result = TopologyManager.shouldRecalculatePosition(
        'viz-model-1',
        'visualization',
        { type: 'parent-moved', parentId: 'model-1' },
        new Set()
      );

      expect(result).toBe(true);
    });

    it('should return false when user drags a node', () => {
      const result = TopologyManager.shouldRecalculatePosition(
        'model-1',
        'mental-model',
        { type: 'user-dragged' },
        new Set()
      );

      expect(result).toBe(false);
    });
  });

  describe('getNodesRequiringRecalculation', () => {
    it('should return empty set when no edges changed', () => {
      const result = TopologyManager.getNodesRequiringRecalculation(
        [],
        [],
        [],
        new Set()
      );

      expect(result.size).toBe(0);
    });

    it('should include mental model when edge is added', () => {
      const changedEdges: GraphEdge[] = [
        { from: 'phase-1', to: 'model-1', type: 'linked-to' },
      ];
      const allNodes: GraphNode[] = [
        { id: 'phase-1', type: 'phase' },
        { id: 'model-1', type: 'mental-model' },
      ];
      const allEdges = changedEdges;

      const result = TopologyManager.getNodesRequiringRecalculation(
        changedEdges,
        allNodes,
        allEdges,
        new Set()
      );

      expect(result.has('model-1')).toBe(true);
    });

    it('should NOT include user-dragged mental models', () => {
      const changedEdges: GraphEdge[] = [
        { from: 'phase-1', to: 'model-1', type: 'linked-to' },
      ];
      const allNodes: GraphNode[] = [
        { id: 'phase-1', type: 'phase' },
        { id: 'model-1', type: 'mental-model' },
      ];
      const userDraggedNodes = new Set(['model-1']);

      const result = TopologyManager.getNodesRequiringRecalculation(
        changedEdges,
        allNodes,
        changedEdges,
        userDraggedNodes
      );

      expect(result.has('model-1')).toBe(false);
    });

    it('should cascade to dependent visualizations when mental model changes', () => {
      const changedEdges: GraphEdge[] = [
        { from: 'phase-1', to: 'model-1', type: 'linked-to' },
      ];
      const allNodes: GraphNode[] = [
        { id: 'phase-1', type: 'phase' },
        { id: 'model-1', type: 'mental-model' },
        { id: 'viz-model-1', type: 'visualization' },
      ];
      const allEdges: GraphEdge[] = [
        { from: 'phase-1', to: 'model-1', type: 'linked-to' },
        { from: 'model-1', to: 'viz-model-1', type: 'visualizes' },
      ];

      const result = TopologyManager.getNodesRequiringRecalculation(
        changedEdges,
        allNodes,
        allEdges,
        new Set()
      );

      expect(result.has('model-1')).toBe(true);
      expect(result.has('viz-model-1')).toBe(true);
    });
  });

  describe('isEdgeAllowed', () => {
    it('should allow phase → mental-model with linked-to edge', () => {
      const result = TopologyManager.isEdgeAllowed('phase', 'mental-model', 'linked-to');

      expect(result).toBe(true);
    });

    it('should allow mental-model → visualization with visualizes edge', () => {
      const result = TopologyManager.isEdgeAllowed('mental-model', 'visualization', 'visualizes');

      expect(result).toBe(true);
    });

    it('should NOT allow visualization → mental-model', () => {
      const result = TopologyManager.isEdgeAllowed('visualization', 'mental-model', 'linked-to');

      expect(result).toBe(false);
    });

    it('should NOT allow phase → visualization (must go through mental model)', () => {
      const result = TopologyManager.isEdgeAllowed('phase', 'visualization', 'visualizes');

      expect(result).toBe(false);
    });
  });

  describe('buildDependencyMap', () => {
    it('should build correct dependency map for mental model → visualization', () => {
      const allNodes: GraphNode[] = [
        { id: 'model-1', type: 'mental-model' },
        { id: 'viz-model-1', type: 'visualization' },
      ];
      const allEdges: GraphEdge[] = [
        { from: 'model-1', to: 'viz-model-1', type: 'visualizes' },
      ];

      const result = TopologyManager.buildDependencyMap(allNodes, allEdges);

      expect(result.get('model-1')).toEqual(new Set(['viz-model-1']));
    });

    it('should return empty set for nodes with no dependents', () => {
      const allNodes: GraphNode[] = [
        { id: 'phase-1', type: 'phase' },
        { id: 'viz-model-1', type: 'visualization' },
      ];
      const allEdges: GraphEdge[] = [];

      const result = TopologyManager.buildDependencyMap(allNodes, allEdges);

      expect(result.get('phase-1')).toEqual(new Set());
      expect(result.get('viz-model-1')).toEqual(new Set());
    });
  });
});
