/**
 * Grouping Configuration
 *
 * Defines TypeScript types and config loader for node grouping.
 * Groups are defined in framework/topology.yaml and provide:
 * - Visual container boxes around nodes
 * - Boundary nodes for pathfinding obstacle avoidance
 *
 * Configuration is loaded from YAML at build time.
 */

import type { NodeType } from './topology-config';

export interface GroupConfig {
  id: string;
  displayName: string;
  description: string;
  members: {
    nodeType: NodeType;
    filter: 'all' | 'specific';
    nodeIds?: string[];
  };
  style: {
    borderColor: string;
    borderWidth: number;
    borderOpacity: number;
    backgroundColor: string;
    backgroundOpacity: number;
    borderRadius: number;
    padding: number;
  };
  label: {
    text: string;
    show: boolean;
    position: 'inside' | 'outside';
    paddingTop: number;
    style: {
      fontSize: number;
      fontWeight: number;
      color: string;
      opacity: number;
    };
  };
  boundary: {
    enabled: boolean;
    strategy: 'perimeter' | 'corners';
    obstacleSize: number;
    spacing: number;
  };
}

export interface GroupingTopology {
  groups: Record<string, GroupConfig>;
}

// Hardcoded fallback config (matches topology.yaml)
// This gets used on client-side since we can't read files there
const FALLBACK_GROUPING_CONFIG: GroupingTopology = {
  groups: {
    'primary-phases': {
      id: 'primary-phases',
      displayName: 'Framework Phases',
      description: 'Primary phases of the R1D3 framework grouped together',
      members: {
        nodeType: 'phase',
        filter: 'all',
      },
      style: {
        borderColor: '#7C3AED',
        borderWidth: 3,
        borderOpacity: 0.3,
        backgroundColor: '#7C3AED',
        backgroundOpacity: 0.05,
        borderRadius: 16,
        padding: 40,
      },
      label: {
        text: 'Framework Phases',
        show: true,
        position: 'inside',
        paddingTop: 20,
        style: {
          fontSize: 14,
          fontWeight: 600,
          color: '#7C3AED',
          opacity: 0.7,
        },
      },
      boundary: {
        enabled: true,
        strategy: 'perimeter',
        obstacleSize: 80,
        spacing: 0,
      },
    },
  },
};

let cachedGroupingConfig: GroupingTopology | null = null;

/**
 * Get grouping configuration
 * Loads from YAML on server, uses fallback on client
 */
export function getGroupingConfig(): GroupingTopology {
  if (cachedGroupingConfig) {
    return cachedGroupingConfig;
  }

  // Server-side: load from YAML
  if (typeof window === 'undefined') {
    try {
      const { parseGroupingConfig } = require('./grouping-parser');
      cachedGroupingConfig = parseGroupingConfig();
    } catch (error) {
      console.error('[Grouping] Failed to load from YAML:', error);
      cachedGroupingConfig = FALLBACK_GROUPING_CONFIG;
    }
  } else {
    // Client-side: use fallback
    cachedGroupingConfig = FALLBACK_GROUPING_CONFIG;
  }

  return cachedGroupingConfig!;
}

/**
 * Get a specific group configuration by ID
 */
export function getGroupConfig(groupId: string): GroupConfig | undefined {
  const config = getGroupingConfig();
  return config.groups[groupId];
}

/**
 * Check if grouping is configured
 */
export function hasGrouping(): boolean {
  const config = getGroupingConfig();
  return Object.keys(config.groups).length > 0;
}
