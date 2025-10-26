/**
 * Integration tests for FilterMenu component (User Story 4)
 * Tests cover all acceptance scenarios from spec.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import FilterMenu from '@/components/FilterMenu';
import type { FlowSummary } from '@/types/yaml-schema';
import type { LayoutAlgorithm } from '@/types/layout';

describe('FilterMenu - User Story 4: Enhanced Filter Menu', () => {
  const mockFlows: FlowSummary[] = [
    {
      id: 'flow-1',
      name: 'Example Flow',
      description: 'Sample flow demonstrating phases and components',
      nodeCount: 10,
      edgeCount: 7,
    },
    {
      id: 'flow-2',
      name: 'Mental Models Flow',
      description: 'Flow showcasing mental model connections',
      nodeCount: 15,
      edgeCount: 12,
    },
    {
      id: 'flow-3',
      name: 'Principles Flow',
      description: 'Governance principles visualization',
      nodeCount: 8,
      edgeCount: 5,
    },
  ];

  const defaultProps = {
    flows: mockFlows,
    selectedFlowId: 'flow-1',
    onFlowSelect: vi.fn(),
    layoutAlgorithm: 'force-directed' as LayoutAlgorithm,
    onLayoutChange: vi.fn(),
    showGrouping: false,
    onGroupingToggle: vi.fn(),
    smartEdgeRouting: false,
    onSmartEdgeRoutingToggle: vi.fn(),
    layoutParams: {},
    onLayoutParamsChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Acceptance Scenario 1: Visually organized list of flows with labels
   */
  describe('Flow List Display', () => {
    it('should display all available flows when menu is opened', () => {
      render(<FilterMenu {...defaultProps} />);

      // Open menu
      const trigger = screen.getByLabelText('Open filter menu');
      fireEvent.click(trigger);

      // Should show all flows with names and descriptions
      // Use getAllByText since "Example Flow" appears in both trigger and list
      const exampleFlowElements = screen.getAllByText('Example Flow');
      expect(exampleFlowElements.length).toBeGreaterThan(0);
      expect(screen.getByText('Sample flow demonstrating phases and components')).toBeInTheDocument();
      expect(screen.getByText('Mental Models Flow')).toBeInTheDocument();
      expect(screen.getByText('Principles Flow')).toBeInTheDocument();
    });

    it('should show section header for flow list', () => {
      render(<FilterMenu {...defaultProps} />);

      const trigger = screen.getByLabelText('Open filter menu');
      fireEvent.click(trigger);

      expect(screen.getByText('Available Flows')).toBeInTheDocument();
    });

    it('should highlight the currently selected flow', () => {
      render(<FilterMenu {...defaultProps} selectedFlowId="flow-2" />);

      const trigger = screen.getByLabelText('Open filter menu');
      fireEvent.click(trigger);

      // Find the selected flow button
      const selectedButton = screen.getByRole('button', { name: /Mental Models Flow/i });
      expect(selectedButton).toHaveClass('bg-blue-50', 'text-blue-700', 'font-medium');
    });

    it('should show selected flow name in trigger button', () => {
      render(<FilterMenu {...defaultProps} selectedFlowId="flow-2" />);

      const trigger = screen.getByLabelText('Open filter menu');
      expect(trigger).toHaveTextContent('Mental Models Flow');
    });
  });

  /**
   * Acceptance Scenario 2: Visual feedback on hover
   */
  describe('Visual Feedback', () => {
    it('should apply hover styles to flow list items', () => {
      render(<FilterMenu {...defaultProps} />);

      const trigger = screen.getByLabelText('Open filter menu');
      fireEvent.click(trigger);

      // Non-selected flows should have hover:bg-gray-100 class
      const nonSelectedFlow = screen.getByRole('button', { name: /Mental Models Flow/i });
      expect(nonSelectedFlow).toHaveClass('hover:bg-gray-100');
    });

    it('should show Settings icon in trigger button', () => {
      render(<FilterMenu {...defaultProps} />);

      const trigger = screen.getByLabelText('Open filter menu');
      // Icon should be present (rendered by lucide-react as SVG)
      const icon = trigger.querySelector('svg');
      expect(icon).toBeTruthy();
      expect(icon).toHaveClass('lucide-settings2', 'lucide-settings-2');
    });
  });

  /**
   * Acceptance Scenario 3: Toggle node grouping visibility
   */
  describe('Grouping Toggle', () => {
    it('should display grouping toggle control', () => {
      render(<FilterMenu {...defaultProps} />);

      const trigger = screen.getByLabelText('Open filter menu');
      fireEvent.click(trigger);

      expect(screen.getByText('Show Grouping')).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: /grouping/i })).toBeInTheDocument();
    });

    it('should call onGroupingToggle when switch is clicked', () => {
      const onGroupingToggle = vi.fn();
      render(<FilterMenu {...defaultProps} onGroupingToggle={onGroupingToggle} />);

      const trigger = screen.getByLabelText('Open filter menu');
      fireEvent.click(trigger);

      const groupingSwitch = screen.getByRole('switch', { name: /grouping/i });
      fireEvent.click(groupingSwitch);

      expect(onGroupingToggle).toHaveBeenCalledWith(true);
    });

    it('should reflect grouping state in switch appearance', () => {
      const { rerender } = render(<FilterMenu {...defaultProps} showGrouping={false} />);

      const trigger = screen.getByLabelText('Open filter menu');
      fireEvent.click(trigger);

      const groupingSwitch = screen.getByRole('switch', { name: /grouping/i });
      expect(groupingSwitch).toHaveAttribute('data-state', 'unchecked');

      // Re-render with grouping enabled
      rerender(<FilterMenu {...defaultProps} showGrouping={true} />);
      expect(groupingSwitch).toHaveAttribute('data-state', 'checked');
    });
  });

  /**
   * Acceptance Scenario 4: Layout algorithm selection with visual feedback
   */
  describe('Layout Algorithm Selection', () => {
    it('should display all three layout algorithm options', () => {
      render(<FilterMenu {...defaultProps} />);

      const trigger = screen.getByLabelText('Open filter menu');
      fireEvent.click(trigger);

      const select = screen.getByRole('combobox');
      expect(within(select).getByText('Force-Directed')).toBeInTheDocument();
      expect(within(select).getByText('Hierarchical')).toBeInTheDocument();
      expect(within(select).getByText('Radial Tree')).toBeInTheDocument();
    });

    it('should show description for selected algorithm', () => {
      render(<FilterMenu {...defaultProps} layoutAlgorithm="force-directed" />);

      const trigger = screen.getByLabelText('Open filter menu');
      fireEvent.click(trigger);

      expect(screen.getByText('Physics-based natural layout')).toBeInTheDocument();
    });

    it('should call onLayoutChange when algorithm is changed', () => {
      const onLayoutChange = vi.fn();
      render(<FilterMenu {...defaultProps} onLayoutChange={onLayoutChange} />);

      const trigger = screen.getByLabelText('Open filter menu');
      fireEvent.click(trigger);

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'hierarchical' } });

      expect(onLayoutChange).toHaveBeenCalledWith('hierarchical');
    });
  });

  /**
   * Acceptance Scenario 5: Menu remains open during interactions
   */
  describe('Menu Persistence', () => {
    it('should keep menu open after selecting a flow', () => {
      render(<FilterMenu {...defaultProps} />);

      const trigger = screen.getByLabelText('Open filter menu');
      fireEvent.click(trigger);

      // Click a different flow
      const flowButton = screen.getByRole('button', { name: /Mental Models Flow/i });
      fireEvent.click(flowButton);

      // Menu should still be visible
      expect(screen.getByText('Available Flows')).toBeInTheDocument();
      expect(screen.getByText('Layout Algorithm')).toBeInTheDocument();
    });

    it('should keep menu open after toggling grouping', () => {
      render(<FilterMenu {...defaultProps} />);

      const trigger = screen.getByLabelText('Open filter menu');
      fireEvent.click(trigger);

      const groupingSwitch = screen.getByRole('switch', { name: /grouping/i });
      fireEvent.click(groupingSwitch);

      // Menu should still be visible
      expect(screen.getByText('Available Flows')).toBeInTheDocument();
    });

    it('should keep menu open after changing layout algorithm', () => {
      render(<FilterMenu {...defaultProps} />);

      const trigger = screen.getByLabelText('Open filter menu');
      fireEvent.click(trigger);

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'hierarchical' } });

      // Menu should still be visible
      expect(screen.getByText('Available Flows')).toBeInTheDocument();
    });

    it('should keep menu open after adjusting layout parameters', () => {
      render(<FilterMenu {...defaultProps} layoutAlgorithm="force-directed" />);

      const trigger = screen.getByLabelText('Open filter menu');
      fireEvent.click(trigger);

      const repulsionSlider = screen.getByRole('slider', { name: /repulsion/i });
      fireEvent.change(repulsionSlider, { target: { value: '500' } });

      // Menu should still be visible
      expect(screen.getByText('Available Flows')).toBeInTheDocument();
    });
  });

  /**
   * Acceptance Scenario 6: Menu closes on explicit action
   */
  describe('Menu Close Behavior', () => {
    it('should close menu when close button is clicked', () => {
      render(<FilterMenu {...defaultProps} />);

      const trigger = screen.getByLabelText('Open filter menu');
      fireEvent.click(trigger);

      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      // Menu should be closed (content not visible)
      expect(screen.queryByText('Available Flows')).not.toBeInTheDocument();
    });

    it('should allow menu to be reopened after closing', () => {
      render(<FilterMenu {...defaultProps} />);

      const trigger = screen.getByLabelText('Open filter menu');

      // Open
      fireEvent.click(trigger);
      expect(screen.getByText('Available Flows')).toBeInTheDocument();

      // Close
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);
      expect(screen.queryByText('Available Flows')).not.toBeInTheDocument();

      // Reopen
      fireEvent.click(trigger);
      expect(screen.getByText('Available Flows')).toBeInTheDocument();
    });

    // Note: Outside click behavior is handled by Radix UI Popover
    // and is tested in Radix's own test suite. We trust the library.
  });

  /**
   * Additional: Flow selection callback
   */
  describe('Flow Selection', () => {
    it('should call onFlowSelect with correct flow ID when flow is clicked', () => {
      const onFlowSelect = vi.fn();
      render(<FilterMenu {...defaultProps} onFlowSelect={onFlowSelect} />);

      const trigger = screen.getByLabelText('Open filter menu');
      fireEvent.click(trigger);

      const flowButton = screen.getByRole('button', { name: /Mental Models Flow/i });
      fireEvent.click(flowButton);

      expect(onFlowSelect).toHaveBeenCalledWith('flow-2');
    });
  });

  /**
   * Additional: ScrollArea for long flow lists
   */
  describe('Scroll Area', () => {
    it('should render flow list inside a scrollable container', () => {
      render(<FilterMenu {...defaultProps} />);

      const trigger = screen.getByLabelText('Open filter menu');
      fireEvent.click(trigger);

      // ScrollArea.Root should be present with fixed height
      const scrollContainer = document.querySelector('[class*="h-40"]');
      expect(scrollContainer).toBeTruthy();
    });
  });

  /**
   * Additional: Accessibility
   */
  describe('Accessibility', () => {
    it('should have proper ARIA labels for trigger button', () => {
      render(<FilterMenu {...defaultProps} />);

      const trigger = screen.getByLabelText('Open filter menu');
      expect(trigger).toBeInTheDocument();
    });

    it('should have proper ARIA labels for layout parameter sliders', () => {
      render(<FilterMenu {...defaultProps} layoutAlgorithm="force-directed" />);

      const trigger = screen.getByLabelText('Open filter menu');
      fireEvent.click(trigger);

      expect(screen.getByLabelText('Repulsion strength')).toBeInTheDocument();
      expect(screen.getByLabelText('Attraction strength')).toBeInTheDocument();
      expect(screen.getByLabelText('Center Gravity strength')).toBeInTheDocument();
    });
  });
});
