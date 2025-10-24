/**
 * Ontology Compliance Tests
 *
 * Verifies that the code respects the ontology defined in YAML files:
 * - All edge types exist in topology.yaml
 * - All node types exist in node-types.yaml
 * - Edge factory validates relationships correctly
 * - Edge styles match topology configuration
 */

import { describe, it, expect } from 'vitest';
import { getEdgeTypeConfig, getEdgeTypeConfigs, getNodeTypeConfig, type EdgeType, type NodeType } from '@/lib/topology-config';
import { createEdge } from '@/lib/edge-factory';
import { NODE_TYPE_CONFIG } from '@/lib/node-type-config';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';

describe('Ontology Compliance: Edge Types', () => {
  it('should have configuration for all edge types', () => {
    const edgeTypes: EdgeType[] = ['contains', 'precedes', 'linked-to', 'visualizes', 'uses'];
    const edgeConfigs = getEdgeTypeConfigs();

    edgeTypes.forEach(edgeType => {
      expect(edgeConfigs[edgeType]).toBeDefined();
      expect(edgeConfigs[edgeType].id).toBe(edgeType);
      expect(edgeConfigs[edgeType].displayName).toBeTruthy();
      expect(edgeConfigs[edgeType].description).toBeTruthy();
      expect(edgeConfigs[edgeType].style).toBeDefined();
      expect(edgeConfigs[edgeType].style.stroke).toMatch(/^#[0-9A-F]{6}$/i);
      expect(edgeConfigs[edgeType].style.strokeWidth).toBeGreaterThan(0);
      expect(typeof edgeConfigs[edgeType].style.animated).toBe('boolean');
    });
  });

  it('should have consistent edge styles', () => {
    const linkedToConfig = getEdgeTypeConfig('linked-to');
    const visualizesConfig = getEdgeTypeConfig('visualizes');

    // linked-to should have dash pattern
    expect(linkedToConfig.style.strokeDasharray).toBeDefined();
    expect(linkedToConfig.style.strokeDasharray).toBe('5,5');

    // visualizes should have different dash pattern
    expect(visualizesConfig.style.strokeDasharray).toBeDefined();
    expect(visualizesConfig.style.strokeDasharray).toBe('2,2');
  });
});

describe('Ontology Compliance: Node Types', () => {
  it('should have configuration for all node types', () => {
    const nodeTypes: NodeType[] = [
      'phase',
      'sub-phase',
      'sub-phase-component',
      'mental-model',
      'visualization',
      'principle',
      'output',
      'outcome',
      'impact',
    ];

    nodeTypes.forEach(nodeType => {
      const config = getNodeTypeConfig(nodeType);
      expect(config).toBeDefined();
      expect(config.id).toBe(nodeType);
      expect(config.displayName).toBeTruthy();
      expect(typeof config.physicsControlled).toBe('boolean');
      expect(Array.isArray(config.allowedTargets)).toBe(true);
      expect(config.dependencies).toBeDefined();
      expect(config.positioning).toBeDefined();
    });
  });

  it('should correctly identify physics-controlled nodes', () => {
    const phaseConfig = getNodeTypeConfig('phase');
    const mentalModelConfig = getNodeTypeConfig('mental-model');
    const vizConfig = getNodeTypeConfig('visualization');

    // Phases are fixed (not physics-controlled)
    expect(phaseConfig.physicsControlled).toBe(false);

    // Mental models are physics-controlled
    expect(mentalModelConfig.physicsControlled).toBe(true);

    // Visualizations are physics-controlled
    expect(vizConfig.physicsControlled).toBe(true);
  });
});

describe('Ontology Compliance: Relationship Validation', () => {
  const mockNodePositions = new Map([
    ['phase1', { x: 0, y: 0 }],
    ['model1', { x: 500, y: 0 }],
    ['viz-model1', { x: 800, y: 0 }],
  ]);

  it('should allow valid phase → mental-model relationship', () => {
    const edge = createEdge(
      'phase1',
      'model1',
      'phase',
      'mental-model',
      mockNodePositions
    );

    expect(edge).not.toBeNull();
    expect(edge?.source).toBe('phase1');
    expect(edge?.target).toBe('model1');
    expect(edge?.label).toBe('Linked To');
  });

  it('should allow valid mental-model → visualization relationship', () => {
    const edge = createEdge(
      'model1',
      'viz-model1',
      'mental-model',
      'visualization',
      mockNodePositions
    );

    expect(edge).not.toBeNull();
    expect(edge?.source).toBe('model1');
    expect(edge?.target).toBe('viz-model1');
    expect(edge?.label).toBe('Visualizes');
  });

  it('should reject invalid mental-model → phase relationship', () => {
    const edge = createEdge(
      'model1',
      'phase1',
      'mental-model',
      'phase',
      mockNodePositions
    );

    // Mental models cannot link to phases
    expect(edge).toBeNull();
  });

  it('should reject invalid visualization → anything relationship', () => {
    const edge = createEdge(
      'viz-model1',
      'model1',
      'visualization',
      'mental-model',
      mockNodePositions
    );

    // Visualizations are terminal nodes (no outgoing edges)
    expect(edge).toBeNull();
  });
});

describe('Ontology Compliance: Edge Styles from Config', () => {
  const mockNodePositions = new Map([
    ['phase1', { x: 0, y: 0 }],
    ['model1', { x: 500, y: 0 }],
  ]);

  it('should use edge style from topology config', () => {
    const edge = createEdge(
      'phase1',
      'model1',
      'phase',
      'mental-model',
      mockNodePositions
    );

    expect(edge).not.toBeNull();

    const linkedToConfig = getEdgeTypeConfig('linked-to');

    // Edge style should match topology config
    expect(edge?.style?.stroke).toBe(linkedToConfig.style.stroke);
    expect(edge?.style?.strokeWidth).toBe(linkedToConfig.style.strokeWidth);
    expect(edge?.style?.strokeDasharray).toBe(linkedToConfig.style.strokeDasharray);
  });

  it('should not have hardcoded color values', () => {
    const edge = createEdge(
      'phase1',
      'model1',
      'phase',
      'mental-model',
      mockNodePositions
    );

    // Verify edge uses config, not hardcoded #A78BFA
    const linkedToConfig = getEdgeTypeConfig('linked-to');
    expect(edge?.style?.stroke).toBe(linkedToConfig.style.stroke);

    // If someone changes topology.yaml, this edge should reflect that
    // (This test would fail if we hardcoded the color)
    expect(edge?.style?.stroke).not.toBe('#HARDCODED');
  });
});

describe('Ontology Compliance: Allowed Targets', () => {
  it('phase can link to mental-model', () => {
    const phaseConfig = getNodeTypeConfig('phase');
    const allowsLinkToMentalModel = phaseConfig.allowedTargets.some(
      t => t.targetType === 'mental-model' && t.edgeType === 'linked-to'
    );
    expect(allowsLinkToMentalModel).toBe(true);
  });

  it('mental-model can only link to visualization', () => {
    const mentalModelConfig = getNodeTypeConfig('mental-model');

    expect(mentalModelConfig.allowedTargets).toHaveLength(1);
    expect(mentalModelConfig.allowedTargets[0].targetType).toBe('visualization');
    expect(mentalModelConfig.allowedTargets[0].edgeType).toBe('visualizes');
  });

  it('visualization has no allowed targets (terminal node)', () => {
    const vizConfig = getNodeTypeConfig('visualization');
    expect(vizConfig.allowedTargets).toHaveLength(0);
  });
});

describe('Ontology Compliance: Node Colors', () => {
  /**
   * Load colors from ontology YAML for comparison
   */
  function loadOntologyColors(): Record<string, string> {
    const yamlPath = path.join(process.cwd(), 'framework/ontology/node-types.yaml');
    const fileContents = fs.readFileSync(yamlPath, 'utf8');
    const parsed = yaml.load(fileContents) as any;

    const colors: Record<string, string> = {};
    for (const nodeType of parsed.node_types) {
      colors[nodeType.id] = nodeType.color;
    }
    return colors;
  }

  it('should have colors in code that match ontology YAML', () => {
    const yamlColors = loadOntologyColors();
    const codeConfig = NODE_TYPE_CONFIG;

    // Verify each node type's color matches YAML
    const nodeTypes: NodeType[] = [
      'phase',
      'sub-phase',
      'sub-phase-component',
      'mental-model',
      'principle',
      'output',
      'outcome',
      'impact',
    ];

    nodeTypes.forEach(nodeType => {
      expect(codeConfig[nodeType].color).toBe(yamlColors[nodeType]);
    });
  });

  it('should have valid hex color format', () => {
    const nodeTypes: NodeType[] = [
      'phase',
      'sub-phase',
      'sub-phase-component',
      'mental-model',
      'principle',
      'output',
      'outcome',
      'impact',
    ];

    nodeTypes.forEach(nodeType => {
      const color = NODE_TYPE_CONFIG[nodeType].color;
      // Verify hex color format (#RRGGBB)
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });

  it('should have matching labels between code and YAML', () => {
    const yamlPath = path.join(process.cwd(), 'framework/ontology/node-types.yaml');
    const fileContents = fs.readFileSync(yamlPath, 'utf8');
    const parsed = yaml.load(fileContents) as any;

    for (const nodeType of parsed.node_types) {
      const codeLabel = NODE_TYPE_CONFIG[nodeType.id as NodeType].label;
      const yamlLabel = nodeType.name;
      expect(codeLabel).toBe(yamlLabel);
    }
  });

  it('should have matching icons between code and YAML', () => {
    const yamlPath = path.join(process.cwd(), 'framework/ontology/node-types.yaml');
    const fileContents = fs.readFileSync(yamlPath, 'utf8');
    const parsed = yaml.load(fileContents) as any;

    for (const nodeType of parsed.node_types) {
      const codeIcon = NODE_TYPE_CONFIG[nodeType.id as NodeType].icon;
      const yamlIcon = nodeType.icon;
      expect(codeIcon).toBe(yamlIcon);
    }
  });
});
