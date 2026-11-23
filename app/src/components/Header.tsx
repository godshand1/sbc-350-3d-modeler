/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ENGINE_CATALOG } from '../data/engineData';
import { RotateCcw, Store, BookOpen, Menu } from 'lucide-react';

interface HeaderProps {
  selectedEngineId: string;
  onSelectEnginePreset: (engineId: string) => void;
  onResetRay: () => void;
  onOpenPartsStore: () => void;
  onOpenKnowledge: () => void;
  onToggleMobileSidebar: () => void;
  activeStoreLabel?: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  selectedEngineId,
  onSelectEnginePreset,
  onResetRay,
  onOpenPartsStore,
  onOpenKnowledge,
  onToggleMobileSidebar,
  activeStoreLabel
}) => {
  return (
    <header className="h-12 flex-shrink-0 bg-[#11151b] border-b border-slate-800 px-4 flex items-center justify-between gap-6 z-30">
      {/* Zone 1: Brand Wordmark (Single-line) */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-1.5 rounded-md border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition"
          aria-label="Toggle Workbenches Menu"
        >
          <Menu className="w-4 h-4" />
        </button>
        <span className="text-sm sm:text-base font-bold tracking-tight text-white whitespace-nowrap">
          SBC 350 CAD Studio
        </span>
      </div>

      {/* Zone 2: Engine Assembly Selector & Global Studio Libraries */}
      <div className="hidden md:flex items-center gap-5 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <label
            htmlFor="studio-engine-select"
            className="text-xs font-medium text-slate-400 whitespace-nowrap shrink-0"
          >
            Engine
          </label>
          <select
            id="studio-engine-select"
            value={selectedEngineId}
            onChange={(e) => onSelectEnginePreset(e.target.value)}
            className="bg-[#0d1014] border border-slate-700 focus:border-orange-500 rounded-md px-2.5 py-1 text-xs font-medium text-white max-w-[260px] truncate outline-none"
          >
            {Object.values(ENGINE_CATALOG).map((eng) => (
              <option key={eng.id} value={eng.id}>
                {eng.name}
              </option>
            ))}
          </select>
        </div>

        <nav className="flex items-center gap-5 text-xs font-medium text-slate-300">
          <button
            onClick={onOpenPartsStore}
            className="hover:text-emerald-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <Store className="w-3.5 h-3.5 text-emerald-400" />
            <span>{activeStoreLabel ? `Counter: ${activeStoreLabel}` : 'Parts Catalog'}</span>
          </button>

          <button
            onClick={onOpenKnowledge}
            className="hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Tech Knowledge</span>
          </button>
        </nav>
      </div>

      {/* Zone 3: Primary Action */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onResetRay}
          title="Reset to Ray's Confirmed Baseline (4.000 x 3.480, 5.700 Rods, 9.025 Deck, 64cc, .054 Quench)"
          className="px-3 py-1.5 rounded-md text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white transition whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Ray's 350</span>
        </button>
      </div>
    </header>
  );
};
