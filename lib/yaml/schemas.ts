/**
 * Zod validation schemas for YAML structures
 */

import { z } from 'zod';

// Flow node schema
export const FlowNodeSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  description: z.string(),
  properties: z.record(z.string(), z.any()).default({}),
  position: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
  layout: z
    .object({
      algorithm: z.enum(['force-directed', 'hierarchical', 'obstacle-avoidance']).optional(),
      parameters: z.record(z.string(), z.number()).optional(),
    })
    .optional(),
  groupId: z.string().optional(),
});

// Flow edge schema
export const FlowEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  type: z.string().min(1),
  properties: z.record(z.string(), z.any()).default({}),
  label: z.string().optional(),
});

// Group visual schema
export const GroupVisualSchema = z.object({
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
  borderStyle: z.enum(['solid', 'dashed', 'dotted']),
  label: z.string().optional(),
  padding: z.number().min(0).optional(),
});

// Group schema
export const GroupSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  nodeIds: z.array(z.string()).min(1),
  visual: GroupVisualSchema,
});

// Flow metadata schema
export const FlowMetadataSchema = z.object({
  created: z.coerce.date(),
  modified: z.coerce.date(),
  author: z.string().optional(),
  version: z.string().optional(),
});

// Complete flow schema
export const FlowSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9-_]+$/, 'Flow ID must be alphanumeric with hyphens/underscores'),
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  nodes: z.array(FlowNodeSchema),
  edges: z.array(FlowEdgeSchema),
  groups: z.array(GroupSchema).default([]),
  metadata: FlowMetadataSchema,
});

// Ontology schemas
export const NodePropertySchema = z.object({
  name: z.string().min(1),
  type: z.enum(['string', 'number', 'boolean', 'array', 'object']),
  required: z.boolean(),
  default: z.unknown().optional(),
});

export const NodeLayoutDefaultsSchema = z.object({
  algorithm: z.enum(['force-directed', 'hierarchical', 'obstacle-avoidance']),
  parameters: z.record(z.string(), z.number()),
});

export const OntologyNodeTypeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  parent: z.string().optional(),
  properties: z.array(NodePropertySchema),
  layout: NodeLayoutDefaultsSchema,
});

export const EdgeVisualSchema = z.object({
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  style: z.enum(['solid', 'dashed', 'dotted']),
  arrow: z.boolean().optional(),
});

export const OntologyEdgeTypeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  sourceTypes: z.array(z.string()).min(1),
  targetTypes: z.array(z.string()).min(1),
  visual: EdgeVisualSchema,
});

export const GroupingRuleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  criteria: z.object({
    nodeType: z.string().optional(),
    propertyMatch: z.record(z.string(), z.any()).optional(),
  }),
  visual: GroupVisualSchema,
});

export const OntologySchema = z.object({
  nodeTypes: z.array(OntologyNodeTypeSchema),
  edgeTypes: z.array(OntologyEdgeTypeSchema),
  groupingRules: z.array(GroupingRuleSchema).optional(),
});

// YAML file schemas (for parsing individual files)
export const NodesYAMLSchema = z.array(FlowNodeSchema);
export const EdgesYAMLSchema = z.array(FlowEdgeSchema);
