import { describe, it, expect, beforeAll } from 'vitest';
import { loadOntology } from '@/lib/ontology/loader';
import type { Ontology } from '@/types/ontology';

describe('Ontology Loader', () => {
  it('should load ontology from YAML files', async () => {
    // This will be a mock test until we create the actual YAML files
    // For now, we'll test the structure
    const ontology = await loadOntology();

    expect(ontology).toBeDefined();
    expect(ontology.nodeTypes).toBeDefined();
    expect(ontology.edgeTypes).toBeDefined();
    expect(Array.isArray(ontology.nodeTypes)).toBe(true);
    expect(Array.isArray(ontology.edgeTypes)).toBe(true);
  });

  it('should load node types with correct structure', async () => {
    const ontology = await loadOntology();

    if (ontology.nodeTypes.length > 0) {
      const nodeType = ontology.nodeTypes[0];
      expect(nodeType.id).toBeDefined();
      expect(nodeType.name).toBeDefined();
      expect(nodeType.description).toBeDefined();
      expect(nodeType.properties).toBeDefined();
      expect(nodeType.layout).toBeDefined();
    }
  });

  it('should load edge types with correct structure', async () => {
    const ontology = await loadOntology();

    if (ontology.edgeTypes.length > 0) {
      const edgeType = ontology.edgeTypes[0];
      expect(edgeType.id).toBeDefined();
      expect(edgeType.name).toBeDefined();
      expect(edgeType.sourceTypes).toBeDefined();
      expect(edgeType.targetTypes).toBeDefined();
      expect(Array.isArray(edgeType.sourceTypes)).toBe(true);
      expect(Array.isArray(edgeType.targetTypes)).toBe(true);
    }
  });
});
