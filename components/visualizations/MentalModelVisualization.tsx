/**
 * MentalModelVisualization Component
 *
 * Displays mental model with toggle between card view and interactive visualization
 */

'use client';

import { useState } from 'react';
import type { MentalModel } from '@/types/framework';
import { Switch } from '@/components/ui/switch';
import HeatmapVisualization from './HeatmapVisualization';
import SVGVisualization from './SVGVisualization';
import FunnelVisualization from './FunnelVisualization';

interface MentalModelVisualizationProps {
  model: MentalModel;
}

/**
 * Renders mental model with view toggle
 */
export default function MentalModelVisualization({ model }: MentalModelVisualizationProps) {
  const [showVisualization, setShowVisualization] = useState(false);

  // Check if model has visualization capability
  const hasVisualization =
    (model.visualization_type === 'heatmap' && model.stages && model.stages.length > 0) ||
    (model.visualization_type === 'funnel' && model.stages && model.stages.length > 0) ||
    (model.visualization_type === 'svg' && model.svg_config);

  if (!hasVisualization) {
    // No visualization available, show simple card
    return (
      <div className="p-4 space-y-3">
        <div>
          <h4 className="text-sm font-semibold text-text-primary mb-2">Mental Model</h4>
          <p className="text-lg font-bold text-text-primary">{model.name}</p>
          {model.description && (
            <p className="text-sm text-text-secondary mt-2">{model.description}</p>
          )}
        </div>

        {model.principles && model.principles.length > 0 && (
          <div>
            <h5 className="text-xs font-semibold text-text-primary mb-1">Principles</h5>
            <ul className="space-y-1">
              {model.principles.map((principle, index) => (
                <li key={index} className="text-xs text-text-secondary">
                  • {principle}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toggle between card and visualization */}
      <div className="flex items-center justify-between px-4 pt-4">
        <span className="text-sm font-semibold text-text-primary">
          {showVisualization ? 'Visualization' : 'Card View'}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary">
            Show Visualization
          </span>
          <Switch
            checked={showVisualization}
            onCheckedChange={setShowVisualization}
          />
        </div>
      </div>

      {/* Content area */}
      <div className="px-4 pb-4">
        {!showVisualization ? (
          // Simple card view
          <div className="space-y-3">
            <div>
              <p className="text-lg font-bold text-text-primary">{model.name}</p>
              {model.description && (
                <p className="text-sm text-text-secondary mt-2">{model.description}</p>
              )}
            </div>

            {model.principles && model.principles.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-text-primary mb-1">Principles</h5>
                <ul className="space-y-1">
                  {model.principles.map((principle, index) => (
                    <li key={index} className="text-xs text-text-secondary">
                      • {principle}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {model.stages && model.stages.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-text-primary mb-1">Stages</h5>
                <ul className="space-y-1">
                  {model.stages.map((stage) => (
                    <li key={stage.id} className="text-xs text-text-secondary">
                      • {stage.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          // Interactive visualization
          <div className="bg-background-secondary rounded-lg p-4">
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
        )}
      </div>
    </div>
  );
}
