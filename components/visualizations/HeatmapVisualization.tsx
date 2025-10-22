/**
 * HeatmapVisualization Component
 *
 * D3-based heatmap visualization for stages with intensity values
 */

'use client';

import { useEffect, useRef } from 'react';
import { scaleLinear } from 'd3-scale';
import type { Stage } from '@/types/framework';

interface HeatmapVisualizationProps {
  stages: Stage[];
}

/**
 * Renders heatmap visualization using D3
 */
export default function HeatmapVisualization({ stages }: HeatmapVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || stages.length === 0) return;

    const svg = svgRef.current;
    const width = svg.clientWidth;
    const height = 300;

    // Clear previous content
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    // Calculate dimensions
    const cellHeight = height / stages.length;
    const cellWidth = width;

    // Color scale from purple (low) to bright purple (high)
    const colorScale = scaleLinear<string>()
      .domain([0, 100])
      .range(['#2D1B4E', '#7C3AED']);

    // Create SVG namespace
    const svgNS = 'http://www.w3.org/2000/svg';

    // Draw heatmap cells
    stages.forEach((stage, index) => {
      const intensity = stage.intensity ?? 50; // Default to 50 if not specified

      // Create cell group
      const g = document.createElementNS(svgNS, 'g');

      // Cell rectangle
      const rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', '0');
      rect.setAttribute('y', String(index * cellHeight));
      rect.setAttribute('width', String(cellWidth));
      rect.setAttribute('height', String(cellHeight));
      rect.setAttribute('fill', colorScale(intensity));
      rect.setAttribute('stroke', '#A78BFA');
      rect.setAttribute('stroke-width', '1');
      rect.setAttribute('rx', '4');

      // Stage name text
      const text = document.createElementNS(svgNS, 'text');
      text.setAttribute('x', '12');
      text.setAttribute('y', String(index * cellHeight + cellHeight / 2));
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('fill', '#F5F3FF');
      text.setAttribute('font-size', '14');
      text.setAttribute('font-weight', '600');
      text.textContent = stage.name;

      // Intensity label
      const intensityText = document.createElementNS(svgNS, 'text');
      intensityText.setAttribute('x', String(cellWidth - 12));
      intensityText.setAttribute('y', String(index * cellHeight + cellHeight / 2));
      intensityText.setAttribute('dominant-baseline', 'middle');
      intensityText.setAttribute('text-anchor', 'end');
      intensityText.setAttribute('fill', '#D4C5F9');
      intensityText.setAttribute('font-size', '12');
      intensityText.textContent = `${intensity}%`;

      g.appendChild(rect);
      g.appendChild(text);
      g.appendChild(intensityText);
      svg.appendChild(g);
    });
  }, [stages]);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-text-primary">Stage Intensity Heatmap</h4>
      <svg
        ref={svgRef}
        className="w-full"
        style={{ height: '300px' }}
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid meet"
      />
      <div className="text-xs text-text-secondary">
        Intensity scale: 0% (low) to 100% (high)
      </div>
    </div>
  );
}
