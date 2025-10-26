/**
 * Unit tests for FilterMenu layout controls (T071)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FilterMenu from '@/components/FilterMenu';
import type { FlowSummary } from '@/types/yaml-schema';

describe('FilterMenu - Layout Parameter Controls (T071)', () => {
  const mockFlows: FlowSummary[] = [
    {
      id: 'test-flow',
      name: 'Test Flow',
      description: 'Test description',
      nodeCount: 5,
      edgeCount: 3,
    },
  ];

  const mockProps = {
    flows: mockFlows,
    selectedFlowId: 'test-flow',
    onFlowSelect: vi.fn(),
    layoutAlgorithm: 'force-directed' as const,
    onLayoutChange: vi.fn(),
    showGrouping: false,
    onGroupingToggle: vi.fn(),
    smartEdgeRouting: false,
    onSmartEdgeRoutingToggle: vi.fn(),
    layoutParams: {},
    onLayoutParamsChange: vi.fn(),
  };

  it('should show force-directed parameters when algorithm is force-directed', () => {
    render(<FilterMenu {...mockProps} layoutAlgorithm="force-directed" />);

    // Click to open menu
    const trigger = screen.getByLabelText('Open filter menu');
    fireEvent.click(trigger);

    // Should show repulsion, attraction, centerGravity parameters
    expect(screen.getByText(/repulsion/i)).toBeInTheDocument();
    expect(screen.getByText(/attraction/i)).toBeInTheDocument();
    expect(screen.getByText(/center gravity/i)).toBeInTheDocument();
  });

  it('should show hierarchical parameters when algorithm is hierarchical', () => {
    render(<FilterMenu {...mockProps} layoutAlgorithm="hierarchical" />);

    const trigger = screen.getByLabelText('Open filter menu');
    fireEvent.click(trigger);

    // Should show rank separation, node separation, direction
    expect(screen.getByText(/rank separation/i)).toBeInTheDocument();
    expect(screen.getByText(/node separation/i)).toBeInTheDocument();
    expect(screen.getByText(/direction/i)).toBeInTheDocument();
  });

  it('should show radial-tree parameters when algorithm is radial-tree', () => {
    render(<FilterMenu {...mockProps} layoutAlgorithm="radial-tree" smartEdgeRouting={false} onSmartEdgeRoutingToggle={vi.fn()} />);

    const trigger = screen.getByLabelText('Open filter menu');
    fireEvent.click(trigger);

    // Should show radius, rotation
    expect(screen.getByText(/radius/i)).toBeInTheDocument();
    expect(screen.getByText(/rotation/i)).toBeInTheDocument();
  });

  it('should call onLayoutParamsChange when parameter is adjusted', () => {
    const onLayoutParamsChange = vi.fn();

    render(
      <FilterMenu
        {...mockProps}
        layoutAlgorithm="force-directed"
        onLayoutParamsChange={onLayoutParamsChange}
      />
    );

    const trigger = screen.getByLabelText('Open filter menu');
    fireEvent.click(trigger);

    // Find repulsion slider and change it (slider shows positive values, but stores negative)
    const repulsionSlider = screen.getByRole('slider', { name: /repulsion/i });
    fireEvent.change(repulsionSlider, { target: { value: '500' } }); // Slider value is positive

    expect(onLayoutParamsChange).toHaveBeenCalledWith({ repulsion: -500 }); // Stored as negative
  });

  it('should display current parameter values', () => {
    render(
      <FilterMenu
        {...mockProps}
        layoutAlgorithm="force-directed"
        layoutParams={{ repulsion: -500, attraction: 0.2, centerGravity: 0.15 }}
      />
    );

    const trigger = screen.getByLabelText('Open filter menu');
    fireEvent.click(trigger);

    // Should display the current values (slider shows positive values)
    const repulsionSlider = screen.getByRole('slider', { name: /repulsion/i }) as HTMLInputElement;
    expect(repulsionSlider.value).toBe('500'); // Slider displays absolute value
  });
});
