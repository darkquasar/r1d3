/**
 * ReactFlow Helpers
 *
 * Helper functions for working with ReactFlow in a native, optimized way.
 * Enables incremental updates instead of full node replacement, which
 * preserves object references for React.memo optimization.
 */

import type { Node } from 'reactflow';
import type { ReactFlowFrameworkNode } from '@/types/graph';
import type { FrameworkNode } from '@/types/framework';
import { createMentalModelEdge, createVisualizationEdge } from './edge-factory';
import type { NodeType } from './topology-config';

/**
 * Update ReactFlow nodes incrementally (preserves unchanged nodes)
 *
 * This is the ReactFlow-native pattern for updating nodes:
 * - Unchanged nodes: Same object reference (React.memo skips re-render)
 * - Changed nodes: New object with updated properties
 * - Removed nodes: Filtered out
 * - Added nodes: Appended
 *
 * @param currentNodes - Current nodes from ReactFlow state
 * @param visibleMentalModelIds - Mental models that should be visible
 * @param visibleVisualizationIds - Visualizations that should be visible
 * @param mentalModelPositions - Position map for mental models
 * @param visualizationPositions - Position map for visualizations
 * @param mentalModelNodes - Template nodes for mental models
 * @param allNodes - All framework nodes (for creating visualization nodes)
 * @returns Updated node array with minimal changes
 */
export function updateNodesIncremental(
  currentNodes: Node[],
  visibleMentalModelIds: Set<string>,
  visibleVisualizationIds: Set<string>,
  mentalModelPositions: Map<string, { x: number; y: number }>,
  visualizationPositions: Map<string, { x: number; y: number }>,
  mentalModelNodes: ReactFlowFrameworkNode[],
  allNodes: FrameworkNode[]
): Node[] {
  const result: Node[] = [];

  // Step 1: Preserve primary nodes (phases, sub-phases, components)
  // These never change, so keep same object reference
  const primaryNodeIds = new Set(['phase', 'sub-phase', 'sub-phase-component']);
  for (const node of currentNodes) {
    if (primaryNodeIds.has(node.type || '')) {
      result.push(node); // Same reference
    }
  }

  // Step 2: Handle mental models (add/update/remove)
  for (const modelId of visibleMentalModelIds) {
    const existingNode = currentNodes.find(n => n.id === modelId);
    const newPosition = mentalModelPositions.get(modelId);

    if (existingNode) {
      // Mental model already exists
      // Check if position changed
      if (
        newPosition &&
        (existingNode.position.x !== newPosition.x ||
          existingNode.position.y !== newPosition.y)
      ) {
        // Position changed - create new object
        result.push({
          ...existingNode,
          position: newPosition,
        });
      } else {
        // Unchanged - keep same reference
        result.push(existingNode);
      }
    } else {
      // New mental model - create node
      const template = mentalModelNodes.find(n => n.id === modelId);
      if (template && newPosition) {
        result.push({
          ...template,
          position: newPosition,
        });
      }
    }
  }

  // Step 3: Handle visualizations (add/update/remove)
  for (const modelId of visibleVisualizationIds) {
    const vizId = `viz-${modelId}`;
    const existingNode = currentNodes.find(n => n.id === vizId);
    const newPosition = visualizationPositions.get(vizId);

    if (existingNode) {
      // Visualization already exists
      // Check if position changed
      if (
        newPosition &&
        (existingNode.position.x !== newPosition.x ||
          existingNode.position.y !== newPosition.y)
      ) {
        // Position changed - create new object
        result.push({
          ...existingNode,
          position: newPosition,
        });
      } else {
        // Unchanged - keep same reference
        result.push(existingNode);
      }
    } else {
      // New visualization - create node
      const mentalModelData = allNodes.find(n => n.id === modelId);
      if (mentalModelData && mentalModelData.node_type === 'mental-model' && newPosition) {
        // Check if mental model has visualization capability
        const hasVisualization =
          (mentalModelData.visualization_type === 'heatmap' &&
            (mentalModelData as any).stages?.length) ||
          (mentalModelData.visualization_type === 'funnel' &&
            (mentalModelData as any).stages?.length) ||
          (mentalModelData.visualization_type === 'svg' &&
            (mentalModelData as any).svg_config);

        if (hasVisualization) {
          result.push({
            id: vizId,
            type: 'visualization',
            position: newPosition,
            data: {
              model: mentalModelData,
            },
            draggable: true,
          });
        }
      }
    }
  }

  return result;
}

/**
 * Helper: Get node type from node ID
 * Determines the topology node type based on ID pattern or lookup
 */
