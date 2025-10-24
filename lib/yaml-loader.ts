/**
 * YAML Loader - Build-Time Only
 *
 * Loads and validates YAML files from the framework directory during Next.js build.
 * CRITICAL: This code uses fs and runs ONLY during build, NOT at runtime in Cloudflare Workers.
 *
 * @packageDocumentation
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';
import {
  FrameworkNodeSchema,
  EdgeSchema,
  type FrameworkNodeInferred,
  type EdgeInferred,
} from './zod-schemas';
import type { FrameworkGraph } from '../types/framework';

/**
 * Error class for YAML validation failures
 */
export class YAMLValidationError extends Error {
  constructor(
    public filePath: string,
    public field: string,
    public expected: string,
    public actual: string,
    public suggestedFix: string
  ) {
    super(`YAML Validation Error in ${filePath}`);
    this.name = 'YAMLValidationError';
  }
}

/**
 * Load all YAML files from a directory
 */
function loadYAMLFilesFromDirectory(dirPath: string): any[] {
  const results: any[] = [];

  try {
    const entries = readdirSync(dirPath);

    for (const entry of entries) {
      const fullPath = join(dirPath, entry);
      const stats = statSync(fullPath);

      if (stats.isDirectory()) {
        // Recursively load from subdirectories
        results.push(...loadYAMLFilesFromDirectory(fullPath));
      } else if (entry.endsWith('.yaml') || entry.endsWith('.yml')) {
        try {
          const fileContents = readFileSync(fullPath, 'utf8');
          const data = yaml.load(fileContents);
          results.push({ data, filePath: fullPath });
        } catch (error) {
          console.error(`❌ Failed to parse YAML file: ${fullPath}`);
          console.error(error);
          throw new Error(`Malformed YAML in ${fullPath}: ${error}`);
        }
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // Directory doesn't exist, return empty array
      return [];
    }
    throw error;
  }

  return results;
}

/**
 * Transform mental model stages from YAML format to internal format
 */
function transformMentalModelStages(nodeData: any): any {
  // If this is not a mental model or has no stages, return as-is
  if (nodeData.node_type !== 'mental-model' || !nodeData.stages) {
    return nodeData;
  }

  // Transform stages array
  let transformedStages: any[] = [];
  let svgConfig: any = undefined;

  for (const item of nodeData.stages) {
    if (item.visualization) {
      // Extract SVG visualization config
      svgConfig = item.visualization;
    } else if (item.phases) {
      // Extract stages from phases array
      transformedStages = item.phases;
    }
  }

  // Build transformed node
  const transformed = { ...nodeData };

  // Only set stages if we found phases
  if (transformedStages.length > 0) {
    transformed.stages = transformedStages;
  } else {
    delete transformed.stages;
  }

  // Set svg_config if we found visualization
  if (svgConfig) {
    transformed.svg_config = svgConfig;
  }

  return transformed;
}

/**
 * Validate a single node against the schema
 */
function validateNode(
  nodeData: any,
  filePath: string
): FrameworkNodeInferred {
  // Transform mental model stages format before validation
  const transformedData = transformMentalModelStages(nodeData);

  const result = FrameworkNodeSchema.safeParse(transformedData);

  if (!result.success) {
    // Zod v4 uses result.error.format() or result.error.issues
    const errorDetails = JSON.stringify(result.error.format(), null, 2);
    throw new Error(`Validation failed for ${filePath}: ${errorDetails}`);
  }

  return result.data;
}

/**
 * Validate a single edge against the schema
 */
function validateEdge(
  edgeData: any,
  filePath: string
): EdgeInferred {
  const result = EdgeSchema.safeParse(edgeData);

  if (!result.success) {
    // Zod v4 uses result.error.format() or result.error.issues
    const errorDetails = JSON.stringify(result.error.format(), null, 2);
    throw new Error(`Validation failed for ${filePath}: ${errorDetails}`);
  }

  // Auto-generate ID if not provided
  if (!result.data.id) {
    result.data.id = `${result.data.from_node}-${result.data.to_node}`;
  }

  return result.data;
}

/**
 * Load all framework nodes from YAML files
 */
export function loadFrameworkNodes(baseDir: string = 'framework/nodes'): FrameworkNodeInferred[] {
  const nodes: FrameworkNodeInferred[] = [];
  const nodeFiles = loadYAMLFilesFromDirectory(baseDir);

  for (const { data, filePath } of nodeFiles) {
    try {
      const validatedNode = validateNode(data, filePath);
      nodes.push(validatedNode);
    } catch (error) {
      if (error instanceof YAMLValidationError) {
        console.error(`\n❌ YAML Validation Error\n`);
        console.error(`File: ${error.filePath}`);
        console.error(`Field: ${error.field}`);
        console.error(`Expected: ${error.expected}`);
        console.error(`Actual: ${error.actual}`);
        console.error(`\nSuggested Fix: ${error.suggestedFix}\n`);
      }
      throw error;
    }
  }

  return nodes;
}

/**
 * Load all framework edges from YAML files
 */
export function loadFrameworkEdges(baseDir: string = 'framework/edges'): EdgeInferred[] {
  const edges: EdgeInferred[] = [];
  const edgeFiles = loadYAMLFilesFromDirectory(baseDir);

  for (const { data, filePath } of edgeFiles) {
    // Handle both single edge and array of edges in one file
    const edgeArray = Array.isArray(data) ? data : [data];

    for (const edgeData of edgeArray) {
      try {
        const validatedEdge = validateEdge(edgeData, filePath);
        edges.push(validatedEdge);
      } catch (error) {
        if (error instanceof YAMLValidationError) {
          console.error(`\n❌ YAML Validation Error\n`);
          console.error(`File: ${error.filePath}`);
          console.error(`Field: ${error.field}`);
          console.error(`Expected: ${error.expected}`);
          console.error(`Actual: ${error.actual}`);
          console.error(`\nSuggested Fix: ${error.suggestedFix}\n`);
        }
        throw error;
      }
    }
  }

  return edges;
}

/**
 * Validate cross-entity references
 */
function validateReferences(
  nodes: FrameworkNodeInferred[],
  edges: EdgeInferred[]
): void {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const errors: string[] = [];

  // Check for duplicate node IDs
  const idCounts = new Map<string, number>();
  for (const node of nodes) {
    idCounts.set(node.id, (idCounts.get(node.id) || 0) + 1);
  }
  for (const [id, count] of idCounts.entries()) {
    if (count > 1) {
      errors.push(`Duplicate node ID: "${id}" appears ${count} times`);
    }
  }

  // Validate edge references
  for (const edge of edges) {
    if (!nodeIds.has(edge.from_node)) {
      errors.push(
        `Edge "${edge.id}" references non-existent from_node: "${edge.from_node}"`
      );
    }
    if (!nodeIds.has(edge.to_node)) {
      errors.push(
        `Edge "${edge.id}" references non-existent to_node: "${edge.to_node}"`
      );
    }
  }

  // Validate mental model links (warning only, not fatal)
  for (const node of nodes) {
    if (node.linked_mental_models) {
      for (const mentalModelId of node.linked_mental_models) {
        if (!nodeIds.has(mentalModelId)) {
          console.warn(
            `⚠️  Node "${node.id}" references mental model "${mentalModelId}" which doesn't exist yet`
          );
        }
      }
    }
  }

  // Validate parent-child relationships
  for (const node of nodes) {
    if (node.node_type === 'sub-phase') {
      if (!nodeIds.has(node.parent_phase)) {
        errors.push(
          `SubPhase "${node.id}" references non-existent parent_phase: "${node.parent_phase}"`
        );
      }
    }
    if (node.node_type === 'sub-phase-component') {
      if (!nodeIds.has(node.parent_sub_phase)) {
        errors.push(
          `SubPhaseComponent "${node.id}" references non-existent parent_sub_phase: "${node.parent_sub_phase}"`
        );
      }
    }
  }

  if (errors.length > 0) {
    console.error('\n❌ Reference Validation Errors:\n');
    errors.forEach((error) => console.error(`  - ${error}`));
    console.error('');
    throw new Error(`Found ${errors.length} reference validation error(s)`);
  }
}

/**
 * Load complete framework graph with validation
 * This is the main entry point called during build
 */
export function loadFrameworkData(): FrameworkGraph {
  console.log('📦 Loading framework YAML files...');

  const nodes = loadFrameworkNodes();
  const edges = loadFrameworkEdges();

  console.log(`✅ Loaded ${nodes.length} nodes and ${edges.length} edges`);

  // Validate cross-entity references
  validateReferences(nodes, edges);

  console.log('✅ All references validated successfully');

  return {
    nodes: nodes as any[], // Type assertion needed due to Zod inference
    edges: edges as any[],
    metadata: {
      version: '1.0.0',
      last_updated: new Date().toISOString(),
      framework_name: 'R1D3',
    },
  };
}
