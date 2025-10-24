/**
 * Topology Manager
 *
 * Provides validation and query functions for the graph topology.
 * Uses the topology configuration to enforce rules about node visibility,
 * edge validity, position recalculation, and cascade deletions.
 */

import {
  TOPOLOGY_CONFIG,
  type NodeType,
  type EdgeType,
  type PositionTrigger,
} from './topology-config';

export interface GraphEdge {
  from: string;
  to: string;
  type: EdgeType;
}

export interface GraphNode {
  id: string;
  type: NodeType;
}

export type PositionEvent =
  | { type: 'edge-added'; edgeId: string }
  | { type: 'edge-removed'; edgeId: string }
  | { type: 'parent-moved'; parentId: string }
  | { type: 'user-dragged' };

export class TopologyManager {
  /**
   * Check if a node should be visible based on dependency rules
   *
   * @param nodeId - ID of the node to check
   * @param nodeType - Type of the node
   * @param edges - All edges in the graph
   * @param visibleNodes - Set of node IDs that are currently visible
   * @returns true if node meets all dependency requirements
   */
  static shouldNodeBeVisible(
    nodeId: string,
    nodeType: NodeType,
    edges: GraphEdge[],
    visibleNodes: Set<string>
  ): boolean {
    const config = TOPOLOGY_CONFIG[nodeType];

    // If no required parents, node can always be visible
    if (!config.dependencies.requiredParents?.length) {
      return true;
    }

    // Check each dependency requirement
    for (const requirement of config.dependencies.requiredParents) {
      // Find edges that connect parents to this node
      const parentEdges = edges.filter(
        (e) =>
          e.to === nodeId &&
          requirement.relationships.includes(e.type)
      );

      if (parentEdges.length === 0) {
        // No parent edges exist - node cannot be visible
        return false;
      }

      if (requirement.mode === 'any') {
        // At least ONE parent must be visible
        const hasVisibleParent = parentEdges.some((e) =>
          visibleNodes.has(e.from)
        );
        if (!hasVisibleParent) {
          return false;
        }
      } else {
        // ALL parents must be visible
        const allParentsVisible = parentEdges.every((e) =>
          visibleNodes.has(e.from)
        );
        if (!allParentsVisible) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Get nodes that should be cascade-deleted when a node is removed
   *
   * @param nodeId - ID of the node being removed
   * @param nodeType - Type of the node being removed
   * @param edges - All edges in the graph
   * @returns Array of node IDs that should be removed
   */
  static getCascadeDeleteNodes(
    nodeId: string,
    nodeType: NodeType,
    edges: GraphEdge[]
  ): string[] {
    const config = TOPOLOGY_CONFIG[nodeType];
    const toDelete: string[] = [];

    if (!config.dependencies.cascadeDelete?.length) {
      return toDelete;
    }

    for (const cascadeRule of config.dependencies.cascadeDelete) {
      // Find edges that match the cascade rule
      const dependentEdges = edges.filter(
        (e) => e.from === nodeId && e.type === cascadeRule.relationship
      );

      toDelete.push(...dependentEdges.map((e) => e.to));
    }

    return toDelete;
  }

  /**
   * Determine if a node's position should be recalculated based on an event
   *
   * @param nodeId - ID of the node
   * @param nodeType - Type of the node
   * @param event - Event that occurred
   * @param userDraggedNodes - Set of nodes that have been manually dragged
   * @returns true if position should be recalculated
   */
  static shouldRecalculatePosition(
    nodeId: string,
    nodeType: NodeType,
    event: PositionEvent,
    userDraggedNodes: Set<string>
  ): boolean {
    const config = TOPOLOGY_CONFIG[nodeType];

    // If node is not physics-controlled, never recalculate
    if (!config.physicsControlled) {
      return false;
    }

    // If user dragged this node and we preserve user positions, don't recalculate
    if (
      userDraggedNodes.has(nodeId) &&
      config.positioning.preserveUserPosition
    ) {
      return false;
    }

    // Map event type to trigger type
    let trigger: PositionTrigger;
    switch (event.type) {
      case 'edge-added':
        trigger = 'on-edge-added';
        break;
      case 'edge-removed':
        trigger = 'on-edge-removed';
        break;
      case 'parent-moved':
        trigger = 'on-parent-moved';
        break;
      case 'user-dragged':
        return false; // Never recalculate on user drag
      default:
        return false;
    }

    // Check if this trigger should cause recalculation
    return config.positioning.recalculateTriggers.includes(trigger);
  }

  /**
   * Get all nodes that need position recalculation when edges change
   *
   * @param changedEdges - Edges that were added or removed
   * @param allNodes - All nodes in the graph
   * @param allEdges - All edges in the graph (after changes)
   * @param userDraggedNodes - Set of nodes that have been manually dragged
   * @returns Set of node IDs that need position recalculation
   */
  static getNodesRequiringRecalculation(
    changedEdges: GraphEdge[],
    allNodes: GraphNode[],
    allEdges: GraphEdge[],
    userDraggedNodes: Set<string>
  ): Set<string> {
    const nodesToRecalculate = new Set<string>();

    for (const edge of changedEdges) {
      const edgeId = `${edge.from}-${edge.to}`;

      // Check source node (e.g., phase that toggled mental model)
      const sourceNode = allNodes.find((n) => n.id === edge.from);
      if (
        sourceNode &&
        this.shouldRecalculatePosition(
          edge.from,
          sourceNode.type,
          { type: 'edge-added', edgeId },
          userDraggedNodes
        )
      ) {
        nodesToRecalculate.add(edge.from);
      }

      // Check target node (e.g., mental model being toggled)
      const targetNode = allNodes.find((n) => n.id === edge.to);
      if (
        targetNode &&
        this.shouldRecalculatePosition(
          edge.to,
          targetNode.type,
          { type: 'edge-added', edgeId },
          userDraggedNodes
        )
      ) {
        nodesToRecalculate.add(edge.to);
      }

      // Cascade to dependent nodes (e.g., visualization depends on mental model)
      const dependentEdges = allEdges.filter((e) => e.from === edge.to);
      for (const depEdge of dependentEdges) {
        const depNode = allNodes.find((n) => n.id === depEdge.to);
        if (
          depNode &&
          this.shouldRecalculatePosition(
            depEdge.to,
            depNode.type,
            { type: 'parent-moved', parentId: edge.to },
            userDraggedNodes
          )
        ) {
          nodesToRecalculate.add(depEdge.to);
        }
      }
    }

    return nodesToRecalculate;
  }

  /**
   * Validate if an edge is allowed by topology rules
   *
   * @param fromNodeType - Type of the source node
   * @param toNodeType - Type of the target node
   * @param edgeType - Type of the edge
   * @returns true if edge is allowed by topology configuration
   */
  static isEdgeAllowed(
    fromNodeType: NodeType,
    toNodeType: NodeType,
    edgeType: EdgeType
  ): boolean {
    const config = TOPOLOGY_CONFIG[fromNodeType];
    return config.allowedTargets.some(
      (target) =>
        target.edgeType === edgeType && target.targetType === toNodeType
    );
  }

  /**
   * Get all edges that should be removed when a node is removed
   * (both incoming and outgoing edges, plus cascade deletions)
   *
   * @param nodeId - ID of the node being removed
   * @param nodeType - Type of the node being removed
   * @param allEdges - All edges in the graph
   * @returns Array of edge IDs to remove
   */
  static getEdgesToRemoveWithNode(
    nodeId: string,
    nodeType: NodeType,
    allEdges: GraphEdge[]
  ): string[] {
    const edgeIdsToRemove: string[] = [];

    // Remove all edges connected to this node
    allEdges.forEach((edge, index) => {
      if (edge.from === nodeId || edge.to === nodeId) {
        edgeIdsToRemove.push(`${index}`); // Use index as edge ID
      }
    });

    return edgeIdsToRemove;
  }

  /**
   * Build a complete dependency map for all nodes
   * Shows which nodes depend on which other nodes
   *
   * @param allNodes - All nodes in the graph
   * @param allEdges - All edges in the graph
   * @returns Map of node ID to set of dependent node IDs
   */
  static buildDependencyMap(
    allNodes: GraphNode[],
    allEdges: GraphEdge[]
  ): Map<string, Set<string>> {
    const dependencyMap = new Map<string, Set<string>>();

    allNodes.forEach((node) => {
      const config = TOPOLOGY_CONFIG[node.type];
      const dependents = new Set<string>();

      // Find all nodes that depend on this node
      if (config.dependencies.cascadeDelete?.length) {
        for (const cascadeRule of config.dependencies.cascadeDelete) {
          const dependentEdges = allEdges.filter(
            (e) => e.from === node.id && e.type === cascadeRule.relationship
          );

          dependentEdges.forEach((e) => dependents.add(e.to));
        }
      }

      dependencyMap.set(node.id, dependents);
    });

    return dependencyMap;
  }
}
