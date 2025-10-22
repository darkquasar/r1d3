/**
 * Layout Algorithms
 *
 * Dagre hierarchical layout and D3 force-directed simulation for automatic node positioning
 *
 * @packageDocumentation
 */

import dagre from 'dagre';
import * as d3Force from 'd3-force';
import type { FrameworkNode, Edge } from '../types/framework';

export interface LayoutOptions {
  direction?: 'TB' | 'LR' | 'BT' | 'RL';
  nodeWidth?: number;
  nodeHeight?: number;
  rankSep?: number;
  nodeSep?: number;
  edgeSep?: number;
}

const DEFAULT_OPTIONS: LayoutOptions = {
  direction: 'TB', // Top to Bottom
  nodeWidth: 250,
  nodeHeight: 100,
  rankSep: 100, // Vertical spacing between ranks
  nodeSep: 80, // Horizontal spacing between nodes
  edgeSep: 20,
};

/**
 * Calculate node positions using Dagre hierarchical layout
 */
export function calculateDagreLayout(
  nodes: FrameworkNode[],
  edges: Edge[],
  options: LayoutOptions = {}
): Map<string, { x: number; y: number }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Create a new directed graph
  const graph = new dagre.graphlib.Graph();

  // Set graph options
  graph.setGraph({
    rankdir: opts.direction,
    ranksep: opts.rankSep,
    nodesep: opts.nodeSep,
    edgesep: opts.edgeSep,
  });

  // Default edge label
  graph.setDefaultEdgeLabel(() => ({}));

  // Add nodes
  nodes.forEach((node) => {
    graph.setNode(node.id, {
      width: opts.nodeWidth,
      height: opts.nodeHeight,
    });
  });

  // Add edges
  edges.forEach((edge) => {
    graph.setEdge(edge.from_node, edge.to_node);
  });

  // Calculate layout
  dagre.layout(graph);

  // Extract positions
  const positions = new Map<string, { x: number; y: number }>();

  nodes.forEach((node) => {
    const nodeWithPosition = graph.node(node.id);
    if (nodeWithPosition) {
      // Dagre returns center position, adjust to top-left for ReactFlow
      positions.set(node.id, {
        x: nodeWithPosition.x - (opts.nodeWidth! / 2),
        y: nodeWithPosition.y - (opts.nodeHeight! / 2),
      });
    }
  });

  return positions;
}

/**
 * Calculate circular layout for nodes (ideal for phases that form a cycle)
 */
export function calculateCircularLayout(
  nodes: FrameworkNode[],
  options: { radius?: number; centerX?: number; centerY?: number } = {}
): Map<string, { x: number; y: number }> {
  const radius = options.radius || 300;
  const centerX = options.centerX || 400;
  const centerY = options.centerY || 300;

  const positions = new Map<string, { x: number; y: number }>();
  const nodeCount = nodes.length;

  // Arrange nodes in a circle
  nodes.forEach((node, index) => {
    // Start from top (270 degrees) and go clockwise
    const angle = (270 + (360 / nodeCount) * index) * (Math.PI / 180);
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    positions.set(node.id, { x, y });
  });

  return positions;
}

/**
 * Calculate horizontal fishbone layout with swim lanes
 *
 * Lane assignments:
 * - Lane 0 (middle): phases
 * - Lane ±1: sub-phases
 * - Lane ±2: sub-phase-components
 * - Lane ±3: mental-models
 * - Lane ±4: visualizations (special nodes)
 * - Lane ±5: principles
 * - Lane ±6: outputs
 * - Lane ±7: outcomes
 * - Lane ±8: impacts
 */
