/**
 * Topology Configuration
 *
 * Defines the graph structure rules:
 * - Node types and their properties
 * - Allowed relationships between nodes
 * - Dependency rules (existence, positioning)
 * - Position recalculation triggers
 *
 * Configuration is loaded from framework/topology.yaml at build time.
 * This provides YAML-based configuration while avoiding runtime parsing overhead.
 */

export type NodeType =
  | 'phase'
  | 'sub-phase'
  | 'sub-phase-component'
  | 'mental-model'
  | 'visualization'
  | 'principle'
  | 'output'
  | 'outcome'
  | 'impact';

export type EdgeType =
  | 'contains'      // Hierarchical (phase → sub-phase)
  | 'precedes'      // Sequential (research → discovery)
  | 'linked-to'     // Associative (phase → mental-model)
  | 'visualizes'    // Dependency (mental-model → visualization)
  | 'uses';         // Utility (component → mental-model)

export interface EdgeTypeConfig {
  id: EdgeType;
  displayName: string;
  description: string;
  edgeComponent?: string; // Optional ReactFlow edge component type (e.g., 'smoothStep', 'default')
  style: {
    stroke: string;
    strokeWidth: number;
    animated: boolean;
    strokeDasharray?: string; // Optional dash pattern
    borderRadius?: number;    // Optional border radius for smooth step edges
  };
}

export type PositionTrigger =
  | 'on-edge-added'        // Any new edge to/from this node
  | 'on-edge-removed'      // Any edge to/from this node removed
  | 'on-parent-moved'      // A parent node moved
  | 'on-dependent-toggled' // A node that depends on this was toggled
  | 'never'                // Fixed position (phases)
  | 'always';              // Recalculate every frame

export interface AllowedTarget {
  edgeType: EdgeType;
  targetType: NodeType;
}

export interface DependencyRequirement {
  // What node types can be parents
  types: NodeType[];
  // What edge types connect to parents
  relationships: EdgeType[];
  // Must have at least one parent ('any') or all parents ('all')
  mode: 'any' | 'all';
}

export interface CascadeDeleteRule {
  type: NodeType;
  relationship: EdgeType;
}

export interface NodeTypeConfig {
  id: NodeType;
  displayName: string;

  // Can this node be positioned by physics, or is it always fixed?
  physicsControlled: boolean;

  // What node types can this node link TO?
  allowedTargets: AllowedTarget[];

  // Dependency rules
  dependencies: {
    // What must exist for this node to be visible?
    requiredParents?: DependencyRequirement[];

    // What should be removed if this node is removed?
    cascadeDelete?: CascadeDeleteRule[];
  };

  // Position recalculation rules
  positioning: {
    // When should physics recalculate this node's position?
    recalculateTriggers: PositionTrigger[];

    // Should user-dragged positions be preserved?
    preserveUserPosition: boolean;

    // Should this node recalculate when connected nodes change?
    recalculateOnTopologyChange: boolean;
  };
}

/**
 * Topology Configuration
 *
 * Loaded from framework/topology.yaml at build time
 *
 * In development, this uses dynamic import to allow file watching.
 * In production builds, the YAML is parsed once during build.
 */
let cachedConfig: Record<NodeType, NodeTypeConfig> | null = null;

export function getTopologyConfig(): Record<NodeType, NodeTypeConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  // Load from YAML (will be bundled at build time)
  if (typeof window === 'undefined') {
    // Server-side: load from YAML
    try {
      const { getTopologyConfig: loadConfig } = require('./topology-parser');
      cachedConfig = loadConfig();
    } catch (error) {
      console.warn('Failed to load topology from YAML, using fallback:', error);
      cachedConfig = FALLBACK_TOPOLOGY_CONFIG;
    }
  } else {
    // Client-side: use the config that was bundled
    cachedConfig = FALLBACK_TOPOLOGY_CONFIG;
  }

  return cachedConfig!; // Non-null assertion safe because we always set cachedConfig above
}

/**
 * Fallback Configuration (TypeScript-based)
 *
 * This serves as:
 * 1. Default config if YAML fails to load
 * 2. Type reference for the YAML structure
 * 3. Client-side bundle (YAML parsed at build time)
 */
