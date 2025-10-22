/**
 * TypeScript Type Definitions for R1D3 Framework Graph Visualizer
 *
 * These types define the structure of YAML files that make up the R1D3 framework.
 * All types are validated at build time using Zod schemas.
 *
 * @packageDocumentation
 */

// ============================================================================
// Enumerations
// ============================================================================

/**
 * Node types in the framework hierarchy
 */
export type NodeType =
  | 'phase'
  | 'sub-phase'
  | 'sub-phase-component'
  | 'mental-model'
  | 'principle'
  | 'output'
  | 'outcome'
  | 'impact';

/**
 * Relationship types between nodes
 */
export type RelationshipType =
  | 'contains'      // Hierarchical containment (phase → sub-phase)
  | 'precedes'      // Sequential ordering (research → discovery)
  | 'linked-to'     // Associative link (phase → mental model)
  | 'uses'          // Dependency or utilization
  | 'visualizes';   // Visualization relationship (mental model → visualization)

/**
 * Visualization strategies for mental models
 */
export type VisualizationType =
  | 'magic-quadrant'  // 2x2 matrix with interactive quadrants
  | 'sunburst'        // Radial hierarchical visualization
  | 'radial-tree'     // Tree layout in radial coordinates
  | 'x-y-curve'       // XY plot/curve visualization
  | 'funnel'          // Funnel/pipeline visualization
  | 'heatmap'         // Heatmap visualization (uses stages)
  | 'svg';            // Embedded SVG visualization

/**
 * Quadrant positions in a 2x2 matrix
 */
export type QuadrantPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

// ============================================================================
// Base Node Interface
// ============================================================================

/**
 * Common properties shared by all node types
 */
export interface BaseNode {
  /** Unique identifier (lowercase, numbers, hyphens only) */
  id: string;

  /** Discriminator for node type */
  node_type: NodeType;

  /** Display name for the node */
  name: string;

  /** Optional markdown-formatted description */
  description?: string;

  /** Semantic version (e.g., "1.0", "1.2.3") */
  version: string;

  /** Array of mental model IDs that apply to this node */
  linked_mental_models?: string[];

  /** Array of principle IDs that guide this node */
  principles?: string[];
}

// ============================================================================
// Phase Entity
// ============================================================================

/**
 * Top-level phase in the R1D3 framework
 * (e.g., Research, Discovery, Disruption, Development)
 */
export interface Phase extends BaseNode {
  node_type: 'phase';

  /** Array of sub-phase IDs contained within this phase */
  contains_sub_phases?: string[];
}

// ============================================================================
// SubPhase Entity
// ============================================================================

/**
 * Sub-phase within a parent phase
 * Breaks down the work of a phase into logical groupings
 */
export interface SubPhase extends BaseNode {
  node_type: 'sub-phase';

  /** ID of the parent phase */
  parent_phase: string;

  /** Array of sub-phase component IDs */
  contains_components?: string[];
}

// ============================================================================
// SubPhaseComponent Entity
// ============================================================================

/**
 * Specific component or activity within a sub-phase
 * Most granular level of the framework hierarchy
 */
export interface SubPhaseComponent extends BaseNode {
  node_type: 'sub-phase-component';

  /** ID of the parent sub-phase */
  parent_sub_phase: string;
}

// ============================================================================
// Mental Model Entities
// ============================================================================

/**
 * Visualization configuration for SVG-based mental models
 */
export interface SVGVisualization {
  /** Type discriminator */
  type: 'svg';

  /** Path to the SVG file relative to framework directory */
  src_file: string;
}

/**
 * A stage or step within a sequential mental model
 */
export interface Stage {
  /** Unique identifier within the mental model */
  id: string;

  /** Display name for the stage */
  name: string;

  /** Explanation of this stage */
  description: string;

  /** Key question this stage answers (e.g., "What?", "Why?", "How?") */
  dominant_question?: string;

  /** Expected artifacts from this stage */
  typical_outputs?: string[];

  /** Optional visualization configuration for this stage */
  visualization?: SVGVisualization;

  /** Optional value for heatmap intensity (0-100) */
  intensity?: number;
}

/**
 * A single quadrant in a 2x2 matrix
 */
export interface Quadrant {
  /** Position in the matrix */
  position: QuadrantPosition;

  /** Name of this quadrant (e.g., "Leaders", "Challengers") */
  name: string;

  /** Explanation of what this quadrant represents */
  description: string;
}

/**
 * Configuration for magic quadrant (2x2 matrix) visualizations
 */
export interface QuadrantConfig {
  /** Label for the X axis */
  x_axis_label: string;

  /** Label for the low end of X axis (left side) */
  x_axis_low: string;

  /** Label for the high end of X axis (right side) */
  x_axis_high: string;

  /** Label for the Y axis */
  y_axis_label: string;

  /** Label for the low end of Y axis (bottom) */
  y_axis_low: string;

  /** Label for the high end of Y axis (top) */
  y_axis_high: string;

  /** Array of exactly 4 quadrants */
  quadrants: [Quadrant, Quadrant, Quadrant, Quadrant];
}

/**
 * Mental model entity - heuristic or visualization pattern
 * Defines HOW to visualize or think about a concept
 */
export interface MentalModel extends BaseNode {
  node_type: 'mental-model';

  /** Type of visualization to use */
  visualization_type: VisualizationType;

  /** URL or citation for the mental model origin */
  source?: string;

  /** List of key principles or rules */
  principles?: string[];

  /** Sequential stages (for linear models like DAIKI, funnels, heatmaps) */
  stages?: Stage[];

  /** Configuration for magic quadrant visualizations */
  quadrant_config?: QuadrantConfig;

