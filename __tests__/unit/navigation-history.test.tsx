/**
 * Unit tests for NavigationHistory component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NavigationHistory from '@/components/panels/NavigationHistory';

describe('NavigationHistory', () => {
  it('should render back and forward buttons', () => {
    const mockOnBack = vi.fn();
    const mockOnForward = vi.fn();

    render(
      <NavigationHistory
        canGoBack={false}
        canGoForward={false}
        onBack={mockOnBack}
        onForward={mockOnForward}
      />
    );

    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /forward/i })).toBeInTheDocument();
  });

  it('should disable back button when canGoBack is false', () => {
    const mockOnBack = vi.fn();
    const mockOnForward = vi.fn();

    render(
      <NavigationHistory
        canGoBack={false}
        canGoForward={true}
        onBack={mockOnBack}
        onForward={mockOnForward}
      />
    );

    const backButton = screen.getByRole('button', { name: /back/i });
    expect(backButton).toBeDisabled();
  });

  it('should disable forward button when canGoForward is false', () => {
    const mockOnBack = vi.fn();
    const mockOnForward = vi.fn();

    render(
      <NavigationHistory
        canGoBack={true}
        canGoForward={false}
        onBack={mockOnBack}
        onForward={mockOnForward}
      />
    );

    const forwardButton = screen.getByRole('button', { name: /forward/i });
    expect(forwardButton).toBeDisabled();
  });

  it('should enable back button when canGoBack is true', () => {
    const mockOnBack = vi.fn();
    const mockOnForward = vi.fn();

    render(
      <NavigationHistory
        canGoBack={true}
        canGoForward={false}
        onBack={mockOnBack}
        onForward={mockOnForward}
      />
    );

    const backButton = screen.getByRole('button', { name: /back/i });
    expect(backButton).not.toBeDisabled();
  });

  it('should enable forward button when canGoForward is true', () => {
    const mockOnBack = vi.fn();
    const mockOnForward = vi.fn();

    render(
      <NavigationHistory
        canGoBack={false}
        canGoForward={true}
        onBack={mockOnBack}
        onForward={mockOnForward}
      />
    );

    const forwardButton = screen.getByRole('button', { name: /forward/i });
    expect(forwardButton).not.toBeDisabled();
  });

  it('should call onBack when back button is clicked', () => {
    const mockOnBack = vi.fn();
    const mockOnForward = vi.fn();

    render(
      <NavigationHistory
        canGoBack={true}
        canGoForward={false}
        onBack={mockOnBack}
        onForward={mockOnForward}
      />
    );

    const backButton = screen.getByRole('button', { name: /back/i });
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('should call onForward when forward button is clicked', () => {
    const mockOnBack = vi.fn();
    const mockOnForward = vi.fn();

    render(
      <NavigationHistory
        canGoBack={false}
        canGoForward={true}
        onBack={mockOnBack}
        onForward={mockOnForward}
      />
    );

    const forwardButton = screen.getByRole('button', { name: /forward/i });
    fireEvent.click(forwardButton);

    expect(mockOnForward).toHaveBeenCalledTimes(1);
  });

  it('should display history count when provided', () => {
    const mockOnBack = vi.fn();
    const mockOnForward = vi.fn();

    render(
      <NavigationHistory
        canGoBack={true}
        canGoForward={true}
        onBack={mockOnBack}
        onForward={mockOnForward}
        historyCount={5}
      />
    );

    expect(screen.getByText(/5/)).toBeInTheDocument();
  });
});
