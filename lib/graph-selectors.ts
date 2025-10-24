/**
 * Graph Selectors
 *
 * Pure selector functions that determine which nodes and edges should render
 * based on toggle state. These functions implement declarative logic for
 * toggle-based visibility.
 *
 * Architecture: Selector-based approach for predictable, testable rendering
 */

import type { Node, Edge } from 'reactflow';
import type { ReactFlowFrameworkNode } from '@/types/graph';
import type { FrameworkNode } from '@/types/framework';
import { calculateVisualizationPosition } from './layout-algorithms';
import { createMentalModelEdge, createVisualizationEdge } from './edge-factory';
import type { NodeType } from './topology-config';

/**
 * Selects mental model IDs that should be visible
 * A mental model is visible if at least one node has toggled it ON
 *
 * @param mentalModelToggles - Map of mental model ID to set of nodes that toggled it ON
 * @returns Set of mental model IDs that have at least one toggle ON
 */
export function selectVisibleMentalModelIds(
  mentalModelToggles: Map<string, Set<string>>
): Set<string> {
  const visibleIds = new Set<string>();

  mentalModelToggles.forEach((toggledByNodes, modelId) => {
    if (toggledByNodes.size > 0) {
      visibleIds.add(modelId);
    }
  });

  return visibleIds;
}

/**
 * Selects visualization IDs that should be visible
 * A visualization is visible ONLY if:
 * 1. Its toggle is ON (in visualizationToggles), AND
 * 2. Its parent mental model is visible
 *
 * @param visualizationToggles - Set of mental model IDs whose visualizations are toggled ON
 * @param visibleMentalModelIds - Set of mental model IDs that are currently visible
 * @returns Set of visualization IDs that should render
 */
export function selectVisibleVisualizationIds(
  visualizationToggles: Set<string>,
  visibleMentalModelIds: Set<string>
): Set<string> {
  const visibleVizIds = new Set<string>();

  visualizationToggles.forEach(modelId => {
    // Only include if parent mental model is visible
    if (visibleMentalModelIds.has(modelId)) {
      visibleVizIds.add(modelId);
    }
  });

  return visibleVizIds;
}

/**
 * Selects all nodes that should be rendered on the canvas
 * Includes:
 * - All primary nodes (phases, sub-phases, components) - always visible
 * - Mental models whose IDs are in visibleMentalModelIds
 * - Visualizations whose IDs are in visibleVisualizationIds
 *
 * @param primaryNodes - Phase, sub-phase, component nodes (always rendered)
 * @param mentalModelNodes - All mental model nodes
 * @param visibleMentalModelIds - Mental models that should be visible
 * @param visibleVisualizationIds - Visualizations that should be visible
 * @param mentalModelPositions - Calculated positions for mental models
 * @param visualizationPositions - Calculated positions for visualizations
 * @param allNodes - All framework nodes (for accessing mental model data)
 * @returns Array of ReactFlow nodes to render
 */
export function selectNodesToRender(
  primaryNodes: Node[],
  mentalModelNodes: ReactFlowFrameworkNode[],
  visibleMentalModelIds: Set<string>,
  visibleVisualizationIds: Set<string>,
  mentalModelPositions: Map<string, { x: number; y: number }>,
  visualizationPositions: Map<string, { x: number; y: number }>,
  allNodes: FrameworkNode[]
): Node[] {
  const nodesToRender: Node[] = [];

  // Always include primary nodes
  nodesToRender.push(...primaryNodes);

  // Include mental models that are visible
  mentalModelNodes.forEach(mmNode => {
    if (visibleMentalModelIds.has(mmNode.id)) {
      const position = mentalModelPositions.get(mmNode.id) || mmNode.position;
      nodesToRender.push({
        ...mmNode,
        position,
      });
    }
  });

  // Include visualizations ONLY if their ID is in visibleVisualizationIds
  visibleVisualizationIds.forEach(modelId => {
    const mentalModelData = allNodes.find(n => n.id === modelId);
    if (!mentalModelData || mentalModelData.node_type !== 'mental-model') return;

    // Check if mental model has visualization capability
    const hasVisualization =
      (mentalModelData.visualization_type === 'heatmap' && mentalModelData.stages?.length) ||
      (mentalModelData.visualization_type === 'funnel' && mentalModelData.stages?.length) ||
      (mentalModelData.visualization_type === 'svg' && mentalModelData.svg_config);

    if (hasVisualization) {
      const vizId = `viz-${modelId}`;
      const position = visualizationPositions.get(vizId) || { x: 0, y: 0 };

      nodesToRender.push({
        id: vizId,
        type: 'visualization',
        position,
        data: {
          model: mentalModelData,
        },
        draggable: true,
      });
    }
  });

  return nodesToRender;
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
  console.warn(`[Graph Selectors] Unknown node type for ${nodeId}`);
  return 'phase'; // Safe fallback
}

/**
 * Selects all edges that should be rendered
 * Creates edges based on current toggle state:
 * - Mental model edges: From ALL nodes that have toggled a mental model ON
 * - Visualization edges: ONLY for mental models whose visualization is toggled ON
 *
 * @param mentalModelToggles - Map of mental model ID to nodes that toggled it ON
 * @param visualizationToggles - Set of mental model IDs whose visualizations are ON
 * @param visibleMentalModelIds - Mental models currently visible
 * @param visibleVisualizationIds - Visualizations currently visible
 * @param nodePositions - Current node positions for handle selection
 * @param allNodes - All framework nodes (for node type lookup)
 * @returns Array of ReactFlow edges to render
 */
export function selectEdgesToRender(
  mentalModelToggles: Map<string, Set<string>>,
  visualizationToggles: Set<string>,
  visibleMentalModelIds: Set<string>,
  visibleVisualizationIds: Set<string>,
  nodePositions: Map<string, { x: number; y: number }>,
  allNodes: FrameworkNode[]
): Edge[] {
  const edgesToRender: Edge[] = [];

  // Mental model edges: From ALL nodes that toggled it ON
  mentalModelToggles.forEach((toggledByNodes, modelId) => {
    if (visibleMentalModelIds.has(modelId)) {
      toggledByNodes.forEach(nodeId => {
        // Use edge factory with ontology validation
        const sourceType = getNodeType(nodeId, allNodes);
        const newEdge = createMentalModelEdge(
          nodeId,
          sourceType as 'phase' | 'sub-phase' | 'sub-phase-component',
          modelId,
          nodePositions
        );

        if (newEdge) {
          edgesToRender.push(newEdge);
        } else {
          console.warn(
            `[Graph Selectors] Failed to create mental model edge: ${nodeId} (${sourceType}) → ${modelId}`
          );
        }
      });
    }
  });

  // Visualization edges: ONLY for visualizations toggled ON
  visibleVisualizationIds.forEach(modelId => {
    const vizId = `viz-${modelId}`;
    const newEdge = createVisualizationEdge(modelId, vizId, nodePositions);

    if (newEdge) {
      edgesToRender.push(newEdge);
    } else {
      console.warn(
        `[Graph Selectors] Failed to create visualization edge: ${modelId} → ${vizId}`
      );
    }
  });

  return edgesToRender;
}
