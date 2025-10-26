import { describe, it, expect } from 'vitest';
import { validateNodeType, validateEdgeType } from '@/lib/ontology/validator';
import type { FlowNode, FlowEdge } from '@/types/yaml-schema';
import type { Ontology } from '@/types/ontology';

describe('Ontology Validator', () => {
  const mockOntology: Ontology = {
    nodeTypes: [
      {
        id: 'phase',
        name: 'Phase',
        description: 'Top-level phase',
        properties: [
          { name: 'duration', type: 'string', required: true },
        ],
        layout: {
          algorithm: 'hierarchical',
          parameters: { orientation: 0 },
        },
      },
      {
        id: 'component',
        name: 'Component',
        description: 'Component node',
        properties: [],
        layout: {
          algorithm: 'force-directed',
          parameters: { repulsion: 300 },
        },
      },
    ],
    edgeTypes: [
      {
        id: 'composition',
        name: 'Composition',
        description: 'Parent-child relationship',
        sourceTypes: ['phase'],
        targetTypes: ['component'],
        visual: {
          color: '#666666',
          style: 'solid',
        },
      },
    ],
  };

  describe('Node Type Validation', () => {
    it('should validate node with correct type', () => {
      const node: FlowNode = {
        id: 'test-phase',
        type: 'phase',
        description: 'Test phase',
        properties: { duration: '2 weeks' },
      };

      const result = validateNodeType(node, mockOntology);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject node with invalid type', () => {
      const node: FlowNode = {
        id: 'test-node',
        type: 'invalid-type',
        description: 'Test',
        properties: {},
      };

      const result = validateNodeType(node, mockOntology);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('invalid-type');
    });

    it('should reject node missing required properties', () => {
      const node: FlowNode = {
        id: 'test-phase',
        type: 'phase',
        description: 'Test phase',
        properties: {}, // Missing 'duration'
      };

      const result = validateNodeType(node, mockOntology);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('duration'))).toBe(true);
    });

    it('should accept node with extra properties', () => {
      const node: FlowNode = {
        id: 'test-phase',
        type: 'phase',
        description: 'Test phase',
        properties: {
          duration: '2 weeks',
          extra: 'allowed',
        },
      };

      const result = validateNodeType(node, mockOntology);
      expect(result.valid).toBe(true);
    });
  });

  describe('Edge Type Validation', () => {
    it('should validate edge with correct types', () => {
      const edge: FlowEdge = {
        id: 'edge-1',
        source: 'phase-1',
        target: 'comp-1',
        type: 'composition',
        properties: {},
      };

      const sourceNode: FlowNode = {
        id: 'phase-1',
        type: 'phase',
        description: 'Phase',
        properties: { duration: '1 week' },
      };

      const targetNode: FlowNode = {
        id: 'comp-1',
        type: 'component',
        description: 'Component',
        properties: {},
      };

      const result = validateEdgeType(edge, sourceNode, targetNode, mockOntology);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject edge with invalid type', () => {
      const edge: FlowEdge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        type: 'invalid-edge-type',
        properties: {},
      };

      const sourceNode: FlowNode = {
        id: 'node-1',
        type: 'phase',
        description: 'Phase',
        properties: { duration: '1 week' },
      };

      const targetNode: FlowNode = {
        id: 'node-2',
        type: 'component',
        description: 'Component',
        properties: {},
      };

      const result = validateEdgeType(edge, sourceNode, targetNode, mockOntology);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('invalid-edge-type'))).toBe(true);
    });

    it('should reject edge with incompatible source type', () => {
      const edge: FlowEdge = {
        id: 'edge-1',
        source: 'comp-1',
        target: 'comp-2',
        type: 'composition',
        properties: {},
      };

      const sourceNode: FlowNode = {
        id: 'comp-1',
        type: 'component', // composition requires 'phase' as source
        description: 'Component',
        properties: {},
      };

      const targetNode: FlowNode = {
        id: 'comp-2',
        type: 'component',
        description: 'Component',
        properties: {},
      };

      const result = validateEdgeType(edge, sourceNode, targetNode, mockOntology);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('source'))).toBe(true);
    });
  });
});
