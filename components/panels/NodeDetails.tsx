/**
 * NodeDetails Component
 *
 * Displays detailed information about a framework node
 */

'use client';

import { useState } from 'react';
import type { FrameworkNode } from '@/types/framework';
import { Switch } from '@/components/ui/switch';

interface NodeDetailsProps {
  node: FrameworkNode;
  onToggleMentalModel?: (nodeId: string, modelId: string, show: boolean) => void;
  onToggleAllMentalModels?: (show: boolean) => void;
  mentalModelToggles?: Map<string, Set<string>>;
  onNavigateToNode?: (nodeId: string) => void;
  onToggleVisualization?: (modelId: string, show: boolean) => void;
  visualizationToggles?: Set<string>;
}

/**
 * Renders node details based on node type
 */
export default function NodeDetails({
  node,
  onToggleMentalModel,
  onToggleAllMentalModels,
  mentalModelToggles,
  onNavigateToNode,
  onToggleVisualization,
  visualizationToggles,
}: NodeDetailsProps) {
  // Check if all mental models for THIS node are toggled ON
  const allModelsToggledByThisNode = node.linked_mental_models
    ? node.linked_mental_models.every(modelId =>
        mentalModelToggles?.get(modelId)?.has(node.id) ?? false
      )
    : false;
  return (
    <div className="space-y-4">
      {/* Node Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-1 text-xs font-medium rounded bg-purple-primary/20 text-purple-accent">
            {node.node_type}
          </span>
          <span className="text-xs text-white/60">v{node.version}</span>
        </div>
        <h3 className="text-xl font-bold text-white">{node.name}</h3>
        <p className="text-sm text-white/50 mt-1 font-mono">{node.id}</p>
      </div>

      {/* Description */}
      {node.description && (
        <div>
          <h4 className="text-sm font-semibold text-white mb-2">Description</h4>
          <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
            {node.description}
          </p>
        </div>
      )}

      {/* Phase-specific fields */}
      {node.node_type === 'phase' && node.contains_sub_phases && (
        <div>
          <h4 className="text-sm font-semibold text-white mb-2">Contains Sub-Phases</h4>
          <ul className="space-y-1">
            {node.contains_sub_phases.map((subPhaseId) => (
              <li key={subPhaseId}>
                <button
                  onClick={() => onNavigateToNode?.(subPhaseId)}
                  className="text-sm text-purple-accent hover:text-purple-light cursor-pointer hover:underline transition-colors"
                  data-testid="related-node-link"
                >
                  {subPhaseId}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* SubPhase-specific fields */}
      {node.node_type === 'sub-phase' && (
        <div>
          <h4 className="text-sm font-semibold text-white mb-2">Parent Phase</h4>
          <button
            onClick={() => onNavigateToNode?.(node.parent_phase)}
            className="text-sm text-purple-accent hover:text-purple-light cursor-pointer hover:underline transition-colors"
            data-testid="related-node-link"
          >
            {node.parent_phase}
          </button>
        </div>
      )}

      {node.node_type === 'sub-phase' && node.contains_components && (
        <div>
          <h4 className="text-sm font-semibold text-white mb-2">Contains Components</h4>
          <ul className="space-y-1">
            {node.contains_components.map((componentId) => (
              <li key={componentId}>
                <button
                  onClick={() => onNavigateToNode?.(componentId)}
                  className="text-sm text-purple-accent hover:text-purple-light cursor-pointer hover:underline transition-colors"
                  data-testid="related-node-link"
                >
                  {componentId}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* SubPhaseComponent-specific fields */}
      {node.node_type === 'sub-phase-component' && (
        <div>
          <h4 className="text-sm font-semibold text-white mb-2">Parent Sub-Phase</h4>
          <button
            onClick={() => onNavigateToNode?.(node.parent_sub_phase)}
            className="text-sm text-purple-accent hover:text-purple-light cursor-pointer hover:underline transition-colors"
            data-testid="related-node-link"
          >
            {node.parent_sub_phase}
          </button>
        </div>
      )}

      {/* Mental Model-specific fields */}
      {node.node_type === 'mental-model' && node.source && (
        <div>
          <h4 className="text-sm font-semibold text-white mb-2">Source</h4>
          <a
            href={node.source}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-purple-accent hover:text-purple-light underline"
          >
            {node.source}
          </a>
        </div>
      )}

      {node.node_type === 'mental-model' && (node as any).summary && (
        <div>
          <h4 className="text-sm font-semibold text-white mb-2">Summary</h4>
          <p className="text-sm text-white/80 leading-relaxed">
            {(node as any).summary}
          </p>
        </div>
      )}

      {/* Visualization toggle for mental models */}
      {node.node_type === 'mental-model' && (
        (() => {
          const mentalModelData = node as any;
          const hasVisualization =
            (mentalModelData.visualization_type === 'heatmap' && mentalModelData.stages?.length) ||
            (mentalModelData.visualization_type === 'funnel' && mentalModelData.stages?.length) ||
            (mentalModelData.visualization_type === 'svg' && mentalModelData.svg_config);

          if (hasVisualization && onToggleVisualization) {
            const isVisualizationOn = visualizationToggles?.has(node.id) ?? false;
            return (
              <div className="border-t border-purple-primary/20 pt-4 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">Visualization</h4>
                    <p className="text-xs text-white/60">
                      Display {mentalModelData.visualization_type} visualization
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-secondary">{isVisualizationOn ? 'On' : 'Off'}</span>
                    <Switch
                      checked={isVisualizationOn}
                      onCheckedChange={(checked) => onToggleVisualization(node.id, checked)}
                    />
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()
      )}

      {/* Principle-specific fields (when viewing a principle directly) */}
      {node.node_type === 'principle' && (node as any).guidance && (
        <div>
          <h4 className="text-sm font-semibold text-white mb-2">Guidance</h4>
          <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
            {(node as any).guidance}
          </p>
        </div>
      )}

      {node.node_type === 'principle' && (node as any).examples && (
        <div>
          <h4 className="text-sm font-semibold text-white mb-2">Examples</h4>
          <ul className="space-y-1">
            {(node as any).examples.map((example: string, index: number) => (
              <li key={index} className="text-sm text-white/80">
                • {example}
              </li>
            ))}
          </ul>
        </div>
      )}

      {node.node_type === 'principle' && (node as any).related_principles && (
        <div>
          <h4 className="text-sm font-semibold text-white mb-2">Related Principles</h4>
          <ul className="space-y-1">
            {(node as any).related_principles.map((relatedId: string) => (
              <li key={relatedId}>
                <button
                  onClick={() => onNavigateToNode?.(relatedId)}
                  className="text-sm text-purple-accent hover:text-purple-light cursor-pointer hover:underline transition-colors"
                  data-testid="related-node-link"
                >
                  {relatedId}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Linked Principles (for any node type that has them) */}
      {/* Testing: Using CSS @theme colors (Tailwind v4 native approach) */}
      {node.node_type !== 'principle' && node.principles && node.principles.length > 0 && (
        <div className="border-t border-purple-primary/20 pt-4 mt-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-purple-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <h4 className="text-sm font-semibold text-text-primary">Guiding Principles</h4>
            <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-principle-badge-bg text-principle-badge-text">
              {node.principles.length}
            </span>
          </div>
          <div className="space-y-2">
            {Array.isArray(node.principles) && node.principles.map((principleId, index) => {
              // Principles are now always string IDs that reference principle nodes
              if (typeof principleId === 'string') {
                return (
                  <div
                    key={index}
                    className="group relative bg-principle-card-bg/20 border border-principle-card-border/40 rounded-lg p-3 hover:bg-principle-card-hover-bg/10 hover:border-principle-card-hover-border/60 transition-all duration-200 hover:shadow-md hover:shadow-principle-card-border/20"
                  >
                    <button
                      onClick={() => onNavigateToNode?.(principleId)}
                      className="w-full text-left"
                      data-testid="related-node-link"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-5 h-5 rounded-full bg-principle-badge-bg/30 flex items-center justify-center">
                            <span className="text-xs font-bold text-principle-badge-text">{index + 1}</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-principle-card-text group-hover:text-principle-card-hover-border transition-colors">
                            {principleId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </div>
                          <div className="text-xs text-text-secondary mt-0.5 font-mono opacity-70">
                            {principleId}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <svg className="w-4 h-4 text-principle-card-border/60 group-hover:text-principle-card-hover-border transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}


      {/* Linked Mental Models */}
      {node.linked_mental_models && node.linked_mental_models.length > 0 && (
        <div className="border-t border-purple-primary/20 pt-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-text-primary">Linked Mental Models</h4>
            {onToggleAllMentalModels && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary">Display All</span>
                <Switch
                  checked={allModelsToggledByThisNode}
                  onCheckedChange={(checked) => onToggleAllMentalModels(checked)}
                />
              </div>
            )}
          </div>

          <ul className="space-y-3">
            {node.linked_mental_models.map((modelId) => {
              // Check if THIS node has toggled this mental model ON
              const isToggledByThisNode = mentalModelToggles?.get(modelId)?.has(node.id) ?? false;
              return (
                <li key={modelId} className="flex items-center justify-between">
                  <button
                    onClick={() => onNavigateToNode?.(modelId)}
                    className="text-sm text-white/80 hover:text-purple-accent cursor-pointer hover:underline transition-colors"
                    data-testid="related-node-link"
                  >
                    {modelId}
                  </button>
                  {onToggleMentalModel && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-secondary">{isToggledByThisNode ? 'On' : 'Off'}</span>
                      <Switch
                        checked={isToggledByThisNode}
                        onCheckedChange={(checked) => onToggleMentalModel(node.id, modelId, checked)}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
