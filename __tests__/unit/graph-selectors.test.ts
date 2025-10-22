/**
 * Unit Tests: Graph Selectors
 *
 * Tests for pure selector functions that determine which nodes/edges should render
 * based on toggle state.
 */

import { describe, it, expect } from 'vitest';
import type { Node, Edge } from 'reactflow';
import type { ReactFlowFrameworkNode } from '@/types/graph';
import type { FrameworkNode } from '@/types/framework';

// Import selectors (these don't exist yet - TDD approach)
import {
  selectVisibleMentalModelIds,
  selectVisibleVisualizationIds,
  selectNodesToRender,
  selectEdgesToRender,
} from '@/lib/graph-selectors';

describe('selectVisibleMentalModelIds', () => {
  it('should return empty set when no toggles exist', () => {
    const mentalModelToggles = new Map<string, Set<string>>();

    const result = selectVisibleMentalModelIds(mentalModelToggles);

    expect(result).toEqual(new Set());
  });

  it('should return mental model IDs that have at least one toggle ON', () => {
    const mentalModelToggles = new Map<string, Set<string>>();
    mentalModelToggles.set('model-1', new Set(['phase-1']));
    mentalModelToggles.set('model-2', new Set(['phase-1', 'phase-2']));
    mentalModelToggles.set('model-3', new Set()); // No toggles ON

    const result = selectVisibleMentalModelIds(mentalModelToggles);

    expect(result).toEqual(new Set(['model-1', 'model-2']));
    expect(result.has('model-3')).toBe(false);
  });

  it('should handle mental models toggled by multiple phases', () => {
    const mentalModelToggles = new Map<string, Set<string>>();
    mentalModelToggles.set('shared-model', new Set(['phase-1', 'phase-2', 'phase-3']));

    const result = selectVisibleMentalModelIds(mentalModelToggles);

    expect(result).toEqual(new Set(['shared-model']));
  });
});

describe('selectVisibleVisualizationIds', () => {
  it('should return empty set when no visualizations toggled ON', () => {
    const visualizationToggles = new Set<string>();
    const visibleMentalModelIds = new Set(['model-1', 'model-2']);

    const result = selectVisibleVisualizationIds(visualizationToggles, visibleMentalModelIds);

    expect(result).toEqual(new Set());
  });

  it('should only include visualizations whose parent mental model is visible', () => {
    const visualizationToggles = new Set(['model-1', 'model-2', 'model-3']);
    const visibleMentalModelIds = new Set(['model-1', 'model-2']); // model-3 NOT visible

    const result = selectVisibleVisualizationIds(visualizationToggles, visibleMentalModelIds);

    expect(result).toEqual(new Set(['model-1', 'model-2']));
    expect(result.has('model-3')).toBe(false);
  });

  it('should respect BOTH visualization toggle AND parent mental model visibility', () => {
    const visualizationToggles = new Set(['model-1']); // Only model-1 viz toggled ON
    const visibleMentalModelIds = new Set(['model-1', 'model-2']); // Both mental models visible

    const result = selectVisibleVisualizationIds(visualizationToggles, visibleMentalModelIds);

    // Only model-1 should be in result (viz toggle ON + parent visible)
    expect(result).toEqual(new Set(['model-1']));
    expect(result.has('model-2')).toBe(false);
  });

  it('should return empty set when mental models visible but NO viz toggles ON', () => {
    const visualizationToggles = new Set<string>(); // No viz toggles
    const visibleMentalModelIds = new Set(['model-1', 'model-2']);

    const result = selectVisibleVisualizationIds(visualizationToggles, visibleMentalModelIds);

    expect(result).toEqual(new Set());
  });
});

