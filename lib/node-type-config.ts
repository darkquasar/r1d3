/**
 * Node Type Configuration
 *
 * Defines visual properties (icons, colors, descriptions) for each node type
 */

import type { NodeType } from '@/types/framework';

// Re-export NodeType for convenience
export type { NodeType };

export interface NodeTypeConfig {
  /** Display label for this type */
  label: string;

  /** Lucide icon name for this type */
  icon: string;

  /** Primary color for this type (Tailwind class) */
  color: string;

  /** Background color for this type (Tailwind class) */
  bgColor: string;

  /** Border color for this type (Tailwind class) */
  borderColor: string;

  /** Text color for this type (Tailwind class) */
  textColor: string;

  /** Description of what this node type represents */
  description: string;
}

export const NODE_TYPE_CONFIG: Record<NodeType, NodeTypeConfig> = {
  phase: {
    label: 'Phase',
    icon: 'Circle',
    color: '#7C3AED', // purple-600
    bgColor: 'bg-purple-600',
    borderColor: 'border-purple-500',
    textColor: 'text-purple-50',
    description: 'Top-level framework phase representing major stages of work',
  },
  'sub-phase': {
    label: 'Sub-Phase',
    icon: 'Square',
    color: '#3B82F6', // blue-500
    bgColor: 'bg-blue-500',
    borderColor: 'border-blue-400',
    textColor: 'text-blue-50',
    description: 'Subdivision of a phase containing detailed activities',
  },
  'sub-phase-component': {
    label: 'Component',
    icon: 'Hexagon',
    color: '#10B981', // green-500
    bgColor: 'bg-green-500',
    borderColor: 'border-green-400',
    textColor: 'text-green-50',
    description: 'Specific component or activity within a sub-phase',
  },
  'mental-model': {
    label: 'Mental Model',
    icon: 'Diamond',
    color: '#14B8A6', // teal-500
    bgColor: 'bg-teal-500',
    borderColor: 'border-teal-400',
    textColor: 'text-teal-50',
    description: 'Conceptual framework or visualization pattern for understanding',
  },
  principle: {
    label: 'Principle',
    icon: 'Star',
    color: '#EAB308', // yellow-500
    bgColor: 'bg-yellow-500',
    borderColor: 'border-yellow-400',
    textColor: 'text-yellow-950',
    description: 'Heuristic that guides reasoning and decision-making',
  },
  output: {
    label: 'Output',
    icon: 'FolderOpen',
    color: '#F97316', // orange-500
    bgColor: 'bg-orange-500',
    borderColor: 'border-orange-400',
    textColor: 'text-orange-50',
    description: 'Deliverable artifact or finding from framework activities',
  },
  outcome: {
    label: 'Outcome',
    icon: 'Target',
    color: '#EF4444', // red-500
    bgColor: 'bg-red-500',
    borderColor: 'border-red-400',
    textColor: 'text-red-50',
    description: 'Desired change in system state with measurable improvements',
  },
  impact: {
    label: 'Impact',
    icon: 'Trophy',
    color: '#F59E0B', // amber-500
    bgColor: 'bg-amber-500',
    borderColor: 'border-amber-400',
    textColor: 'text-amber-950',
    description: 'Strategic goal with lagging indicators of success',
  },
};

/**
 * Get configuration for a node type
 */
export function getNodeTypeConfig(nodeType: NodeType): NodeTypeConfig {
  return NODE_TYPE_CONFIG[nodeType];
}

/**
 * Get all node types with their configurations
 */
export function getAllNodeTypes(): Array<{ type: NodeType; config: NodeTypeConfig }> {
  return Object.entries(NODE_TYPE_CONFIG).map(([type, config]) => ({
    type: type as NodeType,
    config,
  }));
}
