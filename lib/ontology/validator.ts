/**
 * Ontology validation - ensures nodes and edges conform to ontology types
 */

import type { FlowNode, FlowEdge } from '@/types/yaml-schema';
import type { Ontology, OntologyNodeType, OntologyEdgeType } from '@/types/ontology';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate that a node conforms to its type definition in the ontology
 */
export function validateNodeType(node: FlowNode, ontology: Ontology): ValidationResult {
  const errors: string[] = [];

  // Check if node type exists in ontology
  const nodeType = ontology.nodeTypes.find(t => t.id === node.type);

  if (!nodeType) {
    errors.push(`Node type "${node.type}" not found in ontology`);
    return { valid: false, errors };
  }

  // Validate required properties
  for (const prop of nodeType.properties.filter(p => p.required)) {
    if (!(prop.name in node.properties)) {
      errors.push(`Required property "${prop.name}" missing from node "${node.id}"`);
    }
  }

  // TODO: Add property type validation (string, number, boolean, etc.)

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate that an edge conforms to its type definition in the ontology
 */
export function validateEdgeType(
  edge: FlowEdge,
  sourceNode: FlowNode,
  targetNode: FlowNode,
  ontology: Ontology
): ValidationResult {
  const errors: string[] = [];

  // Check if edge type exists in ontology
  const edgeType = ontology.edgeTypes.find(t => t.id === edge.type);

  if (!edgeType) {
    errors.push(`Edge type "${edge.type}" not found in ontology`);
    return { valid: false, errors };
  }

  // Validate source node type
  if (!edgeType.sourceTypes.includes(sourceNode.type)) {
    errors.push(
      `Edge "${edge.id}" has invalid source type "${sourceNode.type}". ` +
      `Expected one of: ${edgeType.sourceTypes.join(', ')}`
    );
  }

  // Validate target node type
  if (!edgeType.targetTypes.includes(targetNode.type)) {
    errors.push(
      `Edge "${edge.id}" has invalid target type "${targetNode.type}". ` +
      `Expected one of: ${edgeType.targetTypes.join(', ')}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate all nodes in a flow against the ontology
 */
export function validateFlowNodes(nodes: FlowNode[], ontology: Ontology): ValidationResult {
  const errors: string[] = [];

  for (const node of nodes) {
    const result = validateNodeType(node, ontology);
    if (!result.valid) {
      errors.push(...result.errors);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate all edges in a flow against the ontology
 */
export function validateFlowEdges(
  edges: FlowEdge[],
  nodes: FlowNode[],
  ontology: Ontology
): ValidationResult {
  const errors: string[] = [];

  // Create node lookup map
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  for (const edge of edges) {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);

    if (!sourceNode) {
      errors.push(`Edge "${edge.id}" references non-existent source node "${edge.source}"`);
      continue;
    }

    if (!targetNode) {
      errors.push(`Edge "${edge.id}" references non-existent target node "${edge.target}"`);
      continue;
    }

    const result = validateEdgeType(edge, sourceNode, targetNode, ontology);
    if (!result.valid) {
      errors.push(...result.errors);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
