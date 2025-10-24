/**
 * GroupContainerNode Component
 *
 * Generic visual container for grouped nodes.
 * Styled dynamically based on grouping configuration from topology.yaml.
 *
 * Features:
 * - Configurable border, background, and border radius
 * - Optional label (inside or outside)
 * - Non-interactive (pointer-events: none)
 * - Renders behind content nodes (zIndex: -10)
 */

'use client';

import { memo } from 'react';
import type { NodeProps } from 'reactflow';
import type { GroupConfig } from '@/lib/grouping-config';

/**
 * Convert hex color to rgba with opacity
 */
function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Group Container Node
 * Renders a styled box around grouped nodes
 */
function GroupContainerNode({ data }: NodeProps<{ groupConfig: GroupConfig }>) {
  const { groupConfig } = data;
  const { style, label } = groupConfig;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        border: `${style.borderWidth}px solid ${hexToRgba(style.borderColor, style.borderOpacity)}`,
        borderRadius: `${style.borderRadius}px`,
        background: hexToRgba(style.backgroundColor, style.backgroundOpacity),
        boxShadow: `0 0 20px ${hexToRgba(style.borderColor, 0.1)}`,
        pointerEvents: 'none', // Pass clicks through to children
        position: 'relative',
      }}
    >
      {/* Render label if enabled */}
      {label.show && label.position === 'inside' && (
        <div
          style={{
            position: 'absolute',
            top: `${label.paddingTop}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: `${label.style.fontSize}px`,
            fontWeight: label.style.fontWeight,
            color: label.style.color,
            opacity: label.style.opacity,
            whiteSpace: 'nowrap',
            textAlign: 'center',
            letterSpacing: '0.5px',
          }}
        >
          {label.text}
        </div>
      )}
    </div>
  );
}

export default memo(GroupContainerNode);