  /** SVG visualization configuration (for visualization_type: 'svg') */
  svg_config?: SVGVisualization;
}

/**
 * Principle entity - heuristics that guide reasoning
 * Defines HOW to think about a topic
 */
export interface Principle extends BaseNode {
  node_type: 'principle';

  /** Guidance text explaining how to apply this principle */
  guidance: string;

  /** Examples of the principle in practice */
  examples?: string[];

  /** Related principles */
  related_principles?: string[];
}

/**
 * Output entity - bounded unit of work from activities
 * Represents deliverables from framework activities
 */
export interface Output extends BaseNode {
  node_type: 'output';

  /** Type of output */
  output_type: 'finding' | 'artefact';

  /** Activity or phase that produces this output */
  produced_by?: string;

  /** Outcome(s) this output contributes to */
  produces_outcome?: string[];

  /** Template or structure for this output */
  template?: string;
}

/**
 * Outcome entity - desired change in system state
 * Transforms outputs into measurable improvements
 */
export interface Outcome extends BaseNode {
  node_type: 'outcome';

  /** Criteria for measuring achievement of this outcome */
  measurement_criteria: string[];

  /** Outputs that feed into this outcome */
  derived_from_outputs?: string[];

  /** Impact(s) this outcome contributes to */
  contributes_to_impact?: string[];

  /** Target timeframe for achieving outcome */
  timeframe?: string;
}

/**
 * Impact entity - strategic goal with lagging indicators
 * Represents measurable system-level behavioral changes
 */
export interface Impact extends BaseNode {
  node_type: 'impact';

  /** Strategic goal this impact represents */
  strategic_goal: string;

  /** Lagging indicators that demonstrate this impact */
  lagging_indicators: string[];

  /** Outcomes that contribute to this impact */
  driven_by_outcomes?: string[];

  /** Measurement period for indicators */
  measurement_period?: string;
}

// ============================================================================
// Union Type
// ============================================================================

/**
 * Any node in the framework
 */
export type FrameworkNode =
  | Phase
  | SubPhase
  | SubPhaseComponent
  | MentalModel
  | Principle
  | Output
  | Outcome
  | Impact;

// ============================================================================
// Edge Entity
// ============================================================================

/**
 * Relationship between two nodes in the graph
 */
export interface Edge {
  /** Unique identifier for the edge */
  id: string;

  /** ID of the source node */
  from_node: string;

  /** ID of the target node */
  to_node: string;

  /** Type of relationship */
  relationship_type: RelationshipType;

  /** Optional explanation of the relationship */
  description?: string;

  /** Whether the relationship flows both ways */
  bidirectional?: boolean;
}

// ============================================================================
// Graph Container
// ============================================================================

/**
 * Metadata about the framework graph
 */
export interface GraphMetadata {
  /** Semantic version of the framework */
  version: string;

  /** ISO 8601 date of last update */
  last_updated: string;

  /** Name of the framework (e.g., "R1D3") */
  framework_name: string;
}

/**
 * Complete framework graph structure
 */
export interface FrameworkGraph {
  /** All nodes (phases, sub-phases, components, mental models) */
  nodes: FrameworkNode[];

  /** All edges between nodes */
  edges: Edge[];

  /** Graph metadata */
  metadata: GraphMetadata;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for Phase nodes
 */
export function isPhase(node: FrameworkNode): node is Phase {
  return node.node_type === 'phase';
}

/**
 * Type guard for SubPhase nodes
 */
export function isSubPhase(node: FrameworkNode): node is SubPhase {
  return node.node_type === 'sub-phase';
}

/**
 * Type guard for SubPhaseComponent nodes
 */
export function isSubPhaseComponent(
  node: FrameworkNode
): node is SubPhaseComponent {
  return node.node_type === 'sub-phase-component';
}

/**
 * Type guard for MentalModel nodes
 */
export function isMentalModel(node: FrameworkNode): node is MentalModel {
  return node.node_type === 'mental-model';
}

// ============================================================================
// UI State Types (not stored in YAML)
// ============================================================================

/**
 * Selection state for UI
 */
export interface SelectionState {
  /** Currently selected node ID */
  selectedNodeId: string | null;

  /** Currently selected edge ID */
  selectedEdgeId: string | null;
}

/**
 * Navigation history state
 */
export interface NavigationHistory {
  /** Stack of previously viewed node IDs */
  history: string[];

  /** Current position in history */
  currentIndex: number;
}

/**
 * Visualization mode state
 */
export interface VisualizationMode {
  /** Current visualization type */
  mode: 'graph' | 'sunburst' | 'radial-tree' | 'magic-quadrant' | 'flat';

  /** Mental model being visualized (if applicable) */
  focusedMentalModel: string | null;
}

/**
 * Side panel state
 */
export interface PanelState {
  /** Whether detail panel is visible */
  sidePanelOpen: boolean;

  /** Content to display in panel */
  panelContent: {
    type: 'node' | 'edge';
    data: FrameworkNode | Edge;
  } | null;
}

// ============================================================================
// ReactFlow Integration Types
// ============================================================================

/**
 * Extended ReactFlow node with framework data
 */
export interface ReactFlowFrameworkNode {
  id: string;
  type: string; // Custom node type for rendering
  position: { x: number; y: number };
  data: FrameworkNode;
}

/**
 * Extended ReactFlow edge with framework data
 */
export interface ReactFlowFrameworkEdge {
  id: string;
  source: string;
  target: string;
  type?: string; // Custom edge type for rendering
  label?: string;
  data: Edge;
}

/**
 * ReactFlow-compatible graph structure
 */
export interface ReactFlowGraph {
  nodes: ReactFlowFrameworkNode[];
  edges: ReactFlowFrameworkEdge[];
}
