/**
 * StraightEdge Component (Step/Elbow Routing)
 *
 * Renders edges with 90-degree elbow bends for mental model connections
 * Force-directed layout handles node spacing, so no obstacle avoidance needed
 */

'use client';

import { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from 'reactflow';
import { getEdgeColor } from '@/lib/theme';

/**
 * Step edge component with elbow bends for mental model connections
 */
function StraightEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  data,
  markerEnd,
}: EdgeProps) {
  // Use smooth step path with sharp 90-degree corners
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 0, // Sharp 90-degree corners (no rounding)
  });

  const relationshipType = data?.relationship_type || 'linked-to';
  const strokeColor = getEdgeColor(relationshipType);

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: strokeColor,
          strokeWidth: 2,
        }}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="
              px-2 py-1 rounded text-xs font-medium
              bg-background-secondary/90 text-white/80
              border border-purple-primary/30
              backdrop-blur-sm
            "
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default memo(StraightEdge);
