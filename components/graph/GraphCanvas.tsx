/**
 * GraphCanvas Component
 *
 * Main ReactFlow canvas for displaying and interacting with the framework graph.
 * Handles node positioning, zoom/pan controls, and user interactions.
 */

'use client';

import { useCallback, useMemo, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type NodeTypes,
  type EdgeTypes,
  type Node,
  type Edge,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

import CustomNode from './CustomNode';
import CustomEdge from './CustomEdge';
import StraightEdge from './StraightEdge';
import SmartStraightEdge from './SmartStraightEdge';
import SmartBezierEdge from './SmartBezierEdge';
import SmoothStepEdge from './SmoothStepEdge';
import VisualizationNode from './VisualizationNode';
import GroupContainerNode from './GroupContainerNode';
import type { ReactFlowFrameworkNode, ReactFlowFrameworkEdge } from '@/types/graph';
import type { FrameworkNode, Edge as FrameworkEdge } from '@/types/framework';
import { calculateForceDirectedLayout } from '@/lib/layout-algorithms';
import {
  selectVisibleMentalModelIds,
  selectVisibleVisualizationIds,
  selectEdgesToRender,
} from '@/lib/graph-selectors';
import { TopologyManager, type GraphEdge, type GraphNode } from '@/lib/topology-manager';
import { updateNodesIncremental, updateEdgesIncremental } from '@/lib/reactflow-helpers';
import { getGroupingConfig } from '@/lib/grouping-config';
import { generateGroupNodes } from '@/lib/group-manager';

interface GraphCanvasProps {
  initialNodes: ReactFlowFrameworkNode[];
  initialEdges: ReactFlowFrameworkEdge[];
  mentalModelNodes: ReactFlowFrameworkNode[];
  allNodes: FrameworkNode[];
  mentalModelToggles: Map<string, Set<string>>;
  visualizationToggles: Set<string>;
  selectedNodeId?: string;
  focusNodeId?: string; // Node to programmatically focus on
  onNodeSelect?: (node: FrameworkNode) => void;
  onEdgeSelect?: (edge: ReactFlowFrameworkEdge) => void;
  onToggleVisualization?: (modelId: string, show: boolean) => void;
  onPaneClick?: (event: React.MouseEvent | MouseEvent) => void; // Called when user clicks on the canvas background
}

// Register custom node and edge types
const nodeTypes: NodeTypes = {
  phase: CustomNode,
  'sub-phase': CustomNode,
  'sub-phase-component': CustomNode,
  'mental-model': CustomNode,
  visualization: VisualizationNode,
  'group-container': GroupContainerNode,  // Visual group box
  'boundary-obstacle': () => null,          // Invisible boundary nodes
};

const edgeTypes: EdgeTypes = {
  default: CustomEdge,
  straight: SmartStraightEdge,  // Smart straight edge for mental model connections
  smartBezier: SmartBezierEdge,  // Smart bezier edge for visualization connections
  smoothStep: SmoothStepEdge,    // Smooth step edge with rounded elbows (configured in topology.yaml)
};

/**
 * Helper: Build edge signature for change detection
 */
function buildEdgeSignature(
  mentalModelToggles: Map<string, Set<string>>,
  visualizationToggles: Set<string>
): string {
  const edges: string[] = [];

  // Mental model edges
  mentalModelToggles.forEach((nodes, modelId) => {
    nodes.forEach(nodeId => {
      edges.push(`${nodeId}->${modelId}`);
    });
  });

  // Visualization edges
  visualizationToggles.forEach(modelId => {
    edges.push(`${modelId}->viz-${modelId}`);
  });

  return edges.sort().join('|');
}

/**
 * Inner GraphCanvas component that uses useReactFlow hook
 */
function GraphCanvasInner({
  initialNodes,
  initialEdges,
  mentalModelNodes,
  allNodes,
  mentalModelToggles,
  visualizationToggles,
  selectedNodeId,
  focusNodeId,
  onNodeSelect,
  onEdgeSelect,
  onToggleVisualization,
  onPaneClick,
}: GraphCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { fitView, setCenter, getNodes } = useReactFlow();
  const previousFocusNodeId = useRef<string | undefined>(undefined);

  // Persist mental model positions across selections
  const mentalModelPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Persist visualization positions across selections
  const visualizationPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Track which nodes have been manually dragged by the user
  const userDraggedNodesRef = useRef<Set<string>>(new Set());

  // Track edge signature for change detection (triggers re-simulation)
  const edgeSignatureRef = useRef<string>('');

  // Constants for phase grid center
  const PHASE_GRID_CENTER_X = 800;
  const PHASE_GRID_CENTER_Y = 600;

  // ============================================================================
  // EFFECT 1: Force Simulation (runs only when edge topology changes)
  // ============================================================================
  useEffect(() => {
    // Use selector functions for declarative visibility
    const visibleMentalModelIds = selectVisibleMentalModelIds(mentalModelToggles);
    const visibleVisualizationIds = selectVisibleVisualizationIds(visualizationToggles, visibleMentalModelIds);

    setNodes(currentNodes => {
      // Get current primary nodes with their positions
      const currentPrimaryNodes = currentNodes.filter(n =>
        initialNodes.some(init => init.id === n.id)
      );

      // Preserve current positions
      const primaryNodesWithPositions = initialNodes.map(initNode => {
        const currentNode = currentPrimaryNodes.find(n => n.id === initNode.id);
        return currentNode || initNode;
      });

      if (visibleMentalModelIds.size === 0) {
        // No mental models visible - use incremental update
        return updateNodesIncremental(
          currentNodes,
          visibleMentalModelIds,
          visibleVisualizationIds,
          mentalModelPositionsRef.current,
          visualizationPositionsRef.current,
          mentalModelNodes,
          allNodes
        );
      }

      // Filter mental models to show
      const modelsToShow = mentalModelNodes.filter(mm =>
        visibleMentalModelIds.has(mm.id)
      );

      // DYNAMIC FORCE-DIRECTED LAYOUT with re-simulation on topology changes
      // Check if edge topology has changed (triggers re-simulation)
      const currentEdgeSignature = buildEdgeSignature(mentalModelToggles, visualizationToggles);
      const shouldReSimulate = currentEdgeSignature !== edgeSignatureRef.current;

      // Identify which mental models have visualizations
      const modelsWithVisualizations = modelsToShow.filter(model => {
        const mentalModelData = allNodes.find(n => n.id === model.id);
        if (!mentalModelData || mentalModelData.node_type !== 'mental-model') return false;
        return (
          (mentalModelData.visualization_type === 'heatmap' && mentalModelData.stages?.length) ||
          (mentalModelData.visualization_type === 'funnel' && mentalModelData.stages?.length) ||
          (mentalModelData.visualization_type === 'svg' && mentalModelData.svg_config)
        );
      });

      if (shouldReSimulate) {
        // Edge topology changed - update signature and re-run force simulation
        edgeSignatureRef.current = currentEdgeSignature;

        // CRITICAL FIX (T168): Clear all drag flags on topology change
        // This resolves the Catch-22 where dragged nodes couldn't be recalculated
        // New topology = new optimal positions, so user drags are no longer relevant
        userDraggedNodesRef.current.clear();
        // Build graph with primary nodes + mental models + visualizations for force simulation
        const nodesForSimulation: FrameworkNode[] = [
          ...primaryNodesWithPositions.map(n => allNodes.find(node => node.id === n.id)!).filter(Boolean),
          ...modelsToShow.map(m => allNodes.find(node => node.id === m.id)!).filter(Boolean),
        ];

        // Add visualization nodes as special nodes in simulation
        modelsWithVisualizations.forEach(model => {
          const mentalModelData = allNodes.find(n => n.id === model.id);
          if (mentalModelData) {
            // Create a pseudo-node for the visualization
            nodesForSimulation.push({
              id: `viz-${model.id}`,
              name: `Visualization of ${mentalModelData.name}`,
              node_type: 'visualization' as any, // Not a real FrameworkNode type, but we track it
              version: mentalModelData.version,
              description: '',
            });
          }
        });

        // Build edges: From ALL nodes that have toggled mental models ON
        const edgesForSimulation: FrameworkEdge[] = [];

        // Primary node -> Mental model edges (from ALL toggled nodes, not just selected)
        mentalModelToggles.forEach((toggledByNodes, modelId) => {
          if (visibleMentalModelIds.has(modelId)) {
            toggledByNodes.forEach(nodeId => {
              edgesForSimulation.push({
                id: `mental-${nodeId}-${modelId}`,
                from_node: nodeId,
                to_node: modelId,
                relationship_type: 'linked-to',
              });
            });
          }
        });

        // Mental model -> Visualization edges (only for toggled visualizations)
        visualizationToggles.forEach(modelId => {
          if (visibleMentalModelIds.has(modelId)) {
            edgesForSimulation.push({
              id: `viz-${modelId}`,
              from_node: modelId,
              to_node: `viz-${modelId}`,
              relationship_type: 'visualizes',
            });
          }
        });

        // Fix primary node positions (phases, sub-phases, components stay in place)
        const fixedNodes = new Map<string, { x: number; y: number }>();
        primaryNodesWithPositions.forEach(node => {
          fixedNodes.set(node.id, node.position);
        });

        // Run force-directed simulation with updated parameters for better spacing
        const forcePositions = calculateForceDirectedLayout(
          nodesForSimulation,
          edgesForSimulation,
          {
            centerX: PHASE_GRID_CENTER_X,
            centerY: PHASE_GRID_CENTER_Y,
            nodeWidth: 280,
            nodeHeight: 160,
            linkDistance: 350,      // Increased: more space between connected nodes
            linkStrength: 0.4,      // Reduced: weaker pull, allows more spreading
            chargeStrength: -2000,  // Increased: stronger repulsion keeps nodes apart
            collisionRadius: 190,   // Increased: default collision (per-node overrides in algorithm)
            iterations: 400,        // More iterations for better settling
            fixedNodes,
          }
        );

        // Build graph representation for topology manager
        const graphEdges: GraphEdge[] = [];
        mentalModelToggles.forEach((toggledByNodes, modelId) => {
          toggledByNodes.forEach(nodeId => {
            graphEdges.push({ from: nodeId, to: modelId, type: 'linked-to' });
          });
        });
        visualizationToggles.forEach(modelId => {
          graphEdges.push({ from: modelId, to: `viz-${modelId}`, type: 'visualizes' });
        });

        const graphNodes: GraphNode[] = allNodes.map(n => ({ id: n.id, type: n.node_type }));

        // Get nodes that need position recalculation based on topology rules
        const nodesToRecalculate = TopologyManager.getNodesRequiringRecalculation(
          graphEdges, // Changed edges (all edges since we re-simulated)
          graphNodes,
          graphEdges,
          userDraggedNodesRef.current
        );

        // Store calculated positions for mental models
        // Only update if topology rules say we should recalculate
        modelsToShow.forEach(model => {
          const forcePos = forcePositions.get(model.id);
          if (forcePos && nodesToRecalculate.has(model.id)) {
            // Topology is forcing recalculation - clear user drag flag
            userDraggedNodesRef.current.delete(model.id);
            mentalModelPositionsRef.current.set(model.id, forcePos);
          } else if (forcePos && !mentalModelPositionsRef.current.has(model.id)) {
            // First time seeing this mental model - store initial position
            mentalModelPositionsRef.current.set(model.id, forcePos);
          }
        });

        // Store calculated positions for visualizations
        modelsWithVisualizations.forEach(model => {
          const vizId = `viz-${model.id}`;
          const forcePos = forcePositions.get(vizId);
          if (forcePos && nodesToRecalculate.has(vizId)) {
            // Topology is forcing recalculation - clear user drag flag
            userDraggedNodesRef.current.delete(vizId);
            visualizationPositionsRef.current.set(vizId, forcePos);
          } else if (forcePos && !visualizationPositionsRef.current.has(vizId)) {
            // First time seeing this visualization - store initial position
            visualizationPositionsRef.current.set(vizId, forcePos);
          }
        });
      }

      // Use incremental update to preserve object references (React.memo optimization)
      // This respects BOTH mental model visibility AND visualization toggles
      const contentNodes = updateNodesIncremental(
        currentNodes,
        visibleMentalModelIds,
        visibleVisualizationIds,
        mentalModelPositionsRef.current,
        visualizationPositionsRef.current,
        mentalModelNodes,
        allNodes
      );

      // Generate group nodes from YAML config (visual boxes + boundary obstacles)
      const groupingConfig = getGroupingConfig();
      console.log('[GraphCanvas] Grouping config:', groupingConfig);

      const groupNodes = Object.values(groupingConfig.groups).flatMap(config => {
        // Use initialNodes (which always includes phases) so box appears on load
        const nodes = generateGroupNodes(config, initialNodes);
        console.log(`[GraphCanvas] Generated ${nodes.length} nodes for group ${config.id}`);
        return nodes;
      });

      console.log(`[GraphCanvas] Total nodes: ${contentNodes.length} content + ${groupNodes.length} group = ${contentNodes.length + groupNodes.length}`);

      // Disable dragging on phase nodes (they're fixed in the fishbone layout)
      const finalContentNodes = contentNodes.map(node => {
        if (node.type === 'phase') {
          return { ...node, draggable: false };
        }
        return node;
      });

      // Return groups first (zIndex: -10) so they render behind content
      return [...groupNodes, ...finalContentNodes];
    });

    // Update edges incrementally (ReactFlow-native pattern)
    // Smart edge library handles routing with geometry-based handle selection
    setEdges(currentEdges => {
      // Build node positions map for handle selection using getNodes()
      // This avoids adding 'nodes' to dependencies which would cause infinite loop
      const nodePositions = new Map<string, { x: number; y: number }>();
      getNodes().forEach(node => {
        nodePositions.set(node.id, node.position);
      });

      return updateEdgesIncremental(
        currentEdges,
        initialEdges,
        mentalModelToggles,
        visualizationToggles,
        visibleMentalModelIds,
        visibleVisualizationIds,
        nodePositions,
        allNodes
      );
    });
  }, [mentalModelToggles, visualizationToggles, initialNodes, mentalModelNodes, allNodes, setNodes, setEdges, getNodes]);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      // Notify parent about node selection for detail panel
      const frameworkNode = allNodes.find(n => n.id === node.id);
      if (frameworkNode && onNodeSelect) {
        onNodeSelect(frameworkNode);
      }
    },
    [onNodeSelect, allNodes]
  );

  const handleNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      // Mark this node as manually positioned by user
      userDraggedNodesRef.current.add(node.id);

      // Update position storage
      if (node.id.startsWith('viz-')) {
        visualizationPositionsRef.current.set(node.id, node.position);
      } else {
        // Check if it's a mental model (physics-controlled node)
        const frameworkNode = allNodes.find(n => n.id === node.id);
        if (frameworkNode?.node_type === 'mental-model') {
          mentalModelPositionsRef.current.set(node.id, node.position);
        }
      }
    },
    [allNodes]
  );

  const handleEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      if (onEdgeSelect) {
        // Find the full edge data
        const fullEdge = initialEdges.find(e => e.id === edge.id);
        if (fullEdge) {
          onEdgeSelect(fullEdge);
        }
      }
    },
    [onEdgeSelect, initialEdges]
  );

  // Programmatic focus on node when focusNodeId changes
  useEffect(() => {
    if (focusNodeId && focusNodeId !== previousFocusNodeId.current) {
      previousFocusNodeId.current = focusNodeId;

      // Find the node to focus on
      const allDisplayedNodes = [...nodes];
      const targetNode = allDisplayedNodes.find(n => n.id === focusNodeId);

      if (targetNode) {
        // Smoothly pan to the node
        setCenter(targetNode.position.x, targetNode.position.y, {
          zoom: 1.2,
          duration: 800,
        });
      }
    }
  }, [focusNodeId, nodes, setCenter]);

  // Memoize to prevent unnecessary re-renders
  const memoizedNodeTypes = useMemo(() => nodeTypes, []);
  const memoizedEdgeTypes = useMemo(() => edgeTypes, []);

  return (
    <div className="w-full h-full bg-background-primary">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onNodeDragStop={handleNodeDragStop}
        onEdgeClick={handleEdgeClick}
        onPaneClick={onPaneClick}
        nodeTypes={memoizedNodeTypes}
        edgeTypes={memoizedEdgeTypes}
        fitView
        attributionPosition="bottom-left"
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'default',
          animated: false,
        }}
        // Force edge updates when nodes change
        edgeUpdaterRadius={10}
      >
        {/* Background pattern */}
        <Background
          color="#7C3AED"
          gap={16}
          size={1}
          className="opacity-10"
        />

        {/* Zoom and pan controls */}
        <Controls
          className="bg-background-secondary border border-purple-primary/30 rounded-lg"
          showInteractive={false}
        />

        {/* Minimap for navigation */}
        <MiniMap
          className="bg-background-secondary border border-purple-primary/30 rounded-lg"
          nodeColor={(node) => {
            const nodeType = node.type || 'phase';
            const colors: Record<string, string> = {
              phase: '#7C3AED',
              'sub-phase': '#A78BFA',
              'sub-phase-component': '#C4B5FD',
              'mental-model': '#D4C5F9',
            };
            return colors[nodeType] || '#7C3AED';
          }}
          maskColor="rgba(26, 11, 46, 0.8)"
        />
      </ReactFlow>
    </div>
  );
}

/**
 * Main GraphCanvas component wrapped with ReactFlowProvider
 */
export default function GraphCanvas(props: GraphCanvasProps) {
  return (
    <ReactFlowProvider>
      <GraphCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
