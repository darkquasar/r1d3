/**
 * FunnelVisualization Component
 *
 * D3-based funnel visualization for sequential stages
 */

'use client';

import { useEffect, useRef } from 'react';
import type { Stage } from '@/types/framework';

interface FunnelVisualizationProps {
  stages: Stage[];
}

/**
 * Renders funnel visualization using D3
 */
export default function FunnelVisualization({ stages }: FunnelVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || stages.length === 0) return;

    const svg = svgRef.current;
    const width = svg.clientWidth;
    const height = 400;
    const padding = 20;

    // Clear previous content
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    const stageHeight = (height - padding * 2) / stages.length;
    const svgNS = 'http://www.w3.org/2000/svg';

    // Draw funnel stages (top to bottom, narrowing)
    stages.forEach((stage, index) => {
      const topWidth = width * (1 - index * 0.15); // Narrow as we go down
      const bottomWidth = width * (1 - (index + 1) * 0.15);
      const y = padding + index * stageHeight;

      // Calculate trapezoid points
      const topLeft = (width - topWidth) / 2;
      const topRight = topLeft + topWidth;
      const bottomLeft = (width - bottomWidth) / 2;
      const bottomRight = bottomLeft + bottomWidth;

      // Create group for stage
      const g = document.createElementNS(svgNS, 'g');

      // Trapezoid path
      const path = document.createElementNS(svgNS, 'path');
      const d = `
        M ${topLeft} ${y}
        L ${topRight} ${y}
        L ${bottomRight} ${y + stageHeight}
        L ${bottomLeft} ${y + stageHeight}
        Z
      `;
      path.setAttribute('d', d);
      path.setAttribute('fill', `hsl(${270 - index * 15}, 65%, 45%)`); // Purple gradient
      path.setAttribute('stroke', '#A78BFA');
      path.setAttribute('stroke-width', '2');

      // Stage name text
      const text = document.createElementNS(svgNS, 'text');
      text.setAttribute('x', String(width / 2));
      text.setAttribute('y', String(y + stageHeight / 2));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('fill', '#F5F3FF');
      text.setAttribute('font-size', '14');
      text.setAttribute('font-weight', '600');
      text.textContent = stage.name;

      g.appendChild(path);
      g.appendChild(text);
      svg.appendChild(g);
    });
  }, [stages]);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-text-primary">Process Funnel</h4>
      <svg
        ref={svgRef}
        className="w-full"
        style={{ height: '400px' }}
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid meet"
      />
      <div className="text-xs text-text-secondary">
        Flow from top to bottom through sequential stages
      </div>
    </div>
  );
}
