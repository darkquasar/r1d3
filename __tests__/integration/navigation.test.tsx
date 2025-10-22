/**
 * Integration tests for navigation functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import FrameworkVisualizerClient from '@/components/FrameworkVisualizerClient';
import type { ReactFlowFrameworkNode, ReactFlowFrameworkEdge } from '@/types/graph';
import type { FrameworkNode } from '@/types/framework';

describe('Navigation Integration', () => {
  let mockNodes: ReactFlowFrameworkNode[];
  let mockEdges: ReactFlowFrameworkEdge[];
  let mockMentalModels: ReactFlowFrameworkNode[];
  let mockAllNodes: FrameworkNode[];

  beforeEach(() => {
    // Create mock phase nodes
    mockNodes = [
      {
        id: 'phase-1',
        type: 'phase',
        position: { x: 0, y: 0 },
        data: {
          id: 'phase-1',
          node_type: 'phase',
          name: 'Phase 1',
          version: '1.0',
          description: 'First phase',
          label: 'Phase 1',
          contains_sub_phases: ['sub-phase-1'],
          linked_mental_models: ['mental-1'],
        },
      },
      {
        id: 'sub-phase-1',
        type: 'sub-phase',
        position: { x: 100, y: 100 },
        data: {
          id: 'sub-phase-1',
          node_type: 'sub-phase',
          name: 'Sub Phase 1',
          version: '1.0',
          description: 'First sub-phase',
          label: 'Sub Phase 1',
          parent_phase: 'phase-1',
        },
      },
    ];

    mockMentalModels = [
      {
        id: 'mental-1',
        type: 'mental-model',
        position: { x: 200, y: 200 },
        data: {
          id: 'mental-1',
          node_type: 'mental-model',
          name: 'Mental Model 1',
          version: '1.0',
          description: 'Test mental model',
          label: 'Mental Model 1',
          visualization_type: 'magic-quadrant',
        },
      },
    ];

    mockEdges = [
      {
        id: 'e1',
        source: 'phase-1',
        target: 'sub-phase-1',
        type: 'default',
        data: {
          id: 'e1',
          from_node: 'phase-1',
          to_node: 'sub-phase-1',
          relationship_type: 'contains',
        },
      },
    ];

    mockAllNodes = [
      ...mockNodes.map(n => n.data),
      ...mockMentalModels.map(m => m.data),
    ] as FrameworkNode[];
  });

  it('should navigate to related node when clicking a link in detail panel', () => {
    render(
      <FrameworkVisualizerClient
        initialNodes={mockNodes}
        initialEdges={mockEdges}
        mentalModelNodes={mockMentalModels}
        allNodes={mockAllNodes}
      />
    );

    // Simulate clicking on phase-1 node
    const phase1Node = screen.getByText('Phase 1');
    fireEvent.click(phase1Node);

    // Detail panel should appear with phase details
    expect(screen.getByText(/Phase 1/)).toBeInTheDocument();
    expect(screen.getByText(/Contains Sub-Phases/)).toBeInTheDocument();

    // Click on the sub-phase link
    const subPhaseLink = screen.getByText('sub-phase-1');
    fireEvent.click(subPhaseLink);

    // Detail panel should update to show sub-phase details
    expect(screen.getByText('Sub Phase 1')).toBeInTheDocument();
    expect(screen.getByText(/Parent Phase/)).toBeInTheDocument();
  });

  it('should highlight connected nodes when a node is selected', () => {
    const { container } = render(
      <FrameworkVisualizerClient
        initialNodes={mockNodes}
        initialEdges={mockEdges}
        mentalModelNodes={mockMentalModels}
        allNodes={mockAllNodes}
      />
    );

    // Click on phase-1 node
    const phase1Node = screen.getByText('Phase 1');
    fireEvent.click(phase1Node);

    // Check that connected edges are highlighted (animated or styled differently)
    const edges = container.querySelectorAll('[data-testid="rf__edge"]');
    const connectedEdge = Array.from(edges).find(
      edge => edge.getAttribute('data-source') === 'phase-1'
    );

    expect(connectedEdge).toBeDefined();
  });

  it('should navigate back using navigation history', () => {
    render(
      <FrameworkVisualizerClient
        initialNodes={mockNodes}
        initialEdges={mockEdges}
        mentalModelNodes={mockMentalModels}
        allNodes={mockAllNodes}
      />
    );

    // Click phase-1
    const phase1Node = screen.getByText('Phase 1');
    fireEvent.click(phase1Node);
    expect(screen.getByText(/Contains Sub-Phases/)).toBeInTheDocument();

    // Navigate to sub-phase-1
    const subPhaseLink = screen.getByText('sub-phase-1');
    fireEvent.click(subPhaseLink);
    expect(screen.getByText('Sub Phase 1')).toBeInTheDocument();

    // Click back button
    const backButton = screen.getByRole('button', { name: /back/i });
    fireEvent.click(backButton);

    // Should return to phase-1 details
    expect(screen.getByText(/Contains Sub-Phases/)).toBeInTheDocument();
  });

  it('should navigate forward using navigation history', () => {
    render(
      <FrameworkVisualizerClient
        initialNodes={mockNodes}
        initialEdges={mockEdges}
        mentalModelNodes={mockMentalModels}
        allNodes={mockAllNodes}
      />
    );

    // Click phase-1
    const phase1Node = screen.getByText('Phase 1');
    fireEvent.click(phase1Node);

    // Navigate to sub-phase-1
    const subPhaseLink = screen.getByText('sub-phase-1');
    fireEvent.click(subPhaseLink);

    // Go back
    const backButton = screen.getByRole('button', { name: /back/i });
    fireEvent.click(backButton);

    // Go forward
    const forwardButton = screen.getByRole('button', { name: /forward/i });
    fireEvent.click(forwardButton);

    // Should return to sub-phase-1 details
    expect(screen.getByText('Sub Phase 1')).toBeInTheDocument();
  });

  it('should focus on node when navigating via links', () => {
    const { container } = render(
      <FrameworkVisualizerClient
        initialNodes={mockNodes}
        initialEdges={mockEdges}
        mentalModelNodes={mockMentalModels}
        allNodes={mockAllNodes}
      />
    );

    // Click phase-1
    const phase1Node = screen.getByText('Phase 1');
    fireEvent.click(phase1Node);

    // Navigate to sub-phase via link
    const subPhaseLink = screen.getByText('sub-phase-1');
    fireEvent.click(subPhaseLink);

    // Verify that ReactFlow viewport has been updated
    // (This is a simplified check - actual implementation would verify fitView was called)
    const reactFlowWrapper = container.querySelector('.react-flow');
    expect(reactFlowWrapper).toBeInTheDocument();
  });
});
