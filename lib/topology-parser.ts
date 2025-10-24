/**
 * Topology YAML Parser
 *
 * Parses framework/topology.yaml at build time and converts it to
 * the TypeScript topology configuration format.
 *
 * This provides YAML-based configuration while maintaining type safety
 * and avoiding runtime parsing overhead.
 */

import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import type {
  NodeTypeConfig,
  EdgeTypeConfig,
  NodeType,
  EdgeType,
  PositionTrigger,
  AllowedTarget,
  DependencyRequirement,
  CascadeDeleteRule,
} from './topology-config';

/**
 * YAML structure (snake_case from YAML file)
 */
interface TopologyYAML {
  version: string;
  node_types: Record<string, NodeTypeYAML>;
  edge_types?: Record<string, EdgeTypeYAML>;
  validation?: ValidationRulesYAML;
}

interface NodeTypeYAML {
  display_name: string;
  physics_controlled: boolean;
  allowed_targets: AllowedTargetYAML[];
  dependencies: DependenciesYAML;
  positioning: PositioningYAML;
  physics?: PhysicsYAML;
}

interface AllowedTargetYAML {
  edge_type: string;
  target_type: string;
}

interface DependenciesYAML {
  required_parents?: RequiredParentYAML[];
  cascade_delete?: CascadeDeleteYAML[];
}

interface RequiredParentYAML {
  types: string[];
  relationships: string[];
  mode: 'any' | 'all';
}

interface CascadeDeleteYAML {
  type: string;
  relationship: string;
}

interface PositioningYAML {
  recalculate_triggers: string[];
  preserve_user_position: boolean;
  recalculate_on_topology_change: boolean;
}

interface PhysicsYAML {
  charge_strength?: number;
  collision_radius?: number;
  link_strength?: number;
}

interface EdgeTypeYAML {
  display_name: string;
  description: string;
  style?: {
    stroke?: string;
    stroke_width?: number;
    animated?: boolean;
  };
}

interface ValidationRulesYAML {
  disallow_cycles?: boolean;
  warn_orphaned_nodes?: boolean;
  max_cascade_depth?: number;
}

/**
 * Load and parse topology YAML file
 *
 * @param yamlPath - Path to topology.yaml file (relative to project root)
 * @returns Parsed topology configuration
 */
