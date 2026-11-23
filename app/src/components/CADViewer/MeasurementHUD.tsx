/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MeasurementState, CoordinatedSpecs, EngineConfig } from '../../types/engine';
import { Ruler, Layers, RotateCw, X, CheckCircle2, AlertTriangle } from 'lucide-react';

interface MeasurementHUDProps {
  measurementState: MeasurementState;
  onUpdateMeasurement: (state: MeasurementState) => void;
  specs: CoordinatedSpecs;
  config: EngineConfig;
  onApplyPreset: (name: string, distIn: number) => void;
}

export const MeasurementHUD: React.FC<MeasurementHUDProps> = ({
  measurementState,
  onUpdateMeasurement,
  specs,
  config,
  onApplyPreset
}) => {
  if (measurementState.mode === 'none') return null;

  return (
    <div className="absolute top-3 left-3 right-3 sm:right-auto sm:w-[410px] z-30 bg-[#141920]/95 border border-cyan-500/60 rounded-xl p-4 shadow-2xl font-mono text-xs text-gray-200">
      {/* Title & Mode Switcher */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
        <span className="font-bold text-xs text-cyan-300 tracking-wide font-sans flex items-center gap-1.5">
          CAD Measure &amp; Volumetric Inspector
        </span>
        <button
          onClick={() => onUpdateMeasurement({ ...measurementState, mode: 'none' })}
          className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Mode Buttons */}
      <div className="flex gap-1.5 mb-3 bg-black/40 p-1 rounded-lg border border-gray-800">
        <button
          onClick={() => onUpdateMeasurement({ ...measurementState, mode: 'caliper' })}
          className={`flex-1 py-1 px-2 rounded font-semibold text-[11px] flex items-center justify-center gap-1 transition ${
            measurementState.mode === 'caliper'
              ? 'bg-cyan-500 text-black font-bold shadow'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Ruler className="w-3.5 h-3.5" /> Caliper (Distance)
        </button>
        <button
          onClick={() => onUpdateMeasurement({ ...measurementState, mode: 'volumetric' })}
          className={`flex-1 py-1 px-2 rounded font-semibold text-[11px] flex items-center justify-center gap-1 transition ${
            measurementState.mode === 'volumetric'
              ? 'bg-cyan-500 text-black font-bold shadow'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Volumetric
        </button>
      </div>

      {/* CALIPER MODE */}
      {measurementState.mode === 'caliper' && (
        <div className="space-y-3">
          {/* Digital Caliper Display */}
          <div className="bg-gradient-to-r from-emerald-950/80 via-black to-emerald-950/80 border-2 border-emerald-500/60 rounded-xl p-3 shadow-inner">
            <div className="flex justify-between items-center text-[10px] text-emerald-400 font-bold mb-1">
              <span>DIGITAL MITUTOYO CAD CALIPER</span>
              <span className="text-gray-400">TOLERANCE ±0.0005"</span>
            </div>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-black text-emerald-300 font-mono">
                  {measurementState.distanceInches !== null
                    ? `${measurementState.distanceInches.toFixed(3)}"`
                    : '--.---"'}
                </span>
                <span className="text-[11px] text-emerald-500 ml-2">INCHES</span>
              </div>
              <div>
                <span className="text-lg font-bold text-gray-300 font-mono">
                  {measurementState.distanceMm !== null
                    ? `${measurementState.distanceMm.toFixed(2)}`
                    : '--.--'}
                </span>
                <span className="text-[10px] text-gray-500 ml-1">MM</span>
              </div>
            </div>
            <div className="text-[10px] text-gray-400 mt-1 flex items-center justify-between border-t border-emerald-900/50 pt-1">
              <span>
                {measurementState.point1 && !measurementState.point2
                  ? "Click 2nd surface/vertex to measure distance"
                  : measurementState.distanceInches !== null
                  ? `Surface: ${measurementState.surfaceLabel || 'Vertex A ➔ Vertex B'}`
                  : "Click any 3D part or select a preset below"}
              </span>
              {measurementState.point1 && (
                <button
                  onClick={() =>
                    onUpdateMeasurement({
                      ...measurementState,
                      point1: null,
                      point2: null,
                      distanceInches: null,
                      distanceMm: null
                    })
                  }
                  className="text-emerald-400 hover:underline"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Quick Preset Verifications */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase">
              QUICK VERIFY BLUEPRINT DIMENSIONS:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: 'Cylinder Bore', in: config.bore, key: 'Bore' },
                { label: 'Crankshaft Stroke', in: config.stroke, key: 'Stroke' },
                { label: 'Connecting Rod', in: config.rodLength, key: 'Rod C-to-C' },
                { label: 'Block Deck Height', in: config.deckHeight, key: 'Deck Height' },
                { label: 'Quench Squish Gap', in: specs.quenchDistance, key: 'Quench' },
                { label: 'Deck Clearance', in: config.deckClearance, key: 'In The Hole' }
              ].map((p) => (
                <button
                  key={p.label}
                  onClick={() => onApplyPreset(p.key, p.in)}
                  className="p-1.5 bg-black/60 hover:bg-gray-800 border border-gray-700/80 rounded flex items-center justify-between text-left transition"
                >
                  <span className="text-[10px] text-gray-300">{p.label}:</span>
                  <span className="font-bold text-cyan-400 font-mono">{p.in.toFixed(3)}"</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VOLUMETRIC MODE */}
      {measurementState.mode === 'volumetric' && (
        <div className="space-y-2.5">
          <div className="p-2.5 bg-black/60 border border-gray-700 rounded-lg space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">Swept Cylinder Volume:</span>
              <span className="font-bold text-cyan-400">{specs.cylinderCc} cc ({(specs.displacementCi / (config.cylinders ?? 8)).toFixed(2)} ci)</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">Combustion Chamber Volume:</span>
              <span className="font-bold text-amber-400">{config.chamberCc.toFixed(1)} cc</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">Head Gasket Compressed Volume:</span>
              <span className="font-bold text-gray-300">{specs.gasketVolumeCc} cc ({config.gasketThickness.toFixed(3)}")</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">Deck Clearance Volume:</span>
              <span className="font-bold text-gray-300">{specs.deckVolumeCc} cc ({config.deckClearance.toFixed(3)}")</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">Piston Valve Relief Volume:</span>
              <span className="font-bold text-gray-300">{config.pistonReliefCc.toFixed(1)} cc</span>
            </div>
            <div className="border-t border-gray-700 pt-1.5 flex justify-between items-center text-xs font-bold">
              <span className="text-white">Total Clearance Volume:</span>
              <span className="text-orange-400">{specs.totalClearanceCc} cc</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-emerald-400 font-bold block uppercase">STATIC COMPRESSION:</span>
              <span className="text-lg font-black text-white">{specs.staticCR}:1</span>
            </div>
            <div>
              <span className="text-[10px] text-cyan-400 font-bold block uppercase">DYNAMIC COMPRESSION:</span>
              <span className="text-lg font-black text-cyan-300">{specs.dynamicCR}:1</span>
            </div>
          </div>

          <div className="text-[10px] text-gray-400">
            Quench Distance: <strong className="text-emerald-400">{specs.quenchDistance}"</strong> — {specs.quenchStatus}
          </div>
        </div>
      )}
    </div>
  );
};
