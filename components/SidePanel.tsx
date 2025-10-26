'use client';

/**
 * Side Panel Component
 *
 * Right-side panel that displays detailed information about selected nodes
 */

import { X, BookOpen, Brain, Link2, Info } from 'lucide-react';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import type { FlowNode } from '@/types/yaml-schema';

export interface SidePanelProps {
  node: FlowNode | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function SidePanel({ node, isOpen, onClose }: SidePanelProps) {
  if (!isOpen || !node) return null;

  return (
    <aside className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 z-50 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">Node Details</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          aria-label="Close panel"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <ScrollArea.Root className="h-[calc(100%-73px)]">
        <ScrollArea.Viewport className="w-full h-full">
          <div className="p-6 space-y-6">
            {/* PRIMARY: Node Description */}
            <section>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Info className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    {node.type}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {node.id}
                  </h3>
                  <p className="text-base text-gray-700 leading-relaxed">
                    {node.description}
                  </p>
                </div>
              </div>
            </section>

            {/* Node Properties */}
            {Object.keys(node.properties).length > 0 && (
              <section className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-gray-600" />
                  Properties
                </h4>
                <div className="space-y-2">
                  {Object.entries(node.properties).map(([key, value]) => (
                    <div key={key} className="flex flex-col">
                      <span className="text-xs font-medium text-gray-500 uppercase">
                        {key}
                      </span>
                      <span className="text-sm text-gray-900 mt-0.5">
                        {Array.isArray(value) ? (
                          <ul className="list-disc list-inside space-y-1 mt-1">
                            {value.map((item, idx) => (
                              <li key={idx} className="text-sm text-gray-700">
                                {String(item)}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          String(value)
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Position Info */}
            {node.position && (
              <section className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Position
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 font-medium">X</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {node.position.x}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 font-medium">Y</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {node.position.y}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Layout Configuration */}
            {node.layout && (
              <section className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Layout Configuration
                </h4>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xs text-blue-700 font-medium mb-1">
                    Algorithm
                  </div>
                  <div className="text-sm text-blue-900 font-medium">
                    {node.layout.algorithm || 'Default'}
                  </div>
                </div>
              </section>
            )}

            {/* Group Membership */}
            {node.groupId && (
              <section className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Group
                </h4>
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-sm text-purple-900 font-medium">
                    {node.groupId}
                  </div>
                </div>
              </section>
            )}

            {/* Placeholder for future enhancements */}
            <section className="pt-4 border-t border-gray-200">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">
                  Linked principles and mental models will appear here in Phase 6-8
                </p>
              </div>
            </section>
          </div>
        </ScrollArea.Viewport>

        <ScrollArea.Scrollbar
          className="flex select-none touch-none p-0.5 bg-gray-100 transition-colors duration-150 ease-out hover:bg-gray-200 data-[orientation=vertical]:w-2.5"
          orientation="vertical"
        >
          <ScrollArea.Thumb className="flex-1 bg-gray-400 rounded-[10px]" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </aside>
  );
}
