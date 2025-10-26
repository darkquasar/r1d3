/**
 * Flow loader - discovers and loads flows from YAML files
 */

import { parseYAML } from './parser';
import { NodesYAMLSchema, EdgesYAMLSchema } from './schemas';
import type { Flow, FlowNode, FlowEdge, FlowSummary } from '@/types/yaml-schema';

/**
 * Load a flow from YAML file contents
 * In a real implementation, this would read from the filesystem
 * For now, we'll provide a way to load from strings
 */
export async function loadFlowFromYAML(
  nodesYAML: string,
  edgesYAML: string,
  flowId: string,
  flowName: string
): Promise<Flow> {
  // Parse nodes
  const nodesResult = parseYAML(nodesYAML, NodesYAMLSchema);
  if (!nodesResult.success) {
    throw new Error(`Failed to parse nodes: ${nodesResult.errors.join(', ')}`);
  }

  // Parse edges
  const edgesResult = parseYAML(edgesYAML, EdgesYAMLSchema);
  if (!edgesResult.success) {
    throw new Error(`Failed to parse edges: ${edgesResult.errors.join(', ')}`);
  }

  const flow: Flow = {
    id: flowId,
    name: flowName,
    description: `Flow loaded from ${flowId}`,
    nodes: nodesResult.data,
    edges: edgesResult.data,
    groups: [],
    metadata: {
      created: new Date(),
      modified: new Date(),
    },
  };

  return flow;
}

/**
 * Get list of available flows
 * In browser/edge environment, this would need to be pre-configured
 * or fetched from an API
 */
export async function getAvailableFlows(): Promise<FlowSummary[]> {
  // For now, return hardcoded list
  // TODO: Implement dynamic discovery
  return [
    {
      id: 'example-flow',
      name: 'Example Flow',
      description: 'Sample flow demonstrating phases, components, and principles',
      nodeCount: 0,
      edgeCount: 0,
    },
  ];
}

/**
 * Merge multiple node YAML files into a single array
 */
export function mergeNodeFiles(nodeFiles: string[]): FlowNode[] {
  const allNodes: FlowNode[] = [];

  for (const yamlContent of nodeFiles) {
    const result = parseYAML(yamlContent, NodesYAMLSchema);
    if (result.success) {
      allNodes.push(...result.data);
    } else {
      console.warn('Failed to parse node file:', result.errors);
    }
  }

  return allNodes;
}

/**
 * Merge multiple edge YAML files into a single array
 */
export function mergeEdgeFiles(edgeFiles: string[]): FlowEdge[] {
  const allEdges: FlowEdge[] = [];

  for (const yamlContent of edgeFiles) {
    const result = parseYAML(yamlContent, EdgesYAMLSchema);
    if (result.success) {
      allEdges.push(...result.data);
    } else {
      console.warn('Failed to parse edge file:', result.errors);
    }
  }

  return allEdges;
}
