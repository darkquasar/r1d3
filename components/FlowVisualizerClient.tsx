'use client';

/**
 * Flow Visualizer Client Component
 *
 * Client-side React Flow canvas that loads and displays YAML-based flows
 */

import { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useFlowState } from '@/lib/hooks/useFlowState';
import { useLayoutState } from '@/lib/hooks/useLayoutState';
import { flowToReactFlow } from '@/lib/transforms/flow-to-reactflow';
import { applyLayout } from '@/lib/layouts/layout-engine';
import { applySmartEdgeRouting } from '@/lib/transforms/smart-edge-router';
import FilterMenu from '@/components/FilterMenu';
import SidePanel from '@/components/SidePanel';
import CustomFlowNode from '@/components/CustomFlowNode';
import type { LayoutAlgorithm } from '@/types/layout';
import type { FlowNode } from '@/types/yaml-schema';

export default function FlowVisualizerClient() {
  const { flow, ontology, loading, error, loadExampleFlow } = useFlowState();
  const {
    layoutAlgorithm,
    layoutParams,
    setLayoutAlgorithm,
    updateLayoutParams,
    getLayoutConfig,
  } = useLayoutState();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Store base positions to prevent cumulative layout drift
  const baseNodesRef = useRef<Node[]>([]);
  const baseEdgesRef = useRef<Edge[]>([]);

  // Filter menu state
  const [showGrouping, setShowGrouping] = useState(false);
  const [smartEdgeRouting, setSmartEdgeRouting] = useState(true);
  const [isLayouting, setIsLayouting] = useState(false); // Default: enabled

  // Side panel state
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);

  // Define custom node types
  const nodeTypes = useMemo(() => ({ custom: CustomFlowNode }), []);

  // Available flows (hardcoded for now, will be dynamic later)
  const availableFlows = [
    {
      id: 'example-flow',
      name: 'Example Flow',
      description: 'Sample flow demonstrating phases, components, and principles',
      nodeCount: 10,
      edgeCount: 7,
    },
  ];

  // Load example flow on mount
  useEffect(() => {
    loadExampleFlow();
  }, []);

  // Transform flow data to React Flow format when flow changes
  useEffect(() => {
    if (flow && ontology) {
      console.log('[FlowVisualizer] Transforming flow to React Flow format...');

      const { nodes: flowNodes, edges: flowEdges } = flowToReactFlow(flow, ontology);

      console.log('[FlowVisualizer] Transformed nodes:', flowNodes.length);
      console.log('[FlowVisualizer] Transformed edges:', flowEdges.length);
      if (flowEdges.length > 0) {
        console.log('[FlowVisualizer] Sample initial edge:', JSON.stringify(flowEdges[0], null, 2));
      }

      // Store base positions for layout reference
      baseNodesRef.current = flowNodes;
      baseEdgesRef.current = flowEdges;
      console.log('[FlowVisualizer] Stored in baseEdgesRef:', baseEdgesRef.current.length, 'edges');

      setNodes(flowNodes);
      setEdges(flowEdges);
    }
  }, [flow, ontology, setNodes, setEdges]);

  // Apply layout when algorithm or params change
  useEffect(() => {
    if (baseNodesRef.current.length > 0) {
      console.log('[FlowVisualizer] Applying layout:', layoutAlgorithm, layoutParams);

      const layoutConfig = getLayoutConfig();

      // Async layout application (for ELK.js support)
      const applyLayoutAsync = async () => {
        setIsLayouting(true);
        try {
          // CRITICAL: Use base positions, not current state, to prevent cumulative drift
          const { nodes: layoutedNodes, edges: layoutedEdges } = await applyLayout(
            baseNodesRef.current,
            baseEdgesRef.current,
            layoutConfig
          );

          // Apply smart edge routing based on final node positions (if enabled)
          console.log('[FlowVisualizer] Edges before smart routing:', layoutedEdges.length);
          const finalEdges = smartEdgeRouting
            ? applySmartEdgeRouting(layoutedNodes, layoutedEdges)
            : layoutedEdges;
          console.log('[FlowVisualizer] Edges after routing:', finalEdges.length);
          if (finalEdges.length > 0) {
            console.log('[FlowVisualizer] Sample edge:', JSON.stringify(finalEdges[0], null, 2));
          }

          setNodes(layoutedNodes);
          setEdges(finalEdges);
        } catch (error) {
          console.error('[FlowVisualizer] Layout failed:', error);
        } finally {
          setIsLayouting(false);
        }
      };

      applyLayoutAsync();
    }
  }, [layoutAlgorithm, layoutParams, smartEdgeRouting, getLayoutConfig, setNodes, setEdges]);

  const handleFlowSelect = useCallback((flowId: string) => {
    // For now, only one flow available
    if (flowId === 'example-flow') {
      loadExampleFlow();
    }
  }, [loadExampleFlow]);

  const handleLayoutChange = useCallback((algorithm: LayoutAlgorithm) => {
    setLayoutAlgorithm(algorithm);
  }, [setLayoutAlgorithm]);

  const handleGroupingToggle = useCallback((show: boolean) => {
    setShowGrouping(show);
    // TODO: Show/hide grouping in Phase 6
    console.log('Grouping toggled:', show);
  }, []);

  const handleSmartEdgeRoutingToggle = useCallback((enabled: boolean) => {
    setSmartEdgeRouting(enabled);
    console.log('Smart edge routing toggled:', enabled);
  }, []);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      console.log('[FlowVisualizer] Node clicked:', node);

      // Find the original flow node from the data
      const flowNode = flow?.nodes.find(n => n.id === node.id);
      if (flowNode) {
        setSelectedNode(flowNode);
        setSidePanelOpen(true);
      }
    },
    [flow]
  );

  const handlePaneClick = useCallback(() => {
    setSidePanelOpen(false);
    setSelectedNode(null);
  }, []);

  const handleSidePanelClose = useCallback(() => {
    setSidePanelOpen(false);
    setSelectedNode(null);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading flow...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Flow</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadExampleFlow}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!flow) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No flow loaded</p>
          <button
            onClick={loadExampleFlow}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Load Example Flow
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background color="#e5e7eb" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const style = node.style as any;
            return style?.backgroundColor || '#6b7280';
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>

      {/* Layout loading indicator */}
      {isLayouting && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-white rounded-lg shadow-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-700 font-medium">Calculating layout...</span>
          </div>
        </div>
      )}

      {/* Filter Menu - Top Left */}
      <div className="absolute top-4 left-4 z-10">
        <FilterMenu
          flows={availableFlows}
          selectedFlowId={flow?.id || null}
          onFlowSelect={handleFlowSelect}
          layoutAlgorithm={layoutAlgorithm}
          onLayoutChange={handleLayoutChange}
          showGrouping={showGrouping}
          onGroupingToggle={handleGroupingToggle}
          smartEdgeRouting={smartEdgeRouting}
          onSmartEdgeRoutingToggle={handleSmartEdgeRoutingToggle}
          layoutParams={layoutParams}
          onLayoutParamsChange={updateLayoutParams}
        />
      </div>

      {/* Flow info overlay - Top Right */}
      {flow && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs z-10">
          <h3 className="font-semibold text-gray-900 mb-2">{flow.name}</h3>
          <p className="text-sm text-gray-600 mb-3">{flow.description}</p>
          <div className="flex gap-4 text-xs text-gray-500">
            <span className="font-medium">{flow.nodes.length} nodes</span>
            <span className="font-medium">{flow.edges.length} edges</span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Layout: <span className="font-medium text-gray-700">{layoutAlgorithm}</span>
          </div>
        </div>
      )}

      {/* Side Panel */}
      <SidePanel
        node={selectedNode}
        isOpen={sidePanelOpen}
        onClose={handleSidePanelClose}
      />
    </div>
  );
}
