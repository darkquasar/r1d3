/**
 * Edge Factory
 *
 * Creates ReactFlow edges with:
 * - Ontology validation (ensures relationships are allowed per topology.yaml)
 * - Style loading from topology config
 * - Geometry-based handle selection
 *
 * This is the SINGLE source of truth for edge creation.
 */

import type { Edge } from 'reactflow';
import {
  getNodeTypeConfig,
  getEdgeTypeConfig,
  type NodeType,
  type EdgeType,
} from './topology-config';

/**
 * Select handles based on simple geometry (ReactFlow's native approach)
 * Uses the relative position of target from source to pick optimal handles
 */
function selectHandlesByGeometry(
  sourcePos: { x: number; y: number },
  targetPos: { x: number; y: number }
): { sourceHandle: string; targetHandle: string } {
  const dx = targetPos.x - sourcePos.x;
  const dy = targetPos.y - sourcePos.y;

  // Use absolute values to determine primary direction
  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal movement is primary
    if (dx > 0) {
      // Target is to the right
      return { sourceHandle: 'right-source', targetHandle: 'left' };
    } else {
      // Target is to the left
      return { sourceHandle: 'left-source', targetHandle: 'right' };
    }
  } else {
    // Vertical movement is primary
    if (dy > 0) {
      // Target is below
      return { sourceHandle: 'bottom', targetHandle: 'top' };
    } else {
      // Target is above
      return { sourceHandle: 'top-source', targetHandle: 'bottom-target' };
    }
  }
}

/**
 * Validate that a relationship is allowed per topology configuration
 *
 * @returns EdgeType if allowed, null otherwise
 */
function validateRelationship(
  sourceType: NodeType,
  targetType: NodeType
): EdgeType | null {
  const sourceConfig = getNodeTypeConfig(sourceType);

  // Find if source can connect to target
  const allowedEdge = sourceConfig.allowedTargets.find(
    (t) => t.targetType === targetType
  );

  if (!allowedEdge) {
    console.warn(
      `[Edge Factory] Invalid relationship: ${sourceType} → ${targetType} not allowed per topology`
    );
    return null;
  }

  return allowedEdge.edgeType;
}

/**
 * Map edge type to ReactFlow edge component type
 * First checks if edge config has edgeComponent specified in YAML,
 * otherwise falls back to hardcoded mapping
 */
function getReactFlowEdgeType(edgeType: EdgeType): string {
  // Check if edge config has edgeComponent specified
  const edgeConfig = getEdgeTypeConfig(edgeType);
  if (edgeConfig.edgeComponent) {
    return edgeConfig.edgeComponent; // Use component from YAML config
  }

  // Fallback to hardcoded mapping (for backward compatibility)
  const mapping: Record<EdgeType, string> = {
    'contains': 'default',
    'precedes': 'default',
    'linked-to': 'straight',      // Smart straight edge (if not in YAML)
    'visualizes': 'smartBezier',  // Smart bezier edge (if not in YAML)
    'uses': 'straight',
  };
  return mapping[edgeType] || 'default';
}

/**
 * Create a validated, styled ReactFlow edge
 *
 * @param source - Source node ID
 * @param target - Target node ID
 * @param sourceType - Source node type (for validation)
 * @param targetType - Target node type (for validation)
 * @param nodePositions - Map of node IDs to positions (for handle selection)
 * @param options - Optional overrides (animated, custom ID, etc.)
 * @returns Configured Edge or null if relationship is invalid
 */
export function createEdge(
  source: string,
  target: string,
  sourceType: NodeType,
  targetType: NodeType,
  nodePositions: Map<string, { x: number; y: number }>,
  options?: {
    customId?: string;
    animated?: boolean;
  }
): Edge | null {
  // Step 1: Validate relationship is allowed per ontology
  const edgeType = validateRelationship(sourceType, targetType);
  if (!edgeType) {
    return null; // Invalid relationship
  }

  // Step 2: Get edge configuration from topology
  const edgeConfig = getEdgeTypeConfig(edgeType);

  // Step 3: Select handles based on geometry
  const sourcePos = nodePositions.get(source);
  const targetPos = nodePositions.get(target);
  const handles =
    sourcePos && targetPos
      ? selectHandlesByGeometry(sourcePos, targetPos)
      : { sourceHandle: 'right-source', targetHandle: 'left' }; // Default fallback

  // Step 4: Build edge ID
  const edgeId = options?.customId || `${edgeType}-${source}-${target}`;

  // Step 5: Return fully configured edge
  return {
    id: edgeId,
    source,
    target,
    sourceHandle: handles.sourceHandle,
    targetHandle: handles.targetHandle,
    type: getReactFlowEdgeType(edgeType),
    label: edgeConfig.displayName,
    animated: options?.animated ?? edgeConfig.style.animated,
    style: {
      stroke: edgeConfig.style.stroke,
      strokeWidth: edgeConfig.style.strokeWidth,
      ...(edgeConfig.style.strokeDasharray && {
        strokeDasharray: edgeConfig.style.strokeDasharray,
      }),
    },
  };
}

/**
 * Create a mental model edge (phase/component → mental-model)
 * Convenience wrapper around createEdge with correct types
 */
export function createMentalModelEdge(
  sourceId: string,
  sourceType: 'phase' | 'sub-phase' | 'sub-phase-component',
  modelId: string,
  nodePositions: Map<string, { x: number; y: number }>
): Edge | null {
  return createEdge(
    sourceId,
    modelId,
    sourceType,
    'mental-model',
    nodePositions,
    {
      customId: `mental-${sourceId}-${modelId}`,
      animated: true, // Mental model edges are always animated
    }
  );
}

/**
 * Create a visualization edge (mental-model → visualization)
 * Convenience wrapper around createEdge with correct types
 */
export function createVisualizationEdge(
  modelId: string,
  vizId: string,
  nodePositions: Map<string, { x: number; y: number }>
): Edge | null {
  return createEdge(
    modelId,
    vizId,
    'mental-model',
    'visualization',
    nodePositions,
    {
      customId: `mental-viz-${modelId}`,
      animated: false, // Visualization edges are not animated
    }
  );
}
