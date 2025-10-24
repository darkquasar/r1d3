/**
 * SVGVisualization Component
 *
 * Displays embedded SVG from external file
 */

'use client';

import { useEffect, useState } from 'react';
import type { SVGVisualization as SVGConfig } from '@/types/framework';

interface SVGVisualizationProps {
  config: SVGConfig;
}

/**
 * Renders SVG visualization from file
 */
export default function SVGVisualization({ config }: SVGVisualizationProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSVG() {
      try {
        setLoading(true);
        setError(null);

        // Fetch SVG file from public directory
        const response = await fetch(`/${config.src_file}`);

        if (!response.ok) {
          throw new Error(`Failed to load SVG: ${response.statusText}`);
        }

        const svgText = await response.text();

        // Parse SVG to add responsive attributes
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, 'image/svg+xml');
        const svgElement = doc.querySelector('svg');

        if (svgElement) {
          // Preserve original viewBox or create one from width/height
          if (!svgElement.hasAttribute('viewBox')) {
            const width = svgElement.getAttribute('width') || '100';
            const height = svgElement.getAttribute('height') || '100';
            svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
          }

          // Make SVG responsive
          svgElement.setAttribute('width', '100%');
          svgElement.setAttribute('height', 'auto');
          svgElement.style.maxHeight = '500px';

          setSvgContent(svgElement.outerHTML);
        } else {
          setSvgContent(svgText);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load SVG');
      } finally {
        setLoading(false);
      }
    }

    loadSVG();
  }, [config.src_file]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-text-secondary animate-pulse">
          Loading visualization...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded">
        <p className="text-sm text-red-400">Error: {error}</p>
        <p className="text-xs text-text-secondary mt-1">
          Source: {config.src_file}
        </p>
      </div>
    );
  }

  if (!svgContent) {
    return (
      <div className="p-4 bg-purple-primary/10 border border-purple-primary/30 rounded">
        <p className="text-sm text-text-secondary">No SVG content available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-text-primary">Diagram</h4>
      <div
        className="svg-container w-full flex items-center justify-center"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
      <div className="text-xs text-text-secondary">
        Source: {config.src_file}
      </div>
    </div>
  );
}
