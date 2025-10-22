/**
 * DetailPanel Component
 *
 * Floating right panel for displaying node/edge details
 * Includes ScrollArea, close button, and click-outside-to-dismiss
 */

'use client';

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface DetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

/**
 * Floating detail panel with scroll and dismiss functionality
 */
export default function DetailPanel({
  isOpen,
  onClose,
  title,
  children,
}: DetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle click outside to dismiss
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Add small delay to prevent immediate closure
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className={cn(
        "fixed right-0 top-0 h-full w-[400px] bg-background-secondary border-l border-purple-primary/30",
        "shadow-2xl z-50 flex flex-col",
        "animate-in slide-in-from-right duration-300"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-purple-primary/30">
        <h2 className="text-lg font-semibold text-white">
          {title || 'Details'}
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded hover:bg-purple-primary/20 transition-colors"
          aria-label="Close panel"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white/80 hover:text-white"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1" role="region">
        <div className="px-6 py-4">
          {children}
        </div>
      </ScrollArea>
    </div>
  );
}
