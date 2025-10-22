/**
 * OntologyPanel Component
 *
 * Displays documentation about the R1D3 framework's node types and ontology
 */

'use client';

import { X } from 'lucide-react';
import NodeTypeIcon from '@/components/graph/NodeTypeIcon';
import type { NodeType } from '@/lib/node-type-config';
import { NODE_TYPE_CONFIG } from '@/lib/node-type-config';

interface OntologyPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NodeTypeDoc {
  id: NodeType;
  name: string;
  icon: string;
  color: string;
  category: string;
  description: string;
  purpose: string;
  usage_guidance: string;
  examples: string[];
  visibility: string;
}

// Ontology documentation data (loaded from YAML in a real implementation)
const ONTOLOGY_DOCS: NodeTypeDoc[] = [
  {
    id: 'phase',
    name: 'Phase',
    icon: 'Circle',
    color: '#7C3AED',
    category: 'Primary Framework Nodes',
    description: 'A top-level phase represents a major stage in the R1D3 framework. Phases organize the high-level flow of work and provide the primary structure for the framework.',
    purpose: 'Phases break down the overall framework into logical temporal or functional segments. They represent the "what" at the highest level of abstraction.',
    usage_guidance: 'Use phases to represent major stages of work (e.g., Research, Discovery, Development). Phases should contain sub-phases that break down the work in detail. Typically 3-6 phases in a complete framework.',
    examples: ['Research Phase - Gathering intelligence and context', 'Discovery Phase - Identifying threats and vulnerabilities', 'Disruption Phase - Active adversary engagement'],
    visibility: 'Always visible in canvas',
  },
  {
    id: 'sub-phase',
    name: 'Sub-Phase',
    icon: 'Square',
    color: '#3B82F6',
    category: 'Primary Framework Nodes',
    description: 'A sub-phase is a subdivision of a phase that provides more granular organization of activities and components within that phase.',
    purpose: 'Sub-phases break down the work of a parent phase into logical groupings that can be understood and executed independently while contributing to the phase goal.',
    usage_guidance: 'Each sub-phase must belong to a parent phase. Sub-phases should represent distinct clusters of activities. Use sub-phases to organize components thematically or sequentially.',
    examples: ['Threat Intelligence Collection (within Research Phase)', 'Attack Surface Mapping (within Discovery Phase)', 'Vulnerability Assessment (within Discovery Phase)'],
    visibility: 'Always visible in canvas',
  },
  {
    id: 'sub-phase-component',
    name: 'Component',
    icon: 'Hexagon',
    color: '#10B981',
    category: 'Primary Framework Nodes',
    description: 'A component is a specific activity, task, or deliverable within a sub-phase. Components represent the most granular level of the framework hierarchy.',
    purpose: 'Components define the actual work to be performed. They are concrete, actionable elements that teams can execute and measure.',
    usage_guidance: 'Each component must belong to a parent sub-phase. Components should be specific and actionable. Define clear inputs, outputs, and success criteria for each component.',
    examples: ['OSINT Reconnaissance (within Threat Intelligence Collection)', 'Network Port Scanning (within Attack Surface Mapping)', 'CVE Database Analysis (within Vulnerability Assessment)'],
    visibility: 'Always visible in canvas',
  },
  {
    id: 'mental-model',
    name: 'Mental Model',
    icon: 'Diamond',
    color: '#14B8A6',
    category: 'Conceptual Frameworks',
    description: 'A mental model is a conceptual framework or visualization pattern that helps understand, reason about, or communicate complex concepts within the R1D3 framework.',
    purpose: 'Mental models provide cognitive scaffolding for practitioners. They offer patterns, heuristics, and visual representations that make abstract concepts concrete.',
    usage_guidance: 'Link mental models to phases or components where they apply. Include visualizations (heatmaps, funnels, SVGs) when helpful. Document the source and principles underlying each model.',
    examples: ['DAIKI (Data-Information-Knowledge-Insight semantic chain)', 'Kill Chain (adversary lifecycle model)', 'Diamond Model (intrusion analysis framework)'],
    visibility: 'Shown dynamically when referenced nodes are selected',
  },
  {
    id: 'principle',
    name: 'Principle',
    icon: 'Star',
    color: '#EAB308',
    category: 'Conceptual Frameworks',
    description: 'A principle is a guiding heuristic or rule of thumb that informs decision-making and reasoning throughout the framework. Principles are abstract guidelines, not concrete procedures.',
    purpose: 'Principles provide philosophical and practical guidance for how to approach work. They help practitioners make context-appropriate decisions when procedures don\'t cover every scenario.',
    usage_guidance: 'Principles should be broadly applicable across multiple contexts. Link principles to mental models, phases, or components they guide. Provide concrete examples of how principles apply in practice.',
    examples: ['Semantic Positioning - Understanding where analysis begins', 'Synthesis-First - Prioritizing integration over collection', 'Defense in Depth - Layered security controls'],
    visibility: 'Only visible in detail panels when referenced',
  },
  {
    id: 'output',
    name: 'Output',
    icon: 'FolderOpen',
    color: '#F97316',
    category: 'Deliverables & Outcomes',
    description: 'An output is a bounded unit of work that results from framework activities. Outputs can be findings (analytical results) or artefacts (tools, documents, configs).',
    purpose: 'Outputs represent tangible work products. They are the concrete results that emerge from executing components and phases. Outputs bridge activities and outcomes.',
    usage_guidance: 'Specify whether output is a "finding" or "artefact". Link outputs to the components that produce them. Define what outcomes the output enables or contributes to.',
    examples: ['Threat Assessment Report (finding)', 'Vulnerability Scan Results (finding)', 'Detection Rule Library (artefact)'],
    visibility: 'Only visible in detail panels when referenced',
  },
  {
    id: 'outcome',
    name: 'Outcome',
    icon: 'Target',
    color: '#EF4444',
    category: 'Deliverables & Outcomes',
    description: 'An outcome is a desired change in the state of the operational system. Outcomes represent measurable improvements or capabilities that result from outputs.',
    purpose: 'Outcomes translate work products (outputs) into operational value. They define success criteria and provide leading indicators of strategic goal achievement.',
    usage_guidance: 'Define clear measurement criteria for each outcome. Link outcomes to the outputs that produce them. Specify what impacts the outcome contributes toward.',
    examples: ['Reduced Attack Surface (measured by exposed services)', 'Improved Threat Visibility (measured by detection coverage)', 'Faster Incident Response (measured by MTTR)'],
    visibility: 'Only visible in detail panels when referenced',
  },
  {
    id: 'impact',
    name: 'Impact',
    icon: 'Trophy',
    color: '#F59E0B',
    category: 'Strategic Goals',
    description: 'An impact represents a strategic goal with lagging indicators that measure organizational resilience and capability at the highest level.',
    purpose: 'Impacts define the ultimate "why" of the framework. They represent business outcomes and strategic objectives that the entire framework exists to achieve.',
    usage_guidance: 'Define lagging indicators that prove impact has occurred. Link impacts to the outcomes that drive them. Specify measurement periods appropriate to the strategic timeframe.',
    examples: ['Zero Breach Operations (measured by breach count, MTTD, MTTR)', 'Regulatory Compliance (measured by audit results)', 'Business Continuity (measured by uptime)'],
    visibility: 'Only visible in detail panels when referenced',
  },
];

