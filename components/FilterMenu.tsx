'use client';

/**
 * Filter Menu Component
 *
 * Top-left menu for selecting flows and configuring display options
 * Uses Radix UI for accessible popover behavior
 */

import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import * as Switch from '@radix-ui/react-switch';
import { Settings2, ChevronDown } from 'lucide-react';
import type { FlowSummary } from '@/types/yaml-schema';
import type { LayoutAlgorithm } from '@/types/layout';

export interface FilterMenuProps {
  flows: FlowSummary[];
  selectedFlowId: string | null;
  onFlowSelect: (flowId: string) => void;
  layoutAlgorithm: LayoutAlgorithm;
  onLayoutChange: (algorithm: LayoutAlgorithm) => void;
  showGrouping: boolean;
  onGroupingToggle: (show: boolean) => void;
  smartEdgeRouting: boolean;
  onSmartEdgeRoutingToggle: (enabled: boolean) => void;
  layoutParams?: Record<string, any>;
  onLayoutParamsChange?: (params: Record<string, any>) => void;
}

export default function FilterMenu({
  flows,
  selectedFlowId,
  onFlowSelect,
  layoutAlgorithm,
  onLayoutChange,
  showGrouping,
  onGroupingToggle,
  smartEdgeRouting,
  onSmartEdgeRoutingToggle,
  layoutParams = {},
  onLayoutParamsChange = () => {},
}: FilterMenuProps) {
  const [open, setOpen] = useState(false);

  const selectedFlow = flows.find(f => f.id === selectedFlowId);

  const handleParamChange = (key: string, value: number) => {
    onLayoutParamsChange({ ...layoutParams, [key]: value });
  };

  const handleStringParamChange = (key: string, value: string) => {
    onLayoutParamsChange({ ...layoutParams, [key]: value });
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
          aria-label="Open filter menu"
        >
          <Settings2 className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">
            {selectedFlow ? selectedFlow.name : 'Select Flow'}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
          sideOffset={8}
          align="start"
        >
          <ScrollArea.Root className="h-[calc(100vh-100px)]">
            <ScrollArea.Viewport className="w-full h-full">
              <div className="p-4">
                {/* Flow Selection */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Available Flows
            </h3>
            <ScrollArea.Root className="h-40 rounded border border-gray-200">
              <ScrollArea.Viewport className="w-full h-full">
                <div className="p-2 space-y-1">
                  {flows.map((flow) => (
                    <button
                      key={flow.id}
                      onClick={() => {
                        onFlowSelect(flow.id);
                        // Keep menu open after selection
                      }}
                      className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                        selectedFlowId === flow.id
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="font-medium">{flow.name}</div>
                      {flow.description && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {flow.description}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea.Viewport>
              <ScrollArea.Scrollbar
                className="flex select-none touch-none p-0.5 bg-gray-100 transition-colors duration-150 ease-out hover:bg-gray-200 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5"
                orientation="vertical"
              >
                <ScrollArea.Thumb className="flex-1 bg-gray-400 rounded-[10px] relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
              </ScrollArea.Scrollbar>
            </ScrollArea.Root>
          </div>

          {/* Layout Algorithm Selection */}
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Layout Algorithm
            </h3>
            <select
              value={layoutAlgorithm}
              onChange={(e) => onLayoutChange(e.target.value as LayoutAlgorithm)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="force-directed">Force-Directed</option>
              <option value="hierarchical">Hierarchical</option>
              <option value="radial-tree">Radial Tree</option>
              <option value="elk">ELK (Production)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {layoutAlgorithm === 'force-directed' && 'Physics-based natural layout'}
              {layoutAlgorithm === 'hierarchical' && 'Tree-like top-down layout'}
              {layoutAlgorithm === 'radial-tree' && 'Tree radiating from center'}
              {layoutAlgorithm === 'elk' && 'Professional layout with zero overlaps'}
            </p>

            {/* Layout Parameters */}
            <div className="mt-3 space-y-3">
              {layoutAlgorithm === 'force-directed' && (
                <>
                  <div>
                    <label htmlFor="repulsion" className="text-xs text-gray-600 block mb-1">
                      Repulsion: {Math.abs(layoutParams.repulsion ?? -400)}
                    </label>
                    <input
                      id="repulsion"
                      type="range"
                      min="100"
                      max="800"
                      step="50"
                      value={Math.abs(layoutParams.repulsion ?? -400)}
                      onChange={(e) => handleParamChange('repulsion', -Number(e.target.value))}
                      aria-label="Repulsion strength"
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                      <span>Compact</span>
                      <span>Spread Out</span>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="attraction" className="text-xs text-gray-600 block mb-1">
                      Attraction: {layoutParams.attraction ?? 0.1}
                    </label>
                    <input
                      id="attraction"
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={layoutParams.attraction ?? 0.1}
                      onChange={(e) => handleParamChange('attraction', Number(e.target.value))}
                      aria-label="Attraction strength"
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                      <span>Weak</span>
                      <span>Strong</span>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="centerGravity" className="text-xs text-gray-600 block mb-1">
                      Center Gravity: {layoutParams.centerGravity ?? 0.1}
                    </label>
                    <input
                      id="centerGravity"
                      type="range"
                      min="0"
                      max="0.5"
                      step="0.05"
                      value={layoutParams.centerGravity ?? 0.1}
                      onChange={(e) => handleParamChange('centerGravity', Number(e.target.value))}
                      aria-label="Center Gravity strength"
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                      <span>Weak</span>
                      <span>Strong</span>
                    </div>
                  </div>
                </>
              )}

              {layoutAlgorithm === 'hierarchical' && (
                <>
                  <div>
                    <label htmlFor="rankSeparation" className="text-xs text-gray-600 block mb-1">
                      Rank Separation: {layoutParams.rankSeparation ?? 100}px
                    </label>
                    <input
                      id="rankSeparation"
                      type="range"
                      min="50"
                      max="300"
                      step="10"
                      value={layoutParams.rankSeparation ?? 100}
                      onChange={(e) => handleParamChange('rankSeparation', Number(e.target.value))}
                      aria-label="Rank separation distance"
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                      <span>Compact</span>
                      <span>Spacious</span>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="nodeSeparation" className="text-xs text-gray-600 block mb-1">
                      Node Separation: {layoutParams.nodeSeparation ?? 80}px
                    </label>
                    <input
                      id="nodeSeparation"
                      type="range"
                      min="40"
                      max="200"
                      step="10"
                      value={layoutParams.nodeSeparation ?? 80}
                      onChange={(e) => handleParamChange('nodeSeparation', Number(e.target.value))}
                      aria-label="Node separation distance"
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                      <span>Compact</span>
                      <span>Spacious</span>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="direction" className="text-xs text-gray-600 block mb-1">
                      Direction
                    </label>
                    <select
                      id="direction"
                      value={layoutParams.direction ?? 'TB'}
                      onChange={(e) => handleParamChange('direction', e.target.value as any)}
                      aria-label="Direction of hierarchy"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="TB">Top → Bottom</option>
                      <option value="BT">Bottom → Top</option>
                      <option value="LR">Left → Right</option>
                      <option value="RL">Right → Left</option>
                    </select>
                  </div>
                </>
              )}

              {layoutAlgorithm === 'radial-tree' && (
                <>
                  <div>
                    <label htmlFor="radius" className="text-xs text-gray-600 block mb-1">
                      Radius: {layoutParams.radius ?? 150}px
                    </label>
                    <input
                      id="radius"
                      type="range"
                      min="50"
                      max="300"
                      step="10"
                      value={layoutParams.radius ?? 150}
                      onChange={(e) => handleParamChange('radius', Number(e.target.value))}
                      aria-label="Radius per level"
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                      <span>Compact</span>
                      <span>Spacious</span>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="angleOffset" className="text-xs text-gray-600 block mb-1">
                      Rotation: {layoutParams.angleOffset ?? 0}°
                    </label>
                    <input
                      id="angleOffset"
                      type="range"
                      min="0"
                      max="360"
                      step="15"
                      value={layoutParams.angleOffset ?? 0}
                      onChange={(e) => handleParamChange('angleOffset', Number(e.target.value))}
                      aria-label="Angle offset"
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                      <span>0°</span>
                      <span>360°</span>
                    </div>
                  </div>
                </>
              )}

              {layoutAlgorithm === 'elk' && (
                <>
                  <div>
                    <label htmlFor="elk-algorithm" className="text-xs text-gray-600 block mb-1">
                      ELK Algorithm
                    </label>
                    <select
                      id="elk-algorithm"
                      value={layoutParams.algorithm ?? 'layered'}
                      onChange={(e) => handleStringParamChange('algorithm', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="layered">Layered (Hierarchical)</option>
                      <option value="force">Force-Directed</option>
                      <option value="stress">Stress Minimization</option>
                      <option value="mrtree">Tree (Multi-root)</option>
                      <option value="radial">Radial</option>
                      <option value="box">Box Packing</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="node-spacing" className="text-xs text-gray-600 block mb-1">
                      Node Spacing: {layoutParams.nodeSpacing ?? 80}px
                    </label>
                    <input
                      id="node-spacing"
                      type="range"
                      min="20"
                      max="300"
                      step="10"
                      value={layoutParams.nodeSpacing ?? 80}
                      onChange={(e) => handleParamChange('nodeSpacing', Number(e.target.value))}
                      aria-label="Space between nodes"
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                      <span>Tight</span>
                      <span>Loose</span>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="layer-spacing" className="text-xs text-gray-600 block mb-1">
                      Layer Spacing: {layoutParams.layerSpacing ?? 100}px
                    </label>
                    <input
                      id="layer-spacing"
                      type="range"
                      min="50"
                      max="300"
                      step="10"
                      value={layoutParams.layerSpacing ?? 100}
                      onChange={(e) => handleParamChange('layerSpacing', Number(e.target.value))}
                      aria-label="Space between layers"
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                      <span>Compact</span>
                      <span>Spacious</span>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="elk-direction" className="text-xs text-gray-600 block mb-1">
                      Direction
                    </label>
                    <select
                      id="elk-direction"
                      value={layoutParams.direction ?? 'TB'}
                      onChange={(e) => handleStringParamChange('direction', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="TB">Top to Bottom</option>
                      <option value="BT">Bottom to Top</option>
                      <option value="LR">Left to Right</option>
                      <option value="RL">Right to Left</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Display Options */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Display Options
            </h3>

            {/* Grouping Toggle */}
            <div className="flex items-center justify-between py-2">
              <label htmlFor="grouping-toggle" className="text-sm text-gray-700">
                Show Grouping
              </label>
              <Switch.Root
                id="grouping-toggle"
                checked={showGrouping}
                onCheckedChange={onGroupingToggle}
                className="w-11 h-6 bg-gray-200 rounded-full relative transition-colors data-[state=checked]:bg-blue-600 outline-none cursor-pointer"
              >
                <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[22px]" />
              </Switch.Root>
            </div>

            {/* Smart Edge Routing Toggle */}
            <div className="flex items-center justify-between py-2">
              <label htmlFor="smart-edge-toggle" className="text-sm text-gray-700">
                Smart Edge Routing
              </label>
              <Switch.Root
                id="smart-edge-toggle"
                checked={smartEdgeRouting}
                onCheckedChange={onSmartEdgeRoutingToggle}
                className="w-11 h-6 bg-gray-200 rounded-full relative transition-colors data-[state=checked]:bg-blue-600 outline-none cursor-pointer"
              >
                <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[22px]" />
              </Switch.Root>
            </div>
            <p className="text-xs text-gray-500 -mt-1 mb-2">
              {smartEdgeRouting
                ? 'Edges avoid obstacles using A* pathfinding'
                : 'Direct paths (may overlap nodes)'}
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={() => setOpen(false)}
            className="mt-4 w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded transition-colors"
          >
            Close
          </button>
              </div>
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar
              className="flex select-none touch-none p-0.5 bg-gray-100 transition-colors duration-150 ease-out hover:bg-gray-200 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5"
              orientation="vertical"
            >
              <ScrollArea.Thumb className="flex-1 bg-gray-400 rounded-[10px] relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>

          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
