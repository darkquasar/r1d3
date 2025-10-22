/**
 * NodeTypeIcon Component
 *
 * Maps node types to their corresponding lucide-react icons
 */

import {
  Circle,
  Square,
  Hexagon,
  Diamond,
  Star,
  FolderOpen,
  Target,
  Trophy,
} from 'lucide-react';
import type { NodeType } from '@/types/framework';

interface NodeTypeIconProps {
  nodeType: NodeType;
  className?: string;
  size?: number;
}

/**
 * Renders the appropriate icon for a given node type
 */
export default function NodeTypeIcon({ nodeType, className = '', size = 18 }: NodeTypeIconProps) {
  const iconProps = {
    className,
    size,
    strokeWidth: 2,
  };

  switch (nodeType) {
    case 'phase':
      return <Circle {...iconProps} />;
    case 'sub-phase':
      return <Square {...iconProps} />;
    case 'sub-phase-component':
      return <Hexagon {...iconProps} />;
    case 'mental-model':
      return <Diamond {...iconProps} />;
    case 'principle':
      return <Star {...iconProps} fill="currentColor" />;
    case 'output':
      return <FolderOpen {...iconProps} />;
    case 'outcome':
      return <Target {...iconProps} />;
    case 'impact':
      return <Trophy {...iconProps} fill="currentColor" />;
    default:
      return <Circle {...iconProps} />;
  }
}
