/**
 * NavigationHistory Component
 *
 * Displays back/forward navigation buttons for browsing through node history
 */

'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface NavigationHistoryProps {
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  historyCount?: number;
}

/**
 * Navigation history controls with back/forward buttons
 */
export default function NavigationHistory({
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  historyCount,
}: NavigationHistoryProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-purple-primary/30 bg-background-secondary/50">
      {/* Back button */}
      <button
        onClick={onBack}
        disabled={!canGoBack}
        aria-label="Back"
        className={`
          p-2 rounded transition-colors
          ${canGoBack
            ? 'hover:bg-purple-primary/20 text-text-primary cursor-pointer'
            : 'text-text-secondary/30 cursor-not-allowed'
          }
        `}
        title="Go back (Alt+Left)"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Forward button */}
      <button
        onClick={onForward}
        disabled={!canGoForward}
        aria-label="Forward"
        className={`
          p-2 rounded transition-colors
          ${canGoForward
            ? 'hover:bg-purple-primary/20 text-text-primary cursor-pointer'
            : 'text-text-secondary/30 cursor-not-allowed'
          }
        `}
        title="Go forward (Alt+Right)"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* History count indicator */}
      {historyCount !== undefined && historyCount > 0 && (
        <span className="text-xs text-text-secondary ml-2">
          {historyCount} {historyCount === 1 ? 'item' : 'items'} in history
        </span>
      )}
    </div>
  );
}
