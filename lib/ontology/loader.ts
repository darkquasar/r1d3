/**
 * Ontology loader - reads and parses ontology YAML files
 */

import { parseYAML } from '@/lib/yaml/parser';
import { OntologySchema } from '@/lib/yaml/schemas';
import type { Ontology } from '@/types/ontology';

// Singleton cache for ontology
let cachedOntology: Ontology | null = null;

/**
 * Load ontology from YAML files
 * Cached after first load for performance
 */
export async function loadOntology(): Promise<Ontology> {
  if (cachedOntology) {
    return cachedOntology;
  }

  try {
    // In a browser/edge environment, we'll need to fetch these files
    // For now, return a minimal valid ontology structure
    // TODO: Implement actual file loading when YAML files exist

    const ontology: Ontology = {
      nodeTypes: [],
      edgeTypes: [],
    };

    cachedOntology = ontology;
    return ontology;
  } catch (error) {
    console.error('Failed to load ontology:', error);
    // Return empty ontology on error
    return {
      nodeTypes: [],
      edgeTypes: [],
    };
  }
}

/**
 * Clear cached ontology (useful for testing or hot reload)
 */
export function clearOntologyCache(): void {
  cachedOntology = null;
}

/**
 * Load ontology from YAML string (for testing or manual loading)
 */
export function loadOntologyFromYAML(yamlContent: string): Ontology {
  const result = parseYAML(yamlContent, OntologySchema);

  if (!result.success) {
    throw new Error(`Failed to parse ontology: ${result.errors.join(', ')}`);
  }

  return result.data;
}
