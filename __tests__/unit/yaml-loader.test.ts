/**
 * Unit Tests for YAML Loader
 *
 * Tests YAML file loading and validation
 */

import { describe, it, expect } from 'vitest';
import { loadFrameworkNodes, loadFrameworkEdges } from '@/lib/yaml-loader';

describe('YAML Loader', () => {
  describe('loadFrameworkNodes', () => {
    it('should load nodes from YAML files', () => {
      // This will fail initially because we don't have YAML files yet
      const nodes = loadFrameworkNodes('framework/nodes');
      expect(Array.isArray(nodes)).toBe(true);
    });

    it('should validate node schema', () => {
      const nodes = loadFrameworkNodes('framework/nodes');

      if (nodes.length > 0) {
        const node = nodes[0];
        expect(node).toHaveProperty('id');
        expect(node).toHaveProperty('node_type');
        expect(node).toHaveProperty('name');
        expect(node).toHaveProperty('version');
      }
    });

    it('should handle empty directories gracefully', () => {
      const nodes = loadFrameworkNodes('framework/nodes/empty');
      expect(nodes).toEqual([]);
    });
  });

  describe('loadFrameworkEdges', () => {
    it('should load edges from YAML files', () => {
      const edges = loadFrameworkEdges('framework/edges');
      expect(Array.isArray(edges)).toBe(true);
    });

    it('should validate edge schema', () => {
      const edges = loadFrameworkEdges('framework/edges');

      if (edges.length > 0) {
        const edge = edges[0];
        expect(edge).toHaveProperty('from_node');
        expect(edge).toHaveProperty('to_node');
        expect(edge).toHaveProperty('relationship_type');
      }
    });

    it('should auto-generate edge IDs if not provided', () => {
      const edges = loadFrameworkEdges('framework/edges');

      edges.forEach(edge => {
        expect(edge.id).toBeDefined();
        expect(typeof edge.id).toBe('string');
      });
    });
  });
});
