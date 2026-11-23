/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  EngineConfig,
  CoordinatedSpecs,
  TechDrawingSheet,
  TechDrawingCallout,
  TransmissionItem,
  TabId
} from '../types/engine';
import { TRANSMISSIONS_DB } from '../data/engineData';
import {
  getEngineDrawingSheet,
  getTransmissionDrawingSheet,
  A500_42RE_REFERENCE_IMAGE
} from '../data/techDrawingsCatalog';
import { ActiveStoreSelection } from './AutoPartsStorePanel';
import {
  SchematicEngineSVG,
  SchematicTransmissionSVG,
  BlueprintPaperTheme
} from './SchematicBlueprints';
import {
  FileSpreadsheet,
  Search,
  Upload,
  Download,
  Printer,
  Box,
  ExternalLink,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Image as ImageIcon,
  Wrench,
  ShieldCheck
} from 'lucide-react';

interface TabTechnicalDrawingsProps {
  config: EngineConfig;
  specs: CoordinatedSpecs;
  onUpdateConfig: (newConfig: Partial<EngineConfig>) => void;
  activeStoreSelection: ActiveStoreSelection | null;
  customEngineDrawing: TechDrawingSheet | null;
  onApplyEngineDrawing: (sheet: TechDrawingSheet | null) => void;
  transDrawingsById: Record<string, TechDrawingSheet>;
  transOverridesById: Record<string, Partial<TransmissionItem>>;
  onApplyTransDrawing: (transId: string, sheet: TechDrawingSheet | null) => void;
  onJumpToTab: (tab: TabId) => void;
}

