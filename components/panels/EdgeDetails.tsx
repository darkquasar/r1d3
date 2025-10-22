/**
 * EdgeDetails Component
 *
 * Displays detailed information about a framework edge/relationship
 */

'use client';

import type { Edge } from '@/types/framework';

interface EdgeDetailsProps {
  edge: Edge;
  onNavigateToNode?: (nodeId: string) => void;
}

/**
 * Renders edge relationship details
 */
export default function EdgeDetails({ edge, onNavigateToNode }: EdgeDetailsProps) {
  return (
    <div className="space-y-4">
      {/* Edge Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-1 text-xs font-medium rounded bg-purple-primary/20 text-purple-accent">
            {edge.relationship_type}
          </span>
          {edge.bidirectional && (
            <span className="px-2 py-1 text-xs font-medium rounded bg-purple-light/20 text-purple-light">
              Bidirectional
            </span>
          )}
        </div>
        <h3 className="text-xl font-bold text-white">Relationship</h3>
        <p className="text-sm text-white/70 mt-1">{edge.id}</p>
      </div>

      {/* Connection Info */}
      <div>
        <h4 className="text-sm font-semibold text-white mb-2">Connection</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/70">From:</span>
            <button
              onClick={() => onNavigateToNode?.(edge.from_node)}
              className="text-sm text-purple-accent hover:text-purple-light cursor-pointer hover:underline transition-colors"
              data-testid="related-node-link"
            >
              {edge.from_node}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/70">To:</span>
            <button
              onClick={() => onNavigateToNode?.(edge.to_node)}
              className="text-sm text-purple-accent hover:text-purple-light cursor-pointer hover:underline transition-colors"
              data-testid="related-node-link"
            >
              {edge.to_node}
            </button>
          </div>
        </div>
      </div>

      {/* Description */}
      {edge.description && (
        <div>
          <h4 className="text-sm font-semibold text-white mb-2">Description</h4>
          <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
            {edge.description}
          </p>
        </div>
      )}
    </div>
  );
}