describe('selectNodesToRender', () => {
  const mockPrimaryNodes: Node[] = [
    { id: 'phase-1', type: 'phase', position: { x: 100, y: 100 }, data: {} },
    { id: 'phase-2', type: 'phase', position: { x: 500, y: 100 }, data: {} },
  ];

  const mockMentalModelNodes: ReactFlowFrameworkNode[] = [
    {
      id: 'model-1',
      type: 'mental-model',
      position: { x: 0, y: 0 },
      data: {
        id: 'model-1',
        name: 'Model 1',
        node_type: 'mental-model',
        version: '1.0',
        description: '',
        visualization_type: 'heatmap',
        stages: [{ id: 's1', name: 'Stage 1', description: '' }],
      },
    },
    {
      id: 'model-2',
      type: 'mental-model',
      position: { x: 0, y: 0 },
      data: {
        id: 'model-2',
        name: 'Model 2',
        node_type: 'mental-model',
        version: '1.0',
        description: '',
        visualization_type: 'funnel',
        stages: [],
      },
    },
  ];

  const mockAllNodes: FrameworkNode[] = [
    {
      id: 'model-1',
      name: 'Model 1',
      node_type: 'mental-model',
      version: '1.0',
      description: '',
      visualization_type: 'heatmap',
      stages: [{ id: 's1', name: 'Stage 1', description: '' }],
    } as any,
    {
      id: 'model-2',
      name: 'Model 2',
      node_type: 'mental-model',
      version: '1.0',
      description: '',
      visualization_type: 'funnel',
      stages: [],
    } as any,
  ];

  it('should always include primary nodes', () => {
    const visibleMentalModelIds = new Set<string>();
    const visibleVisualizationIds = new Set<string>();
    const mentalModelPositions = new Map();
    const visualizationPositions = new Map();

    const result = selectNodesToRender(
      mockPrimaryNodes,
      mockMentalModelNodes,
      visibleMentalModelIds,
      visibleVisualizationIds,
      mentalModelPositions,
      visualizationPositions,
      mockAllNodes
    );

    expect(result).toHaveLength(2);
    expect(result.find(n => n.id === 'phase-1')).toBeDefined();
    expect(result.find(n => n.id === 'phase-2')).toBeDefined();
  });

  it('should include mental models when their IDs are in visibleMentalModelIds', () => {
    const visibleMentalModelIds = new Set(['model-1']);
    const visibleVisualizationIds = new Set<string>();
    const mentalModelPositions = new Map([['model-1', { x: 300, y: 200 }]]);
    const visualizationPositions = new Map();

    const result = selectNodesToRender(
      mockPrimaryNodes,
      mockMentalModelNodes,
      visibleMentalModelIds,
      visibleVisualizationIds,
      mentalModelPositions,
      visualizationPositions,
      mockAllNodes
    );

    expect(result).toHaveLength(3); // 2 primary + 1 mental model
    expect(result.find(n => n.id === 'model-1')).toBeDefined();
    expect(result.find(n => n.id === 'model-2')).toBeUndefined();
  });

  it('should ONLY include visualization nodes when their ID is in visibleVisualizationIds', () => {
    const visibleMentalModelIds = new Set(['model-1']);
    const visibleVisualizationIds = new Set<string>(); // Viz toggle OFF
    const mentalModelPositions = new Map([['model-1', { x: 300, y: 200 }]]);
    const visualizationPositions = new Map([['viz-model-1', { x: 650, y: 200 }]]);

    const result = selectNodesToRender(
      mockPrimaryNodes,
      mockMentalModelNodes,
      visibleMentalModelIds,
      visibleVisualizationIds,
      mentalModelPositions,
      visualizationPositions,
      mockAllNodes
    );

    // Should NOT include viz-model-1 because visibleVisualizationIds is empty
    expect(result.find(n => n.id === 'viz-model-1')).toBeUndefined();
  });

  it('should include visualization nodes ONLY when viz toggle is ON', () => {
    const visibleMentalModelIds = new Set(['model-1']);
    const visibleVisualizationIds = new Set(['model-1']); // Viz toggle ON
    const mentalModelPositions = new Map([['model-1', { x: 300, y: 200 }]]);
    const visualizationPositions = new Map([['viz-model-1', { x: 650, y: 200 }]]);

    const result = selectNodesToRender(
      mockPrimaryNodes,
      mockMentalModelNodes,
      visibleMentalModelIds,
      visibleVisualizationIds,
      mentalModelPositions,
      visualizationPositions,
      mockAllNodes
    );

    // Should include viz-model-1
    expect(result.find(n => n.id === 'viz-model-1')).toBeDefined();
  });
});