const FALLBACK_TOPOLOGY_CONFIG: Record<NodeType, NodeTypeConfig> = {
  phase: {
    id: 'phase',
    displayName: 'Phase',
    physicsControlled: false, // Phases are FIXED in fishbone layout

    allowedTargets: [
      { edgeType: 'contains', targetType: 'sub-phase' },
      { edgeType: 'linked-to', targetType: 'mental-model' },
      { edgeType: 'precedes', targetType: 'phase' },
    ],

    dependencies: {
      requiredParents: [], // Phases are top-level
      cascadeDelete: [],   // Per spec: sub-phases can exist without phases
    },

    positioning: {
      recalculateTriggers: ['never'], // Phases never move (fishbone layout)
      preserveUserPosition: false,
      recalculateOnTopologyChange: false,
    },
  },

  'sub-phase': {
    id: 'sub-phase',
    displayName: 'Sub-Phase',
    physicsControlled: false, // Sub-phases are FIXED in fishbone layout

    allowedTargets: [
      { edgeType: 'contains', targetType: 'sub-phase-component' },
      { edgeType: 'linked-to', targetType: 'mental-model' },
      { edgeType: 'precedes', targetType: 'sub-phase' },
    ],

    dependencies: {
      requiredParents: [], // Per spec: can exist without phase
      cascadeDelete: [],   // Per spec: components can exist without sub-phases
    },

    positioning: {
      recalculateTriggers: ['never'], // Sub-phases never move (fishbone layout)
      preserveUserPosition: false,
      recalculateOnTopologyChange: false,
    },
  },

  'sub-phase-component': {
    id: 'sub-phase-component',
    displayName: 'Component',
    physicsControlled: false, // Components are FIXED in fishbone layout

    allowedTargets: [
      { edgeType: 'uses', targetType: 'mental-model' },
      { edgeType: 'linked-to', targetType: 'mental-model' },
    ],

    dependencies: {
      requiredParents: [], // Per spec: can exist independently
      cascadeDelete: [],
    },

    positioning: {
      recalculateTriggers: ['never'], // Components never move (fishbone layout)
      preserveUserPosition: false,
      recalculateOnTopologyChange: false,
    },
  },

  'mental-model': {
    id: 'mental-model',
    displayName: 'Mental Model',
    physicsControlled: true, // ✅ CONTROLLED BY PHYSICS

    allowedTargets: [
      { edgeType: 'visualizes', targetType: 'visualization' },
    ],

    dependencies: {
      // Mental model must be linked from at least ONE phase/sub-phase/component
      requiredParents: [
        {
          types: ['phase', 'sub-phase', 'sub-phase-component'],
          relationships: ['linked-to', 'uses'],
          mode: 'any', // At least ONE must link to it
        },
      ],
      // When mental model is removed, remove its visualizations
      cascadeDelete: [
        { type: 'visualization', relationship: 'visualizes' },
      ],
    },

    positioning: {
      recalculateTriggers: [
        'on-edge-added',   // ✅ New phase toggles → recalculate
        'on-edge-removed', // ✅ Phase untoggled → recalculate
      ],
      preserveUserPosition: true,         // ✅ Respect user dragging
      recalculateOnTopologyChange: true,  // ✅ Recalculate unless dragged
    },
  },

  visualization: {
    id: 'visualization',
    displayName: 'Visualization',
    physicsControlled: true, // ✅ CONTROLLED BY PHYSICS

    allowedTargets: [], // Terminal node (nothing links from visualizations)

    dependencies: {
      // Visualization MUST have parent mental model
      requiredParents: [
        {
          types: ['mental-model'],
          relationships: ['visualizes'],
          mode: 'all', // ✅ MUST have parent mental model
        },
      ],
      cascadeDelete: [], // Nothing depends on visualizations
    },

    positioning: {
      recalculateTriggers: [
        'on-parent-moved', // ✅ Recalculate when mental model moves
        'on-edge-added',
        'on-edge-removed',
      ],
      preserveUserPosition: true,
      recalculateOnTopologyChange: true,
    },
  },

  // Future node types (placeholder configuration)
  principle: {
    id: 'principle',
    displayName: 'Principle',
    physicsControlled: true,

    allowedTargets: [
      { edgeType: 'linked-to', targetType: 'mental-model' },
    ],

    dependencies: {
      requiredParents: [],
      cascadeDelete: [],
    },

    positioning: {
      recalculateTriggers: ['on-edge-added', 'on-edge-removed'],
      preserveUserPosition: true,
      recalculateOnTopologyChange: true,
    },
  },

  output: {
    id: 'output',
    displayName: 'Output',
    physicsControlled: true,

    allowedTargets: [
      { edgeType: 'linked-to', targetType: 'outcome' },
    ],

    dependencies: {
      requiredParents: [
        {
          types: ['sub-phase-component'],
          relationships: ['linked-to'],
          mode: 'any',
        },
      ],
      cascadeDelete: [],
    },

    positioning: {
      recalculateTriggers: ['on-edge-added', 'on-edge-removed'],
      preserveUserPosition: true,
      recalculateOnTopologyChange: true,
    },
  },

  outcome: {
    id: 'outcome',
    displayName: 'Outcome',
    physicsControlled: true,

    allowedTargets: [
      { edgeType: 'linked-to', targetType: 'impact' },
    ],

    dependencies: {
      requiredParents: [
        {
          types: ['output'],
          relationships: ['linked-to'],
          mode: 'any',
        },
      ],
      cascadeDelete: [],
    },

    positioning: {
      recalculateTriggers: ['on-edge-added', 'on-edge-removed'],
      preserveUserPosition: true,
      recalculateOnTopologyChange: true,
    },
  },

  impact: {
    id: 'impact',
    displayName: 'Impact',
    physicsControlled: true,

    allowedTargets: [],

    dependencies: {
      requiredParents: [
        {
          types: ['outcome'],
          relationships: ['linked-to'],
          mode: 'any',
        },
      ],
      cascadeDelete: [],
    },

    positioning: {
      recalculateTriggers: ['on-edge-added', 'on-edge-removed'],
      preserveUserPosition: true,
      recalculateOnTopologyChange: true,
    },
  },
};