export const TabTechnicalDrawings: React.FC<TabTechnicalDrawingsProps> = ({
  config,
  specs,
  onUpdateConfig,
  activeStoreSelection,
  customEngineDrawing,
  onApplyEngineDrawing,
  transDrawingsById,
  transOverridesById,
  onApplyTransDrawing,
  onJumpToTab
}) => {
  const [domain, setDomain] = useState<'engine' | 'transmission'>('engine');
  const [visualMode, setVisualMode] = useState<'schematic' | 'diagram'>('schematic');
  const [paperTheme, setPaperTheme] = useState<BlueprintPaperTheme>('blueprint');
  const [diagramZoom, setDiagramZoom] = useState<number>(1);
  const [rowFilter, setRowFilter] = useState<string>('ALL');
  const [calloutFilter, setCalloutFilter] = useState<string>('');
  const [selectedCallout, setSelectedCallout] = useState<TechDrawingCallout | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stagedSheet, setStagedSheet] = useState<TechDrawingSheet | null>(null);
  const [isLookingUp, setIsLookingUp] = useState<boolean>(false);
  const [isParsingDiagram, setIsParsingDiagram] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const baseTrans = TRANSMISSIONS_DB[config.selectedTrans] || TRANSMISSIONS_DB.th350;
  const currentTrans: TransmissionItem = useMemo(() => {
    const override = transOverridesById[baseTrans.id];
    return override ? { ...baseTrans, ...override } : baseTrans;
  }, [baseTrans, transOverridesById]);

  const builtInEngineSheet = useMemo(
    () => getEngineDrawingSheet(config, specs, activeStoreSelection),
    [config, specs, activeStoreSelection]
  );
  const builtInTransSheet = useMemo(
    () => getTransmissionDrawingSheet(currentTrans),
    [currentTrans]
  );

  const activeSavedSheet =
    domain === 'engine'
      ? customEngineDrawing || builtInEngineSheet
      : transDrawingsById[currentTrans.id] || builtInTransSheet;

  const displayedSheet =
    stagedSheet && stagedSheet.domain === domain ? stagedSheet : activeSavedSheet;

  const hasReferenceImage = Boolean(displayedSheet.referenceImageUrl);

  const activeInspectCallout = useMemo(() => {
    if (selectedCallout) return selectedCallout;
    return displayedSheet.callouts[0] || null;
  }, [selectedCallout, displayedSheet]);

  const rowsAvailable = useMemo(() => {
    const set = new Set<string>();
    displayedSheet.callouts.forEach((c) => {
      if (c.row) set.add(c.row.toUpperCase());
    });
    return ['ALL', ...Array.from(set).sort()];
  }, [displayedSheet]);

  const filteredCallouts = useMemo(() => {
    const q = calloutFilter.trim().toLowerCase();
    return displayedSheet.callouts.filter((c) => {
      const matchesRow = rowFilter === 'ALL' || c.row.toUpperCase() === rowFilter;
      if (!q) return matchesRow;
      return (
        matchesRow &&
        (c.partName.toLowerCase().includes(q) ||
          c.indexCode.toLowerCase().includes(q) ||
          (c.partNumber || '').toLowerCase().includes(q) ||
          (c.clearanceSpec || '').toLowerCase().includes(q) ||
          c.targetSubassembly.toLowerCase().includes(q))
      );
    });
  }, [displayedSheet, rowFilter, calloutFilter]);

  const handleSelectDomain = (nextDomain: 'engine' | 'transmission') => {
    setDomain(nextDomain);
    setSelectedCallout(null);
    setRowFilter('ALL');
    setErrorMsg(null);
    setStatusMsg(null);
    if (nextDomain === 'transmission' && currentTrans.id === 'mopar_a500_42re') {
      // Keep user's selected mode, or make diagram toggle immediately obvious
    }
  };

  const handleOnlineLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim() || displayedSheet.title;
    if (!q) return;

    setIsLookingUp(true);
    setErrorMsg(null);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/specs/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          query: q,
          unitName: displayedSheet.title,
          contextSpecs:
            domain === 'engine'
              ? {
                  bore: config.bore,
                  stroke: config.stroke,
                  rodLength: config.rodLength,
                  chamberCc: config.chamberCc,
                  staticCR: specs.staticCR
                }
              : {
                  id: currentTrans.id,
                  ratios: currentTrans.ratios,
                  lengthInches: currentTrans.lengthInches
                }
        })
      });

      const payload = (await res.json()) as { sheet?: TechDrawingSheet; error?: string };
      if (!res.ok || !payload.sheet) {
        throw new Error(payload.error || `Online lookup failed (${res.status})`);
      }

      setStagedSheet(payload.sheet);
      setSelectedCallout(payload.sheet.callouts[0] || null);
      setRowFilter('ALL');
      setStatusMsg(
        `Loaded ${payload.sheet.callouts.length} real-world callouts for "${payload.sheet.title}". Apply to commit into live CAD & 3D.`
      );
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to fetch online specs.');
    } finally {
      setIsLookingUp(false);
    }
  };

  const parseDiagramDataUrl = async (
    dataUrl: string,
    mimeType: string,
    label: string,
    hintDomain?: 'engine' | 'transmission'
  ) => {
    setIsParsingDiagram(true);
    setErrorMsg(null);
    setStatusMsg(null);

    try {
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      const res = await fetch('/api/specs/parse-diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: hintDomain || domain,
          imageBase64: base64,
          mimeType,
          unitHint: label
        })
      });

      const payload = (await res.json()) as { sheet?: TechDrawingSheet; error?: string };
      if (!res.ok || !payload.sheet) {
        throw new Error(payload.error || `Diagram extraction failed (${res.status})`);
      }

      const nextSheet: TechDrawingSheet = {
        ...payload.sheet,
        referenceImageUrl: dataUrl
      };
      setDomain(nextSheet.domain);
      setStagedSheet(nextSheet);
      setVisualMode('diagram');
      setSelectedCallout(nextSheet.callouts[0] || null);
      setRowFilter('ALL');
      setStatusMsg(
        `Extracted ${nextSheet.callouts.length} labeled components from "${label}". Switch between Schematic & Part Diagram views anytime.`
      );
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to parse uploaded technical drawing.');
    } finally {
      setIsParsingDiagram(false);
    }
  };

  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        void parseDiagramDataUrl(reader.result, file.type || 'image/jpeg', file.name);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleLoadA500Diagram = async () => {
    onUpdateConfig({ selectedTrans: 'mopar_a500_42re' });
    setStagedSheet(null);
    setDomain('transmission');
    setVisualMode('diagram');
    setDiagramZoom(1);
    setSelectedCallout(null);
    setErrorMsg(null);
    setStatusMsg('Loaded Chrysler 40RH / 42RH / 42RE / 44RE (A500) Exploded Catalog Diagram & CAD Schematic.');
  };

  const handleApplyTo3D = () => {
    const targetSheet = displayedSheet;
    if (targetSheet.domain === 'engine') {
      onApplyEngineDrawing(targetSheet);
      const dims = targetSheet.dimensions;
      if (dims) {
        const updates: Partial<EngineConfig> = {};
        if (typeof dims.bore === 'number' && dims.bore > 2 && dims.bore < 6) updates.bore = dims.bore;
        if (typeof dims.stroke === 'number' && dims.stroke > 2 && dims.stroke < 6) updates.stroke = dims.stroke;
        if (typeof dims.rodLength === 'number' && dims.rodLength > 4 && dims.rodLength < 8) updates.rodLength = dims.rodLength;
        if (typeof dims.deckHeight === 'number' && dims.deckHeight > 7 && dims.deckHeight < 12) updates.deckHeight = dims.deckHeight;
        if (typeof dims.deckClearance === 'number' && dims.deckClearance >= 0 && dims.deckClearance < 0.2) {
          updates.deckClearance = dims.deckClearance;
        }
        if (typeof dims.gasketThickness === 'number' && dims.gasketThickness > 0.01 && dims.gasketThickness < 0.15) {
          updates.gasketThickness = dims.gasketThickness;
        }
        if (typeof dims.chamberCc === 'number' && dims.chamberCc > 30 && dims.chamberCc < 140) {
          updates.chamberCc = dims.chamberCc;
        }
        if (Object.keys(updates).length > 0) {
          onUpdateConfig(updates);
        }
      }
    } else {
      onApplyTransDrawing(currentTrans.id, targetSheet);
      if (targetSheet.dimensions?.defaultStall && currentTrans.type === 'Automatic') {
        onUpdateConfig({ stallSpeed: targetSheet.dimensions.defaultStall });
      }
    }
    setStagedSheet(null);
    setStatusMsg(`Applied "${targetSheet.title}" specs & BOM callouts to the live 3D ${targetSheet.domain} model.`);
  };

  const handleExportSvg = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgRef.current);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${displayedSheet.drawingNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const dimensionStripItems =
    domain === 'engine'
      ? [
          {
            label: 'Bore × Stroke',
            value: `${config.bore.toFixed(3)}" × ${config.stroke.toFixed(3)}"`,
            sub: `${specs.displacementCi} CID (${specs.displacementL} L)`
          },
          {
            label: 'Rod & Kinematics',
            value: `${config.rodLength.toFixed(3)}" C-to-C`,
            sub: `R/S ${specs.rodStrokeRatio}:1 · Max Angle ${specs.maxRodAngleDeg}°`
          },
          {
            label: 'Deck & Quench Stack',
            value: `${specs.quenchDistance}" Quench`,
            sub: `${config.deckHeight.toFixed(3)}" Deck · ${config.deckClearance.toFixed(3)}" + ${config.gasketThickness.toFixed(3)}"`
          },
          {
            label: 'Compression Ratio',
            value: `${specs.staticCR}:1 SCR`,
            sub: `${specs.dynamicCR}:1 Dynamic · ${config.chamberCc.toFixed(1)} cc Chamber`
          },
          {
            label: 'Valvetrain & Rings',
            value: `${specs.totalValveLift}" Valve Lift`,
            sub: `Gaps ${specs.topRingGap}" / ${specs.secondRingGap}" / ${specs.oilRingGap.toFixed(3)}"`
          }
        ]
      : [
          {
            label: 'Overall Length',
            value: `${currentTrans.lengthInches.toFixed(1)}" OAL`,
            sub: `${currentTrans.type} · ${currentTrans.ratios.length}-Speed`
          },
          {
            label: 'Bellhousing Pattern',
            value: currentTrans.nativePattern,
            sub: specs.compatibility.isDirectBoltOn ? 'Direct GM Bolt-On' : specs.compatibility.bellhousing
          },
          {
            label: 'Forward Gear Ratios',
            value: currentTrans.ratios.map((r) => r.toFixed(2)).join(' / '),
            sub: `Reverse ${currentTrans.reverse.toFixed(2)}:1`
          },
          {
            label: 'Converter / Clutch',
            value: currentTrans.type === 'Automatic' ? `${config.stallSpeed} RPM Stall` : 'Manual Clutch',
            sub: currentTrans.clutch
          },
          {
            label: 'Chassis Tunnel Fit',
            value: specs.compatibility.isDirectBoltOn ? 'Factory Fitment' : 'Adapter Required',
            sub: currentTrans.tunnelProfile
          }
        ];

  return (
    <div className="p-4 sm:p-6 max-w-[1440px] mx-auto w-full space-y-5 text-xs text-slate-200">
      {/* Workbench Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
            <span>Technical Drawing Description &amp; Dimensioned Schematics</span>
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
            <span className="font-mono text-cyan-300 font-semibold">{displayedSheet.drawingNumber}</span>
            <span aria-hidden="true">·</span>
            <span>{displayedSheet.title}</span>
            <span aria-hidden="true">·</span>
            <span>{displayedSheet.sourceLabel}</span>
          </div>
        </div>

        {/* Interactive Assembly, View & Paper Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Domain Selector */}
          <div className="flex items-center gap-1 p-1 bg-[#12161c] border border-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => handleSelectDomain('engine')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${
                domain === 'engine'
                  ? 'bg-orange-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Engine Schematic
            </button>
            <button
              type="button"
              onClick={() => handleSelectDomain('transmission')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${
                domain === 'transmission'
                  ? 'bg-orange-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Transmission Schematic
            </button>
          </div>

          {/* Schematic vs Part Diagram Toggle */}
          <div className="flex items-center gap-1 p-1 bg-[#12161c] border border-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setVisualMode('schematic')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${
                visualMode === 'schematic'
                  ? 'bg-cyan-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Dimensioned CAD
            </button>
            <button
              type="button"
              onClick={() => setVisualMode('diagram')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${
                visualMode === 'diagram'
                  ? 'bg-cyan-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Part Catalog Diagram
            </button>
          </div>

          {/* Paper Style Toggle */}
          {visualMode === 'schematic' && (
            <button
              type="button"
              onClick={() => setPaperTheme((prev) => (prev === 'blueprint' ? 'vellum' : 'blueprint'))}
              className="px-3 py-2 rounded-lg border border-slate-700 bg-[#12161c] hover:border-slate-500 text-slate-200 text-xs font-medium transition whitespace-nowrap"
            >
              {paperTheme === 'blueprint' ? 'Vellum Paper' : 'Blueprint Dark'}
            </button>
          )}

          {visualMode === 'schematic' && (
            <button
              type="button"
              onClick={handleExportSvg}
              className="px-3 py-2 rounded-lg border border-slate-700 bg-[#12161c] hover:border-emerald-500/60 text-slate-200 hover:text-emerald-300 text-xs font-medium flex items-center gap-1.5 transition whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export SVG</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="no-print px-3 py-2 rounded-lg border border-slate-700 bg-[#12161c] hover:border-slate-500 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Transmission Selector Bar + Online Lookup & Diagram Upload */}
      <div className="bg-[#12161c] border border-slate-800 rounded-xl p-4 space-y-3 no-print">
        <div className="flex flex-wrap items-center gap-3">
          {domain === 'transmission' && (
            <div className="flex items-center gap-2 min-w-[260px]">
              <label htmlFor="td-trans-select" className="text-slate-400 font-medium whitespace-nowrap">
                Transmission Unit:
              </label>
              <select
                id="td-trans-select"
                value={currentTrans.id}
                onChange={(e) => {
                  const chosen = TRANSMISSIONS_DB[e.target.value];
                  if (chosen) {
                    onUpdateConfig({
                      selectedTrans: chosen.id,
                      stallSpeed: chosen.defaultStall || config.stallSpeed
                    });
                    setSelectedCallout(null);
                  }
                }}
                className="bg-[#0d1014] border border-slate-700 focus:border-cyan-400 rounded-md px-2.5 py-1.5 text-xs text-white font-medium max-w-[300px]"
              >
                {Object.values(TRANSMISSIONS_DB).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <form onSubmit={handleOnlineLookup} className="flex-1 flex flex-wrap sm:flex-nowrap items-center gap-2 min-w-[260px]">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  domain === 'engine'
                    ? `Search online specs (current: ${displayedSheet.title})...`
                    : `Search online specs (current: ${currentTrans.name})...`
                }
                className="w-full bg-[#0d1014] border border-slate-700 focus:border-cyan-400 rounded-md pl-8 pr-3 py-1.5 text-xs text-white outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isLookingUp || isParsingDiagram}
              className="px-3.5 py-1.5 rounded-md bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition whitespace-nowrap"
            >
              {isLookingUp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{isLookingUp ? 'Searching...' : 'Pull Online Specs'}</span>
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUploadFile}
              className="hidden"
            />
            <button
              type="button"
              disabled={isLookingUp || isParsingDiagram}
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-md border border-slate-700 bg-[#0d1014] hover:border-orange-400 text-slate-200 hover:text-white text-xs font-medium flex items-center gap-1.5 transition whitespace-nowrap"
            >
              {isParsingDiagram ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-400" />
              ) : (
                <Upload className="w-3.5 h-3.5 text-orange-400" />
              )}
              <span>{isParsingDiagram ? 'Extracting...' : 'Upload Part Diagram'}</span>
            </button>

            <button
              type="button"
              onClick={handleLoadA500Diagram}
              className="px-3 py-1.5 rounded-md border border-slate-700 bg-[#0d1014] hover:border-cyan-400 text-cyan-300 text-xs font-medium flex items-center gap-1.5 transition whitespace-nowrap"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>View A500 / 42RE Diagram</span>
            </button>

            <button
              type="button"
              onClick={handleApplyTo3D}
              className={`px-3.5 py-1.5 rounded-md font-semibold text-xs flex items-center gap-1.5 transition whitespace-nowrap ${
                stagedSheet
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  : 'bg-orange-600 hover:bg-orange-500 text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{stagedSheet ? 'Apply Pulled Specs to 3D' : 'Sync Sheet to 3D Model'}</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-500/50 text-red-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {statusMsg && !errorMsg && (
          <div className="p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-emerald-200">
            {statusMsg}
          </div>
        )}
      </div>

      {/* Primary Focal Anchor: Dimensioned Schematic / Catalog Diagram + Selected Callout Spec Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* Left / Main Technical Drawing Stage (9 cols on XL) */}
        <div className="xl:col-span-9 bg-[#091628] border border-slate-800 rounded-xl overflow-hidden flex flex-col">
          {visualMode === 'schematic' ? (
            <div className="w-full overflow-x-auto">
              {domain === 'engine' ? (
                <SchematicEngineSVG
                  config={config}
                  specs={specs}
                  sheet={displayedSheet}
                  selectedTarget={activeInspectCallout?.targetSubassembly || null}
                  onSelectCallout={(c) => setSelectedCallout(c)}
                  paperTheme={paperTheme}
                  svgRef={svgRef}
                />
              ) : (
                <SchematicTransmissionSVG
                  transmission={currentTrans}
                  sheet={displayedSheet}
                  selectedTarget={activeInspectCallout?.targetSubassembly || null}
                  onSelectCallout={(c) => setSelectedCallout(c)}
                  paperTheme={paperTheme}
                  svgRef={svgRef}
                />
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-[460px]">
              {/* Diagram Viewer Toolbar */}
              <div className="px-4 py-2.5 bg-[#0d1014] border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-slate-300">
                  {hasReferenceImage
                    ? `Exploded Parts Catalog Sheet · ${displayedSheet.drawingNumber}`
                    : 'No uploaded catalog bitmap for this unit — upload an image or view Dimensioned CAD Schematic'}
                </span>
                {hasReferenceImage && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDiagramZoom((z) => Math.max(0.75, +(z - 0.25).toFixed(2)))}
                      className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                      aria-label="Zoom out diagram"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-cyan-300 px-2 tabular-nums">
                      {Math.round(diagramZoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setDiagramZoom((z) => Math.min(2.5, +(z + 0.25).toFixed(2)))}
                      className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                      aria-label="Zoom in diagram"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiagramZoom(1)}
                      className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                      aria-label="Reset zoom"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Diagram Image Canvas or Guided Fallback */}
              <div className="flex-1 overflow-auto bg-[#0b1320] flex items-center justify-center p-4">
                {hasReferenceImage ? (
                  <div className="bg-white rounded-lg p-2 shadow-xl overflow-auto max-h-[540px]">
                    <img
                      src={displayedSheet.referenceImageUrl}
                      alt={`${displayedSheet.title} technical parts diagram`}
                      referrerPolicy="no-referrer"
                      style={{ transform: `scale(${diagramZoom})`, transformOrigin: 'top center' }}
                      className="max-w-full h-auto object-contain transition-transform"
                    />
                  </div>
                ) : (
                  <div className="max-w-lg text-center space-y-3 p-6 border border-slate-800 rounded-xl bg-[#12161c]">
                    <ImageIcon className="w-10 h-10 text-cyan-400 mx-auto" />
                    <h3 className="text-sm font-bold text-white">
                      Dimensioned Vector CAD Active — No Catalog Bitmap Attached Yet
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Upload any scanned factory exploded parts diagram or shop manual sheet above, load the Chrysler A500 / 42RE reference sheet, or switch to the parametric Dimensioned CAD view.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2 rounded-md bg-orange-600 hover:bg-orange-500 text-white font-semibold"
                      >
                        Upload Diagram Image
                      </button>
                      <button
                        type="button"
                        onClick={handleLoadA500Diagram}
                        className="px-3.5 py-2 rounded-md border border-slate-700 bg-[#0d1014] hover:border-cyan-400 text-cyan-300 font-medium"
                      >
                        Load A500 / 42RE Diagram
                      </button>
                      <button
                        type="button"
                        onClick={() => setVisualMode('schematic')}
                        className="px-3.5 py-2 rounded-md border border-slate-700 bg-[#0d1014] hover:text-white text-slate-300 font-medium"
                      >
                        View CAD Schematic
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Component Inspector Panel (3 cols on XL) */}
        <aside className="xl:col-span-3 bg-[#12161c] border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-4">
          {activeInspectCallout ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="font-mono text-cyan-300 font-bold">
                  INDEX {activeInspectCallout.indexCode} · ROW {activeInspectCallout.row}
                </span>
                <span className="text-slate-400">{activeInspectCallout.category}</span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white leading-snug">
                  {activeInspectCallout.partName}
                </h3>
                {activeInspectCallout.partNumber && (
                  <p className="font-mono text-amber-300 font-semibold mt-1">
                    SKU / Part #: {activeInspectCallout.partNumber}
                  </p>
                )}
              </div>

              <div className="space-y-2.5 pt-1 border-t border-slate-800/80">
                <div className="space-y-0.5">
                  <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Clearance &amp; Tolerance Spec</span>
                  </div>
                  <p className="font-mono text-slate-200 tabular-nums leading-relaxed">
                    {activeInspectCallout.clearanceSpec || 'OEM factory standard tolerance'}
                  </p>
                </div>

                <div className="space-y-0.5">
                  <div className="text-[11px] font-semibold text-amber-400 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Fastener Torque &amp; Preload</span>
                  </div>
                  <p className="font-mono text-slate-200 tabular-nums leading-relaxed">
                    {activeInspectCallout.torqueSpec || 'Standard dry/lubed fastener torque'}
                  </p>
                </div>

                {activeInspectCallout.material && (
                  <div className="space-y-0.5">
                    <div className="text-[11px] font-semibold text-slate-400">Material &amp; Finish</div>
                    <p className="text-slate-200">{activeInspectCallout.material}</p>
                  </div>
                )}

                {activeInspectCallout.notes && (
                  <div className="space-y-0.5">
                    <div className="text-[11px] font-semibold text-slate-400">Assembly &amp; Inspection Notes</div>
                    <p className="text-slate-300 leading-relaxed">{activeInspectCallout.notes}</p>
                  </div>
                )}
              </div>

              {displayedSheet.sourceUrls && displayedSheet.sourceUrls.length > 0 && (
                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <div className="text-[11px] font-semibold text-sky-400">Online Verification Sources</div>
                  {displayedSheet.sourceUrls.slice(0, 3).map((src) => (
                    <a
                      key={src.uri}
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-sky-300 hover:text-white underline flex items-center gap-1 truncate"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">{src.title}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-slate-400">
              Select any balloon callout on the CAD blueprint or row in the specification table below to inspect tolerances.
            </div>
          )}

          <div className="pt-3 border-t border-slate-800 space-y-2">
            <button
              type="button"
              onClick={() => onJumpToTab(domain === 'engine' ? 'block3d' : 'trans')}
              className="w-full px-3.5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition"
            >
              <Box className="w-4 h-4" />
              <span>
                {domain === 'engine' ? 'Inspect in 3D Engine Viewport' : 'Inspect in 3D Transmission'}
              </span>
            </button>
            <p className="text-[11px] text-slate-400 text-center">
              Click any callout balloon on the schematic to isolate its tolerances.
            </p>
          </div>
        </aside>
      </div>

      {/* Key Confirmed Engineering Dimensions Strip (5-Column Full Width) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 bg-[#12161c] border border-slate-800 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-800">
        {dimensionStripItems.map((item) => (
          <div key={item.label} className="p-3.5 space-y-1">
            <div className="text-[11px] text-slate-400 font-medium">{item.label}</div>
            <div className="font-mono text-sm font-bold text-white tabular-nums">{item.value}</div>
            <div className="font-mono text-[11px] text-cyan-300 tabular-nums truncate" title={item.sub}>
              {item.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Full Technical Drawing Description & Tolerance BOM Schedule */}
      <div className="bg-[#12161c] border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white">
              Component Dimension, Clearance &amp; Torque Description Schedule
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{displayedSheet.unitSummary}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 no-print">
            <div className="flex items-center gap-1 p-1 bg-[#0d1014] border border-slate-800 rounded-lg">
              {rowsAvailable.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRowFilter(r)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                    rowFilter === r
                      ? 'bg-orange-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r === 'ALL' ? 'All Rows' : `Row ${r}`}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={calloutFilter}
              onChange={(e) => setCalloutFilter(e.target.value)}
              placeholder="Filter part, SKU, tolerance..."
              className="bg-[#0d1014] border border-slate-700 focus:border-cyan-400 rounded-md px-3 py-1.5 text-xs text-white outline-none w-52"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#0d1014] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 font-medium">Index</th>
                <th className="py-2.5 px-3 font-medium">Row</th>
                <th className="py-2.5 px-3 font-medium">Component Description</th>
                <th className="py-2.5 px-3 font-medium">OEM / Aftermarket SKU</th>
                <th className="py-2.5 px-3 font-medium">Dimension &amp; Clearance Spec</th>
                <th className="py-2.5 px-3 font-medium">Torque Spec</th>
                <th className="py-2.5 px-3 font-medium">Material</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredCallouts.map((c, idx) => {
                const isSelected = activeInspectCallout?.indexCode === c.indexCode && activeInspectCallout?.partName === c.partName;
                return (
                  <tr
                    key={`${c.indexCode}_${idx}`}
                    onClick={() => setSelectedCallout(c)}
                    className={`cursor-pointer transition ${
                      isSelected ? 'bg-orange-950/40 text-white' : 'hover:bg-slate-800/50 text-slate-300'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-cyan-300 whitespace-nowrap tabular-nums">
                      {c.indexCode}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">{c.row}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-white">{c.partName}</div>
                      {c.notes && <div className="text-[11px] text-slate-400 mt-0.5">{c.notes}</div>}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-amber-300 whitespace-nowrap">
                      {c.partNumber || '—'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-emerald-300 tabular-nums">
                      {c.clearanceSpec || 'OEM Standard'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-200 tabular-nums">
                      {c.torqueSpec || 'Factory Spec'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{c.material || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