describe('selectEdgesToRender', () => {
  it('should return empty array when no toggles exist', () => {
    const mentalModelToggles = new Map<string, Set<string>>();
    const visualizationToggles = new Set<string>();
    const visibleMentalModelIds = new Set<string>();
    const visibleVisualizationIds = new Set<string>();

    const result = selectEdgesToRender(
      mentalModelToggles,
      visualizationToggles,
      visibleMentalModelIds,
      visibleVisualizationIds
    );

    expect(result).toEqual([]);
  });

  it('should create edges from ALL nodes that have toggled mental models ON', () => {
    const mentalModelToggles = new Map<string, Set<string>>();
    mentalModelToggles.set('model-1', new Set(['phase-1', 'phase-2']));
    const visualizationToggles = new Set<string>();
    const visibleMentalModelIds = new Set(['model-1']);
    const visibleVisualizationIds = new Set<string>();

    const result = selectEdgesToRender(
      mentalModelToggles,
      visualizationToggles,
      visibleMentalModelIds,
      visibleVisualizationIds
    );

    expect(result).toHaveLength(2);
    expect(result.find(e => e.id === 'mental-phase-1-model-1')).toBeDefined();
    expect(result.find(e => e.id === 'mental-phase-2-model-1')).toBeDefined();
  });

  it('should NOT create edges for mental models with no toggles ON', () => {
    const mentalModelToggles = new Map<string, Set<string>>();
    mentalModelToggles.set('model-1', new Set(['phase-1']));
    mentalModelToggles.set('model-2', new Set()); // No toggles
    const visualizationToggles = new Set<string>();
    const visibleMentalModelIds = new Set(['model-1']); // model-2 not visible
    const visibleVisualizationIds = new Set<string>();

    const result = selectEdgesToRender(
      mentalModelToggles,
      visualizationToggles,
      visibleMentalModelIds,
      visibleVisualizationIds
    );

    expect(result).toHaveLength(1);
    expect(result.find(e => e.id === 'mental-phase-1-model-1')).toBeDefined();
    expect(result.find(e => e.source === 'model-2')).toBeUndefined();
  });

  it('should create visualization edges ONLY when viz toggle is ON', () => {
    const mentalModelToggles = new Map<string, Set<string>>();
    mentalModelToggles.set('model-1', new Set(['phase-1']));
    const visualizationToggles = new Set(['model-1']); // Viz toggle ON
    const visibleMentalModelIds = new Set(['model-1']);
    const visibleVisualizationIds = new Set(['model-1']);

    const result = selectEdgesToRender(
      mentalModelToggles,
      visualizationToggles,
      visibleMentalModelIds,
      visibleVisualizationIds
    );

    expect(result).toHaveLength(2); // 1 mental model edge + 1 viz edge
    expect(result.find(e => e.id === 'mental-phase-1-model-1')).toBeDefined();
    expect(result.find(e => e.id === 'mental-viz-model-1')).toBeDefined();
  });

  it('should NOT create visualization edges when viz toggle is OFF', () => {
    const mentalModelToggles = new Map<string, Set<string>>();
    mentalModelToggles.set('model-1', new Set(['phase-1']));
    const visualizationToggles = new Set<string>(); // Viz toggle OFF
    const visibleMentalModelIds = new Set(['model-1']);
    const visibleVisualizationIds = new Set<string>();

    const result = selectEdgesToRender(
      mentalModelToggles,
      visualizationToggles,
      visibleMentalModelIds,
      visibleVisualizationIds
    );

    expect(result).toHaveLength(1); // Only mental model edge
    expect(result.find(e => e.id === 'mental-phase-1-model-1')).toBeDefined();
    expect(result.find(e => e.id === 'mental-viz-model-1')).toBeUndefined();
  });
});
