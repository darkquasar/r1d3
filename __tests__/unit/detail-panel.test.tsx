/**
 * Unit Tests for DetailPanel Component
 *
 * Tests panel open/close, scroll behavior, and content display
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DetailPanel from '@/components/panels/DetailPanel';

describe('DetailPanel', () => {
  it('should render when open', () => {
    render(
      <DetailPanel isOpen={true} onClose={() => {}}>
        <div>Test content</div>
      </DetailPanel>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <DetailPanel isOpen={false} onClose={() => {}}>
        <div>Test content</div>
      </DetailPanel>
    );

    expect(screen.queryByText('Test content')).not.toBeInTheDocument();
  });

  it('should call onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(
      <DetailPanel isOpen={true} onClose={onClose}>
        <div>Test content</div>
      </DetailPanel>
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should have scrollable content area', () => {
    render(
      <DetailPanel isOpen={true} onClose={() => {}}>
        <div style={{ height: '2000px' }}>Long content</div>
      </DetailPanel>
    );

    const scrollArea = screen.getByRole('region');
    expect(scrollArea).toBeInTheDocument();
  });

  it('should display title when provided', () => {
    render(
      <DetailPanel isOpen={true} onClose={() => {}} title="Test Title">
        <div>Content</div>
      </DetailPanel>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });
});
