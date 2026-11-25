/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  EngineConfig,
  PartsGradeTier,
  StoreEngineSpec,
  StorePartOption,
  StoreVehicleModel
} from '../types/engine';
import {
  STORE_YEARS,
  STORE_VEHICLE_MODELS,
  STORE_ENGINES,
  PARTS_GRADE_TIERS,
  getStorePartsForEngine
} from '../data/autoPartsCatalog';
import {
  Store,
  Search,
  CheckCircle2,
  Package,
  Wrench,
  ShieldCheck,
  ShoppingCart,
  ArrowRight,
  RotateCcw,
  Layers
} from 'lucide-react';

export interface ActiveStoreSelection {
  yearLabel: string;
  vehicle: StoreVehicleModel | null;
  engine: StoreEngineSpec;
  tier: PartsGradeTier;
  selectedParts: StorePartOption[];
}

interface AutoPartsStorePanelProps {
  config: EngineConfig;
  activeSelection: ActiveStoreSelection | null;
  onApplyStoreEngine: (
    engine: StoreEngineSpec,
    vehicle: StoreVehicleModel | null,
    yearLabel: string,
    tier: PartsGradeTier,
    selectedParts: StorePartOption[]
  ) => void;
  onUpdateStoreParts: (parts: StorePartOption[], tier: PartsGradeTier) => void;
  onResetRay: () => void;
  compact?: boolean;
}