function getNodeType(nodeId: string, allNodes: FrameworkNode[]): NodeType {
  // Visualization nodes have viz- prefix
  if (nodeId.startsWith('viz-')) {
    return 'visualization';
  }

  // Look up in allNodes array
  const node = allNodes.find(n => n.id === nodeId);
  if (node) {
    return node.node_type as NodeType;
  }

  // Default fallback (shouldn't happen)
  console.warn(`[ReactFlow Helpers] Unknown node type for ${nodeId}`);
  return 'phase'; // Safe fallback
}

/**
 * Update ReactFlow edges incrementally (preserves unchanged edges)
 *
 * This follows the ReactFlow-native pattern for edge updates:
 * - Unchanged edges: Same object reference (optimization)
 * - Changed edges: New object with updated properties
 * - Removed edges: Filtered out
 * - Added edges: Appended
 *
 * Uses @jalez/react-flow-smart-edge for automatic obstacle avoidance
 * with geometry-based handle selection (ReactFlow's native approach).
 *
 * @param currentEdges - Current edges from ReactFlow state
 * @param originalEdges - Static edges from YAML (phases, sub-phases, etc.)
 * @param mentalModelToggles - Map of mental model visibility
 * @param visualizationToggles - Set of visualization visibility
 * @param visibleMentalModelIds - Mental models currently visible
 * @param visibleVisualizationIds - Visualizations currently visible
 * @param nodePositions - Current node positions for handle selection
 * @param allNodes - All framework nodes (for node type lookup)
 * @returns Updated edge array with minimal changes
 */
export function updateEdgesIncremental(
  currentEdges: any[],
  originalEdges: any[],
  mentalModelToggles: Map<string, Set<string>>,
  visualizationToggles: Set<string>,
  visibleMentalModelIds: Set<string>,
  visibleVisualizationIds: Set<string>,
  nodePositions: Map<string, { x: number; y: number }>,
  allNodes: FrameworkNode[]
): any[] {
  const result: any[] = [];

  // Step 1: Preserve original edges (YAML-based phase edges)
  // These never change based on toggles, so keep same object reference
  const originalEdgeIds = new Set(originalEdges.map(e => e.id));
  for (const edge of currentEdges) {
    if (originalEdgeIds.has(edge.id)) {
      result.push(edge); // Same reference
    }
  }

  // Step 2: Handle mental model edges (add/update/remove based on toggles)
  mentalModelToggles.forEach((toggledByNodes, modelId) => {
    if (visibleMentalModelIds.has(modelId)) {
      toggledByNodes.forEach(nodeId => {
        const edgeId = `mental-${nodeId}-${modelId}`;
        const existingEdge = currentEdges.find(e => e.id === edgeId);

        if (existingEdge) {
          // Edge exists - keep same reference (smart edge handles routing)
          result.push(existingEdge);
        } else {
          // New edge - use edge factory with ontology validation
          const sourceType = getNodeType(nodeId, allNodes);
          const newEdge = createMentalModelEdge(
            nodeId,
            sourceType as 'phase' | 'sub-phase' | 'sub-phase-component',
            modelId,
            nodePositions
          );

          if (newEdge) {
            result.push(newEdge);
          } else {
            console.warn(
              `[ReactFlow Helpers] Failed to create mental model edge: ${nodeId} (${sourceType}) → ${modelId}`
            );
          }
        }
      });
    }
  });

  // Step 3: Handle visualization edges
  visibleVisualizationIds.forEach(modelId => {
    const edgeId = `mental-viz-${modelId}`;
    const existingEdge = currentEdges.find(e => e.id === edgeId);

    if (existingEdge) {
      // Edge exists - keep same reference (smart edge handles routing)
      result.push(existingEdge);
    } else {
      // New visualization edge - use edge factory with ontology validation
      const vizId = `viz-${modelId}`;
      const newEdge = createVisualizationEdge(modelId, vizId, nodePositions);

      if (newEdge) {
        result.push(newEdge);
      } else {
        console.warn(
          `[ReactFlow Helpers] Failed to create visualization edge: ${modelId} → ${vizId}`
        );
      }
    }
  });

  return result;
}

/**
 * Check if two positions are equal (helper)
 */
function positionsEqual(
  pos1: { x: number; y: number },
  pos2: { x: number; y: number }
): boolean {
  return pos1.x === pos2.x && pos1.y === pos2.y;
}

/**
 * Get position updates for nodes (useful for detecting changes)
 *
 * @param oldNodes - Previous node array
 * @param newNodes - New node array
 * @returns Map of node IDs to position changes
 */
export function getPositionUpdates(
  oldNodes: Node[],
  newNodes: Node[]
): Map<string, { from: { x: number; y: number }; to: { x: number; y: number } }> {
  const updates = new Map();

  for (const newNode of newNodes) {
    const oldNode = oldNodes.find(n => n.id === newNode.id);
    if (oldNode && !positionsEqual(oldNode.position, newNode.position)) {
      updates.set(newNode.id, {
        from: oldNode.position,
        to: newNode.position,
      });
    }
  }

  return updates;
}
