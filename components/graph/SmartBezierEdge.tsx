/**
 * SmartBezierEdge Component
 *
 * Custom bezier edge using @jalez/react-flow-smart-edge for intelligent routing.
 * Uses A* pathfinding to route edges around nodes with smooth bezier curves.
 * Used for visualization edges (mental model → visualization).
 */

'use client';

import { memo } from 'react';
import { BaseEdge, getBezierPath, type EdgeProps } from 'reactflow';
import { useNodes } from 'reactflow';
import { getSmartEdge } from '@jalez/react-flow-smart-edge';

function SmartBezierEdgeComponent(props: EdgeProps) {
  const {
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

  // Fallback to standard bezier if no smart path found
  if (getSmartEdgeResponse === null) {
    const [edgePath] = getBezierPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
    });
    return <BaseEdge path={edgePath} {...props} />;
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

export default memo(SmartBezierEdgeComponent);