export const AutoPartsStorePanel: React.FC<AutoPartsStorePanelProps> = ({
  config,
  activeSelection,
  onApplyStoreEngine,
  onUpdateStoreParts,
  onResetRay,
  compact = false
}) => {
  const [selectedYear, setSelectedYear] = useState<string>(
    activeSelection?.yearLabel || '1969'
  );
  const [selectedMake, setSelectedMake] = useState<string>(
    activeSelection?.vehicle?.make || activeSelection?.engine.make || 'Chevrolet'
  );
  const [selectedModelId, setSelectedModelId] = useState<string>(
    activeSelection?.vehicle?.id || 'camaro1969'
  );
  const [selectedEngineId, setSelectedEngineId] = useState<string>(
    activeSelection?.engine.id || 'sbc_350_ray'
  );
  const [selectedTier, setSelectedTier] = useState<PartsGradeTier>(
    activeSelection?.tier || 'street_perf'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [checkedPartIds, setCheckedPartIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (activeSelection?.selectedParts?.length) {
      activeSelection.selectedParts.forEach((p) => {
        initial[p.id] = true;
      });
    }
    return initial;
  });

  // 1. Vehicles filtered by Year
  const vehiclesForYear = useMemo(() => {
    if (selectedYear === 'ALL') return STORE_VEHICLE_MODELS;
    const yr = parseInt(selectedYear, 10);
    return STORE_VEHICLE_MODELS.filter((v) => yr >= v.yearStart && yr <= v.yearEnd);
  }, [selectedYear]);

  // 2. Available Makes for selected Year
  const availableMakes = useMemo(() => {
    const set = new Set<string>(vehiclesForYear.map((v) => v.make));
    return Array.from(set).sort();
  }, [vehiclesForYear]);

  // 3. Available Models for selected Year + Make
  const availableModels = useMemo(() => {
    return vehiclesForYear.filter((v) =>
      selectedMake === 'ALL' ? true : v.make === selectedMake
    );
  }, [vehiclesForYear, selectedMake]);

  // Resolved Model
  const currentVehicle = useMemo(() => {
    return (
      availableModels.find((m) => m.id === selectedModelId) ||
      availableModels[0] ||
      null
    );
  }, [availableModels, selectedModelId]);

  // 4. Available Engines (either for the chosen Vehicle Model, or search-matched across ALL engines)
  const availableEngines = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length >= 2) {
      return Object.values(STORE_ENGINES).filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.code.toLowerCase().includes(q) ||
          e.make.toLowerCase().includes(q) ||
          e.family.toLowerCase().includes(q) ||
          `${e.liters}l`.includes(q) ||
          `${e.cid}`.includes(q)
      );
    }

    if (currentVehicle) {
      return currentVehicle.engineIds
        .map((id) => STORE_ENGINES[id])
        .filter((e): e is StoreEngineSpec => Boolean(e));
    }

    return Object.values(STORE_ENGINES);
  }, [currentVehicle, searchQuery]);

  const currentEngine = useMemo(() => {
    return (
      availableEngines.find((e) => e.id === selectedEngineId) ||
      availableEngines[0] ||
      STORE_ENGINES.sbc_350_ray
    );
  }, [availableEngines, selectedEngineId]);

  // 5. Store Parts Catalog for Current Engine + Tier
  const storeParts = useMemo(() => {
    return getStorePartsForEngine(currentEngine, selectedTier);
  }, [currentEngine, selectedTier]);

  const filteredParts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return storeParts;
    const engineMatched =
      currentEngine.name.toLowerCase().includes(q) ||
      currentEngine.code.toLowerCase().includes(q);
    if (engineMatched) return storeParts;
    const partHits = storeParts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
    return partHits.length > 0 ? partHits : storeParts;
  }, [storeParts, searchQuery, currentEngine]);

  const selectedPartsList = useMemo(() => {
    return storeParts.filter((p) => checkedPartIds[p.id]);
  }, [storeParts, checkedPartIds]);

  const selectedPartsTotal = useMemo(() => {
    return selectedPartsList.reduce(
      (sum, p) => sum + p.price + (p.coreCharge || 0),
      0
    );
  }, [selectedPartsList]);

  // Handlers for cascading Year -> Make -> Model -> Engine
  const handleYearChange = (yr: string) => {
    setSelectedYear(yr);
    const list =
      yr === 'ALL'
        ? STORE_VEHICLE_MODELS
        : STORE_VEHICLE_MODELS.filter(
            (v) => parseInt(yr, 10) >= v.yearStart && parseInt(yr, 10) <= v.yearEnd
          );
    if (list.length > 0) {
      const keepMake = list.some((v) => v.make === selectedMake)
        ? selectedMake
        : list[0].make;
      setSelectedMake(keepMake);
      const models = list.filter((v) => v.make === keepMake);
      if (models.length > 0) {
        const nextModel =
          models.find((m) => m.id === selectedModelId) || models[0];
        setSelectedModelId(nextModel.id);
        if (nextModel.engineIds.length > 0 && !nextModel.engineIds.includes(selectedEngineId)) {
          setSelectedEngineId(nextModel.engineIds[0]);
        }
      }
    }
  };

  const handleMakeChange = (mk: string) => {
    setSelectedMake(mk);
    const models = vehiclesForYear.filter((v) =>
      mk === 'ALL' ? true : v.make === mk
    );
    if (models.length > 0) {
      setSelectedModelId(models[0].id);
      if (models[0].engineIds.length > 0) {
        setSelectedEngineId(models[0].engineIds[0]);
      }
    }
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModelId(modelId);
    const m = STORE_VEHICLE_MODELS.find((v) => v.id === modelId);
    if (m && m.engineIds.length > 0) {
      setSelectedEngineId(m.engineIds[0]);
    }
  };

  const handleTogglePart = (part: StorePartOption) => {
    const nextMap = { ...checkedPartIds, [part.id]: !checkedPartIds[part.id] };
    setCheckedPartIds(nextMap);
    const nextParts = storeParts.filter((p) => nextMap[p.id]);
    onUpdateStoreParts(nextParts, selectedTier);
  };

  const handleSelectCoreProKit = () => {
    // Select key build subsystems (Pistons, Bearings, Gaskets, Oil Pump, Timing, Cam, Water Pump, Ignition, Fasteners)
    const nextMap: Record<string, boolean> = {};
    storeParts.slice(1).forEach((p) => {
      nextMap[p.id] = true;
    });
    setCheckedPartIds(nextMap);
    onUpdateStoreParts(storeParts.slice(1), selectedTier);
  };

  const handleTierSwitch = (tier: PartsGradeTier) => {
    setSelectedTier(tier);
    const newParts = getStorePartsForEngine(currentEngine, tier);
    // Keep same subsystem categories checked when switching tier
    const checkedCategories = new Set(
      storeParts.filter((p) => checkedPartIds[p.id]).map((p) => p.category)
    );
    const nextMap: Record<string, boolean> = {};
    const nextParts: StorePartOption[] = [];
    newParts.forEach((p) => {
      if (checkedCategories.has(p.category)) {
        nextMap[p.id] = true;
        nextParts.push(p);
      }
    });
    setCheckedPartIds(nextMap);
    if (nextParts.length > 0) {
      onUpdateStoreParts(nextParts, tier);
    }
  };

  const isAppliedEngine =
    Math.abs(config.bore - currentEngine.bore) < 0.002 &&
    Math.abs(config.stroke - currentEngine.stroke) < 0.002 &&
    (config.cylinders ?? 8) === currentEngine.cylinders;

  return (
    <div className="bg-[#151a20] border border-orange-500/40 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xl font-mono text-xs text-gray-200">
      {/* Counter Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-orange-500" />
            <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider font-sans">
              PRO AUTO PARTS COUNTER — ALL YEARS, MAKES, MODELS &amp; ENGINE SIZES
            </h3>
            <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
              1955–2026 CATALOG
            </span>
          </div>
          <p className="text-[11px] text-gray-400 font-sans mt-0.5">
            Select Year, Make, Model &amp; Engine displacement, choose OE / Commercial HD / Street Perf / Forged Race parts grade, and sync directly into 3D CAD &amp; Build Sheet BOM.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onResetRay}
            className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold border border-orange-500/70 bg-orange-500/10 hover:bg-orange-600 text-orange-300 hover:text-white transition flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Ray's 350</span>
          </button>
        </div>
      </div>

      {/* Row 1: Year -> Make -> Model -> Engine Size -> Search */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 bg-[#0f1318] p-3 rounded-xl border border-gray-800">
        {/* Year */}
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
            1. MODEL YEAR (1955–2026)
          </label>
          <select
            value={selectedYear}
            onChange={(e) => handleYearChange(e.target.value)}
            className="w-full bg-[#1a2027] border border-gray-700 focus:border-orange-500 rounded-lg px-2.5 py-1.5 text-white font-bold text-xs"
          >
            <option value="ALL">All Model Years (1955–2026)</option>
            {STORE_YEARS.map((yr) => (
              <option key={yr} value={String(yr)}>
                {yr} Model Year
              </option>
            ))}
          </select>
        </div>

        {/* Make */}
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
            2. VEHICLE MAKE ({availableMakes.length})
          </label>
          <select
            value={selectedMake}
            onChange={(e) => handleMakeChange(e.target.value)}
            className="w-full bg-[#1a2027] border border-gray-700 focus:border-orange-500 rounded-lg px-2.5 py-1.5 text-white font-bold text-xs"
          >
            <option value="ALL">All Makes ({vehiclesForYear.length} models)</option>
            {availableMakes.map((mk) => (
              <option key={mk} value={mk}>
                {mk}
              </option>
            ))}
          </select>
        </div>

        {/* Model */}
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
            3. VEHICLE MODEL ({availableModels.length})
          </label>
          <select
            value={currentVehicle?.id || ''}
            onChange={(e) => handleModelChange(e.target.value)}
            className="w-full bg-[#1a2027] border border-gray-700 focus:border-orange-500 rounded-lg px-2.5 py-1.5 text-white font-bold text-xs"
          >
            {availableModels.map((mod) => (
              <option key={mod.id} value={mod.id}>
                {mod.model} ({mod.yearStart}–{mod.yearEnd})
              </option>
            ))}
          </select>
        </div>

        {/* Engine Size */}
        <div>
          <label className="text-[10px] font-bold text-orange-400 uppercase block mb-1">
            4. ENGINE SIZE / SUBMODEL ({availableEngines.length})
          </label>
          <select
            value={currentEngine.id}
            onChange={(e) => setSelectedEngineId(e.target.value)}
            className="w-full bg-[#1a2027] border border-orange-500/70 rounded-lg px-2.5 py-1.5 text-white font-bold text-xs"
          >
            {availableEngines.map((eng) => (
              <option key={eng.id} value={eng.id}>
                {eng.liters.toFixed(1)}L / {eng.cid} CID {eng.configLabel} — {eng.code}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Search */}
        <div>
          <label className="text-[10px] font-bold text-cyan-400 uppercase block mb-1">
            SEARCH CID / CODE / SKU
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. 350, LS3, 5.0L, Fel-Pro..."
              className="w-full bg-[#1a2027] border border-gray-700 focus:border-cyan-400 rounded-lg pl-8 pr-2.5 py-1.5 text-white text-xs placeholder:text-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Row 2: Selected Engine Blueprint Strip & Load Button */}
      <div className="bg-black/60 border border-gray-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-orange-600 text-white font-black text-[10px]">
              {selectedYear === 'ALL'
                ? `${currentEngine.yearStart}–${currentEngine.yearEnd}`
                : selectedYear}{' '}
              {currentVehicle ? `${currentVehicle.make} ${currentVehicle.model}` : currentEngine.make}
            </span>
            <span className="text-white font-black text-xs sm:text-sm font-sans">
              {currentEngine.name}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold">
              {currentEngine.cylinders}-CYL {currentEngine.configLabel} | {currentEngine.family}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-400">
            <span>
              Bore × Stroke:{' '}
              <strong className="text-white">
                {currentEngine.bore.toFixed(3)}" × {currentEngine.stroke.toFixed(3)}"
              </strong>
            </span>
            <span>
              Rod: <strong className="text-emerald-400">{currentEngine.rodLength.toFixed(3)}"</strong>
            </span>
            <span>
              Deck: <strong className="text-cyan-300">{currentEngine.deckHeight.toFixed(3)}"</strong>
            </span>
            <span>
              Firing Order: <strong className="text-amber-300">{currentEngine.firingOrder}</strong>
            </span>
            <span>
              Induction: <strong className="text-gray-200">{currentEngine.fuelSystem}</strong>
            </span>
          </div>
        </div>

        <button
          onClick={() =>
            onApplyStoreEngine(
              currentEngine,
              currentVehicle,
              selectedYear,
              selectedTier,
              selectedPartsList
            )
          }
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-lg ${
            isAppliedEngine
              ? 'bg-emerald-600/20 border border-emerald-500 text-emerald-300 hover:bg-emerald-600 hover:text-white'
              : 'bg-orange-600 hover:bg-orange-500 text-white border border-orange-400'
          }`}
        >
          {isAppliedEngine ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>ACTIVE IN 3D CAD &amp; DYNO — RE-SYNC</span>
            </>
          ) : (
            <>
              <Layers className="w-4 h-4" />
              <span>LOAD ENGINE INTO 3D CAD &amp; DYNO</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {/* Row 3: Professional-Grade Motor Parts Tier Selector */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            SELECT PROFESSIONAL-GRADE MOTOR PARTS LINE:
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectCoreProKit}
              className="px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/70 border border-cyan-500/50 text-cyan-300 text-[10px] font-bold transition flex items-center gap-1"
            >
              <Package className="w-3 h-3" />
              <span>Check Full Pro Rebuild Parts Pack</span>
            </button>
            <div className="px-2.5 py-1 rounded-lg bg-black/70 border border-gray-700 text-[10px] font-bold text-emerald-400 flex items-center gap-1.5">
              <ShoppingCart className="w-3 h-3" />
              <span>
                {selectedPartsList.length} SKUs Selected (${selectedPartsTotal.toFixed(2)})
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {PARTS_GRADE_TIERS.map((t) => {
            const active = selectedTier === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleTierSwitch(t.id)}
                className={`text-left p-2.5 rounded-xl border transition ${
                  active
                    ? `${t.accent} ring-1 ring-white/30`
                    : 'bg-[#101419] border-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-200'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-black text-xs text-white">{t.label}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/60 border border-current font-bold">
                    {t.badge}
                  </span>
                </div>
                <div className="text-[10px] text-gray-400 font-sans mt-1 leading-tight">
                  {t.tagline}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 4: Counter Motor Parts SKU Grid */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 gap-2.5 ${
          compact ? 'max-h-[340px] overflow-y-auto pr-1' : ''
        }`}
      >
        {filteredParts.map((part) => {
          const isChecked = Boolean(checkedPartIds[part.id]);
          return (
            <div
              key={part.id}
              onClick={() => handleTogglePart(part)}
              className={`cursor-pointer p-3 rounded-xl border transition flex flex-col justify-between gap-1.5 ${
                isChecked
                  ? 'bg-emerald-950/25 border-emerald-500/70'
                  : 'bg-[#0f1318] border-gray-800 hover:border-gray-600'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 font-bold uppercase">
                      {part.category}
                    </span>
                    <span className="text-[10px] text-cyan-300 font-bold">
                      SKU: {part.sku}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white font-sans">
                    {part.name}
                  </div>
                  <div className="text-[10px] text-amber-300 font-semibold">
                    {part.brand} • {part.warranty}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-black text-emerald-400">
                    ${part.price.toFixed(2)}
                  </div>
                  {part.coreCharge ? (
                    <div className="text-[9px] text-gray-400">
                      +${part.coreCharge.toFixed(2)} Core
                    </div>
                  ) : null}
                  <div
                    className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold border ${
                      isChecked
                        ? 'bg-emerald-600 border-emerald-400 text-white'
                        : 'bg-black/60 border-gray-700 text-gray-300'
                    }`}
                  >
                    <Wrench className="w-2.5 h-2.5" />
                    <span>{isChecked ? 'IN BOM' : 'ADD TO BOM'}</span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-gray-400 font-sans border-t border-gray-800/80 pt-1.5 flex flex-wrap items-center justify-between gap-2">
                <span className="leading-snug">{part.specSummary}</span>
                <span className="text-[9px] text-emerald-400 font-mono font-bold shrink-0">
                  {part.inStock}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
