/**
 * TypeScript types for ontology meta-model
 * These define the types that nodes and edges can be instances of
 */

export interface OntologyNodeType {
  id: string;
  name: string;
  description: string;
  parent?: string; // References OntologyNodeType.id for hierarchy
  properties: NodeProperty[];
  layout: NodeLayoutDefaults;
}

export interface NodeProperty {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  default?: unknown;
}

export interface NodeLayoutDefaults {
  algorithm: 'force-directed' | 'hierarchical' | 'obstacle-avoidance';
  parameters: Record<string, number>;
}

export interface OntologyEdgeType {
  id: string;
  name: string;
  description: string;
  sourceTypes: string[]; // Allowed source node type IDs
  targetTypes: string[]; // Allowed target node type IDs
  visual: EdgeVisual;
}

export interface EdgeVisual {
  color: string;
  style: 'solid' | 'dashed' | 'dotted';
  arrow?: boolean;
}

export interface Ontology {
  nodeTypes: OntologyNodeType[];
  edgeTypes: OntologyEdgeType[];
  groupingRules?: GroupingRule[];
}

export interface GroupingRule {
  id: string;
  name: string;
  criteria: {
    nodeType?: string;
    propertyMatch?: Record<string, unknown>;
  };
  visual: {
    color: string;
    borderStyle: 'solid' | 'dashed' | 'dotted';
    label?: string;
    padding?: number;
  };
}

// Meta-graph types for ontology visualization
export interface OntologyMetaGraph {
  nodes: MetaGraphNode[];
  edges: MetaGraphEdge[];
}

export interface MetaGraphNode {
  id: string;
  category: 'node-type' | 'edge-type';
  data: OntologyNodeType | OntologyEdgeType;
}

export interface MetaGraphEdge {
  id: string;
  source: string; // MetaGraphNode.id
  target: string; // MetaGraphNode.id
  type: 'composition' | 'connection-rule'; // Meta-edge types
  label?: string;
}
