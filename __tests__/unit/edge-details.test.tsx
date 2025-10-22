/**
 * Unit Tests for EdgeDetails Component
 *
 * Tests edge relationship display
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import EdgeDetails from '@/components/panels/EdgeDetails';
import type { Edge } from '@/types/framework';

describe('EdgeDetails', () => {
  const mockEdge: Edge = {
    id: 'edge-1',
    from_node: 'node-a',
    to_node: 'node-b',
    relationship_type: 'precedes',
    description: 'Node A precedes Node B in the workflow',
  };

  it('should render edge relationship type', () => {
    render(<EdgeDetails edge={mockEdge} />);

    // Check for the badge with the relationship type
    const badges = screen.getAllByText(/precedes/);
    expect(badges.length).toBeGreaterThan(0);
  });

  it('should display source and target nodes', () => {
    render(<EdgeDetails edge={mockEdge} />);

    expect(screen.getByText(/node-a/)).toBeInTheDocument();
    expect(screen.getByText(/node-b/)).toBeInTheDocument();
  });

  it('should render edge description', () => {
    render(<EdgeDetails edge={mockEdge} />);

    expect(screen.getByText(/Node A precedes Node B/)).toBeInTheDocument();
  });

  it('should handle edges without description', () => {
    const edgeWithoutDesc: Edge = {
      ...mockEdge,
      description: undefined,
    };

    render(<EdgeDetails edge={edgeWithoutDesc} />);

    expect(screen.getByText(/precedes/)).toBeInTheDocument();
    expect(screen.getByText(/node-a/)).toBeInTheDocument();
  });

  it('should display different relationship types correctly', () => {
    const containsEdge: Edge = {
      ...mockEdge,
      relationship_type: 'contains',
    };

    render(<EdgeDetails edge={containsEdge} />);

    expect(screen.getByText(/contains/)).toBeInTheDocument();
  });

  it('should show bidirectional indicator when applicable', () => {
    const bidirectionalEdge: Edge = {
      ...mockEdge,
      bidirectional: true,
    };

    render(<EdgeDetails edge={bidirectionalEdge} />);

    expect(screen.getByText(/bidirectional/i)).toBeInTheDocument();
  });
});
