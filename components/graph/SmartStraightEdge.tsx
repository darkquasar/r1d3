/**
 * SmartStraightEdge Component
 *
 * Custom edge component using @jalez/react-flow-smart-edge for intelligent routing.
 * Uses A* pathfinding to route edges around nodes, preventing intersections.
 */

'use client';

import { memo } from 'react';
import { BaseEdge, type EdgeProps } from 'reactflow';
import { useNodes } from 'reactflow';
import { getSmartEdge, svgDrawStraightLinePath } from '@jalez/react-flow-smart-edge';

function SmartStraightEdgeComponent(props: EdgeProps) {
  const {
    id,
    sourcePosition,
    targetPosition,
    sourceX,
    sourceY,
    targetX,
    targetY,
    style,
    markerEnd,
    markerStart,
  } = props;

  const nodes = useNodes();

  const getSmartEdgeResponse = getSmartEdge({
    sourcePosition,
    targetPosition,
    sourceX,
    sourceY,
    targetX,
    targetY,
    nodes: nodes as any, // Type cast needed due to ReactFlow/smart-edge type mismatch
  });

  // Fallback to straight line if no smart path found
  if (getSmartEdgeResponse === null) {
    return <BaseEdge path={`M ${sourceX},${sourceY} L ${targetX},${targetY}`} {...props} />;
  }

  const { svgPathString } = getSmartEdgeResponse;

  return (
    <BaseEdge
      path={svgPathString}
      style={style}
      markerEnd={markerEnd}
      markerStart={markerStart}
      {...props}
    />
  );
}

export default memo(SmartStraightEdgeComponent);
