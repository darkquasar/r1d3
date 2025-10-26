/**
 * TypeScript types for YAML file structures
 * These types represent the runtime data loaded from YAML files
 */

export interface FlowNode {
  id: string;
  type: string; // References OntologyNodeType.id
  description: string;
  properties: Record<string, unknown>;
  position?: { x: number; y: number }; // Optional: for manual positioning
  layout?: NodeLayoutConfig;
  groupId?: string; // Optional: references Group.id
}

export interface NodeLayoutConfig {
  algorithm?: 'force-directed' | 'hierarchical' | 'obstacle-avoidance';
  parameters?: Record<string, number>;
}

export interface FlowEdge {
  id: string;
  source: string; // References FlowNode.id
  target: string; // References FlowNode.id
  type: string; // References OntologyEdgeType.id
  properties: Record<string, unknown>;
  label?: string;
}

export interface Group {
  id: string;
  name: string;
  nodeIds: string[]; // References FlowNode.id[]
  visual: GroupVisual;
}

export interface GroupVisual {
  color: string; // Hex color code
  borderStyle: 'solid' | 'dashed' | 'dotted';
  label?: string;
  padding?: number; // Pixels of padding around nodes
}

export interface Flow {
  id: string;
  name: string;
  description: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  groups: Group[];
  metadata: FlowMetadata;
}

export interface FlowMetadata {
  created: Date;
  modified: Date;
  author?: string;
  version?: string;
}

export interface FlowSummary {
  id: string;
  name: string;
  description: string;
  nodeCount: number;
  edgeCount: number;
}
