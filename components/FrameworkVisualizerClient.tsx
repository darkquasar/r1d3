/**
 * Framework Visualizer Client Component
 *
 * Client-side wrapper for the graph visualization with detail panel
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import GraphCanvas from './graph/GraphCanvas';
import DetailPanel from './panels/DetailPanel';
import NodeDetails from './panels/NodeDetails';
import EdgeDetails from './panels/EdgeDetails';
import NavigationHistory from './panels/NavigationHistory';
import TypeFilterPanel from './panels/TypeFilterPanel';
import OntologyPanel from './panels/OntologyPanel';
import type { ReactFlowFrameworkNode, ReactFlowFrameworkEdge } from '@/types/graph';
import type { FrameworkNode, Edge } from '@/types/framework';
import type { NodeType } from '@/lib/node-type-config';

interface FrameworkVisualizerClientProps {
  initialNodes: ReactFlowFrameworkNode[];
  initialEdges: ReactFlowFrameworkEdge[];
  mentalModelNodes: ReactFlowFrameworkNode[];
  allNodes: FrameworkNode[];
}

export default function FrameworkVisualizerClient({
  initialNodes,
  initialEdges,
  mentalModelNodes,
  allNodes,
}: FrameworkVisualizerClientProps) {
  const [selectedNode, setSelectedNode] = useState<FrameworkNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

  // NEW: Per-node mental model toggles
  // Map<mental model ID, Set<node IDs that have toggled it ON>>
  const [mentalModelToggles, setMentalModelToggles] = useState<Map<string, Set<string>>>(
    new Map()
  );

  // NEW: Per-mental-model visualization toggles
  // Set of mental model IDs that have their visualization toggled ON
  const [visualizationToggles, setVisualizationToggles] = useState<Set<string>>(
    new Set()
  );

  const [sourcePhaseId, setSourcePhaseId] = useState<string | null>(null);
  const [focusNodeId, setFocusNodeId] = useState<string | undefined>(undefined);

  // Type filtering - only show primary framework nodes in canvas
  // Outputs, outcomes, impacts, and principles are shown in detail panels only
  const [visibleTypes, setVisibleTypes] = useState<Set<NodeType>>(
    new Set<NodeType>([
      'phase',
      'sub-phase',
      'sub-phase-component',
      'mental-model',
      // Note: These types are intentionally excluded from canvas - they appear in detail panels only:
      // - 'principle' (guiding principles)
      // - 'output' (deliverables/findings)
      // - 'outcome' (measurable changes)
      // - 'impact' (strategic goals)
    ])
  );
  const [showTypeFilter, setShowTypeFilter] = useState<boolean>(false);
  const [showOntology, setShowOntology] = useState<boolean>(false);

  // Navigation history
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Navigate to a node by ID
  const navigateToNode = useCallback((nodeId: string) => {
    const node = allNodes.find(n => n.id === nodeId);
    if (!node) return;

    // Add to history (trim any forward history when navigating from middle)
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(nodeId);
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);

    // Select and focus on the node
    setSelectedNode(node);
    setSelectedEdge(null);
    setFocusNodeId(nodeId);

    // Update source phase for mental models
    if (node.node_type === 'phase') {
      setSourcePhaseId(node.id);
    }
  }, [allNodes, historyIndex]);

  // Go back in history
  const handleBack = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const nodeId = history[newIndex];
      const node = allNodes.find(n => n.id === nodeId);
      if (node) {
        setSelectedNode(node);
        setSelectedEdge(null);
        setFocusNodeId(nodeId);
        if (node.node_type === 'phase') {
          setSourcePhaseId(node.id);
        }
      }
    }
  }, [historyIndex, history, allNodes]);

  // Go forward in history
  const handleForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const nodeId = history[newIndex];
      const node = allNodes.find(n => n.id === nodeId);
      if (node) {
        setSelectedNode(node);
        setSelectedEdge(null);
        setFocusNodeId(nodeId);
        if (node.node_type === 'phase') {
          setSourcePhaseId(node.id);
        }
      }
    }
  }, [historyIndex, history, allNodes]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt+Left = Back
      if (event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault();
        handleBack();
      }
      // Alt+Right = Forward
      if (event.altKey && event.key === 'ArrowRight') {
        event.preventDefault();
        handleForward();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleBack, handleForward]);

  // Global click handler to close TypeFilterPanel when clicking outside
  useEffect(() => {
    if (!showTypeFilter) return;

    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is inside the TypeFilterPanel
      const isClickInsidePanel = target.closest('[data-type-filter-panel]');
      if (!isClickInsidePanel) {
        setShowTypeFilter(false);
      }
    };

    // Add listener with a slight delay to avoid immediate closure
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleGlobalClick, true); // Use capture phase
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, [showTypeFilter]);

  const handleClosePanel = () => {
    setSelectedNode(null);
    setSelectedEdge(null);
    // Note: Don't close TypeFilterPanel here - it's independent of DetailPanel
  };

  const handleNodeSelect = (node: FrameworkNode) => {
    navigateToNode(node.id);
    setShowTypeFilter(true); // Show type filter when node is selected
  };

  const handleToggleType = useCallback((nodeType: NodeType) => {
    setVisibleTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeType)) {
        newSet.delete(nodeType);
      } else {
        newSet.add(nodeType);
      }
      return newSet;
    });
  }, []);

  const handleEdgeSelect = (edge: ReactFlowFrameworkEdge) => {
    setSelectedEdge(edge.data);
    setSelectedNode(null);
  };

  // NEW: Toggle mental model for a specific node
  const handleToggleMentalModel = useCallback((nodeId: string, modelId: string, show: boolean) => {
    setMentalModelToggles(prev => {
      const newToggles = new Map(prev);

      if (show) {
        // Toggle ON: add nodeId to the set for this mental model
        if (!newToggles.has(modelId)) {
          newToggles.set(modelId, new Set());
        }
        newToggles.get(modelId)!.add(nodeId);
      } else {
        // Toggle OFF: remove nodeId from the set
        if (newToggles.has(modelId)) {
          newToggles.get(modelId)!.delete(nodeId);

          // Clean up: if no nodes have this mental model toggled ON, remove it completely
          if (newToggles.get(modelId)!.size === 0) {
            newToggles.delete(modelId);

            // Also hide visualization when mental model is completely hidden
            setVisualizationToggles(prevViz => {
              const newVizToggles = new Set(prevViz);
              newVizToggles.delete(modelId);
              return newVizToggles;
            });
          }
        }
      }

      return newToggles;
    });
  }, []);

  // NEW: Toggle all mental models for the current selected node
  const handleToggleAllMentalModels = useCallback((show: boolean) => {
    if (!selectedNode || !selectedNode.linked_mental_models) return;

    const nodeId = selectedNode.id;
    const linkedModels = selectedNode.linked_mental_models;

    setMentalModelToggles(prev => {
      const newToggles = new Map(prev);

      linkedModels.forEach(modelId => {
        if (show) {
          // Toggle all ON for this node
          if (!newToggles.has(modelId)) {
            newToggles.set(modelId, new Set());
          }
          newToggles.get(modelId)!.add(nodeId);
        } else {
          // Toggle all OFF for this node
          if (newToggles.has(modelId)) {
            newToggles.get(modelId)!.delete(nodeId);
            if (newToggles.get(modelId)!.size === 0) {
              newToggles.delete(modelId);

              // Hide visualization
              setVisualizationToggles(prevViz => {
                const newVizToggles = new Set(prevViz);
                newVizToggles.delete(modelId);
                return newVizToggles;
              });
            }
          }
        }
      });

      return newToggles;
    });
  }, [selectedNode]);

  // NEW: Toggle visualization for a mental model
  const handleToggleVisualization = useCallback((modelId: string, show: boolean) => {
    setVisualizationToggles(prev => {
      const newToggles = new Set(prev);
      if (show) {
        newToggles.add(modelId);
      } else {
        newToggles.delete(modelId);
      }
      return newToggles;
    });
  }, []);

  const isPanelOpen = selectedNode !== null || selectedEdge !== null;

  // Filter nodes and edges based on visible types
  const filteredNodes = initialNodes.filter(node =>
    visibleTypes.has(node.data.node_type)
  );
  const filteredMentalModelNodes = mentalModelNodes.filter(node =>
    visibleTypes.has(node.data.node_type)
  );

  // Create a combined list of all visible nodes for edge filtering
  // This includes both primary nodes and mental model nodes
  const allVisibleNodes = [...filteredNodes, ...filteredMentalModelNodes];
  const visibleNodeIds = new Set(allVisibleNodes.map(n => n.id));

  // Only show edges where both source and target nodes are visible
  // This properly handles edges between all node types including mental models
  const filteredEdges = initialEdges.filter(edge => {
    // Check if both source and target are in the visible node set
    return visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target);
  });

  // NEW: Calculate which mental models are visible (have any toggles ON)
  // Only include mental models whose type is currently visible in type filter
  const visibleMentalModelIds = visibleTypes.has('mental-model')
    ? Array.from(mentalModelToggles.entries())
        .filter(([_, toggledByNodes]) => toggledByNodes.size > 0)
        .map(([modelId]) => modelId)
    : [];

  return (
    <>
      {/* Type Filter Panel - shows when a node is selected */}
      {showTypeFilter && (
        <TypeFilterPanel
          visibleTypes={visibleTypes}
          onToggleType={handleToggleType}
          onShowOntologyInfo={() => setShowOntology(true)}
        />
      )}

      {/* Ontology Documentation Panel */}
      <OntologyPanel
        isOpen={showOntology}
        onClose={() => setShowOntology(false)}
      />

      <GraphCanvas
        initialNodes={filteredNodes}
        initialEdges={filteredEdges}
        mentalModelNodes={filteredMentalModelNodes}
        allNodes={allNodes}
        mentalModelToggles={mentalModelToggles}
        visualizationToggles={visualizationToggles}
        selectedNodeId={sourcePhaseId || undefined}
        focusNodeId={focusNodeId}
        onNodeSelect={handleNodeSelect}
        onEdgeSelect={handleEdgeSelect}
        onToggleVisualization={handleToggleVisualization}
        onPaneClick={undefined} // Don't close on pane click - handled by global listener
      />

      <DetailPanel
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        title={selectedNode ? selectedNode.name : selectedEdge ? 'Relationship' : 'Details'}
      >
        {/* Navigation History */}
        <NavigationHistory
          canGoBack={historyIndex > 0}
          canGoForward={historyIndex < history.length - 1}
          onBack={handleBack}
          onForward={handleForward}
          historyCount={history.length}
        />

        {selectedNode && (
          <NodeDetails
            node={selectedNode}
            onToggleMentalModel={handleToggleMentalModel}
            onToggleAllMentalModels={handleToggleAllMentalModels}
            mentalModelToggles={mentalModelToggles}
            onNavigateToNode={navigateToNode}
            onToggleVisualization={handleToggleVisualization}
            visualizationToggles={visualizationToggles}
          />
        )}
        {selectedEdge && (
          <EdgeDetails
            edge={selectedEdge}
            onNavigateToNode={navigateToNode}
          />
        )}
      </DetailPanel>
    </>
  );
}
