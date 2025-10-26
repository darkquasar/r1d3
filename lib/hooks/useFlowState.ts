/**
 * React hook for managing flow state
 */

import { useState, useEffect } from 'react';
import type { Flow } from '@/types/yaml-schema';
import type { Ontology } from '@/types/ontology';
import { loadOntology } from '@/lib/ontology/loader';
import { mergeNodeFiles, mergeEdgeFiles } from '@/lib/yaml/loader';

export interface FlowStateHook {
  flow: Flow | null;
  ontology: Ontology;
  loading: boolean;
  error: string | null;
  loadExampleFlow: () => Promise<void>;
}

/**
 * Hook to manage flow loading and state
 */
export function useFlowState(): FlowStateHook {
  const [flow, setFlow] = useState<Flow | null>(null);
  const [ontology, setOntology] = useState<Ontology>({ nodeTypes: [], edgeTypes: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load ontology on mount
  useEffect(() => {
    loadOntology().then(setOntology);
  }, []);

  const loadExampleFlow = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('[useFlowState] Starting to load example flow...');

      // Fetch all YAML files
      const phasesResponse = await fetch('/flows/example-flow/nodes/phases.yaml');
      if (!phasesResponse.ok) throw new Error(`Failed to fetch phases.yaml: ${phasesResponse.status}`);
      const phasesYAML = await phasesResponse.text();
      console.log('[useFlowState] Loaded phases.yaml:', phasesYAML.substring(0, 100));

      const componentsResponse = await fetch('/flows/example-flow/nodes/components.yaml');
      if (!componentsResponse.ok) throw new Error(`Failed to fetch components.yaml: ${componentsResponse.status}`);
      const componentsYAML = await componentsResponse.text();
      console.log('[useFlowState] Loaded components.yaml');

      const principlesResponse = await fetch('/flows/example-flow/nodes/principles.yaml');
      if (!principlesResponse.ok) throw new Error(`Failed to fetch principles.yaml: ${principlesResponse.status}`);
      const principlesYAML = await principlesResponse.text();
      console.log('[useFlowState] Loaded principles.yaml');

      const compositionResponse = await fetch('/flows/example-flow/edges/composition.yaml');
      if (!compositionResponse.ok) throw new Error(`Failed to fetch composition.yaml: ${compositionResponse.status}`);
      const compositionYAML = await compositionResponse.text();
      console.log('[useFlowState] Loaded composition.yaml');

      const principlesEdgesResponse = await fetch('/flows/example-flow/edges/principles.yaml');
      if (!principlesEdgesResponse.ok) throw new Error(`Failed to fetch principles edges.yaml: ${principlesEdgesResponse.status}`);
      const principlesEdgesYAML = await principlesEdgesResponse.text();
      console.log('[useFlowState] Loaded principles edges.yaml');

      // Merge all nodes and edges
      const nodes = mergeNodeFiles([phasesYAML, componentsYAML, principlesYAML]);
      const edges = mergeEdgeFiles([compositionYAML, principlesEdgesYAML]);

      console.log('[useFlowState] Merged nodes:', nodes.length);
      console.log('[useFlowState] Merged edges:', edges.length);
      console.log('[useFlowState] Sample node:', nodes[0]);

      const loadedFlow: Flow = {
        id: 'example-flow',
        name: 'Example Flow',
        description: 'Sample flow demonstrating phases, components, and principles',
        nodes,
        edges,
        groups: [],
        metadata: {
          created: new Date(),
          modified: new Date(),
        },
      };

      console.log('[useFlowState] Flow loaded successfully:', loadedFlow);
      setFlow(loadedFlow);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load flow';
      setError(errorMessage);
      console.error('[useFlowState] Error loading flow:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    flow,
    ontology,
    loading,
    error,
    loadExampleFlow,
  };
}
