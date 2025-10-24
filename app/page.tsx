/**
 * Home Page - R1D3 Framework Visualizer
 *
 * Main page that loads and displays the framework graph visualization.
 */

import FrameworkVisualizerClient from '@/components/FrameworkVisualizerClient';
import ErrorBoundary from '@/components/ErrorBoundary';
import { loadFrameworkData } from '@/lib/yaml-loader';
import { calculateHybridLayout } from '@/lib/layout-algorithms';
import { buildReactFlowGraph } from '@/lib/graph-builder';

/**
 * Server component that loads YAML data at build time
 */
export default function Home() {
  // Load framework data (runs at build time in Cloudflare Workers)
  const frameworkData = loadFrameworkData();

  // Separate special node types from primary canvas nodes
  // Mental models are handled separately (shown/hidden dynamically)
  // These types are NOT shown in canvas (only in detail panels when referenced):
  //   - principle, output, outcome, impact
  const mentalModels = frameworkData.nodes.filter(n => n.node_type === 'mental-model');
  const primaryNodes = frameworkData.nodes.filter(
    n => n.node_type !== 'mental-model'
      && n.node_type !== 'principle'
      && n.node_type !== 'output'
      && n.node_type !== 'outcome'
      && n.node_type !== 'impact'
  );

  // Calculate hybrid layout: 2x2 grid for phases, git-branches for sub-phases/components
  const positions = calculateHybridLayout(
    primaryNodes,
    frameworkData.edges,
    {
      phaseCenterX: 800,       // Center X coordinate of the 2x2 grid
      phaseCenterY: 600,       // Center Y coordinate of the 2x2 grid
      phaseSpacingX: 600,      // Horizontal spacing between phases in grid
      phaseSpacingY: 400,      // Vertical spacing between phases in grid
      branchSpacing: 350,      // Distance sub-phases branch from phases
      verticalSpacing: 200,    // Vertical spacing between multiple sub-phases/components
    }
  );

  // Build ReactFlow graph with only primary nodes initially
  const { nodes, edges } = buildReactFlowGraph(
    primaryNodes,
    frameworkData.edges,
    positions
  );

  // Also prepare mental model nodes (hidden initially)
  const mentalModelPositions = new Map<string, { x: number; y: number }>();
  mentalModels.forEach((model) => {
    // Position mental models off to the side (they'll be repositioned when shown)
    mentalModelPositions.set(model.id, { x: 500, y: 0 });
  });

  const { nodes: mentalModelNodes } = buildReactFlowGraph(
    mentalModels,
    [],
    mentalModelPositions
  );

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen bg-background-primary">
        {/* Header */}
        <header className="border-b border-purple-primary/30 bg-background-secondary px-6 py-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-text-primary">
                R1D3 Framework Visualizer
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xs text-text-secondary">
                <span className="font-medium">{primaryNodes.length}</span> nodes
                {' • '}
                <span className="font-medium">{frameworkData.edges.length}</span> edges
                {' • '}
                <span className="font-medium">{mentalModels.length}</span> mental models
              </div>
            </div>
          </div>
        </header>

        {/* Main graph canvas with detail panel */}
        <main className="flex-1 overflow-hidden">
          <FrameworkVisualizerClient
            initialNodes={nodes}
            initialEdges={edges}
            mentalModelNodes={mentalModelNodes}
            allNodes={frameworkData.nodes}
          />
        </main>

        {/* Footer */}
        <footer className="border-t border-purple-primary/30 bg-background-secondary px-6 py-3">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <div>
              R1D3 Framework v1.0
            </div>
            <div className="flex gap-4">
              <span>Use scroll to zoom • Drag to pan • Click nodes to select</span>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
