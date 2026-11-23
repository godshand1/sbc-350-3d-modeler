/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useMemo } from 'react';
import { TechDrawingSheet, TechDrawingCallout } from '../types/engine';
import { A500_42RE_REFERENCE_IMAGE } from '../data/techDrawingsCatalog';
import {
  FileSpreadsheet,
  Search,
  Upload,
  CheckCircle2,
  ExternalLink,
  X,
  Loader2,
  AlertTriangle,
  Crosshair,
  Image as ImageIcon,
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface TechDrawingSpecsDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
  domain: 'engine' | 'transmission';
  activeSheet: TechDrawingSheet;
  defaultQuery: string;
  contextSpecs?: Record<string, unknown>;
  onApplySheetTo3D: (sheet: TechDrawingSheet) => void;
  onFocusCalloutIn3D: (callout: TechDrawingCallout, sheet: TechDrawingSheet) => void;
  onResetCustomSheet?: () => void;
  hasCustomApplied?: boolean;
  inlinePanel?: boolean;
}

export const TechDrawingSpecsDrawer: React.FC<TechDrawingSpecsDrawerProps> = ({
  isOpen = true,
  onClose,
  domain,
  activeSheet,
  defaultQuery,
  contextSpecs,
  onApplySheetTo3D,
  onFocusCalloutIn3D,
  onResetCustomSheet,
  hasCustomApplied = false,
  inlinePanel = false
}) => {
  const [searchQuery, setSearchQuery] = useState<string>(defaultQuery);
  const [rowFilter, setRowFilter] = useState<string>('ALL');
  const [calloutFilter, setCalloutFilter] = useState<string>('');
  const [stagedSheet, setStagedSheet] = useState<TechDrawingSheet | null>(null);
  const [isLookingUp, setIsLookingUp] = useState<boolean>(false);
  const [isParsingDiagram, setIsParsingDiagram] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [previewLightboxUrl, setPreviewLightboxUrl] = useState<string | null>(null);
  const [selectedIndexCode, setSelectedIndexCode] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!inlinePanel && !isOpen) return null;

  const displayedSheet = stagedSheet || activeSheet;

  const rowsAvailable = useMemo(() => {
    const set = new Set<string>();
    displayedSheet.callouts.forEach((c) => {
      if (c.row) set.add(c.row.toUpperCase());
    });
    return ['ALL', ...Array.from(set).sort()];
  }, [displayedSheet]);

  const filteredCallouts = useMemo(() => {
    return displayedSheet.callouts.filter((c) => {
      const matchesRow = rowFilter === 'ALL' || c.row.toUpperCase() === rowFilter;
      const q = calloutFilter.trim().toLowerCase();
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

  const handleOnlineLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim() || defaultQuery;
    if (!q) return;

    setIsLookingUp(true);
    setErrorMsg(null);
    setStatusNotice(null);

    try {
      const res = await fetch('/api/specs/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          query: q,
          unitName: activeSheet.title,
          contextSpecs
        })
      });

      const payload = (await res.json()) as { sheet?: TechDrawingSheet; error?: string };
      if (!res.ok || !payload.sheet) {
        throw new Error(payload.error || `Lookup failed (${res.status})`);
      }

      setStagedSheet(payload.sheet);
      setRowFilter('ALL');
      setStatusNotice(
        `Pulled ${payload.sheet.callouts.length} real-world callouts & specs from online sources. Click "Apply to 3D Model" to push into the live 3D assembly.`
      );
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to fetch online specifications.');
    } finally {
      setIsLookingUp(false);
    }
  };

  const parseDiagramDataUrl = async (dataUrl: string, mimeType: string, label: string) => {
    setIsParsingDiagram(true);
    setErrorMsg(null);
    setStatusNotice(null);

    try {
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      const res = await fetch('/api/specs/parse-diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          imageBase64: base64,
          mimeType,
          unitHint: label
        })
      });

      const payload = (await res.json()) as { sheet?: TechDrawingSheet; error?: string };
      if (!res.ok || !payload.sheet) {
        throw new Error(payload.error || `Diagram extraction failed (${res.status})`);
      }

      const sheetWithPreview: TechDrawingSheet = {
        ...payload.sheet,
        referenceImageUrl: dataUrl
      };
      setStagedSheet(sheetWithPreview);
      setRowFilter('ALL');
      setStatusNotice(
        `Extracted ${sheetWithPreview.callouts.length} exploded BOM items from "${label}". Click "Apply to 3D Model" to bind them to the 3D scene.`
      );
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to parse uploaded technical drawing.');
    } finally {
      setIsParsingDiagram(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleLoadA500Sample = async () => {
    setIsParsingDiagram(true);
    setErrorMsg(null);
    try {
      const resp = await fetch(A500_42RE_REFERENCE_IMAGE);
      const blob = await resp.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Failed to read sample blueprint image.'));
        reader.readAsDataURL(blob);
      });
      await parseDiagramDataUrl(dataUrl, blob.type || 'image/jpeg', 'Chrysler 40RH/42RH/42RE/44RE (A500)');
    } catch (err: unknown) {
      setIsParsingDiagram(false);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load A500 reference diagram.');
    }
  };

  const handleCommitTo3D = () => {
    onApplySheetTo3D(displayedSheet);
    setStagedSheet(null);
    setStatusNotice(
      `Uploaded "${displayedSheet.title}" (${displayedSheet.callouts.length} callouts) directly onto the 3D ${domain} assembly.`
    );
  };

  const containerClasses = inlinePanel
    ? 'bg-[#12161c] border border-slate-800 rounded-xl overflow-hidden text-xs text-slate-200 font-mono'
    : 'absolute top-3 bottom-3 left-3 z-40 w-[min(94vw,620px)] bg-[#12161c] border border-cyan-500/50 rounded-xl shadow-2xl flex flex-col overflow-hidden text-xs text-slate-200 font-mono';

  return (
    <>
      <div className={containerClasses}>
        {/* Header */}
        <div className="px-4 py-2.5 bg-[#0d1014] border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <FileSpreadsheet className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="font-bold text-white font-sans truncate">
                Technical Drawing &amp; Real-World Spec Sheet
              </span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold">
                {displayedSheet.drawingNumber}
              </span>
              {stagedSheet && (
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[10px] font-bold">
                  STAGED FOR 3D
                </span>
              )}
              {!stagedSheet && hasCustomApplied && (
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-[10px] font-bold">
                  APPLIED TO 3D
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 truncate font-sans mt-0.5">
              {displayedSheet.title} — {displayedSheet.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {hasCustomApplied && onResetCustomSheet && (
              <button
                onClick={() => {
                  setStagedSheet(null);
                  setStatusNotice(null);
                  onResetCustomSheet();
                }}
                className="px-2 py-1 rounded border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 text-[10px] flex items-center gap-1"
                title="Restore built-in baseline drawing sheet"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                title="Close Technical Drawing Sheet"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Online Spec Search & Diagram Upload Controls */}
        <div className="p-3 bg-[#151a22] border-b border-slate-800 space-y-2.5 shrink-0">
          <form onSubmit={handleOnlineLookup} className="flex flex-wrap sm:flex-nowrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  domain === 'transmission'
                    ? 'Pull online specs (e.g. Chrysler A500 42RE, TH400, Tremec T56)...'
                    : 'Pull online specs (e.g. 1996 Chevy 350 L31, LS3, AFR 195 heads)...'
                }
                className="w-full bg-[#0d1014] border border-slate-700 focus:border-cyan-400 rounded-md pl-8 pr-3 py-1.5 text-[11px] text-white outline-none font-sans"
              />
            </div>
            <button
              type="submit"
              disabled={isLookingUp || isParsingDiagram}
              className="px-3 py-1.5 rounded-md bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-[11px] flex items-center gap-1.5 transition whitespace-nowrap"
            >
              {isLookingUp ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{isLookingUp ? 'Pulling Specs...' : 'Pull Online Specs'}</span>
            </button>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                disabled={isLookingUp || isParsingDiagram}
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1.5 rounded-md bg-[#0d1014] border border-slate-700 hover:border-orange-400 text-slate-200 hover:text-white text-[11px] font-medium flex items-center gap-1.5 transition"
              >
                {isParsingDiagram ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-400" />
                ) : (
                  <Upload className="w-3.5 h-3.5 text-orange-400" />
                )}
                <span>{isParsingDiagram ? 'Extracting Diagram...' : 'Upload Drawing Image to 3D'}</span>
              </button>

              {domain === 'transmission' && (
                <button
                  type="button"
                  disabled={isLookingUp || isParsingDiagram}
                  onClick={handleLoadA500Sample}
                  className="px-2.5 py-1.5 rounded-md bg-[#0d1014] border border-slate-700 hover:border-cyan-400 text-cyan-300 text-[11px] font-medium flex items-center gap-1.5 transition"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Scan A500 / 42RE Reference Sheet</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleCommitTo3D}
              className={`px-3 py-1.5 rounded-md font-bold text-[11px] flex items-center gap-1.5 transition ${
                stagedSheet
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg'
                  : 'bg-orange-600 hover:bg-orange-500 text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{stagedSheet ? 'Apply Pulled Specs to 3D Model' : 'Sync Sheet to 3D Model'}</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-2 rounded-md bg-red-950/60 border border-red-500/50 text-red-200 text-[11px] flex items-start gap-2 font-sans">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {statusNotice && !errorMsg && (
            <div className="p-2 rounded-md bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-[11px] font-sans">
              {statusNotice}
            </div>
          )}
        </div>

        {/* Summary, Reference Blueprint Image & Online Grounded Citations */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <div className="bg-[#0d1014] border border-slate-800 rounded-lg p-3 flex flex-col sm:flex-row gap-3 items-start">
            {displayedSheet.referenceImageUrl && (
              <button
                type="button"
                onClick={() => setPreviewLightboxUrl(displayedSheet.referenceImageUrl || null)}
                className="shrink-0 w-full sm:w-40 rounded-md overflow-hidden border border-slate-700 hover:border-cyan-400 transition group relative bg-white"
                title="Click to enlarge technical drawing blueprint"
              >
                <img
                  src={displayedSheet.referenceImageUrl}
                  alt={displayedSheet.title}
                  className="w-full h-24 object-contain bg-white"
                />
                <span className="block bg-black/85 text-[9px] text-cyan-300 py-0.5 text-center font-bold">
                  Click to Zoom Diagram
                </span>
              </button>
            )}

            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                <span className="text-amber-400 font-bold uppercase">{displayedSheet.sourceLabel}</span>
                {displayedSheet.dimensions && (
                  <span className="text-emerald-400 font-semibold">
                    {displayedSheet.domain === 'transmission' && displayedSheet.dimensions.ratios
                      ? `Ratios: ${displayedSheet.dimensions.ratios.join(' / ')} · ${displayedSheet.dimensions.lengthInches || '—'}" OAL`
                      : displayedSheet.dimensions.bore
                      ? `${displayedSheet.dimensions.bore}" Bore × ${displayedSheet.dimensions.stroke}" Stroke · ${displayedSheet.dimensions.chamberCc ?? '—'}cc`
                      : ''}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                {displayedSheet.unitSummary}
              </p>

              {displayedSheet.sourceUrls && displayedSheet.sourceUrls.length > 0 && (
                <div className="pt-1 flex flex-wrap gap-1.5">
                  {displayedSheet.sourceUrls.slice(0, 4).map((src) => (
                    <a
                      key={src.uri}
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-0.5 rounded bg-sky-950/70 border border-sky-700/50 text-sky-300 hover:text-white text-[10px] flex items-center gap-1 max-w-[230px]"
                    >
                      <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{src.title}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row A-F Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold mr-1">Rows:</span>
              {rowsAvailable.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRowFilter(r)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                    rowFilter === r
                      ? 'bg-orange-600 text-white'
                      : 'bg-[#0d1014] border border-slate-800 text-slate-400 hover:text-white'
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
              placeholder="Filter part #, spec, component..."
              className="bg-[#0d1014] border border-slate-800 focus:border-cyan-400 rounded px-2.5 py-1 text-[11px] text-white outline-none font-sans w-48"
            />
          </div>

          {/* Exploded Callout BOM Table */}
          <div className="border border-slate-800 rounded-lg overflow-hidden bg-[#0d1014]">
            <div className="overflow-x-auto max-h-[340px]">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="bg-[#181e26] text-slate-400 border-b border-slate-800 sticky top-0 z-10">
                  <tr>
                    <th className="py-1.5 px-2">IDX</th>
                    <th className="py-1.5 px-2">COMPONENT &amp; PART #</th>
                    <th className="py-1.5 px-2">CLEARANCE / SPEC</th>
                    <th className="py-1.5 px-2">TORQUE</th>
                    <th className="py-1.5 px-2 text-right">3D TARGET</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredCallouts.map((c, idx) => {
                    const isFocused = selectedIndexCode === `${c.indexCode}_${idx}`;
                    return (
                      <tr
                        key={`${c.indexCode}_${idx}`}
                        onClick={() => {
                          setSelectedIndexCode(`${c.indexCode}_${idx}`);
                          onFocusCalloutIn3D(c, displayedSheet);
                        }}
                        className={`cursor-pointer transition ${
                          isFocused
                            ? 'bg-orange-950/50 text-white'
                            : 'hover:bg-slate-800/60 text-slate-300'
                        }`}
                        title="Click to highlight & inspect this component inside the 3D CAD viewport"
                      >
                        <td className="py-2 px-2 align-top whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold text-[10px]">
                            {c.indexCode}
                          </span>
                        </td>
                        <td className="py-2 px-2 align-top">
                          <div className="font-semibold text-white font-sans">{c.partName}</div>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                            {c.partNumber && (
                              <span className="text-amber-300 font-semibold">{c.partNumber}</span>
                            )}
                            {c.material && <span>{c.material}</span>}
                          </div>
                          {c.notes && (
                            <p className="text-[10px] text-slate-400 font-sans mt-0.5">{c.notes}</p>
                          )}
                        </td>
                        <td className="py-2 px-2 align-top text-emerald-300 text-[10px] font-sans">
                          {c.clearanceSpec || 'OEM Std'}
                        </td>
                        <td className="py-2 px-2 align-top text-amber-300 text-[10px] font-sans">
                          {c.torqueSpec || 'Factory Spec'}
                        </td>
                        <td className="py-2 px-2 align-top text-right whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-cyan-300">
                            <Crosshair className="w-2.5 h-2.5" />
                            {c.targetSubassembly}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Reference Blueprint Zoom Lightbox */}
      {previewLightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewLightboxUrl(null)}
        >
          <div
            className="relative max-w-5xl w-full bg-[#12161c] border border-slate-700 rounded-xl p-3 space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between text-xs text-white">
              <span className="font-bold font-sans">{displayedSheet.title} — Technical Blueprint</span>
              <button
                type="button"
                onClick={() => setPreviewLightboxUrl(null)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={previewLightboxUrl}
              alt={displayedSheet.title}
              className="w-full max-h-[78vh] object-contain bg-white rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  );
};