/**
 * Modal panel that displays ontology documentation
 */
export default function OntologyPanel({ isOpen, onClose }: OntologyPanelProps) {
  if (!isOpen) return null;

  // Prevent clicks inside the panel from propagating
  const handlePanelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed inset-4 md:inset-8 bg-background-secondary border border-purple-primary/30 rounded-lg shadow-2xl z-50 flex flex-col"
        onClick={handlePanelClick}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-primary/30 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-text-primary">R1D3 Framework Ontology</h2>
            <p className="text-sm text-text-secondary mt-1">
              Understanding the building blocks of the framework
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-purple-primary/10 rounded-lg transition-colors"
            aria-label="Close ontology panel"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {ONTOLOGY_DOCS.map((doc) => {
              const config = NODE_TYPE_CONFIG[doc.id];
              return (
                <div
                  key={doc.id}
                  className="bg-background-primary border border-purple-primary/20 rounded-lg p-5 hover:border-purple-primary/40 transition-colors"
                >
                  {/* Type Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${doc.color}20` }}
                    >
                      <NodeTypeIcon
                        nodeType={doc.id}
                        size={24}
                        className="text-white"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-text-primary">{doc.name}</h3>
                      <p className="text-xs text-text-secondary">{doc.category}</p>
                    </div>
                    <div
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{
                        backgroundColor: doc.visibility.includes('canvas') ? '#10B98120' : '#F9731620',
                        color: doc.visibility.includes('canvas') ? '#10B981' : '#F97316',
                      }}
                    >
                      {doc.visibility.includes('canvas') ? 'Canvas' : 'Panel Only'}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {doc.description}
                    </p>
                  </div>

                  {/* Purpose */}
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-text-primary uppercase mb-2">
                      Purpose
                    </h4>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {doc.purpose}
                    </p>
                  </div>

                  {/* Usage Guidance */}
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-text-primary uppercase mb-2">
                      Usage Guidance
                    </h4>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {doc.usage_guidance}
                    </p>
                  </div>

                  {/* Examples */}
                  <div>
                    <h4 className="text-xs font-semibold text-text-primary uppercase mb-2">
                      Examples
                    </h4>
                    <ul className="space-y-1">
                      {doc.examples.map((example, index) => (
                        <li key={index} className="text-sm text-text-secondary flex items-start">
                          <span className="text-purple-accent mr-2">•</span>
                          <span>{example}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-purple-primary/30 px-6 py-4">
          <p className="text-xs text-text-secondary">
            Framework Version 1.0 • Last Updated: 2025-10-20
          </p>
        </div>
      </div>
    </>
  );
}
