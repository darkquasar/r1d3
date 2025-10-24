/**
 * SmoothStepEdge Component (Rounded Elbow Routing)
 *
 * Renders edges with smooth 90-degree elbow bends for mental model and visualization connections.
 * Uses borderRadius: 12 for rounded corners on the elbow bends.
 */

'use client';

import { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from 'reactflow';
import { getEdgeColor } from '@/lib/theme';

/**
 * Smooth step edge component with rounded elbow bends
 */
function SmoothStepEdge({
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
  // Use smooth step path with rounded corners
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 12, // Rounded corners on 90-degree bends
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

export default memo(SmoothStepEdge);