/**
 * Export TOPOLOGY_CONFIG for backward compatibility
 * (uses getter to load from YAML)
 */
export const TOPOLOGY_CONFIG = new Proxy({} as Record<NodeType, NodeTypeConfig>, {
  get(_target, prop: string | symbol) {
    if (typeof prop === 'string') {
      return getTopologyConfig()[prop as NodeType];
    }
    return undefined;
  },
  ownKeys(_target) {
    return Object.keys(getTopologyConfig());
  },
  getOwnPropertyDescriptor(_target, prop) {
    const config = getTopologyConfig();
    if (prop in config) {
      return {
        enumerable: true,
        configurable: true,
        value: config[prop as NodeType],
      };
    }
    return undefined;
  },
});

/**
 * Helper: Get configuration for a node type
 */
export function getNodeTypeConfig(nodeType: NodeType): NodeTypeConfig {
  return getTopologyConfig()[nodeType];
}

/**
 * Helper: Check if a node type is physics-controlled
 */
export function isPhysicsControlled(nodeType: NodeType): boolean {
  return getTopologyConfig()[nodeType].physicsControlled;
}

/**
 * Fallback Edge Type Configuration
 * Loaded from framework/topology.yaml edge_types section
 */
const FALLBACK_EDGE_CONFIG: Record<EdgeType, EdgeTypeConfig> = {
  'contains': {
    id: 'contains',
    displayName: 'Contains',
    description: 'Hierarchical containment relationship',
    style: {
      stroke: '#7C3AED',
      strokeWidth: 2,
      animated: false,
    },
  },
  'precedes': {
    id: 'precedes',
    displayName: 'Precedes',
    description: 'Sequential ordering relationship',
    style: {
      stroke: '#A78BFA',
      strokeWidth: 2,
      animated: false,
    },
  },
  'linked-to': {
    id: 'linked-to',
    displayName: 'Linked To',
    description: 'Associative relationship',
    edgeComponent: 'smoothStep', // Use smooth step path with rounded elbows
    style: {
      stroke: '#A78BFA',
      strokeWidth: 2,
      animated: false,
      strokeDasharray: '5,5', // Dashed for mental models
      borderRadius: 12, // Rounded corners on elbows
    },
  },
  'visualizes': {
    id: 'visualizes',
    displayName: 'Visualizes',
    description: 'Visualization dependency',
    edgeComponent: 'smoothStep', // Use smooth step path with rounded elbows
    style: {
      stroke: '#7C3AED',
      strokeWidth: 2,
      animated: false,
      strokeDasharray: '2,2', // Dotted for visualizations
      borderRadius: 12, // Rounded corners on elbows
    },
  },
  'uses': {
    id: 'uses',
    displayName: 'Uses',
    description: 'Utility relationship',
    style: {
      stroke: '#C4B5FD',
      strokeWidth: 2,
      animated: false,
    },
  },
};

let cachedEdgeConfig: Record<EdgeType, EdgeTypeConfig> | null = null;

/**
 * Get edge type configurations from topology YAML
 */
export function getEdgeTypeConfigs(): Record<EdgeType, EdgeTypeConfig> {
  if (cachedEdgeConfig) {
    return cachedEdgeConfig;
  }

  // Load from YAML (server-side) or use fallback
  if (typeof window === 'undefined') {
    // Server-side: load from YAML
    try {
      const { getEdgeTypeConfigsFromYAML } = require('./topology-parser');
      const yamlConfig = getEdgeTypeConfigsFromYAML();
      // Merge YAML config with fallback (YAML takes precedence)
      cachedEdgeConfig = { ...FALLBACK_EDGE_CONFIG, ...yamlConfig };
    } catch (error) {
      console.warn('Failed to load edge types from YAML, using fallback:', error);
      cachedEdgeConfig = FALLBACK_EDGE_CONFIG;
    }
  } else {
    // Client-side: use the config that was bundled
    cachedEdgeConfig = FALLBACK_EDGE_CONFIG;
  }

  return cachedEdgeConfig!; // Non-null assertion safe because we always set cachedEdgeConfig above
}

/**
 * Helper: Get configuration for an edge type
 */
export function getEdgeTypeConfig(edgeType: EdgeType): EdgeTypeConfig {
  return getEdgeTypeConfigs()[edgeType];
}
