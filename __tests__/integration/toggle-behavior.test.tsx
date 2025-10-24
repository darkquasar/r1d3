/**
 * Integration Tests: Toggle Behavior
 *
 * Tests the complete toggle workflow for mental models and visualizations
 * Verifies the 3 critical bugs are fixed:
 * - Issue 1: Viz nodes only appear when viz toggle is ON
 * - Issue 2: Viz nodes disappear when toggle turned OFF
 * - Issue 3: Mental model edges disappear when all phase toggles OFF
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FrameworkVisualizerClient from '@/components/FrameworkVisualizerClient';
import type { ReactFlowFrameworkNode, ReactFlowFrameworkEdge } from '@/types/graph';
import type { FrameworkNode } from '@/types/framework';

describe('Toggle Behavior Integration', () => {
  const mockPhaseNodes: ReactFlowFrameworkNode[] = [
    {
      id: 'phase-1',
      type: 'phase',
      position: { x: 100, y: 100 },
      data: {
        id: 'phase-1',
        name: 'Research Phase',
        node_type: 'phase',
        version: '1.0',
        description: '',
        linked_mental_models: ['model-1'],
      },
    },
    {
      id: 'phase-2',
      type: 'phase',
      position: { x: 500, y: 100 },
      data: {
        id: 'phase-2',
        name: 'Discovery Phase',
        node_type: 'phase',
        version: '1.0',
        description: '',
        linked_mental_models: ['model-1'],
      },
    },
  ];

  const mockMentalModelNodes: ReactFlowFrameworkNode[] = [
    {
      id: 'model-1',
      type: 'mental-model',
      position: { x: 300, y: 300 },
      data: {
        id: 'model-1',
        name: 'DAIKI Model',
        node_type: 'mental-model',
        version: '1.0',
        description: '',
        visualization_type: 'heatmap',
        stages: [{ id: 's1', name: 'Stage 1', description: 'First stage' }],
      },
    },
  ];

  const mockEdges: ReactFlowFrameworkEdge[] = [];

  const mockAllNodes: FrameworkNode[] = [
    {
      id: 'phase-1',
      name: 'Research Phase',
      node_type: 'phase',
      version: '1.0',
      description: '',
      linked_mental_models: ['model-1'],
    } as any,
    {
      id: 'phase-2',
      name: 'Discovery Phase',
      node_type: 'phase',
      version: '1.0',
      description: '',
      linked_mental_models: ['model-1'],
    } as any,
    {
      id: 'model-1',
      name: 'DAIKI Model',
      node_type: 'mental-model',
      version: '1.0',
      description: '',
      visualization_type: 'heatmap',
      stages: [{ id: 's1', name: 'Stage 1', description: 'First stage' }],
    } as any,
  ];

  it('Issue 1: Mental model appears when phase toggles it ON, but viz stays hidden', async () => {
    const { container } = render(
      <FrameworkVisualizerClient
        initialNodes={mockPhaseNodes}
        initialEdges={mockEdges}
        mentalModelNodes={mockMentalModelNodes}
        allNodes={mockAllNodes}
      />
    );

    // Initially, no mental models or visualizations should be visible
    expect(container.querySelector('[data-id="model-1"]')).toBeNull();
    expect(container.querySelector('[data-id="viz-model-1"]')).toBeNull();

    // Click on phase-1 to open detail panel
    const phase1Node = container.querySelector('[data-id="phase-1"]');
    expect(phase1Node).toBeTruthy();
    await userEvent.click(phase1Node!);

    // Find and toggle mental model ON
    const mentalModelToggle = screen.getByRole('switch', { name: /model-1/i });
    await userEvent.click(mentalModelToggle);

    // Mental model should now be visible
    expect(container.querySelector('[data-id="model-1"]')).toBeTruthy();

    // But visualization should NOT be visible (viz toggle still OFF)
    expect(container.querySelector('[data-id="viz-model-1"]')).toBeNull();
  });

  it('Issue 1 & 2: Visualization only appears when its toggle is ON, and disappears when toggled OFF', async () => {
    const { container } = render(
      <FrameworkVisualizerClient
        initialNodes={mockPhaseNodes}
        initialEdges={mockEdges}
        mentalModelNodes={mockMentalModelNodes}
        allNodes={mockAllNodes}
      />
    );

    // Toggle mental model ON first
    const phase1Node = container.querySelector('[data-id="phase-1"]');
    await userEvent.click(phase1Node!);
    const mentalModelToggle = screen.getByRole('switch', { name: /model-1/i });
    await userEvent.click(mentalModelToggle);

    // Mental model is visible
    expect(container.querySelector('[data-id="model-1"]')).toBeTruthy();

    // Now click on mental model to open its detail panel
    const mentalModelNode = container.querySelector('[data-id="model-1"]');
    await userEvent.click(mentalModelNode!);

    // Find and toggle visualization ON
    const vizToggle = screen.getByRole('switch', { name: /visualization/i });
    await userEvent.click(vizToggle);

    // Visualization should now be visible
    expect(container.querySelector('[data-id="viz-model-1"]')).toBeTruthy();

    // Toggle visualization OFF
    await userEvent.click(vizToggle);

    // Visualization should disappear
    expect(container.querySelector('[data-id="viz-model-1"]')).toBeNull();
  });

  it('Issue 3: Mental model edges disappear when all phases toggle OFF', async () => {
    const { container } = render(
      <FrameworkVisualizerClient
        initialNodes={mockPhaseNodes}
        initialEdges={mockEdges}
        mentalModelNodes={mockMentalModelNodes}
        allNodes={mockAllNodes}
      />
    );

    // Toggle mental model ON from phase-1
    const phase1Node = container.querySelector('[data-id="phase-1"]');
    await userEvent.click(phase1Node!);
    const phase1Toggle = screen.getByRole('switch', { name: /model-1/i });
    await userEvent.click(phase1Toggle);

    // Edge should exist
    expect(container.querySelector('[data-id="mental-phase-1-model-1"]')).toBeTruthy();

    // Toggle mental model ON from phase-2
    const phase2Node = container.querySelector('[data-id="phase-2"]');
    await userEvent.click(phase2Node!);
    const phase2Toggle = screen.getByRole('switch', { name: /model-1/i });
    await userEvent.click(phase2Toggle);

    // Both edges should exist
    expect(container.querySelector('[data-id="mental-phase-1-model-1"]')).toBeTruthy();
    expect(container.querySelector('[data-id="mental-phase-2-model-1"]')).toBeTruthy();

    // Toggle OFF from phase-1
    await userEvent.click(phase1Node!);
    await userEvent.click(phase1Toggle);

    // Phase-1 edge should be gone, phase-2 edge remains
    expect(container.querySelector('[data-id="mental-phase-1-model-1"]')).toBeNull();
    expect(container.querySelector('[data-id="mental-phase-2-model-1"]')).toBeTruthy();

    // Toggle OFF from phase-2 (all toggles now OFF)
    await userEvent.click(phase2Node!);
    await userEvent.click(phase2Toggle);

    // All mental model edges should be gone
    expect(container.querySelector('[data-id="mental-phase-1-model-1"]')).toBeNull();
    expect(container.querySelector('[data-id="mental-phase-2-model-1"]')).toBeNull();

    // Mental model node itself should also disappear
    expect(container.querySelector('[data-id="model-1"]')).toBeNull();
  });

  it('Visualization respects BOTH viz toggle AND parent mental model visibility', async () => {
    const { container } = render(
      <FrameworkVisualizerClient
        initialNodes={mockPhaseNodes}
        initialEdges={mockEdges}
        mentalModelNodes={mockMentalModelNodes}
        allNodes={mockAllNodes}
      />
    );

    // Toggle mental model ON
    const phase1Node = container.querySelector('[data-id="phase-1"]');
    await userEvent.click(phase1Node!);
    const mentalModelToggle = screen.getByRole('switch', { name: /model-1/i });
    await userEvent.click(mentalModelToggle);

    // Mental model visible
    expect(container.querySelector('[data-id="model-1"]')).toBeTruthy();

    // Toggle visualization ON
    const mentalModelNode = container.querySelector('[data-id="model-1"]');
    await userEvent.click(mentalModelNode!);
    const vizToggle = screen.getByRole('switch', { name: /visualization/i });
    await userEvent.click(vizToggle);

    // Visualization visible
    expect(container.querySelector('[data-id="viz-model-1"]')).toBeTruthy();

    // Now toggle mental model OFF (parent)
    await userEvent.click(phase1Node!);
    await userEvent.click(mentalModelToggle);

    // Mental model disappears
    expect(container.querySelector('[data-id="model-1"]')).toBeNull();

    // Visualization should ALSO disappear (parent is hidden)
    expect(container.querySelector('[data-id="viz-model-1"]')).toBeNull();
  });
});