export function loadTopologyYAML(yamlPath: string): Record<NodeType, NodeTypeConfig> {
  try {
    const fullPath = path.isAbsolute(yamlPath)
      ? yamlPath
      : path.join(process.cwd(), yamlPath);

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const parsed = yaml.load(fileContents) as TopologyYAML;

    // Validate structure
    validateTopologyStructure(parsed);

    // Convert to TypeScript config format
    return parseTopologyYAML(parsed);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load topology YAML: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Validate topology YAML structure
 */
function validateTopologyStructure(topology: TopologyYAML): void {
  if (!topology.version) {
    throw new Error('Topology YAML must have a version field');
  }

  if (!topology.node_types || typeof topology.node_types !== 'object') {
    throw new Error('Topology YAML must have node_types');
  }

  // Validate each node type
  for (const [nodeTypeId, config] of Object.entries(topology.node_types)) {
    if (!config.display_name) {
      throw new Error(`Node type '${nodeTypeId}' must have display_name`);
    }

    if (typeof config.physics_controlled !== 'boolean') {
      throw new Error(`Node type '${nodeTypeId}' must have physics_controlled (boolean)`);
    }

    if (!Array.isArray(config.allowed_targets)) {
      throw new Error(`Node type '${nodeTypeId}' must have allowed_targets array`);
    }

    if (!config.dependencies) {
      throw new Error(`Node type '${nodeTypeId}' must have dependencies`);
    }

    if (!config.positioning) {
      throw new Error(`Node type '${nodeTypeId}' must have positioning`);
    }

    if (!Array.isArray(config.positioning.recalculate_triggers)) {
      throw new Error(`Node type '${nodeTypeId}' positioning must have recalculate_triggers array`);
    }
  }

  // Validate cross-references (target types exist)
  const nodeTypeIds = new Set(Object.keys(topology.node_types));
  for (const [nodeTypeId, config] of Object.entries(topology.node_types)) {
    for (const target of config.allowed_targets) {
      if (!nodeTypeIds.has(target.target_type)) {
        console.warn(
          `Warning: Node type '${nodeTypeId}' references unknown target type '${target.target_type}'`
        );
      }
    }
  }
}

/**
 * Convert YAML structure to TypeScript configuration
 */
function parseTopologyYAML(topology: TopologyYAML): Record<NodeType, NodeTypeConfig> {
  const config: Record<string, NodeTypeConfig> = {};

  for (const [nodeTypeId, nodeConfig] of Object.entries(topology.node_types)) {
    config[nodeTypeId] = {
      id: nodeTypeId as NodeType,
      displayName: nodeConfig.display_name,
      physicsControlled: nodeConfig.physics_controlled,

      // Parse allowed targets
      allowedTargets: nodeConfig.allowed_targets.map(
        (target): AllowedTarget => ({
          edgeType: target.edge_type as EdgeType,
          targetType: target.target_type as NodeType,
        })
      ),

      // Parse dependencies
      dependencies: {
        requiredParents: nodeConfig.dependencies.required_parents?.map(
          (parent): DependencyRequirement => ({
            types: parent.types as NodeType[],
            relationships: parent.relationships as EdgeType[],
            mode: parent.mode,
          })
        ),

        cascadeDelete: nodeConfig.dependencies.cascade_delete?.map(
          (cascade): CascadeDeleteRule => ({
            type: cascade.type as NodeType,
            relationship: cascade.relationship as EdgeType,
          })
        ),
      },

      // Parse positioning
      positioning: {
        recalculateTriggers: nodeConfig.positioning.recalculate_triggers as PositionTrigger[],
        preserveUserPosition: nodeConfig.positioning.preserve_user_position,
        recalculateOnTopologyChange: nodeConfig.positioning.recalculate_on_topology_change,
      },
    };
  }

  return config as Record<NodeType, NodeTypeConfig>;
}

/**
 * Parse edge type configurations from YAML
 */
function parseEdgeTypesYAML(topology: TopologyYAML): Record<EdgeType, EdgeTypeConfig> {
  const edgeConfig: Record<string, EdgeTypeConfig> = {};

  if (!topology.edge_types) {
    return edgeConfig as Record<EdgeType, EdgeTypeConfig>;
  }

  for (const [edgeTypeId, edgeYaml] of Object.entries(topology.edge_types)) {
    edgeConfig[edgeTypeId] = {
      id: edgeTypeId as EdgeType,
      displayName: edgeYaml.display_name,
      description: edgeYaml.description,
      style: {
        stroke: edgeYaml.style?.stroke || '#A78BFA',
        strokeWidth: edgeYaml.style?.stroke_width || 2,
        animated: edgeYaml.style?.animated || false,
      },
    };
  }

  return edgeConfig as Record<EdgeType, EdgeTypeConfig>;
}

/**
 * Load topology configuration for the application
 * Called at build time to parse YAML into TypeScript config
 */
export function getTopologyConfig(): Record<NodeType, NodeTypeConfig> {
  return loadTopologyYAML('framework/topology.yaml');
}

/**
 * Load edge type configurations from topology YAML
 * Called at build time to parse edge_types section
 */
export function getEdgeTypeConfigsFromYAML(): Record<EdgeType, EdgeTypeConfig> {
  try {
    const fullPath = path.join(process.cwd(), 'framework/topology.yaml');
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const parsed = yaml.load(fileContents) as TopologyYAML;
    return parseEdgeTypesYAML(parsed);
  } catch (error) {
    if (error instanceof Error) {
      console.warn(`Failed to load edge types from YAML: ${error.message}`);
    }
    return {} as Record<EdgeType, EdgeTypeConfig>;
  }
}
