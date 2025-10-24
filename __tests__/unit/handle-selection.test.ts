/**
 * Tests for geometry-based handle selection
 * Verifies that edges choose different handles based on node positions
 */

import { describe, it, expect } from 'vitest';
import { updateEdgesIncremental } from '@/lib/reactflow-helpers';
import type { FrameworkNode } from '@/types/framework';

// Mock framework nodes for testing
const mockAllNodes: FrameworkNode[] = [
  {
    id: 'node1',
    name: 'Test Node 1',
    node_type: 'phase',
    version: '1.0',
    description: 'Test node',
  },
  {
    id: 'model1',
    name: 'Test Model 1',
    node_type: 'mental-model',
    version: '1.0',
    description: 'Test mental model',
  },
  {
    id: 'model2',
    name: 'Test Model 2',
    node_type: 'mental-model',
    version: '1.0',
    description: 'Test mental model',
  },
  {
    id: 'model3',
    name: 'Test Model 3',
    node_type: 'mental-model',
    version: '1.0',
    description: 'Test mental model',
  },
];

describe('Handle Selection Based on Geometry', () => {
  it('should use right-source → left for target to the right', () => {
    const currentEdges: any[] = [];
    const originalEdges: any[] = [];
    const mentalModelToggles = new Map([['model1', new Set(['node1'])]]);
    const visualizationToggles = new Set<string>();
    const visibleMentalModelIds = new Set(['model1']);
    const visibleVisualizationIds = new Set<string>();

    // node1 is at (0, 0), model1 is to the right at (500, 0)
    const nodePositions = new Map([
      ['node1', { x: 0, y: 0 }],
      ['model1', { x: 500, y: 0 }],
    ]);

    const edges = updateEdgesIncremental(
      currentEdges,
      originalEdges,
      mentalModelToggles,
      visualizationToggles,
      visibleMentalModelIds,
      visibleVisualizationIds,
      nodePositions,
      mockAllNodes
    );

    expect(edges).toHaveLength(1);
    expect(edges[0].sourceHandle).toBe('right-source');
    expect(edges[0].targetHandle).toBe('left');
  });

  it('should use left-source → right for target to the left', () => {
    const currentEdges: any[] = [];
    const originalEdges: any[] = [];
    const mentalModelToggles = new Map([['model1', new Set(['node1'])]]);
    const visualizationToggles = new Set<string>();
    const visibleMentalModelIds = new Set(['model1']);
    const visibleVisualizationIds = new Set<string>();

    // node1 is at (500, 0), model1 is to the left at (0, 0)
    const nodePositions = new Map([
      ['node1', { x: 500, y: 0 }],
      ['model1', { x: 0, y: 0 }],
    ]);

    const edges = updateEdgesIncremental(
      currentEdges,
      originalEdges,
      mentalModelToggles,
      visualizationToggles,
      visibleMentalModelIds,
      visibleVisualizationIds,
      nodePositions,
      mockAllNodes
    );

    expect(edges).toHaveLength(1);
    expect(edges[0].sourceHandle).toBe('left-source');
    expect(edges[0].targetHandle).toBe('right');
  });

  it('should use bottom → top for target below', () => {
    const currentEdges: any[] = [];
    const originalEdges: any[] = [];
    const mentalModelToggles = new Map([['model1', new Set(['node1'])]]);
    const visualizationToggles = new Set<string>();
    const visibleMentalModelIds = new Set(['model1']);
    const visibleVisualizationIds = new Set<string>();

    // node1 is at (0, 0), model1 is below at (0, 500)
    const nodePositions = new Map([
      ['node1', { x: 0, y: 0 }],
      ['model1', { x: 0, y: 500 }],
    ]);

    const edges = updateEdgesIncremental(
      currentEdges,
      originalEdges,
      mentalModelToggles,
      visualizationToggles,
      visibleMentalModelIds,
      visibleVisualizationIds,
      nodePositions,
      mockAllNodes
    );

    expect(edges).toHaveLength(1);
    expect(edges[0].sourceHandle).toBe('bottom');
    expect(edges[0].targetHandle).toBe('top');
  });

  it('should use top-source → bottom-target for target above', () => {
    const currentEdges: any[] = [];
    const originalEdges: any[] = [];
    const mentalModelToggles = new Map([['model1', new Set(['node1'])]]);
    const visualizationToggles = new Set<string>();
    const visibleMentalModelIds = new Set(['model1']);
    const visibleVisualizationIds = new Set<string>();

    // node1 is at (0, 500), model1 is above at (0, 0)
    const nodePositions = new Map([
      ['node1', { x: 0, y: 500 }],
      ['model1', { x: 0, y: 0 }],
    ]);

    const edges = updateEdgesIncremental(
      currentEdges,
      originalEdges,
      mentalModelToggles,
      visualizationToggles,
      visibleMentalModelIds,
      visibleVisualizationIds,
      nodePositions,
      mockAllNodes
    );

    expect(edges).toHaveLength(1);
    expect(edges[0].sourceHandle).toBe('top-source');
    expect(edges[0].targetHandle).toBe('bottom-target');
  });

  it('should use different handles for mental models in different positions', () => {
    const currentEdges: any[] = [];
    const originalEdges: any[] = [];
    const mentalModelToggles = new Map([
      ['model1', new Set(['node1'])], // to the right
      ['model2', new Set(['node1'])], // below
      ['model3', new Set(['node1'])], // to the left
    ]);
    const visualizationToggles = new Set<string>();
    const visibleMentalModelIds = new Set(['model1', 'model2', 'model3']);
    const visibleVisualizationIds = new Set<string>();

    // node1 is at center (0, 0)
    // model1 is to the right
    // model2 is below
    // model3 is to the left
    const nodePositions = new Map([
      ['node1', { x: 0, y: 0 }],
      ['model1', { x: 500, y: 0 }],
      ['model2', { x: 0, y: 500 }],
      ['model3', { x: -500, y: 0 }],
    ]);

    const edges = updateEdgesIncremental(
      currentEdges,
      originalEdges,
      mentalModelToggles,
      visualizationToggles,
      visibleMentalModelIds,
      visibleVisualizationIds,
      nodePositions,
      mockAllNodes
    );

    expect(edges).toHaveLength(3);

    // Find each edge
    const edge1 = edges.find(e => e.target === 'model1');
    const edge2 = edges.find(e => e.target === 'model2');
    const edge3 = edges.find(e => e.target === 'model3');

    // Different mental models should use different handles
    expect(edge1?.sourceHandle).toBe('right-source'); // to the right
    expect(edge2?.sourceHandle).toBe('bottom');        // below
    expect(edge3?.sourceHandle).toBe('left-source');   // to the left
  });

  it('should fall back to default handles when position data is missing', () => {
    const currentEdges: any[] = [];
    const originalEdges: any[] = [];
    const mentalModelToggles = new Map([['model1', new Set(['node1'])]]);
    const visualizationToggles = new Set<string>();
    const visibleMentalModelIds = new Set(['model1']);
    const visibleVisualizationIds = new Set<string>();

    // Empty position map - simulate missing position data
    const nodePositions = new Map<string, { x: number; y: number }>();

    const edges = updateEdgesIncremental(
      currentEdges,
      originalEdges,
      mentalModelToggles,
      visualizationToggles,
      visibleMentalModelIds,
      visibleVisualizationIds,
      nodePositions,
      mockAllNodes
    );

    expect(edges).toHaveLength(1);
    // Should fall back to default
    expect(edges[0].sourceHandle).toBe('right-source');
    expect(edges[0].targetHandle).toBe('left');
  });
});
