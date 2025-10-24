/**
 * VisualizationNode Component
 *
 * Custom ReactFlow node for displaying mental model visualizations
 */

'use client';

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { MentalModel } from '@/types/framework';
import HeatmapVisualization from '@/components/visualizations/HeatmapVisualization';
import SVGVisualization from '@/components/visualizations/SVGVisualization';
import FunnelVisualization from '@/components/visualizations/FunnelVisualization';

interface VisualizationNodeProps {
  data: {
    model: MentalModel;
  };
}

/**
 * Renders a mental model visualization as a node in the graph
 */
function VisualizationNode({ data }: VisualizationNodeProps) {
  const { model } = data;

  // Check if model has visualization capability
  const hasVisualization =
    (model.visualization_type === 'heatmap' && model.stages && model.stages.length > 0) ||
    (model.visualization_type === 'funnel' && model.stages && model.stages.length > 0) ||
    (model.visualization_type === 'svg' && model.svg_config);

  if (!hasVisualization) {
    return null;
  }

  return (
    <div className="bg-background-secondary rounded-lg shadow-xl border-2 border-purple-primary/30 min-w-[400px] max-w-[600px]">
      {/* Connection handles on all four sides */}
      {/* Top handle - can be both source and target */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="w-3 h-3 !bg-purple-light border-2 border-background-primary"
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        className="w-3 h-3 !bg-purple-light border-2 border-background-primary"
        style={{ opacity: 0 }}
      />

      {/* Left handle - can be both source and target */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="w-3 h-3 !bg-purple-light border-2 border-background-primary"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        className="w-3 h-3 !bg-purple-light border-2 border-background-primary"
        style={{ opacity: 0 }}
      />

      {/* Right handle - can be both source and target */}
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        className="w-3 h-3 !bg-purple-light border-2 border-background-primary"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className="w-3 h-3 !bg-purple-light border-2 border-background-primary"
        style={{ opacity: 0 }}
      />

      {/* Header */}
      <div className="px-4 py-3 border-b border-purple-primary/20">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 text-xs font-medium rounded bg-purple-primary/20 text-purple-accent">
            visualization
          </span>
        </div>
        <h3 className="text-lg font-bold text-text-primary">{model.name}</h3>
      </div>

      {/* Visualization content */}
      <div className="p-4">
        {model.visualization_type === 'heatmap' && model.stages && (
          <HeatmapVisualization stages={model.stages} />
        )}
        {model.visualization_type === 'funnel' && model.stages && (
          <FunnelVisualization stages={model.stages} />
        )}
        {model.visualization_type === 'svg' && model.svg_config && (
          <SVGVisualization config={model.svg_config} />
        )}
      </div>

      {/* Bottom handle - can be both source and target */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="w-3 h-3 !bg-purple-light border-2 border-background-primary"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        className="w-3 h-3 !bg-purple-light border-2 border-background-primary"
        style={{ opacity: 0 }}
      />
    </div>
  );
}

export default memo(VisualizationNode);
