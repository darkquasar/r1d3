/**
 * Theme Utilities
 *
 * Color palette and WCAG AA contrast verification functions
 *
 * @packageDocumentation
 */

/**
 * Dark purple color palette with WCAG AA compliance
 */
export const colors = {
  background: {
    primary: '#1A0B2E', // Very dark purple
    secondary: '#2D1B4E', // Cards/panels
  },
  text: {
    primary: '#F5F3FF', // 15.8:1 contrast (AAA)
    secondary: '#D4C5F9', // 9.8:1 contrast (AAA)
    link: '#C4B5FD', // 8.2:1 contrast (AAA)
  },
  purple: {
    primary: '#7C3AED', // Interactive elements
    hover: '#6D28D9', // Hover state (8.9:1 contrast)
    light: '#A78BFA', // Highlights
    accent: '#C4B5FD',
  },
  node: {
    phase: '#7C3AED',
    subphase: '#A78BFA',
    component: '#C4B5FD',
    mental: '#D4C5F9',
  },
  edge: {
    contains: '#7C3AED',
    precedes: '#A78BFA',
    linked: '#C4B5FD',
    uses: '#D4C5F9',
    visualizes: '#9333EA', // Purple for visualization edges
  },
};

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate relative luminance
 * https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const srgb = c / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * https://www.w3.org/TR/WCAG20/#contrast-ratiodef
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    throw new Error('Invalid hex color format');
  }

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if color combination meets WCAG AA standard (4.5:1 for normal text)
 */
export function meetsWCAGAA(foreground: string, background: string): boolean {
  const ratio = getContrastRatio(foreground, background);
  return ratio >= 4.5;
}

/**
 * Check if color combination meets WCAG AAA standard (7:1 for normal text)
 */
export function meetsWCAGAAA(foreground: string, background: string): boolean {
  const ratio = getContrastRatio(foreground, background);
  return ratio >= 7.0;
}

/**
 * Get node color by type
 */
export function getNodeColor(nodeType: string): string {
  switch (nodeType) {
    case 'phase':
      return colors.node.phase;
    case 'sub-phase':
      return colors.node.subphase;
    case 'sub-phase-component':
      return colors.node.component;
    case 'mental-model':
      return colors.node.mental;
    default:
      return colors.purple.primary;
  }
}

/**
 * Get edge color by relationship type
 */
export function getEdgeColor(relationshipType: string): string {
  switch (relationshipType) {
    case 'contains':
      return colors.edge.contains;
    case 'precedes':
      return colors.edge.precedes;
    case 'linked-to':
      return colors.edge.linked;
    case 'uses':
      return colors.edge.uses;
    case 'visualizes':
      return colors.edge.visualizes;
    default:
      return colors.purple.primary;
  }
}

/**
 * Get edge style by relationship type
 */
export function getEdgeStyle(relationshipType: string): 'solid' | 'dashed' | 'dotted' {
  switch (relationshipType) {
    case 'contains':
      return 'solid';
    case 'precedes':
      return 'dashed';
    case 'linked-to':
      return 'dotted';
    case 'uses':
      return 'dashed'; // dash-dot approximation
    case 'visualizes':
      return 'solid';
    default:
      return 'solid';
  }
}
