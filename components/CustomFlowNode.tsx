'use client';

/**
 * Custom Flow Node Component
 *
 * Custom node with 4 handles (top, right, bottom, left) for better connectivity
 */

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';

function CustomFlowNode({ data, selected }: NodeProps) {
  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 transition-all ${
        selected
          ? 'ring-2 ring-blue-400 ring-offset-2 shadow-lg'
          : 'shadow-md hover:shadow-lg'
      }`}
      style={{
        backgroundColor: data.backgroundColor || '#6b7280',
        borderColor: selected ? '#3b82f6' : '#ffffff',
        color: 'white',
        minWidth: '180px',
      }}
    >
      {/* Top Handles - source (invisible) + target (visible) */}
      <Handle
        id="top-source"
        type="source"
        position={Position.Top}
        style={{ top: -6, opacity: 0 }}
      />
      <Handle
        id="top"
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-white !border-2 !border-gray-400"
        style={{ top: -6 }}
      />

      {/* Right Handles - source (visible) + target (invisible) */}
      <Handle
        id="right"
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-white !border-2 !border-gray-400"
        style={{ right: -6 }}
      />
      <Handle
        id="right-target"
        type="target"
        position={Position.Right}
        style={{ right: -6, opacity: 0 }}
      />

      {/* Bottom Handles - source (visible) + target (invisible) */}
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-white !border-2 !border-gray-400"
        style={{ bottom: -6 }}
      />
      <Handle
        id="bottom-target"
        type="target"
        position={Position.Bottom}
        style={{ bottom: -6, opacity: 0 }}
      />

      {/* Left Handles - source (invisible) + target (visible) */}
      <Handle
        id="left-source"
        type="source"
        position={Position.Left}
        style={{ left: -6, opacity: 0 }}
      />
      <Handle
        id="left"
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-white !border-2 !border-gray-400"
        style={{ left: -6 }}
      />

      {/* Node Content */}
      <div className="text-sm font-medium">
        {data.label}
      </div>

      {/* Node Type Badge */}
      {data.nodeType && (
        <div className="mt-1 text-xs opacity-75 font-medium uppercase tracking-wide">
          {data.nodeType}
        </div>
      )}
    </div>
  );
}

export default memo(CustomFlowNode);
