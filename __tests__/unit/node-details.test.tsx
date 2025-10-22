/**
 * Unit Tests for NodeDetails Component
 *
 * Tests rendering different node types with their specific fields
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import NodeDetails from '@/components/panels/NodeDetails';
import type { Phase, SubPhase, MentalModel } from '@/types/framework';

describe('NodeDetails', () => {
  const mockPhase: Phase = {
    id: 'test-phase',
    node_type: 'phase',
    name: 'Test Phase',
    version: '1.0',
    description: 'Test phase description',
    linked_mental_models: ['model-1', 'model-2'],
  };

  const mockSubPhase: SubPhase = {
    id: 'test-subphase',
    node_type: 'sub-phase',
    name: 'Test SubPhase',
    version: '1.0',
    description: 'Test subphase description',
    parent_phase: 'test-phase',
  };

  const mockMentalModel: MentalModel = {
    id: 'test-model',
    node_type: 'mental-model',
    name: 'Test Model',
    version: '1.0',
    description: 'Test mental model description',
    source: 'https://example.com',
    principles: ['principle-1', 'principle-2'],
  };

  it('should render phase node details', () => {
    render(<NodeDetails node={mockPhase} />);

    expect(screen.getByText('Test Phase')).toBeInTheDocument();
    expect(screen.getByText('test-phase')).toBeInTheDocument();
    expect(screen.getByText(/v1\.0/)).toBeInTheDocument();
    expect(screen.getByText(/Test phase description/)).toBeInTheDocument();
  });

  it('should display linked mental models for phase', () => {
    render(<NodeDetails node={mockPhase} />);

    expect(screen.getByText(/model-1/)).toBeInTheDocument();
    expect(screen.getByText(/model-2/)).toBeInTheDocument();
  });

  it('should render subphase node details', () => {
    render(<NodeDetails node={mockSubPhase} />);

    expect(screen.getByText('Test SubPhase')).toBeInTheDocument();
    expect(screen.getByText(/test-phase/)).toBeInTheDocument();
  });

  it('should render mental model details', () => {
    render(<NodeDetails node={mockMentalModel} />);

    // Text appears multiple times: once in header, once in visualization card
    expect(screen.getAllByText('Test Model').length).toBeGreaterThan(0);
    expect(screen.getByText(/https:\/\/example\.com/)).toBeInTheDocument();
  });

  it('should display node type badge', () => {
    render(<NodeDetails node={mockPhase} />);

    expect(screen.getByText('phase')).toBeInTheDocument();
  });

  it('should handle nodes without description', () => {
    const nodeWithoutDesc: Phase = {
      ...mockPhase,
      description: undefined,
    };

    render(<NodeDetails node={nodeWithoutDesc} />);

    expect(screen.getByText('Test Phase')).toBeInTheDocument();
  });

  it('should display guiding principles section for mental model', () => {
    render(<NodeDetails node={mockMentalModel} />);

    expect(screen.getByText('Guiding Principles')).toBeInTheDocument();
    expect(screen.getByText('principle-1')).toBeInTheDocument();
    expect(screen.getByText('principle-2')).toBeInTheDocument();
  });

  it('should display guiding principles count badge', () => {
    render(<NodeDetails node={mockMentalModel} />);

    // Check for the count badge specifically (there may be multiple "2" elements)
    const badges = screen.getAllByText('2');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('should display beautified principle cards with proper formatting', () => {
    render(<NodeDetails node={mockMentalModel} />);

    // Check for human-readable title (converted from kebab-case)
    expect(screen.getByText('Principle 1')).toBeInTheDocument();
    expect(screen.getByText('Principle 2')).toBeInTheDocument();
  });

  it('should not display guiding principles section for principle node type', () => {
    const principleNode: any = {
      id: 'test-principle',
      node_type: 'principle',
      name: 'Test Principle',
      version: '1.0',
      principles: ['other-principle'], // Should not show this section
    };

    render(<NodeDetails node={principleNode} />);

    // Guiding Principles section should not appear for principle nodes
    const guidingPrinciplesHeadings = screen.queryAllByText('Guiding Principles');
    expect(guidingPrinciplesHeadings.length).toBe(0);
  });

  it('should display guiding principles for phase nodes', () => {
    const phaseWithPrinciples: Phase = {
      ...mockPhase,
      principles: ['semantic-positioning', 'synthesis-first'],
    };

    render(<NodeDetails node={phaseWithPrinciples} />);

    expect(screen.getByText('Guiding Principles')).toBeInTheDocument();
    expect(screen.getByText('semantic-positioning')).toBeInTheDocument();
    expect(screen.getByText('synthesis-first')).toBeInTheDocument();
  });

  it('should handle navigation clicks on principle cards', () => {
    const mockNavigate = vi.fn();
    render(<NodeDetails node={mockMentalModel} onNavigateToNode={mockNavigate} />);

    const principleButton = screen.getByRole('button', { name: /principle-1/i });
    principleButton.click();

    expect(mockNavigate).toHaveBeenCalledWith('principle-1');
  });
});
