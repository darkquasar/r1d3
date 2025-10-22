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
import VisualizationNode from './VisualizationNode';
import type { ReactFlowFrameworkNode, ReactFlowFrameworkEdge } from '@/types/graph';
import type { FrameworkNode, Edge as FrameworkEdge } from '@/types/framework';
import { calculateForceDirectedLayout } from '@/lib/layout-algorithms';
import {
  selectVisibleMentalModelIds,
  selectVisibleVisualizationIds,
  selectNodesToRender,
  selectEdgesToRender,
} from '@/lib/graph-selectors';

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
};

const edgeTypes: EdgeTypes = {
  default: CustomEdge,
  straight: StraightEdge,
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
  const { fitView, setCenter } = useReactFlow();
  const previousFocusNodeId = useRef<string | undefined>(undefined);

  // Persist mental model positions across selections
  const mentalModelPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Persist visualization positions across selections
  const visualizationPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Track edge signature for change detection (triggers re-simulation)
  const edgeSignatureRef = useRef<string>('');

  // Constants for phase grid center
  const PHASE_GRID_CENTER_X = 800;
  const PHASE_GRID_CENTER_Y = 600;

  // ============================================================================
  // EFFECT 1: Force Simulation (runs only when edge topology changes)
  // ============================================================================
  useEffect(() => {
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

      // Calculate which mental models are visible (have any toggles ON)
      const visibleMentalModelIds = Array.from(mentalModelToggles.entries())
        .filter(([_, nodes]) => nodes.size > 0)
        .map(([modelId]) => modelId);

      if (visibleMentalModelIds.length === 0) {
        // No mental models visible
        return primaryNodesWithPositions;
      }

      // Filter mental models to show
      const modelsToShow = mentalModelNodes.filter(mm =>
        visibleMentalModelIds.includes(mm.id)
      );

      // DYNAMIC FORCE-DIRECTED LAYOUT with re-simulation on topology changes
      const PHASE_GRID_CENTER_X = 800;
      const PHASE_GRID_CENTER_Y = 600;

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
          if (visibleMentalModelIds.includes(modelId)) {
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
          if (visibleMentalModelIds.includes(modelId)) {
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

        // Store calculated positions for mental models
        modelsToShow.forEach(model => {
          const forcePos = forcePositions.get(model.id);
          if (forcePos && !mentalModelPositionsRef.current.has(model.id)) {
            mentalModelPositionsRef.current.set(model.id, forcePos);
          }
        });

        // Store calculated positions for visualizations
        modelsWithVisualizations.forEach(model => {
          const vizId = `viz-${model.id}`;
          const forcePos = forcePositions.get(vizId);
          if (forcePos && !visualizationPositionsRef.current.has(vizId)) {
            visualizationPositionsRef.current.set(vizId, forcePos);
          }
        });
      }

      // Apply positions to mental models
      const positionedModels = modelsToShow.map((model) => {
        // Check if this mental model already exists in current nodes (preserve dragged position)
        const existingModel = currentNodes.find(n => n.id === model.id);

        if (existingModel) {
          // Mental model already exists - preserve its current position
          mentalModelPositionsRef.current.set(model.id, existingModel.position);
          return existingModel;
        }

        // Get stored position (either from force simulation or previous drag)
        const position = mentalModelPositionsRef.current.get(model.id);

        if (!position) {
          // Fallback: shouldn't happen, but place near center if no position exists
          return {
            ...model,
            position: {
              x: PHASE_GRID_CENTER_X + (Math.random() - 0.5) * 400,
              y: PHASE_GRID_CENTER_Y + (Math.random() - 0.5) * 400,
            },
          };
        }

        return {
          ...model,
          position,
        };
      });

      // Create visualization nodes for mental models that have visualizations
      // Position them using force-directed layout (or preserve dragged positions)
      const visualizationNodes: Node[] = [];
      positionedModels.forEach((model, index) => {
        const mentalModelData = allNodes.find(n => n.id === model.id);
        if (mentalModelData && mentalModelData.node_type === 'mental-model') {
          const hasVisualization =
            (mentalModelData.visualization_type === 'heatmap' && mentalModelData.stages?.length) ||
            (mentalModelData.visualization_type === 'funnel' && mentalModelData.stages?.length) ||
            (mentalModelData.visualization_type === 'svg' && mentalModelData.svg_config);

          if (hasVisualization) {
            const vizId = `viz-${model.id}`;

            // Check if visualization already exists in current nodes (preserve dragged position)
            const existingViz = currentNodes.find(n => n.id === vizId);

            let vizPosition: { x: number; y: number };

            if (existingViz) {
              // Preserve current position (dragged)
              vizPosition = existingViz.position;
              visualizationPositionsRef.current.set(vizId, vizPosition);
            } else {
              // Use stored position from force simulation
              vizPosition = visualizationPositionsRef.current.get(vizId) || {
                // Fallback: position near mental model if no force position exists
                x: model.position.x + 300,
                y: model.position.y - 100,
              };
            }

            visualizationNodes.push({
              id: vizId,
              type: 'visualization',
              position: vizPosition,
              data: {
                model: mentalModelData,
              },
              draggable: true,
            });
          }
        }
      });

      return [...primaryNodesWithPositions, ...positionedModels, ...visualizationNodes];
    });

    // Update edges separately
    setEdges(currentEdges => {
      // Keep original edges (non-mental-model edges)
      const originalEdges = currentEdges.filter(
        e => !e.id.includes('-mental-') && !e.id.startsWith('mental-viz-')
      );

      // Calculate which mental models are visible (have any toggles ON)
      const visibleMentalModelIds = Array.from(mentalModelToggles.entries())
        .filter(([_, nodes]) => nodes.size > 0)
        .map(([modelId]) => modelId);

      if (visibleMentalModelIds.length === 0) {
        return originalEdges;
      }

      // Determine which mental model edges should exist
      const desiredMentalModelEdgeIds = new Set<string>();
      const mentalModelEdgesToCreate: Edge[] = [];

      // Create edges from ALL nodes that have toggled mental models ON
      mentalModelToggles.forEach((toggledByNodes, modelId) => {
        if (visibleMentalModelIds.includes(modelId)) {
          toggledByNodes.forEach(nodeId => {
            const edgeId = `mental-${nodeId}-${modelId}`;
            desiredMentalModelEdgeIds.add(edgeId);

            // Check if this edge already exists in currentEdges
            const existingEdge = currentEdges.find(e => e.id === edgeId);
            if (existingEdge) {
              // Reuse existing edge object to prevent ghosting
              mentalModelEdgesToCreate.push(existingEdge);
            } else {
              // Create new edge only if it doesn't exist
              mentalModelEdgesToCreate.push({
                id: edgeId,
                source: nodeId,
                sourceHandle: 'right-source',
                target: modelId,
                targetHandle: 'left',
                type: 'straight',
                label: 'linked-to',
                animated: false,
                style: {
                  stroke: '#A78BFA',
                  strokeWidth: 2,
                },
              });
            }
          });
        }
      });

      // Determine which visualization edges should exist
      const desiredVizEdgeIds = new Set<string>();
      const visualizationEdgesToCreate: Edge[] = [];

      // Only create visualization edges for models that have their visualization toggled ON
      visualizationToggles.forEach(modelId => {
        if (!visibleMentalModelIds.includes(modelId)) return;

        const mentalModelData = allNodes.find(n => n.id === modelId);
        if (!mentalModelData || mentalModelData.node_type !== 'mental-model') return;

        const hasVisualization =
          (mentalModelData.visualization_type === 'heatmap' && mentalModelData.stages?.length) ||
          (mentalModelData.visualization_type === 'funnel' && mentalModelData.stages?.length) ||
          (mentalModelData.visualization_type === 'svg' && mentalModelData.svg_config);

        if (hasVisualization) {
          const edgeId = `mental-viz-${modelId}`;
          desiredVizEdgeIds.add(edgeId);

          // Check if this edge already exists
          const existingEdge = currentEdges.find(e => e.id === edgeId);
          if (existingEdge) {
            // Reuse existing edge object
            visualizationEdgesToCreate.push(existingEdge);
          } else {
            // Create new edge
            visualizationEdgesToCreate.push({
              id: edgeId,
              source: modelId,
              sourceHandle: 'right-source',
              target: `viz-${modelId}`,
              targetHandle: 'left',
              type: 'default',
              label: 'visualizes',
              animated: false,
              style: {
                stroke: '#7C3AED',
                strokeWidth: 2,
              },
            });
          }
        }
      });

      return [...originalEdges, ...mentalModelEdgesToCreate, ...visualizationEdgesToCreate];
    });
  }, [mentalModelToggles, visualizationToggles, initialNodes, mentalModelNodes, allNodes, setNodes, setEdges]);

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
