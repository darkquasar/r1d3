/**
 * Grouping YAML Parser
 *
 * Parses the grouping section from framework/topology.yaml
 * and converts it to TypeScript GroupConfig objects.
 */

import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import type { GroupConfig, GroupingTopology } from './grouping-config';

/**
 * Parse grouping configuration from topology.yaml
 */
export function parseGroupingConfig(): GroupingTopology {
  try {
    const yamlPath = path.join(process.cwd(), 'framework/topology.yaml');
    const fileContents = fs.readFileSync(yamlPath, 'utf8');
    const parsed = yaml.load(fileContents) as any;

    if (!parsed.grouping) {
      return { groups: {} };
    }

    const groups: Record<string, GroupConfig> = {};

    for (const [groupId, groupYaml] of Object.entries(parsed.grouping)) {
      const g = groupYaml as any;

      groups[groupId] = {
        id: groupId,
        displayName: g.display_name,
        description: g.description,
        members: {
          nodeType: g.members.node_type,
          filter: g.members.filter,
          nodeIds: g.members.node_ids,
        },
        style: {
          borderColor: g.style.border_color,
          borderWidth: g.style.border_width,
          borderOpacity: g.style.border_opacity,
          backgroundColor: g.style.background_color,
          backgroundOpacity: g.style.background_opacity,
          borderRadius: g.style.border_radius,
          padding: g.style.padding,
        },
        label: {
          text: g.label.text,
          show: g.label.show,
          position: g.label.position,
          paddingTop: g.label.padding_top || 20,
          style: {
            fontSize: g.label.style.font_size,
            fontWeight: g.label.style.font_weight,
            color: g.label.style.color,
            opacity: g.label.style.opacity || 1,
          },
        },
        boundary: {
          enabled: g.boundary.enabled,
          strategy: g.boundary.strategy,
          obstacleSize: g.boundary.obstacle_size,
          spacing: g.boundary.spacing || 0,
        },
      };
    }

    return { groups };
  } catch (error) {
    console.error('Error parsing grouping config:', error);
    return { groups: {} };
  }
}
