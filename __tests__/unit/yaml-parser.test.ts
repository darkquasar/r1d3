import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { parseYAML, parseYAMLFile } from '@/lib/yaml/parser';
import { FlowNodeSchema, FlowEdgeSchema, NodesYAMLSchema } from '@/lib/yaml/schemas';

describe('YAML Parser', () => {
  it('should parse valid node YAML', () => {
    const yaml = `
- id: test-node
  type: phase
  description: "Test phase"
  properties:
    duration: "2 weeks"
`;
    const result = parseYAML(yaml, NodesYAMLSchema);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('test-node');
      expect(result.data[0].type).toBe('phase');
    }
  });

  it('should parse valid edge YAML', () => {
    const yaml = `
- id: edge-1
  source: node-a
  target: node-b
  type: composition
  properties: {}
`;
    const result = parseYAML(yaml, z.array(FlowEdgeSchema));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].source).toBe('node-a');
    }
  });

  it('should reject invalid schema', () => {
    const yaml = `
- id: 123
  type: invalid
`;
    const result = parseYAML(yaml, NodesYAMLSchema);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it('should handle YAML parsing errors', () => {
    const yaml = `
this is not: valid: yaml: syntax
`;
    const result = parseYAML(yaml, NodesYAMLSchema);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toBeDefined();
    }
  });

  it('should provide detailed error messages for schema violations', () => {
    const yaml = `
- id: ""
  type: phase
  description: "Test"
`;
    const result = parseYAML(yaml, NodesYAMLSchema);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some(e => e.includes('id'))).toBe(true);
    }
  });
});
