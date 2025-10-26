/**
 * Home Page - R1D3 Framework Visualizer
 *
 * Main page that loads and displays flow visualizations from YAML files.
 */

import FlowVisualizerClient from '@/components/FlowVisualizerClient';
import ErrorBoundary from '@/components/ErrorBoundary';

/**
 * Main page - delegates to client component for interactive flow visualization
 */
export default function Home() {
  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Header */}
        <header className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                R1D3 Flow Visualizer
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                YAML-based conceptual model visualization
              </p>
            </div>
          </div>
        </header>

        {/* Main graph canvas */}
        <main className="flex-1 overflow-hidden">
          <FlowVisualizerClient />
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white px-6 py-3">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div>
              R1D3 Framework v2.0 - YAML Flow Management
            </div>
            <div className="flex gap-4">
              <span>Scroll to zoom • Drag to pan • Click nodes for details</span>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
