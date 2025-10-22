/**
 * CustomNode Component
 *
 * Renders framework nodes (phases, sub-phases, components, mental models)
 * in the ReactFlow graph with appropriate styling and interactivity.
 */

'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { FrameworkNode } from '@/types/framework';
import { getNodeTypeConfig } from '@/lib/node-type-config';
import NodeTypeIcon from './NodeTypeIcon';

type CustomNodeData = FrameworkNode & {
  label: string;
};

/**
 * Custom node component for ReactFlow
 */
function CustomNode({ data, selected }: NodeProps<CustomNodeData>) {
  const typeConfig = getNodeTypeConfig(data.node_type);
  const isMentalModel = data.node_type === 'mental-model';

  // Mental models keep white background, others use type-specific colors
  const cardStyle = isMentalModel
    ? { backgroundColor: '#FFFFFF' }
    : { backgroundColor: typeConfig.color };

  const headerTextClass = isMentalModel
    ? 'text-xs font-medium text-purple-primary uppercase tracking-wide'
    : `text-xs font-medium ${typeConfig.textColor} uppercase tracking-wide opacity-90`;

  const titleTextClass = isMentalModel
    ? 'text-base font-semibold text-black'
    : `text-base font-semibold ${typeConfig.textColor}`;

  const descriptionTextClass = isMentalModel
    ? 'text-xs text-gray-700 line-clamp-2 mt-1'
    : `text-xs ${typeConfig.textColor} opacity-90 line-clamp-2 mt-1`;

  const versionTextClass = isMentalModel
    ? 'text-xs text-purple-primary mt-1'
    : `text-xs ${typeConfig.textColor} opacity-80 mt-1`;

  const iconColorClass = isMentalModel ? 'text-purple-primary' : typeConfig.textColor;

  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 shadow-md
        transition-all duration-200
        min-w-[200px] max-w-[300px]
        ${selected ? 'border-purple-accent ring-2 ring-purple-accent/50' : 'border-purple-primary/30'}
      `}
      style={cardStyle}
    >
      {/* Connection handles on all four sides */}
      {/* Top handle - can be both source and target */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="w-3 h-3 !bg-purple-light border-2 border-background-primary"
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        className="w-3 h-3 !bg-purple-light border-2 border-background-primary"
        style={{ opacity: 0 }} // Hidden, shares same visual handle
      />

      {/* Left handle - can be both source and target */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="w-3 h-3 !bg-purple-light border-2 border-background-primary"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        className="w-3 h-3 !bg-purple-light border-2 border-background-primary"
        style={{ opacity: 0 }} // Hidden, shares same visual handle
      />

      {/* Right handle - can be both source and target */}
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        className="w-3 h-3 !bg-purple-light border-2 border-background-primary"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className="w-3 h-3 !bg-purple-light border-2 border-background-primary"
        style={{ opacity: 0 }} // Hidden, shares same visual handle
      />

      {/* Node header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <NodeTypeIcon nodeType={data.node_type} className={iconColorClass} size={16} />
          <div className={headerTextClass}>
            {typeConfig.label}
          </div>
        </div>

        <div className={titleTextClass}>
          {data.label}
        </div>

        {data.description && (
          <div className={descriptionTextClass}>
            {data.description}
          </div>
        )}

        <div className={versionTextClass}>
          v{data.version}
        </div>
      </div>

      {/* Bottom handle - can be both source and target */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="w-3 h-3 !bg-purple-light border-2 border-background-primary"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        className="w-3 h-3 !bg-purple-light border-2 border-background-primary"
        style={{ opacity: 0 }} // Hidden, shares same visual handle
      />
    </div>
  );
}

export default memo(CustomNode);
