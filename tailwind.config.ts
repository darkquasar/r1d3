import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: '#000000', // Black background
          secondary: '#1A1A1A', // Dark gray for cards/panels
        },
        text: {
          primary: '#F5F3FF', // Primary text (15.8:1 contrast - AAA)
          secondary: '#D4C5F9', // Secondary text (9.8:1 contrast - AAA)
          link: '#C4B5FD', // Link text (8.2:1 contrast - AAA)
        },
        purple: {
          primary: '#7C3AED', // Interactive elements
          hover: '#6D28D9', // Hover state
          light: '#A78BFA', // Highlights, borders
          accent: '#C4B5FD', // Accents
        },
        node: {
          phase: '#7C3AED', // Phase node border
          subphase: '#A78BFA', // Sub-phase border
          component: '#C4B5FD', // Component border
          mental: '#D4C5F9', // Mental model border
        },
        edge: {
          contains: '#7C3AED', // Solid line
          precedes: '#A78BFA', // Dashed line
          linked: '#C4B5FD', // Dotted line
          uses: '#D4C5F9', // Dash-dot line
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
