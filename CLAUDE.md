# r1d3 Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-19

## Active Technologies
- TypeScript 5+ (strict mode), JavaScript ES2022+ (001-yaml-graph-visualizer)
- TypeScript 5+ (strict mode) + Next.js 15.4.6, React 19.1.0, React Flow 11.11.4, js-yaml 4.1.0, d3-force 3.0.0, d3-hierarchy 3.1.2, dagre 0.8.5, Radix UI (dialog, popover, scroll-area, switch), TailwindCSS 4+ (002-yaml-flow-ontology-ux)
- File system (YAML files in `/flows/` and `/ontology/` directories) (002-yaml-flow-ontology-ux)

## Project Structure
```
src/
tests/
```

## Commands
npm test && npm run lint

## Code Style
TypeScript 5+ (strict mode), JavaScript ES2022+: Follow standard conventions

## Transient Files Policy
All transient files created during development should be placed in the `claude_tracking/` folder, including:
- Debug files and logs
- Temporary summaries and analysis documents
- Problem-solving scratch files
- Investigation notes
- Any files created to solve specific problems that aren't part of the main codebase

This folder is gitignored to keep the repository clean.

## Recent Changes
- 002-yaml-flow-ontology-ux: Added TypeScript 5+ (strict mode) + Next.js 15.4.6, React 19.1.0, React Flow 11.11.4, js-yaml 4.1.0, d3-force 3.0.0, d3-hierarchy 3.1.2, dagre 0.8.5, Radix UI (dialog, popover, scroll-area, switch), TailwindCSS 4+
- 001-yaml-graph-visualizer: Added TypeScript 5+ (strict mode), JavaScript ES2022+

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
