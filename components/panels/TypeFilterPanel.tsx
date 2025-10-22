/**
 * TypeFilterPanel Component
 *
 * Controls visibility of different node types in the graph
 */

'use client';

import { Switch } from '@/components/ui/switch';
import { NODE_TYPE_CONFIG, type NodeType } from '@/lib/node-type-config';
import NodeTypeIcon from '@/components/graph/NodeTypeIcon';
import { Info } from 'lucide-react';

interface TypeFilterPanelProps {
  visibleTypes: Set<NodeType>;
  onToggleType: (nodeType: NodeType) => void;
  onShowOntologyInfo?: () => void;
}

// Node types that can be toggled in the canvas
// Excludes: principle, output, outcome, impact (these appear in detail panels only)
const ALL_NODE_TYPES: NodeType[] = [
  'phase',
  'sub-phase',
  'sub-phase-component',
  'mental-model',
];

/**
 * Panel for filtering node types and showing ontology information
 */
export default function TypeFilterPanel({
  visibleTypes,
  onToggleType,
  onShowOntologyInfo,
}: TypeFilterPanelProps) {
  // Prevent clicks inside the panel from propagating to the canvas
  const handlePanelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      data-type-filter-panel="true"
      className="fixed top-20 left-4 bg-background-secondary border border-purple-primary/30 rounded-lg shadow-lg p-4 w-72 z-[100] pointer-events-auto"
      onClick={handlePanelClick}
      onMouseDown={handlePanelClick}
      onPointerDown={handlePanelClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">Filter by Type</h3>
        {onShowOntologyInfo && (
          <button
            onClick={onShowOntologyInfo}
            className="flex items-center gap-1 text-xs text-purple-accent hover:text-purple-light transition-colors"
            title="Show ontology information"
          >
            <Info size={14} />
            <span>Ontology</span>
          </button>
        )}
      </div>

      {/* Type toggles */}
      <div className="space-y-3">
        {ALL_NODE_TYPES.map((nodeType) => {
          const config = NODE_TYPE_CONFIG[nodeType];
          const isVisible = visibleTypes.has(nodeType);

          return (
            <div key={nodeType} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <NodeTypeIcon nodeType={nodeType} size={16} className="flex-shrink-0" />
                <span className="text-sm text-text-primary">{config.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary">{isVisible ? 'On' : 'Off'}</span>
                <Switch
                  checked={isVisible}
                  onCheckedChange={() => onToggleType(nodeType)}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="mt-4 pt-3 border-t border-purple-primary/20">
        <p className="text-xs text-text-secondary">
          Click canvas to close this panel
        </p>
      </div>
    </div>
  );
}
