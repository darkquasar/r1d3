/**
 * ErrorBoundary Component
 *
 * Catches and handles errors in the React component tree,
 * providing a user-friendly error display.
 */

'use client';

import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary to catch and display React errors gracefully
 */
export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background-primary flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-background-secondary border-2 border-purple-primary/30 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-text-primary mb-4">
              Something went wrong
            </h2>
            <p className="text-text-secondary mb-4">
              An error occurred while rendering the visualization. Please try refreshing the page.
            </p>
            {this.state.error && (
              <details className="mt-4 p-3 bg-background-primary rounded border border-purple-primary/20">
                <summary className="text-sm font-medium text-purple-accent cursor-pointer">
                  Error details
                </summary>
                <pre className="mt-2 text-xs text-text-secondary overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-6 w-full px-4 py-2 bg-purple-primary hover:bg-purple-hover text-text-primary font-medium rounded-lg transition-colors"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
