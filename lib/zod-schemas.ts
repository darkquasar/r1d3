/**
 * Zod Validation Schemas for R1D3 Framework YAML Files
 *
 * These schemas validate the structure and content of YAML files at build time.
 * All validation happens during Next.js compilation, not at runtime.
 *
 * @packageDocumentation
 */

import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

export const NodeTypeSchema = z.enum([
  'phase',
  'sub-phase',
  'sub-phase-component',
  'mental-model',
  'principle',
  'output',
  'outcome',
  'impact',
]);

export const RelationshipTypeSchema = z.enum([
  'contains',
  'precedes',
  'linked-to',
  'uses',
]);

export const VisualizationTypeSchema = z.enum([
  'magic-quadrant',
  'sunburst',
  'radial-tree',
  'x-y-curve',
  'funnel',
  'heatmap',
  'svg',
]);

export const QuadrantPositionSchema = z.enum([
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
]);

// ============================================================================
// Base Node Schema
// ============================================================================

export const BaseNodeSchema = z.object({
  id: z
    .string()
    .min(2)
    .max(64)
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      'ID must be lowercase letters, numbers, and hyphens only'
    ),
  node_type: NodeTypeSchema,
  name: z.string().min(1).max(100),
  description: z.string().max(10000).optional(),
  version: z
    .string()
    .regex(/^\d+\.\d+(\.\d+)?$/, 'Version must follow semver format (X.Y or X.Y.Z)'),
  linked_mental_models: z.array(z.string()).optional(),
  principles: z.array(z.string()).optional(),
});

// ============================================================================
// Specific Node Schemas
// ============================================================================

export const PhaseSchema = BaseNodeSchema.extend({
  node_type: z.literal('phase'),
  contains_sub_phases: z.array(z.string()).optional(),
});

export const SubPhaseSchema = BaseNodeSchema.extend({
  node_type: z.literal('sub-phase'),
  parent_phase: z.string(),
  contains_components: z.array(z.string()).optional(),
});

export const SubPhaseComponentSchema = BaseNodeSchema.extend({
  node_type: z.literal('sub-phase-component'),
  parent_sub_phase: z.string(),
});

// ============================================================================
// Mental Model Schemas
// ============================================================================

export const SVGVisualizationSchema = z.object({
  type: z.literal('svg'),
  src_file: z.string(),
});

export const StageSchema = z.object({
  id: z.string(),
  name: z.string().max(50),
  description: z.string().max(500),
  dominant_question: z.string().max(100).optional(),
  typical_outputs: z.array(z.string()).optional(),
  intensity: z.number().min(0).max(100).optional(),
});

export const QuadrantSchema = z.object({
  position: QuadrantPositionSchema,
  name: z.string().max(30),
  description: z.string().max(200),
});

export const QuadrantConfigSchema = z.object({
  x_axis_label: z.string().max(50),
  x_axis_low: z.string().max(30),
  x_axis_high: z.string().max(30),
  y_axis_label: z.string().max(50),
  y_axis_low: z.string().max(30),
  y_axis_high: z.string().max(30),
  quadrants: z.array(QuadrantSchema).length(4),
});

export const MentalModelSchema = BaseNodeSchema.extend({
  node_type: z.literal('mental-model'),
  visualization_type: VisualizationTypeSchema.optional(),
  source: z.string().optional(),
  summary: z.string().optional(),
  stages: z.array(StageSchema).optional(),
  quadrant_config: QuadrantConfigSchema.optional(),
  svg_config: SVGVisualizationSchema.optional(),
}).catchall(z.any()).refine(
  (data) => {
    // If visualization_type is 'magic-quadrant', quadrant_config is required
    if (data.visualization_type === 'magic-quadrant') {
      return data.quadrant_config !== undefined;
    }
    return true;
  },
  {
    message: "quadrant_config is required when visualization_type is 'magic-quadrant'",
    path: ['quadrant_config'],
  }
);

export const PrincipleSchema = BaseNodeSchema.extend({
  node_type: z.literal('principle'),
  guidance: z.string().min(1).max(2000),
  examples: z.array(z.string()).optional(),
  related_principles: z.array(z.string()).optional(),
});

export const OutputSchema = BaseNodeSchema.extend({
  node_type: z.literal('output'),
  output_type: z.enum(['finding', 'artefact']),
  produced_by: z.string().optional(),
  produces_outcome: z.array(z.string()).optional(),
  template: z.string().optional(),
});

export const OutcomeSchema = BaseNodeSchema.extend({
  node_type: z.literal('outcome'),
  measurement_criteria: z.array(z.string()).min(1),
  derived_from_outputs: z.array(z.string()).optional(),
  contributes_to_impact: z.array(z.string()).optional(),
  timeframe: z.string().optional(),
});

export const ImpactSchema = BaseNodeSchema.extend({
  node_type: z.literal('impact'),
  strategic_goal: z.string().min(1).max(500),
  lagging_indicators: z.array(z.string()).min(1),
  driven_by_outcomes: z.array(z.string()).optional(),
  measurement_period: z.string().optional(),
});

// ============================================================================
// Framework Node Union Schema
// ============================================================================

export const FrameworkNodeSchema = z.discriminatedUnion('node_type', [
  PhaseSchema,
  SubPhaseSchema,
  SubPhaseComponentSchema,
  MentalModelSchema,
  PrincipleSchema,
  OutputSchema,
  OutcomeSchema,
  ImpactSchema,
]);

// ============================================================================
// Edge Schema
// ============================================================================

export const EdgeSchema = z
  .object({
    id: z.string().optional(),
    from_node: z.string(),
    to_node: z.string(),
    relationship_type: RelationshipTypeSchema,
    description: z.string().max(2000).optional(),
    bidirectional: z.boolean().optional().default(false),
  })
  .refine((data) => data.from_node !== data.to_node, {
    message: 'Edge cannot reference itself (from_node must not equal to_node)',
    path: ['to_node'],
  });

// ============================================================================
// Graph Metadata Schema
// ============================================================================

export const GraphMetadataSchema = z.object({
  version: z.string(),
  last_updated: z.string(),
  framework_name: z.string(),
});

// ============================================================================
// Complete Graph Schema
// ============================================================================

export const FrameworkGraphSchema = z.object({
  nodes: z.array(FrameworkNodeSchema),
  edges: z.array(EdgeSchema),
  metadata: GraphMetadataSchema,
});

// ============================================================================
// Type Inference
// ============================================================================

export type NodeTypeInferred = z.infer<typeof NodeTypeSchema>;
export type RelationshipTypeInferred = z.infer<typeof RelationshipTypeSchema>;
export type VisualizationTypeInferred = z.infer<typeof VisualizationTypeSchema>;
export type BaseNodeInferred = z.infer<typeof BaseNodeSchema>;
export type PhaseInferred = z.infer<typeof PhaseSchema>;
export type SubPhaseInferred = z.infer<typeof SubPhaseSchema>;
export type SubPhaseComponentInferred = z.infer<typeof SubPhaseComponentSchema>;
export type MentalModelInferred = z.infer<typeof MentalModelSchema>;
export type FrameworkNodeInferred = z.infer<typeof FrameworkNodeSchema>;
export type EdgeInferred = z.infer<typeof EdgeSchema>;
export type FrameworkGraphInferred = z.infer<typeof FrameworkGraphSchema>;
