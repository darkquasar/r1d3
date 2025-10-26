/**
 * Transform flow data to React Flow format
 */

import type { Node, Edge } from 'reactflow';
import { MarkerType } from 'reactflow';
import type { Flow, FlowNode, FlowEdge } from '@/types/yaml-schema';
import type { Ontology } from '@/types/ontology';

export interface ReactFlowData {
  nodes: Node[];
  edges: Edge[];
}

/**
 * Transform a Flow to React Flow format
 */
export function flowToReactFlow(flow: Flow, ontology: Ontology): ReactFlowData {
  const nodes = flow.nodes.map((node) => transformNode(node, ontology));
  const edges = flow.edges.map((edge) => transformEdge(edge, ontology));

  return { nodes, edges };
}

/**
 * Transform a single FlowNode to React Flow Node
 */
function transformNode(node: FlowNode, ontology: Ontology): Node {
  // Find node type in ontology for styling
  const nodeType = ontology.nodeTypes.find((t) => t.id === node.type);

  // Determine node color based on type
  const nodeColors: Record<string, string> = {
    phase: '#3b82f6', // blue
    subphase: '#8b5cf6', // purple
    component: '#10b981', // green
    action: '#f59e0b', // amber
    principle: '#ec4899', // pink
    'mental-model': '#6366f1', // indigo
  };

  const backgroundColor = nodeColors[node.type] || '#6b7280'; // default gray

  return {
    id: node.id,
    type: 'custom', // Use custom node type with 4 handles
    position: node.position || { x: 0, y: 0 },
    data: {
      label: node.description,
      nodeType: node.type,
      backgroundColor,
      ...node,
    },
  };
}

/**
 * Transform a single FlowEdge to React Flow Edge
 */
function transformEdge(edge: FlowEdge, ontology: Ontology): Edge {
  // Find edge type in ontology for styling
  const edgeType = ontology.edgeTypes.find((t) => t.id === edge.type);

  const style: React.CSSProperties = {
    stroke: edgeType?.visual.color || '#666666',
    strokeWidth: 2,
  };

  if (edgeType?.visual.style === 'dashed') {
    style.strokeDasharray = '5,5';
  } else if (edgeType?.visual.style === 'dotted') {
    style.strokeDasharray = '2,2';
  }

  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    type: 'default',
    style,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: edgeType?.visual.color || '#666666',
    },
  };
}
