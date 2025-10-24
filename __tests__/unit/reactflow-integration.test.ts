/**
 * Unit Tests: ReactFlow Integration
 *
 * Tests for ReactFlow-native patterns:
 * - Incremental node updates (not full replacement)
 * - Object reference preservation (React.memo optimization)
 * - Proper merging of position updates
 */

import { describe, it, expect } from 'vitest';
import type { Node } from 'reactflow';

// Import the helper we'll create (TDD - doesn't exist yet)
import { updateNodesIncremental } from '@/lib/reactflow-helpers';

describe('updateNodesIncremental', () => {
  const mockPrimaryNodes: Node[] = [
    { id: 'phase-1', type: 'phase', position: { x: 100, y: 100 }, data: {} },
    { id: 'phase-2', type: 'phase', position: { x: 500, y: 100 }, data: {} },
  ];

  it('should preserve unchanged nodes (same object reference)', () => {
    const currentNodes: Node[] = [
      ...mockPrimaryNodes,
      { id: 'model-1', type: 'mental-model', position: { x: 300, y: 300 }, data: { id: 'model-1' } },
    ];

    // No changes - model-1 still visible, same position
    const visibleMentalModelIds = new Set(['model-1']);
    const visibleVisualizationIds = new Set<string>();
    const mentalModelPositions = new Map([['model-1', { x: 300, y: 300 }]]);
    const visualizationPositions = new Map();

    const result = updateNodesIncremental(
      currentNodes,
      visibleMentalModelIds,
      visibleVisualizationIds,
      mentalModelPositions,
      visualizationPositions,
      [], // mentalModelNodes not needed for this test
      []  // allNodes not needed
    );

    // Primary nodes should be SAME object reference
    expect(result[0]).toBe(currentNodes[0]); // Same instance, not copy
    expect(result[1]).toBe(currentNodes[1]);

    // Mental model unchanged, should be SAME object reference
    expect(result[2]).toBe(currentNodes[2]);
  });

  it('should update only changed node positions', () => {
    const currentNodes: Node[] = [
      ...mockPrimaryNodes,
      { id: 'model-1', type: 'mental-model', position: { x: 300, y: 300 }, data: { id: 'model-1' } },
      { id: 'model-2', type: 'mental-model', position: { x: 600, y: 300 }, data: { id: 'model-2' } },
    ];

    // model-1 position changed, model-2 unchanged
    const visibleMentalModelIds = new Set(['model-1', 'model-2']);
    const visibleVisualizationIds = new Set<string>();
    const mentalModelPositions = new Map([
      ['model-1', { x: 400, y: 350 }], // Changed position
      ['model-2', { x: 600, y: 300 }], // Same position
    ]);
    const visualizationPositions = new Map();

    const result = updateNodesIncremental(
      currentNodes,
      visibleMentalModelIds,
      visibleVisualizationIds,
      mentalModelPositions,
      visualizationPositions,
      [],
      []
    );

    // Primary nodes unchanged
    expect(result[0]).toBe(currentNodes[0]);
    expect(result[1]).toBe(currentNodes[1]);

    // model-1 changed, should be NEW object with updated position
    expect(result[2]).not.toBe(currentNodes[2]); // Different instance
    expect(result[2].id).toBe('model-1');
    expect(result[2].position).toEqual({ x: 400, y: 350 });

    // model-2 unchanged, should be SAME object reference
    expect(result[3]).toBe(currentNodes[3]); // Same instance
  });

  it('should remove nodes that are no longer visible', () => {
    const currentNodes: Node[] = [
      ...mockPrimaryNodes,
      { id: 'model-1', type: 'mental-model', position: { x: 300, y: 300 }, data: { id: 'model-1' } },
      { id: 'model-2', type: 'mental-model', position: { x: 600, y: 300 }, data: { id: 'model-2' } },
    ];

    // Only model-1 visible now (model-2 toggled off)
    const visibleMentalModelIds = new Set(['model-1']);
    const visibleVisualizationIds = new Set<string>();
    const mentalModelPositions = new Map([['model-1', { x: 300, y: 300 }]]);
    const visualizationPositions = new Map();

    const result = updateNodesIncremental(
      currentNodes,
      visibleMentalModelIds,
      visibleVisualizationIds,
      mentalModelPositions,
      visualizationPositions,
      [],
      []
    );

    expect(result).toHaveLength(3); // 2 primary + 1 mental model
    expect(result.find(n => n.id === 'model-1')).toBeDefined();
    expect(result.find(n => n.id === 'model-2')).toBeUndefined(); // Removed
  });

  it('should add newly visible nodes', () => {
    const currentNodes: Node[] = [
      ...mockPrimaryNodes,
    ];

    // model-1 newly visible
    const visibleMentalModelIds = new Set(['model-1']);
    const visibleVisualizationIds = new Set<string>();
    const mentalModelPositions = new Map([['model-1', { x: 300, y: 300 }]]);
    const visualizationPositions = new Map();

    const mentalModelNodes = [
      {
        id: 'model-1',
        type: 'mental-model',
        position: { x: 0, y: 0 }, // Initial position (will be overridden)
        data: { id: 'model-1', name: 'Model 1', node_type: 'mental-model' },
      },
    ];

    const result = updateNodesIncremental(
      currentNodes,
      visibleMentalModelIds,
      visibleVisualizationIds,
      mentalModelPositions,
      visualizationPositions,
      mentalModelNodes as any,
      []
    );

    expect(result).toHaveLength(3); // 2 primary + 1 new mental model
    const newNode = result.find(n => n.id === 'model-1');
    expect(newNode).toBeDefined();
    expect(newNode?.position).toEqual({ x: 300, y: 300 }); // From positions map
  });

  it('should handle visualization nodes correctly', () => {
    const currentNodes: Node[] = [
      ...mockPrimaryNodes,
      { id: 'model-1', type: 'mental-model', position: { x: 300, y: 300 }, data: { id: 'model-1' } },
    ];

    // Add visualization for model-1
    const visibleMentalModelIds = new Set(['model-1']);
    const visibleVisualizationIds = new Set(['model-1']); // Viz toggle ON
    const mentalModelPositions = new Map([['model-1', { x: 300, y: 300 }]]);
    const visualizationPositions = new Map([['viz-model-1', { x: 650, y: 300 }]]);

    const allNodes = [
      {
        id: 'model-1',
        name: 'Model 1',
        node_type: 'mental-model',
        visualization_type: 'heatmap',
        stages: [{ id: 's1', name: 'Stage 1', description: '' }],
      },
    ];

    const result = updateNodesIncremental(
      currentNodes,
      visibleMentalModelIds,
      visibleVisualizationIds,
      mentalModelPositions,
      visualizationPositions,
      [],
      allNodes as any
    );

    expect(result).toHaveLength(4); // 2 primary + 1 mental model + 1 viz
    const vizNode = result.find(n => n.id === 'viz-model-1');
    expect(vizNode).toBeDefined();
    expect(vizNode?.type).toBe('visualization');
    expect(vizNode?.position).toEqual({ x: 650, y: 300 });
  });

  it('should remove visualizations when toggle is OFF', () => {
    const currentNodes: Node[] = [
      ...mockPrimaryNodes,
      { id: 'model-1', type: 'mental-model', position: { x: 300, y: 300 }, data: { id: 'model-1' } },
      { id: 'viz-model-1', type: 'visualization', position: { x: 650, y: 300 }, data: {} },
    ];

    // Mental model still visible, but viz toggle OFF
    const visibleMentalModelIds = new Set(['model-1']);
    const visibleVisualizationIds = new Set<string>(); // Viz toggle OFF
    const mentalModelPositions = new Map([['model-1', { x: 300, y: 300 }]]);
    const visualizationPositions = new Map();

    const result = updateNodesIncremental(
      currentNodes,
      visibleMentalModelIds,
      visibleVisualizationIds,
      mentalModelPositions,
      visualizationPositions,
      [],
      []
    );

    expect(result).toHaveLength(3); // 2 primary + 1 mental model (NO viz)
    expect(result.find(n => n.id === 'viz-model-1')).toBeUndefined();
  });

  it('should never modify primary nodes', () => {
    const currentNodes: Node[] = [
      ...mockPrimaryNodes,
    ];

    const visibleMentalModelIds = new Set<string>();
    const visibleVisualizationIds = new Set<string>();
    const mentalModelPositions = new Map();
    const visualizationPositions = new Map();

    const result = updateNodesIncremental(
      currentNodes,
      visibleMentalModelIds,
      visibleVisualizationIds,
      mentalModelPositions,
      visualizationPositions,
      [],
      []
    );

    // Primary nodes always present, never modified
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(currentNodes[0]); // Same reference
    expect(result[1]).toBe(currentNodes[1]); // Same reference
  });
});
