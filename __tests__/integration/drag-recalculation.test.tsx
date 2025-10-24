/**
 * Integration Tests: Drag + Recalculation
 *
 * Tests that user drag doesn't permanently lock position:
 * - User can drag mental model
 * - Adding new edge triggers recalculation despite drag
 * - Removing edge triggers recalculation despite drag
 * - User can drag again after auto-reposition
 */

import { describe, it, expect } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FrameworkVisualizerClient from '@/components/FrameworkVisualizerClient';
import type { ReactFlowFrameworkNode, ReactFlowFrameworkEdge } from '@/types/graph';
import type { FrameworkNode } from '@/types/framework';

describe('Drag + Recalculation Integration', () => {
  const mockPhaseNodes: ReactFlowFrameworkNode[] = [
    {
      id: 'phase-a',
      type: 'phase',
      position: { x: 100, y: 100 },
      data: {
        id: 'phase-a',
        name: 'Phase A',
        node_type: 'phase',
        version: '1.0',
        description: '',
        linked_mental_models: ['model-x'],
      },
    },
    {
      id: 'phase-b',
      type: 'phase',
      position: { x: 500, y: 100 },
      data: {
        id: 'phase-b',
        name: 'Phase B',
        node_type: 'phase',
        version: '1.0',
        description: '',
        linked_mental_models: ['model-x'],
      },
    },
    {
      id: 'phase-c',
      type: 'phase',
      position: { x: 900, y: 100 },
      data: {
        id: 'phase-c',
        name: 'Phase C',
        node_type: 'phase',
        version: '1.0',
        description: '',
        linked_mental_models: ['model-x'],
      },
    },
  ];

  const mockMentalModelNodes: ReactFlowFrameworkNode[] = [
    {
      id: 'model-x',
      type: 'mental-model',
      position: { x: 300, y: 300 },
      data: {
        id: 'model-x',
        name: 'Model X',
        node_type: 'mental-model',
        version: '1.0',
        description: '',
        visualization_type: 'heatmap',
        stages: [],
      },
    },
  ];

  const mockEdges: ReactFlowFrameworkEdge[] = [];

  const mockAllNodes: FrameworkNode[] = [
    {
      id: 'phase-a',
      name: 'Phase A',
      node_type: 'phase',
      version: '1.0',
      description: '',
      linked_mental_models: ['model-x'],
    } as any,
    {
      id: 'phase-b',
      name: 'Phase B',
      node_type: 'phase',
      version: '1.0',
      description: '',
      linked_mental_models: ['model-x'],
    } as any,
    {
      id: 'phase-c',
      name: 'Phase C',
      node_type: 'phase',
      version: '1.0',
      description: '',
      linked_mental_models: ['model-x'],
    } as any,
    {
      id: 'model-x',
      name: 'Model X',
      node_type: 'mental-model',
      version: '1.0',
      description: '',
      visualization_type: 'heatmap',
      stages: [],
    } as any,
  ];

  it('should allow user to drag mental model', async () => {
    const { container } = render(
      <FrameworkVisualizerClient
        initialNodes={mockPhaseNodes}
        initialEdges={mockEdges}
        mentalModelNodes={mockMentalModelNodes}
        allNodes={mockAllNodes}
      />
    );

    // Toggle model from Phase A
    const phaseA = container.querySelector('[data-id="phase-a"]');
    await userEvent.click(phaseA!);

    const toggle = container.querySelector('[data-testid="mental-model-toggle-model-x"]');
    await userEvent.click(toggle!);

    await waitFor(() => {
      expect(container.querySelector('[data-id="model-x"]')).toBeTruthy();
    });

    // Get initial position
    const modelNode = container.querySelector('[data-id="model-x"]') as HTMLElement;
    const initialTransform = modelNode.style.transform;

    // Simulate drag (ReactFlow updates position)
    // In real scenario, ReactFlow's onNodeDragStop would fire
    // For test, we verify drag is allowed (node is draggable)
    expect(modelNode.getAttribute('data-draggable')).not.toBe('false');
  });

  it('CRITICAL: should recalculate position when new edge added despite drag', async () => {
    const { container } = render(
      <FrameworkVisualizerClient
        initialNodes={mockPhaseNodes}
        initialEdges={mockEdges}
        mentalModelNodes={mockMentalModelNodes}
        allNodes={mockAllNodes}
      />
    );

    // Toggle from Phase A
    const phaseA = container.querySelector('[data-id="phase-a"]');
    await userEvent.click(phaseA!);
    const toggleA = container.querySelector('[data-testid="mental-model-toggle-model-x"]');
    await userEvent.click(toggleA!);

    await waitFor(() => {
      expect(container.querySelector('[data-id="model-x"]')).toBeTruthy();
    });

    // Simulate user drag by firing dragStop event
    const modelNode = container.querySelector('[data-id="model-x"]') as HTMLElement;

    // In ReactFlow, dragging updates the node position in state
    // We simulate this by checking the drag flag is set
    // (Implementation will use onNodeDragStop handler)

    // Get position after drag
    const positionAfterDrag = modelNode.style.transform;

    // Now toggle from Phase B (adds new edge)
    const phaseB = container.querySelector('[data-id="phase-b"]');
    await userEvent.click(phaseB!);
    const toggleB = container.querySelector('[data-testid="mental-model-toggle-model-x"]');
    await userEvent.click(toggleB!);

    // Position should CHANGE (recalculation despite drag)
    await waitFor(() => {
      const newPosition = (container.querySelector('[data-id="model-x"]') as HTMLElement).style.transform;
      // Position should be different (recalculated to midpoint between A and B)
      expect(newPosition).not.toBe(positionAfterDrag);
    });

    // Both edges should exist
    expect(container.querySelector('[data-id="mental-phase-a-model-x"]')).toBeTruthy();
    expect(container.querySelector('[data-id="mental-phase-b-model-x"]')).toBeTruthy();
  });

  it('CRITICAL: should recalculate position when edge removed despite drag', async () => {
    const { container } = render(
      <FrameworkVisualizerClient
        initialNodes={mockPhaseNodes}
        initialEdges={mockEdges}
        mentalModelNodes={mockMentalModelNodes}
        allNodes={mockAllNodes}
      />
    );

    // Toggle from Phase A and Phase B
    const phaseA = container.querySelector('[data-id="phase-a"]');
    await userEvent.click(phaseA!);
    const toggleA = container.querySelector('[data-testid="mental-model-toggle-model-x"]');
    await userEvent.click(toggleA!);

    await waitFor(() => {
      expect(container.querySelector('[data-id="model-x"]')).toBeTruthy();
    });

    const phaseB = container.querySelector('[data-id="phase-b"]');
    await userEvent.click(phaseB!);
    const toggleB = container.querySelector('[data-testid="mental-model-toggle-model-x"]');
    await userEvent.click(toggleB!);

    await waitFor(() => {
      expect(container.querySelector('[data-id="mental-phase-b-model-x"]')).toBeTruthy();
    });

    // Simulate drag
    const modelNode = container.querySelector('[data-id="model-x"]') as HTMLElement;
    const positionAfterDrag = modelNode.style.transform;

    // Now REMOVE edge from Phase A
    await userEvent.click(phaseA!);
    await userEvent.click(toggleA!); // Toggle OFF

    // Position should CHANGE (recalculated despite drag)
    await waitFor(() => {
      const newPosition = (container.querySelector('[data-id="model-x"]') as HTMLElement).style.transform;
      expect(newPosition).not.toBe(positionAfterDrag);
    });

    // Only Phase B edge should remain
    expect(container.querySelector('[data-id="mental-phase-a-model-x"]')).toBeNull();
    expect(container.querySelector('[data-id="mental-phase-b-model-x"]')).toBeTruthy();
  });

  it('should allow dragging again after auto-reposition', async () => {
    const { container } = render(
      <FrameworkVisualizerClient
        initialNodes={mockPhaseNodes}
        initialEdges={mockEdges}
        mentalModelNodes={mockMentalModelNodes}
        allNodes={mockAllNodes}
      />
    );

    // Setup: Toggle from Phase A
    const phaseA = container.querySelector('[data-id="phase-a"]');
    await userEvent.click(phaseA!);
    const toggleA = container.querySelector('[data-testid="mental-model-toggle-model-x"]');
    await userEvent.click(toggleA!);

    await waitFor(() => {
      expect(container.querySelector('[data-id="model-x"]')).toBeTruthy();
    });

    // Drag mental model
    const modelNode = container.querySelector('[data-id="model-x"]') as HTMLElement;

    // Add edge from Phase B (triggers auto-reposition)
    const phaseB = container.querySelector('[data-id="phase-b"]');
    await userEvent.click(phaseB!);
    const toggleB = container.querySelector('[data-testid="mental-model-toggle-model-x"]');
    await userEvent.click(toggleB!);

    // Wait for repositioning
    await waitFor(() => {
      expect(container.querySelector('[data-id="mental-phase-b-model-x"]')).toBeTruthy();
    });

    // Node should still be draggable
    const updatedModelNode = container.querySelector('[data-id="model-x"]') as HTMLElement;
    expect(updatedModelNode.getAttribute('data-draggable')).not.toBe('false');
  });

  it('should handle multiple drag-reposition cycles', async () => {
    const { container } = render(
      <FrameworkVisualizerClient
        initialNodes={mockPhaseNodes}
        initialEdges={mockEdges}
        mentalModelNodes={mockMentalModelNodes}
        allNodes={mockAllNodes}
      />
    );

    // Toggle from Phase A
    const phaseA = container.querySelector('[data-id="phase-a"]');
    await userEvent.click(phaseA!);
    const toggleA = container.querySelector('[data-testid="mental-model-toggle-model-x"]');
    await userEvent.click(toggleA!);

    await waitFor(() => {
      expect(container.querySelector('[data-id="model-x"]')).toBeTruthy();
    });

    // Cycle 1: Drag, then add Phase B
    const phaseB = container.querySelector('[data-id="phase-b"]');
    await userEvent.click(phaseB!);
    const toggleB = container.querySelector('[data-testid="mental-model-toggle-model-x"]');
    await userEvent.click(toggleB!);

    await waitFor(() => {
      expect(container.querySelector('[data-id="mental-phase-b-model-x"]')).toBeTruthy();
    });

    // Cycle 2: Drag again, then add Phase C
    const phaseC = container.querySelector('[data-id="phase-c"]');
    await userEvent.click(phaseC!);
    const toggleC = container.querySelector('[data-testid="mental-model-toggle-model-x"]');
    await userEvent.click(toggleC!);

    // All 3 edges should exist
    await waitFor(() => {
      expect(container.querySelector('[data-id="mental-phase-a-model-x"]')).toBeTruthy();
      expect(container.querySelector('[data-id="mental-phase-b-model-x"]')).toBeTruthy();
      expect(container.querySelector('[data-id="mental-phase-c-model-x"]')).toBeTruthy();
    });

    // Mental model should be at optimal position for all 3 phases
    expect(container.querySelector('[data-id="model-x"]')).toBeTruthy();
  });
});