export function calculateFishboneLayout(
  nodes: FrameworkNode[],
  edges: Edge[],
  options: {
    laneSpacing?: number;
    horizontalSpacing?: number;
    startX?: number;
    centerY?: number;
  } = {}
): Map<string, { x: number; y: number }> {
  const laneSpacing = options.laneSpacing || 150;
  const horizontalSpacing = options.horizontalSpacing || 300;
  const startX = options.startX || 100;
  const centerY = options.centerY || 400;

  const positions = new Map<string, { x: number; y: number }>();

  // Group nodes by type for lane assignment
  const nodesByType: Record<string, FrameworkNode[]> = {
    phase: [],
    'sub-phase': [],
    'sub-phase-component': [],
    'mental-model': [],
    principle: [],
    output: [],
    outcome: [],
    impact: [],
  };

  nodes.forEach(node => {
    if (nodesByType[node.node_type]) {
      nodesByType[node.node_type].push(node);
    }
  });

  // Lane assignments (from center lane 0)
  const laneAssignments: Record<string, number> = {
    phase: 0,
    'sub-phase': 1,
    'sub-phase-component': 2,
    'mental-model': 3,
    principle: 5,
    output: 6,
    outcome: 7,
    impact: 8,
  };

  // Build dependency graph for left-to-right ordering
  const dependencyMap = new Map<string, Set<string>>();
  edges.forEach(edge => {
    if (!dependencyMap.has(edge.to_node)) {
      dependencyMap.set(edge.to_node, new Set());
    }
    dependencyMap.get(edge.to_node)!.add(edge.from_node);
  });

  // Topological sort for left-to-right ordering within each type
  function topologicalSort(nodesOfType: FrameworkNode[]): FrameworkNode[] {
    const sorted: FrameworkNode[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    function visit(node: FrameworkNode) {
      if (visited.has(node.id)) return;
      if (visiting.has(node.id)) return; // Cycle detected, skip

      visiting.add(node.id);

      // Visit dependencies first
      const deps = dependencyMap.get(node.id);
      if (deps) {
        deps.forEach(depId => {
          const depNode = nodesOfType.find(n => n.id === depId);
          if (depNode) visit(depNode);
        });
      }

      visiting.delete(node.id);
      visited.add(node.id);
      sorted.push(node);
    }

    nodesOfType.forEach(visit);
    return sorted;
  }

  // Position nodes in each swim lane
  Object.entries(nodesByType).forEach(([type, nodesOfType]) => {
    if (nodesOfType.length === 0) return;

    const lane = laneAssignments[type] || 0;
    const sortedNodes = topologicalSort(nodesOfType);

    // Alternate between above and below center line for visual balance
    const useNegativeLane = Math.random() > 0.5 && lane !== 0;
    const actualLane = useNegativeLane ? -lane : lane;

    sortedNodes.forEach((node, index) => {
      const x = startX + (index * horizontalSpacing);
      const y = centerY + (actualLane * laneSpacing);

      positions.set(node.id, { x, y });
    });
  });

  return positions;
}

/**
 * Calculate hybrid layout: 2x2 grid for phases, git-style branches for everything else
 */
export function calculateHybridLayout(
  nodes: FrameworkNode[],
  edges: Edge[],
  options: {
    phaseCenterX?: number;
    phaseCenterY?: number;
    phaseSpacingX?: number;
    phaseSpacingY?: number;
    branchSpacing?: number;
    verticalSpacing?: number;
  } = {}
): Map<string, { x: number; y: number }> {
  const phaseCenterX = options.phaseCenterX || 800;
  const phaseCenterY = options.phaseCenterY || 600;
  const phaseSpacingX = options.phaseSpacingX || 600; // Horizontal spacing between phases
  const phaseSpacingY = options.phaseSpacingY || 400; // Vertical spacing between phases
  const branchSpacing = options.branchSpacing || 350;
  const verticalSpacing = options.verticalSpacing || 200;

  const positions = new Map<string, { x: number; y: number }>();

  // 1. Separate nodes by type
  const phases = nodes.filter(n => n.node_type === 'phase');
  const subPhases = nodes.filter(n => n.node_type === 'sub-phase');
  const components = nodes.filter(n => n.node_type === 'sub-phase-component');
  const mentalModels = nodes.filter(n => n.node_type === 'mental-model');

  // 2. Position phases in a 2x2 grid (magic quadrant style)
  // Grid positions:
  // [0] Top-Left     [1] Top-Right
  // [2] Bottom-Left  [3] Bottom-Right
  const gridPositions = [
    { x: phaseCenterX - phaseSpacingX / 2, y: phaseCenterY - phaseSpacingY / 2 }, // Top-Left
    { x: phaseCenterX + phaseSpacingX / 2, y: phaseCenterY - phaseSpacingY / 2 }, // Top-Right
    { x: phaseCenterX - phaseSpacingX / 2, y: phaseCenterY + phaseSpacingY / 2 }, // Bottom-Left
    { x: phaseCenterX + phaseSpacingX / 2, y: phaseCenterY + phaseSpacingY / 2 }, // Bottom-Right
  ];

  phases.forEach((phase, index) => {
    const gridPos = gridPositions[index % 4]; // Support up to 4 phases
    positions.set(phase.id, gridPos);
  });

  // 3. Build parent-child relationships
  const phaseToSubPhases = new Map<string, FrameworkNode[]>();
  const subPhaseToComponents = new Map<string, FrameworkNode[]>();

  subPhases.forEach(subPhase => {
    const parentPhase = subPhase.parent_phase;
    if (!phaseToSubPhases.has(parentPhase)) {
      phaseToSubPhases.set(parentPhase, []);
    }
    phaseToSubPhases.get(parentPhase)!.push(subPhase);
  });

  components.forEach(component => {
    const parentSubPhase = component.parent_sub_phase;
    if (!subPhaseToComponents.has(parentSubPhase)) {
      subPhaseToComponents.set(parentSubPhase, []);
    }
    subPhaseToComponents.get(parentSubPhase)!.push(component);
  });

  // 4. Position sub-phases branching outward from their parent phases
  // For 2x2 grid, branch in cardinal directions based on quadrant
  phases.forEach((phase, phaseIndex) => {
    const phasePos = positions.get(phase.id)!;
    const childSubPhases = phaseToSubPhases.get(phase.id) || [];

    // Determine branch direction based on quadrant position
    // Top-Left (0): branch left
    // Top-Right (1): branch right
    // Bottom-Left (2): branch left
    // Bottom-Right (3): branch right
    const quadrant = phaseIndex % 4;
    const branchRight = quadrant === 1 || quadrant === 3;
    const branchDirection = branchRight ? 1 : -1;

    childSubPhases.forEach((subPhase, subIndex) => {
      // Branch horizontally (left or right) from phase
      const x = phasePos.x + (branchSpacing * branchDirection);
      const y = phasePos.y + (subIndex * verticalSpacing);

      positions.set(subPhase.id, { x, y });

      // 5. Position components branching further in the same direction
      const childComponents = subPhaseToComponents.get(subPhase.id) || [];
      childComponents.forEach((component, compIndex) => {
        const compX = phasePos.x + (branchSpacing * 1.5 * branchDirection);
        const compY = phasePos.y + (subIndex * verticalSpacing) + (compIndex * 150);

        positions.set(component.id, { x: compX, y: compY });
      });
    });
  });

  return positions;
}

/**
 * Smart edge routing: calculates the best source and target handles based on node positions
 */
export function calculateSmartEdgeRouting(
  sourceId: string,
  targetId: string,
  positions: Map<string, { x: number; y: number }>
): { sourceHandle: string; targetHandle: string } {
  const sourcePos = positions.get(sourceId);
  const targetPos = positions.get(targetId);

  if (!sourcePos || !targetPos) {
    return { sourceHandle: 'right-source', targetHandle: 'left' };
  }

  // Calculate the angle from source to target
  const dx = targetPos.x - sourcePos.x;
  const dy = targetPos.y - sourcePos.y;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Normalize angle to 0-360
  const normalizedAngle = (angle + 360) % 360;

  // Choose handles based on direction
  // Right: 315-45 degrees
  // Bottom: 45-135 degrees
  // Left: 135-225 degrees
  // Top: 225-315 degrees

  let sourceHandle = 'right-source';
  let targetHandle = 'left';

  if (normalizedAngle >= 315 || normalizedAngle < 45) {
    // Target is to the right
    sourceHandle = 'right-source';
    targetHandle = 'left';
  } else if (normalizedAngle >= 45 && normalizedAngle < 135) {
    // Target is below
    sourceHandle = 'bottom';
    targetHandle = 'top';
  } else if (normalizedAngle >= 135 && normalizedAngle < 225) {
    // Target is to the left
    sourceHandle = 'left-source';
    targetHandle = 'right';
  } else {
    // Target is above
    sourceHandle = 'top-source';
    targetHandle = 'bottom-target';
  }

  return { sourceHandle, targetHandle };
}

/**
 * Get bounding box of all positioned nodes
 */
export function getGraphBounds(
  positions: Map<string, { x: number; y: number }>,
  nodeWidth: number = 250,
  nodeHeight: number = 100
): { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  positions.forEach((pos) => {
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x + nodeWidth);
    maxY = Math.max(maxY, pos.y + nodeHeight);
  });

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Force-Directed Layout Options
 */
export interface ForceDirectedOptions {
  centerX?: number;
  centerY?: number;
  nodeWidth?: number;
  nodeHeight?: number;
  linkDistance?: number;
  linkStrength?: number;
  chargeStrength?: number;
  collisionRadius?: number;
  iterations?: number;
  fixedNodes?: Map<string, { x: number; y: number }>; // Nodes to keep fixed (e.g., phase cards)
}

/**
 * Calculate force-directed layout using D3 force simulation
 *
 * This creates a physics-based layout where:
 * - Nodes repel each other (charge force)
 * - Connected nodes attract (link force)
 * - Nodes avoid overlapping (collision force)
 * - Graph stays centered (centering force)
 * - Fixed nodes remain in place (e.g., phase cards act as anchors)
 */
export function calculateForceDirectedLayout(
  nodes: FrameworkNode[],
  edges: Edge[],
  options: ForceDirectedOptions = {}
): Map<string, { x: number; y: number }> {
  const {
    centerX = 800,
    centerY = 600,
    nodeWidth = 280,
    nodeHeight = 160,
    linkDistance = 250,
    linkStrength = 0.3,
    chargeStrength = -800,
    collisionRadius = nodeWidth / 2 + 20,
    iterations = 300,
    fixedNodes = new Map(),
  } = options;

  // Create D3 simulation nodes
  interface SimulationNode extends d3Force.SimulationNodeDatum {
    id: string;
    nodeType?: string;
    fx?: number | null;
    fy?: number | null;
  }

  const simulationNodes: SimulationNode[] = nodes.map(node => {
    const fixed = fixedNodes.get(node.id);

    // Determine initial position
    let initialX: number;
    let initialY: number;

    if (fixed) {
      // Use fixed position for anchored nodes (phases, sub-phases, components)
      initialX = fixed.x;
      initialY = fixed.y;
    } else {
      // For free nodes (mental models, visualizations), start them OUTSIDE the phase grid
      // Use a radial distribution around the center to avoid clustering at center
      const angle = Math.random() * 2 * Math.PI;
      const distance = 500 + Math.random() * 200; // 500-700px from center
      initialX = centerX + distance * Math.cos(angle);
      initialY = centerY + distance * Math.sin(angle);
    }

    return {
      id: node.id,
      nodeType: node.node_type,
      x: initialX,
      y: initialY,
      // Fix nodes that should stay in place
      fx: fixed?.x ?? null,
      fy: fixed?.y ?? null,
    };
  });

  // Create D3 simulation links
  interface SimulationLink extends d3Force.SimulationLinkDatum<SimulationNode> {
    source: string | SimulationNode;
    target: string | SimulationNode;
  }

  const simulationLinks: SimulationLink[] = edges.map(edge => ({
    source: edge.from_node,
    target: edge.to_node,
  }));

  // Create force simulation
  const simulation = d3Force.forceSimulation<SimulationNode>(simulationNodes)
    // Link force: connected nodes attract each other
    .force('link', d3Force.forceLink<SimulationNode, SimulationLink>(simulationLinks)
      .id(d => d.id)
      .distance(linkDistance)
      .strength(linkStrength)
    )
    // Charge force: nodes repel each other
    .force('charge', d3Force.forceManyBody<SimulationNode>()
      .strength(chargeStrength)
    )
    // Collision force: prevent node overlap with per-node radii
    .force('collision', d3Force.forceCollide<SimulationNode>()
      .radius((node: SimulationNode) => {
        // Different collision radii based on node type
        switch (node.nodeType) {
          case 'phase':
            return 220; // Phases are large, need more space
          case 'sub-phase':
            return 200;
          case 'sub-phase-component':
            return 180;
          case 'mental-model':
            return 190; // Mental models need good spacing
          case 'visualization':
            return 170; // Visualizations can be closer
          default:
            return collisionRadius; // Fallback to default
        }
      })
      .strength(1.2) // Strong collision to prevent overlap
      .iterations(3) // Multiple iterations for better collision detection
    )
    // Center force: keep graph centered
    .force('center', d3Force.forceCenter<SimulationNode>(centerX, centerY)
      .strength(0.05)
    );

  // Run simulation for specified iterations
  simulation.stop();
  for (let i = 0; i < iterations; i++) {
    simulation.tick();
  }

  // Extract final positions
  const positions = new Map<string, { x: number; y: number }>();
  simulationNodes.forEach(node => {
    positions.set(node.id, {
      x: node.x ?? centerX,
      y: node.y ?? centerY,
    });
  });

  return positions;
}

/**
 * Calculate visualization position in the same direction as mental model
 *
 * Uses vector math to position visualization nodes along the same directional
 * vector as their parent mental model (relative to phase grid center).
 *
 * Example: If mental model is positioned upper-right from center,
 * visualization will be further upper-right in the same direction.
 *
 * @param mentalModelPos - Position of the mental model node
 * @param phaseGridCenter - Center point of the phase grid
 * @param distance - Distance from mental model to visualization (default: 350px)
 * @returns Calculated position for the visualization node
 */
export function calculateVisualizationPosition(
  mentalModelPos: { x: number; y: number },
  phaseGridCenter: { x: number; y: number },
  distance: number = 350
): { x: number; y: number } {
  // Calculate displacement vector from center to mental model
  const vectorX = mentalModelPos.x - phaseGridCenter.x;
  const vectorY = mentalModelPos.y - phaseGridCenter.y;

  // Calculate magnitude (length) of the vector
  const magnitude = Math.sqrt(vectorX ** 2 + vectorY ** 2);

  // Edge case: Mental model is at center (no direction)
  if (magnitude === 0) {
    // Default to placing visualization to the right
    return {
      x: mentalModelPos.x + distance,
      y: mentalModelPos.y,
    };
  }

  // Normalize the vector (make it unit length)
  const normalizedX = vectorX / magnitude;
  const normalizedY = vectorY / magnitude;

  // Position visualization 'distance' pixels further in the SAME direction
  return {
    x: mentalModelPos.x + normalizedX * distance,
    y: mentalModelPos.y + normalizedY * distance,
  };
}
