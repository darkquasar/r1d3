/**
 * Integration Tests: Toggle State Management
 *
 * Tests that mental model toggle state is properly managed:
 * - Toggle ON adds to Set
 * - Toggle OFF removes from Set
 * - Edges appear/disappear correctly
 * - Mental models removed when all toggles OFF
 */

import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FrameworkVisualizerClient from '@/components/FrameworkVisualizerClient';
import type { ReactFlowFrameworkNode, ReactFlowFrameworkEdge } from '@/types/graph';
import type { FrameworkNode } from '@/types/framework';

describe('Toggle State Management', () => {
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
      id: 'model-x',
      name: 'Model X',
      node_type: 'mental-model',
      version: '1.0',
      description: '',
      visualization_type: 'heatmap',
      stages: [],
    } as any,
  ];

  it('should add edge when toggling mental model from Phase A', async () => {
    const { container } = render(
      <FrameworkVisualizerClient
        initialNodes={mockPhaseNodes}
        initialEdges={mockEdges}
        mentalModelNodes={mockMentalModelNodes}
        allNodes={mockAllNodes}
      />
    );

    // Initially, no mental model visible
    expect(container.querySelector('[data-id="model-x"]')).toBeNull();
    expect(container.querySelector('[data-id="mental-phase-a-model-x"]')).toBeNull();

    // Click Phase A to open detail panel
    const phaseA = container.querySelector('[data-id="phase-a"]');
    await userEvent.click(phaseA!);

    // Toggle model-x ON from Phase A
    const toggle = screen.getByTestId('mental-model-toggle-model-x');
    await userEvent.click(toggle);

    // Mental model should appear
    await waitFor(() => {
      expect(container.querySelector('[data-id="model-x"]')).toBeTruthy();
    });

    // Edge should exist
    expect(container.querySelector('[data-id="mental-phase-a-model-x"]')).toBeTruthy();
  });

  it('should have 2 edges when toggling from both Phase A and Phase B', async () => {
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
    const toggleA = screen.getByTestId('mental-model-toggle-model-x');
    await userEvent.click(toggleA);

    // Wait for model to appear
    await waitFor(() => {
      expect(container.querySelector('[data-id="model-x"]')).toBeTruthy();
    });

    // Toggle from Phase B
    const phaseB = container.querySelector('[data-id="phase-b"]');
    await userEvent.click(phaseB!);
    const toggleB = screen.getByTestId('mental-model-toggle-model-x');
    await userEvent.click(toggleB);

    // Should have 2 edges now
    await waitFor(() => {
      expect(container.querySelector('[data-id="mental-phase-a-model-x"]')).toBeTruthy();
      expect(container.querySelector('[data-id="mental-phase-b-model-x"]')).toBeTruthy();
    });

    // Mental model should still be visible
    expect(container.querySelector('[data-id="model-x"]')).toBeTruthy();
  });

  it('CRITICAL: should remove edge when untoggling from Phase A (only Phase B edge remains)', async () => {
    const { container } = render(
      <FrameworkVisualizerClient
        initialNodes={mockPhaseNodes}
        initialEdges={mockEdges}
        mentalModelNodes={mockMentalModelNodes}
        allNodes={mockAllNodes}
      />
    );

    // Toggle from both phases
    const phaseA = container.querySelector('[data-id="phase-a"]');
    await userEvent.click(phaseA!);
    const toggleA = screen.getByTestId('mental-model-toggle-model-x');
    await userEvent.click(toggleA);

    await waitFor(() => {
      expect(container.querySelector('[data-id="model-x"]')).toBeTruthy();
    });

    const phaseB = container.querySelector('[data-id="phase-b"]');
    await userEvent.click(phaseB!);
    const toggleB = screen.getByTestId('mental-model-toggle-model-x');
    await userEvent.click(toggleB);

    await waitFor(() => {
      expect(container.querySelector('[data-id="mental-phase-b-model-x"]')).toBeTruthy();
    });

    // Now UNTOGGLE from Phase A
    await userEvent.click(phaseA!);
    await userEvent.click(toggleA); // Click again to toggle OFF

    // Phase A edge should be REMOVED
    await waitFor(() => {
      expect(container.querySelector('[data-id="mental-phase-a-model-x"]')).toBeNull();
    });

    // Phase B edge should STILL EXIST
    expect(container.querySelector('[data-id="mental-phase-b-model-x"]')).toBeTruthy();

    // Mental model should STILL BE VISIBLE (Phase B still toggles it)
    expect(container.querySelector('[data-id="model-x"]')).toBeTruthy();
  });

  it('CRITICAL: should remove mental model when untoggling from all phases', async () => {
    const { container } = render(
      <FrameworkVisualizerClient
        initialNodes={mockPhaseNodes}
        initialEdges={mockEdges}
        mentalModelNodes={mockMentalModelNodes}
        allNodes={mockAllNodes}
      />
    );

    // Toggle from both phases
    const phaseA = container.querySelector('[data-id="phase-a"]');
    await userEvent.click(phaseA!);
    const toggleA = screen.getByTestId('mental-model-toggle-model-x');
    await userEvent.click(toggleA);

    await waitFor(() => {
      expect(container.querySelector('[data-id="model-x"]')).toBeTruthy();
    });

    const phaseB = container.querySelector('[data-id="phase-b"]');
    await userEvent.click(phaseB!);
    const toggleB = screen.getByTestId('mental-model-toggle-model-x');
    await userEvent.click(toggleB);

    // Untoggle from Phase A
    await userEvent.click(phaseA!);
    await userEvent.click(toggleA);

    // Untoggle from Phase B (last toggle)
    await userEvent.click(phaseB!);
    await userEvent.click(toggleB);

    // Mental model should be REMOVED (no toggles left)
    await waitFor(() => {
      expect(container.querySelector('[data-id="model-x"]')).toBeNull();
    });

    // All edges should be REMOVED
    expect(container.querySelector('[data-id="mental-phase-a-model-x"]')).toBeNull();
    expect(container.querySelector('[data-id="mental-phase-b-model-x"]')).toBeNull();
  });
});
