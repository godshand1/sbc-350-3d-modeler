/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { CoordinatedSpecs, EngineConfig, TabId } from '../types/engine';
import {
  TECH_KNOWLEDGE_DOMAINS,
  TECH_KNOWLEDGE_ARTICLES
} from '../data/autoTechKnowledge';
import {
  BookOpen,
  Search,
  X,
  ArrowUpRight,
  Wrench,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

interface AutoTechKnowledgeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  specs: CoordinatedSpecs;
  config: EngineConfig;
  onJumpToTab: (tab: TabId) => void;
}

export const AutoTechKnowledgeDrawer: React.FC<AutoTechKnowledgeDrawerProps> = ({
  isOpen,
  onClose,
  specs,
  config,
  onJumpToTab
}) => {
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return TECH_KNOWLEDGE_ARTICLES.filter((article) => {
      const domainMatch =
        selectedDomain === 'ALL' || article.domainId === selectedDomain;
      if (!domainMatch) return false;
      if (!q) return true;
      return (
        article.title.toLowerCase().includes(q) ||
        article.summary.toLowerCase().includes(q) ||
        article.subsystemTag.toLowerCase().includes(q) ||
        article.keyPrinciples.some((p) => p.toLowerCase().includes(q)) ||
        article.failureDiagnostics.some((f) => f.toLowerCase().includes(q)) ||
        (article.formula && article.formula.toLowerCase().includes(q))
      );
    });
  }, [selectedDomain, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex justify-end">
      <div className="w-full max-w-5xl h-full bg-[#11151b] border-l border-slate-800 flex flex-col shadow-2xl">
        {/* Top Bar */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-[#151a21] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <BookOpen className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white truncate">
                Global Automotive &amp; Motor Technology Encyclopedia
              </h2>
              <p className="text-xs text-slate-400 truncate">
                Engine architecture, kinematics, metallurgy, forced induction, ignition, driveline &amp; metrology reference
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg border border-slate-700 bg-[#0d1014] text-slate-300 hover:text-white hover:border-slate-500 transition shrink-0"
            aria-label="Close Encyclopedia"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Telemetry Reference Bar (Synced to Active Engine Config) */}
        <div className="px-5 py-2.5 bg-[#0d1014] border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <span className="text-slate-400 font-medium">
            Active Engine Telemetry Reference:
          </span>
          <div className="flex flex-wrap items-center gap-5 font-mono tabular-nums">
            <span>
              <span className="text-slate-500">DISP </span>
              <strong className="text-white">{specs.displacementCi} CID ({specs.displacementL}L)</strong>
            </span>
            <span>
              <span className="text-slate-500">B×S </span>
              <strong className="text-slate-200">{config.bore.toFixed(3)}" × {config.stroke.toFixed(3)}"</strong>
            </span>
            <span>
              <span className="text-slate-500">QUENCH </span>
              <strong className="text-emerald-400">{specs.quenchDistance}"</strong>
            </span>
            <span>
              <span className="text-slate-500">SCR / DCR </span>
              <strong className="text-amber-400">{specs.staticCR}:1 / {specs.dynamicCR}:1</strong>
            </span>
            <span>
              <span className="text-slate-500">DEMAND </span>
              <strong className="text-cyan-400">{specs.peakCfmDemand} CFM</strong>
            </span>
          </div>
        </div>

        {/* Search + Split Domain Rail & Content */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row">
          {/* Left Domain Rail */}
          <aside className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-slate-800 bg-[#0f1318] p-3 flex flex-col gap-2 overflow-y-auto">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search formulas, parts, failures..."
                className="w-full bg-[#161c24] border border-slate-700 focus:border-amber-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none"
              />
            </div>

            <div className="space-y-1 pt-1">
              <button
                onClick={() => setSelectedDomain('ALL')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition ${
                  selectedDomain === 'ALL'
                    ? 'bg-orange-600/20 text-orange-300 border border-orange-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                All Domains ({TECH_KNOWLEDGE_ARTICLES.length} Guides)
              </button>

              {TECH_KNOWLEDGE_DOMAINS.map((domain) => (
                <button
                  key={domain.id}
                  onClick={() => setSelectedDomain(domain.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition ${
                    selectedDomain === domain.id
                      ? 'bg-orange-600/20 text-orange-300 border border-orange-500/40 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <div className="truncate">{domain.name}</div>
                </button>
              ))}
            </div>
          </aside>

          {/* Right Article Stream */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {filteredArticles.length === 0 ? (
              <div className="p-8 text-center border border-slate-800 rounded-xl bg-[#151a21]">
                <p className="text-sm font-semibold text-white">
                  No engineering references matched "{searchQuery}"
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Try searching terms like "Quench", "4340", "ZDDP", "17-Bolt", "LS", or "5252".
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedDomain('ALL');
                  }}
                  className="mt-3 px-4 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-semibold hover:bg-orange-500 transition"
                >
                  Reset Filter
                </button>
              </div>
            ) : (
              filteredArticles.map((article) => (
                <article
                  key={article.id}
                  className="border border-slate-800 rounded-xl bg-[#151a21] p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3">
                    <div className="space-y-1">
                      <div className="text-xs text-slate-400 flex items-center gap-2">
                        <span className="text-amber-400 font-medium">
                          {article.subsystemTag}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {TECH_KNOWLEDGE_DOMAINS.find((d) => d.id === article.domainId)?.name}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white">
                        {article.title}
                      </h3>
                    </div>

                    <button
                      onClick={() => {
                        onJumpToTab(article.relatedTab);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-700 hover:border-orange-500 bg-[#0d1014] text-xs font-medium text-slate-200 hover:text-orange-300 transition flex items-center gap-1.5 shrink-0"
                    >
                      <span>Open Workbench</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed">
                    {article.summary}
                  </p>

                  {article.formula && (
                    <div className="px-3.5 py-2.5 rounded-lg bg-[#0d1014] border border-slate-800 font-mono text-xs text-cyan-300">
                      Formula: {article.formula}
                    </div>
                  )}

                  {/* Reference Specs Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {article.engineeringSpecs.map((spec) => (
                      <div
                        key={spec.label}
                        className="p-2.5 rounded-lg bg-[#0d1014] border border-slate-800/80"
                      >
                        <div className="text-[11px] text-slate-400">{spec.label}</div>
                        <div className="text-xs font-mono font-bold text-white mt-0.5 tabular-nums">
                          {spec.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Key Principles & Diagnostics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Design &amp; Blueprint Principles</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed">
                        {article.keyPrinciples.map((kp, idx) => (
                          <li key={idx} className="flex gap-2">
                            <Wrench className="w-3 h-3 text-slate-500 shrink-0 mt-1" />
                            <span>{kp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Failure Modes &amp; Shop Diagnostics</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed">
                        {article.failureDiagnostics.map((fd, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="text-amber-500 font-mono shrink-0">!</span>
                            <span>{fd}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
