/**
 * Unit Tests for Layout Algorithms
 *
 * Tests Dagre layout positioning
 */

import { describe, it, expect } from 'vitest';
import {
  calculateDagreLayout,
  calculateHybridLayout,
  calculateSmartEdgeRouting,
  getGraphBounds,
  calculateVisualizationPosition,
} from '@/lib/layout-algorithms';
import type { FrameworkNode, Edge } from '@/types/framework';

describe('Layout Algorithms', () => {
  const mockNodes: FrameworkNode[] = [
    {
      id: 'node-1',
      node_type: 'phase',
      name: 'Node 1',
      version: '1.0',
    },
    {
      id: 'node-2',
      node_type: 'sub-phase',
      name: 'Node 2',
      version: '1.0',
      parent_phase: 'node-1',
    },
  ];

  const mockEdges: Edge[] = [
    {
      id: 'edge-1',
      from_node: 'node-1',
      to_node: 'node-2',
      relationship_type: 'contains',
    },
  ];

  describe('calculateDagreLayout', () => {
    it('should calculate positions for all nodes', () => {
      const positions = calculateDagreLayout(mockNodes, mockEdges);

      expect(positions.size).toBe(2);
      expect(positions.has('node-1')).toBe(true);
      expect(positions.has('node-2')).toBe(true);
    });

    it('should return valid x,y coordinates', () => {
      const positions = calculateDagreLayout(mockNodes, mockEdges);

      positions.forEach((pos) => {
        expect(typeof pos.x).toBe('number');
        expect(typeof pos.y).toBe('number');
        expect(Number.isFinite(pos.x)).toBe(true);
        expect(Number.isFinite(pos.y)).toBe(true);
      });
    });

    it('should respect layout direction option', () => {
      const positionsTB = calculateDagreLayout(mockNodes, mockEdges, { direction: 'TB' });
      const positionsLR = calculateDagreLayout(mockNodes, mockEdges, { direction: 'LR' });

      const node1TB = positionsTB.get('node-1')!;
      const node2TB = positionsTB.get('node-2')!;
      const node1LR = positionsLR.get('node-1')!;
      const node2LR = positionsLR.get('node-2')!;

      // TB layout should have different Y positions
      expect(node1TB.y).not.toBe(node2TB.y);

      // LR layout should have different X positions
      expect(node1LR.x).not.toBe(node2LR.x);
    });

    it('should apply custom spacing options', () => {
      const defaultPositions = calculateDagreLayout(mockNodes, mockEdges);
      const customPositions = calculateDagreLayout(mockNodes, mockEdges, {
        rankSep: 200,
        nodeSep: 150,
      });

      // Calculate distance between nodes for both layouts
      const defaultNode1 = defaultPositions.get('node-1')!;
      const defaultNode2 = defaultPositions.get('node-2')!;
      const customNode1 = customPositions.get('node-1')!;
      const customNode2 = customPositions.get('node-2')!;

      const defaultDistance = Math.sqrt(
        Math.pow(defaultNode2.x - defaultNode1.x, 2) + Math.pow(defaultNode2.y - defaultNode1.y, 2)
      );
      const customDistance = Math.sqrt(
        Math.pow(customNode2.x - customNode1.x, 2) + Math.pow(customNode2.y - customNode1.y, 2)
      );

      // Custom spacing should result in different distances between nodes
      expect(customDistance).not.toBe(defaultDistance);
    });
  });

  describe('getGraphBounds', () => {
    it('should calculate bounding box of positioned nodes', () => {
      const positions = new Map([
        ['node-1', { x: 0, y: 0 }],
        ['node-2', { x: 300, y: 150 }],
      ]);

      const bounds = getGraphBounds(positions);

      expect(bounds.minX).toBe(0);
      expect(bounds.minY).toBe(0);
      expect(bounds.maxX).toBeGreaterThan(300);
      expect(bounds.maxY).toBeGreaterThan(150);
      expect(bounds.width).toBeGreaterThan(0);
      expect(bounds.height).toBeGreaterThan(0);
    });
  });

  describe('calculateHybridLayout', () => {
    const mockPhases: FrameworkNode[] = [
      {
        id: 'phase-1',
        node_type: 'phase',
        name: 'Research',
        version: '1.0',
      },
      {
        id: 'phase-2',
        node_type: 'phase',
        name: 'Disruption',
        version: '1.0',
      },
      {
        id: 'phase-3',
        node_type: 'phase',
        name: 'Defense',
        version: '1.0',
      },
      {
        id: 'phase-4',
        node_type: 'phase',
        name: 'Response',
        version: '1.0',
      },
    ];

    const mockSubPhases: FrameworkNode[] = [
      {
        id: 'sub-phase-1',
        node_type: 'sub-phase',
        name: 'SubPhase 1',
        version: '1.0',
        parent_phase: 'phase-1',
      },
      {
        id: 'sub-phase-2',
        node_type: 'sub-phase',
        name: 'SubPhase 2',
        version: '1.0',
        parent_phase: 'phase-2',
      },
    ];

    const mockComponents: FrameworkNode[] = [
      {
        id: 'component-1',
        node_type: 'sub-phase-component',
        name: 'Component 1',
        version: '1.0',
        parent_sub_phase: 'sub-phase-1',
      },
    ];

    const allNodes = [...mockPhases, ...mockSubPhases, ...mockComponents];

    it('should position phases in a 2x2 grid', () => {
      const positions = calculateHybridLayout(allNodes, []);

      // All 4 phases should be positioned
      expect(positions.has('phase-1')).toBe(true);
      expect(positions.has('phase-2')).toBe(true);
      expect(positions.has('phase-3')).toBe(true);
      expect(positions.has('phase-4')).toBe(true);

      // Get phase positions
      const phase1 = positions.get('phase-1')!;
      const phase2 = positions.get('phase-2')!;
      const phase3 = positions.get('phase-3')!;
      const phase4 = positions.get('phase-4')!;

      // Phases should form a 2x2 grid pattern (4 distinct positions)
      const phasePositions = [phase1, phase2, phase3, phase4];
      const uniqueXPositions = new Set(phasePositions.map(p => p.x));
      const uniqueYPositions = new Set(phasePositions.map(p => p.y));

      expect(uniqueXPositions.size).toBe(2); // 2 columns
      expect(uniqueYPositions.size).toBe(2); // 2 rows
    });

    it('should branch sub-phases from their parent phases', () => {
      const positions = calculateHybridLayout(allNodes, []);

      const phase1 = positions.get('phase-1')!;
      const subPhase1 = positions.get('sub-phase-1')!;

      // Sub-phase should be offset from its parent phase (at least X coordinate should differ)
      expect(subPhase1.x).not.toBe(phase1.x);
      // Y coordinate might be the same if it's the first sub-phase (index 0 * verticalSpacing = 0)
      // so we just check that the sub-phase exists and has valid coordinates
      expect(Number.isFinite(subPhase1.y)).toBe(true);
    });

    it('should branch components from their parent sub-phases', () => {
      const positions = calculateHybridLayout(allNodes, []);

      const subPhase1 = positions.get('sub-phase-1')!;
      const component1 = positions.get('component-1')!;

      // Component should be offset from its parent sub-phase
      expect(component1.x).not.toBe(subPhase1.x);
    });

    it('should respect custom spacing options', () => {
      const defaultPositions = calculateHybridLayout(allNodes, []);
      const customPositions = calculateHybridLayout(allNodes, [], {
        phaseSpacingX: 1000,
        phaseSpacingY: 800,
      });

      const defaultPhase1 = defaultPositions.get('phase-1')!;
      const defaultPhase2 = defaultPositions.get('phase-2')!;
      const customPhase1 = customPositions.get('phase-1')!;
      const customPhase2 = customPositions.get('phase-2')!;

      // Distance between phases should be different with custom spacing
      const defaultDistance = Math.sqrt(
        Math.pow(defaultPhase2.x - defaultPhase1.x, 2) +
        Math.pow(defaultPhase2.y - defaultPhase1.y, 2)
      );
      const customDistance = Math.sqrt(
        Math.pow(customPhase2.x - customPhase1.x, 2) +
        Math.pow(customPhase2.y - customPhase1.y, 2)
      );

      expect(customDistance).not.toBe(defaultDistance);
    });

    it('should return valid coordinates for all nodes', () => {
      const positions = calculateHybridLayout(allNodes, []);

      positions.forEach((pos, id) => {
        expect(typeof pos.x).toBe('number');
        expect(typeof pos.y).toBe('number');
        expect(Number.isFinite(pos.x)).toBe(true);
        expect(Number.isFinite(pos.y)).toBe(true);
      });
    });
  });

  describe('calculateSmartEdgeRouting', () => {
    it('should route edges to the right when target is to the right', () => {
      const positions = new Map([
        ['source', { x: 0, y: 0 }],
        ['target', { x: 100, y: 0 }],
      ]);

      const routing = calculateSmartEdgeRouting('source', 'target', positions);

      expect(routing.sourceHandle).toBe('right-source');
      expect(routing.targetHandle).toBe('left');
    });

    it('should route edges to the left when target is to the left', () => {
      const positions = new Map([
        ['source', { x: 100, y: 0 }],
        ['target', { x: 0, y: 0 }],
      ]);

      const routing = calculateSmartEdgeRouting('source', 'target', positions);

      expect(routing.sourceHandle).toBe('left-source');
      expect(routing.targetHandle).toBe('right');
    });

    it('should route edges downward when target is below', () => {
      const positions = new Map([
        ['source', { x: 0, y: 0 }],
        ['target', { x: 0, y: 100 }],
      ]);

      const routing = calculateSmartEdgeRouting('source', 'target', positions);

      expect(routing.sourceHandle).toBe('bottom');
      expect(routing.targetHandle).toBe('top');
    });

    it('should route edges upward when target is above', () => {
      const positions = new Map([
        ['source', { x: 0, y: 100 }],
        ['target', { x: 0, y: 0 }],
      ]);

      const routing = calculateSmartEdgeRouting('source', 'target', positions);

      expect(routing.sourceHandle).toBe('top-source');
      expect(routing.targetHandle).toBe('bottom-target');
    });

    it('should return default routing when positions are missing', () => {
      const positions = new Map();

      const routing = calculateSmartEdgeRouting('source', 'target', positions);

      expect(routing.sourceHandle).toBe('right-source');
      expect(routing.targetHandle).toBe('left');
    });

    it('should handle diagonal routing correctly', () => {
      const positions = new Map([
        ['source', { x: 0, y: 0 }],
        ['target-right-down', { x: 100, y: 100 }],
        ['target-left-up', { x: -100, y: -100 }],
      ]);

      const routingRightDown = calculateSmartEdgeRouting('source', 'target-right-down', positions);
      const routingLeftUp = calculateSmartEdgeRouting('source', 'target-left-up', positions);

      // Right-down should use bottom handle
      expect(routingRightDown.sourceHandle).toBe('bottom');

      // Left-up should use top handle
      expect(routingLeftUp.sourceHandle).toBe('top-source');
    });
  });

  describe('calculateVisualizationPosition', () => {
    const phaseGridCenter = { x: 800, y: 600 };

    it('should position visualization in the same direction as mental model', () => {
      // Mental model is to the right and above center
      const mentalModelPos = { x: 1100, y: 400 };
      const distance = 350;

      const vizPos = calculateVisualizationPosition(mentalModelPos, phaseGridCenter, distance);

      // Viz should be further in the same direction (right and up from center)
      expect(vizPos.x).toBeGreaterThan(mentalModelPos.x);
      expect(vizPos.y).toBeLessThan(mentalModelPos.y);
    });

    it('should calculate correct vector math for rightward displacement', () => {
      const mentalModelPos = { x: 1150, y: 600 }; // Directly to the right of center
      const distance = 350;

      const vizPos = calculateVisualizationPosition(mentalModelPos, phaseGridCenter, distance);

      // Should be 350px further right, same Y
      expect(vizPos.x).toBeCloseTo(1500, 0);
      expect(vizPos.y).toBeCloseTo(600, 0);
    });

    it('should calculate correct vector math for leftward displacement', () => {
      const mentalModelPos = { x: 450, y: 600 }; // Directly to the left of center
      const distance = 350;

      const vizPos = calculateVisualizationPosition(mentalModelPos, phaseGridCenter, distance);

      // Should be 350px further left, same Y
      expect(vizPos.x).toBeCloseTo(100, 0);
      expect(vizPos.y).toBeCloseTo(600, 0);
    });

    it('should calculate correct vector math for upward displacement', () => {
      const mentalModelPos = { x: 800, y: 250 }; // Directly above center
      const distance = 350;

      const vizPos = calculateVisualizationPosition(mentalModelPos, phaseGridCenter, distance);

      // Should be 350px further up, same X
      expect(vizPos.x).toBeCloseTo(800, 0);
      expect(vizPos.y).toBeCloseTo(-100, 0);
    });

    it('should calculate correct vector math for downward displacement', () => {
      const mentalModelPos = { x: 800, y: 950 }; // Directly below center
      const distance = 350;

      const vizPos = calculateVisualizationPosition(mentalModelPos, phaseGridCenter, distance);

      // Should be 350px further down, same X
      expect(vizPos.x).toBeCloseTo(800, 0);
      expect(vizPos.y).toBeCloseTo(1300, 0);
    });

    it('should maintain direction for diagonal displacement', () => {
      // Mental model at 45-degree angle from center (upper-right)
      const mentalModelPos = { x: 1100, y: 300 };
      const distance = 350;

      const vizPos = calculateVisualizationPosition(mentalModelPos, phaseGridCenter, distance);

      // Calculate expected direction
      const vectorX = mentalModelPos.x - phaseGridCenter.x; // 300
      const vectorY = mentalModelPos.y - phaseGridCenter.y; // -300
      const magnitude = Math.sqrt(vectorX ** 2 + vectorY ** 2); // ~424
      const normalizedX = vectorX / magnitude; // ~0.707
      const normalizedY = vectorY / magnitude; // ~-0.707

      const expectedX = mentalModelPos.x + normalizedX * distance;
      const expectedY = mentalModelPos.y + normalizedY * distance;

      expect(vizPos.x).toBeCloseTo(expectedX, 0);
      expect(vizPos.y).toBeCloseTo(expectedY, 0);
    });

    it('should use custom distance parameter', () => {
      const mentalModelPos = { x: 1150, y: 600 };
      const customDistance = 500;

      const vizPos = calculateVisualizationPosition(mentalModelPos, phaseGridCenter, customDistance);

      // Should be 500px further right instead of default 350px
      expect(vizPos.x).toBeCloseTo(1650, 0);
    });

    it('should handle mental model at center (edge case)', () => {
      // Mental model exactly at center
      const mentalModelPos = { x: 800, y: 600 };
      const distance = 350;

      const vizPos = calculateVisualizationPosition(mentalModelPos, phaseGridCenter, distance);

      // When at center, there's no direction - should fallback to a default (e.g., right)
      // Or return the same position - implementation detail
      expect(vizPos).toBeDefined();
      expect(typeof vizPos.x).toBe('number');
      expect(typeof vizPos.y).toBe('number');
    });
  });
});
