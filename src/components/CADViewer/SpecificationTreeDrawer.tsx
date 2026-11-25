/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  EngineConfig,
  CoordinatedSpecs,
  SubsystemIsolation,
  InspectionData
} from '../../types/engine';
import {
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Crosshair,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  Box,
  X
} from 'lucide-react';

export type AnalysisMode = 'none' | 'stress' | 'thermal' | 'clearance';

interface SpecificationTreeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  config: EngineConfig;
  specs: CoordinatedSpecs;
  subsystemIsolation: SubsystemIsolation;
  onSelectIsolation: (sub: SubsystemIsolation) => void;
  hiddenParts: Record<string, boolean>;
  onTogglePartVisibility: (partKey: string) => void;
  onUpdateConfig: (newConfig: Partial<EngineConfig>) => void;
  onSelectPart: (data: InspectionData) => void;
  rpm: number;
}

interface TreeNodeDef {
  key: string;
  label: string;
  code: string;
  isolation: SubsystemIsolation;
  specBadge: string;
  inspection: InspectionData;
}

export const SpecificationTreeDrawer: React.FC<SpecificationTreeDrawerProps> = ({
  isOpen,
  onClose,
  config,
  specs,
  subsystemIsolation,
  onSelectIsolation,
  hiddenParts,
  onTogglePartVisibility,
  onUpdateConfig,
  onSelectPart,
  rpm
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    assy: true,
    params: true,
    gdt: true
  });

  if (!isOpen) return null;

  const toggleExpand = (id: string) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const treeNodes: TreeNodeDef[] = [
    {
      key: 'block',
      label: '01_Block_Casting_9.025',
      code: 'GM-10243880',
      isolation: 'all',
      specBadge: `${config.bore.toFixed(3)}" Bore`,
      inspection: {
        name: 'SBC 350 Cast-Iron 4-Bolt Block',
        category: 'Engine Block',
        desc: `Deck height: ${config.deckHeight.toFixed(3)}" | Bore: ${config.bore.toFixed(3)}" | Fel-Pro .039" Gasket | Quench: ${specs.quenchDistance}".`,
        torque: 'Main Caps: 70 ft-lbs inner / 65 ft-lbs splayed',
        partNumber: 'GM-10243880'
      }
    },
    {
      key: 'timingCover',
      label: '01b_Timing_Cover_Front_Seal',
      code: 'SUM-G6320',
      isolation: 'all',
      specBadge: 'Viton Seal + TDC',
      inspection: {
        name: 'Billet Aluminum Timing Chain Cover & TDC Pointer',
        category: 'Engine Block',
        desc: 'CNC aluminum timing cover enclosing double-roller timing drive with adjustable 0° TDC pointer.',
        torque: 'Cover Bolts: 12 ft-lbs',
        partNumber: 'SUM-G6320'
      }
    },
    {
      key: 'crank',
      label: '02_Crank_4340_60-2_Trigger',
      code: 'SCA-43500',
      isolation: 'rotating',
      specBadge: `${config.stroke.toFixed(3)}" + 60-2`,
      inspection: {
        name: 'Scat 4340 Forged Crank + 60-2 Trigger Wheel',
        category: 'Rotating Assembly',
        desc: `Stroke: ${config.stroke.toFixed(3)}" | 2.450" Mains / 2.100" Rods | 60-2 Billet Crank Reluctor Wheel + 168T Flexplate.`,
        torque: 'Damper: 85 ft-lbs | Flexplate: 74 ft-lbs',
        partNumber: 'SCA-43500'
      }
    },
    {
      key: 'rotating',
      label: '03_Rods_5.700_Pistons_Rings',
      code: 'SCA-25700',
      isolation: 'rotating',
      specBadge: `${config.rodLength.toFixed(3)}" R/S ${specs.rodStrokeRatio}`,
      inspection: {
        name: `5.700" H-Beam Rods & ${config.pistonAlloy.toUpperCase()} Pistons`,
        category: 'Rotating Assembly',
        desc: `R/S Ratio: ${specs.rodStrokeRatio}:1 | Max Rod Angle: ${specs.maxRodAngleDeg}° | PTW: ${specs.ptwClearance} | Top Gap: ${specs.topRingGap}".`,
        torque: 'ARP 2000 Rod Bolts: 45 ft-lbs (0.0060" stretch)',
        partNumber: 'SCA-25700'
      }
    },
    {
      key: 'heads',
      label: '04_23deg_Heads_Headers_O2',
      code: 'EDL-5089',
      isolation: 'valvetrain',
      specBadge: `${config.chamberCc.toFixed(1)}cc / ${specs.staticCR}:1`,
      inspection: {
        name: '23° Aluminum Cylinder Heads & Hollow Valve Covers',
        category: 'Cylinder Heads',
        desc: `4.400" bore spacing | E-I-I-E-E-I-I-E 2.02"/1.60" valves | Blue billet stud girdle & ${config.rockerRatio}:1 roller rockers | Static CR: ${specs.staticCR}:1.`,
        torque: '17 Head Bolts: 25 ➔ 45 ➔ 70 ft-lbs',
        partNumber: 'EDL-5089'
      }
    },
    {
      key: 'cam',
      label: '05_Cam_DoubleRoller_Pushrods',
      code: 'CCA-12-422',
      isolation: 'valvetrain',
      specBadge: `${specs.totalValveLift}" Lift`,
      inspection: {
        name: `Pushrod Valvetrain (${specs.camData.name})`,
        category: 'Valvetrain',
        desc: `2:1 Double-Roller Timing Set | Roller lifters & 7.800" chromoly pushrods | ${config.rockerRatio}:1 rockers | Net Lift: ${specs.totalValveLift}".`,
        partNumber: 'CCA-CL12-422-8'
      }
    },
    {
      key: 'intake',
      label: '06_Manifold_Holley4150_Carb',
      code: `HLY-${config.carbCfm}`,
      isolation: 'all',
      specBadge: `${config.carbCfm} CFM`,
      inspection: {
        name: `${specs.intakeData.name} & Holley 4150 (${config.carbCfm} CFM)`,
        category: 'Induction',
        desc: `1" billet spacer, dual metering blocks, dual-feed braided fuel log | Demand: ${specs.peakCfmDemand} CFM | Target AFR: ${config.targetAFR}:1.`,
        torque: 'Intake Bolts: 30 ft-lbs',
        partNumber: specs.intakeData.id
      }
    },
    {
      key: 'efiRails',
      label: '06b_MPFI_Fuel_Rails_Injectors',
      code: 'HOL-534-212',
      isolation: 'fuel',
      specBadge: 'MPFI Option',
      inspection: {
        name: 'Billet MPFI Fuel Rails & 8× EV14 Injectors',
        category: 'Fuel System',
        desc: 'Active in MPFI + Coils dress mode: anodized -8 AN fuel rails & 42 lb/hr sequential port injectors.',
        partNumber: 'HOL-534-212'
      }
    },
    {
      key: 'ignition',
      label: '07_MSD_HEI_Distributor_Plugs',
      code: 'MSD-8360',
      isolation: 'ignition',
      specBadge: `${config.ignitionTiming}° BTDC`,
      inspection: {
        name: 'MSD Pro-Billet HEI Distributor & 8.5mm Wires',
        category: 'Ignition',
        desc: `Cam-gear driven distributor & oil pump hex shaft | Advance: ${config.ignitionTiming}° BTDC | Gap: ${config.sparkPlugGap.toFixed(3)}" | 1-8-4-3-6-5-7-2.`,
        partNumber: 'MSD-8360'
      }
    },
    {
      key: 'lubrication',
      label: '08_Lubrication_Melling_M55HV',
      code: 'MEL-M55HV',
      isolation: 'lubrication',
      specBadge: '3/8" Pickup',
      inspection: {
        name: 'Melling M-55HV Oil Pump & Wix Filter',
        category: 'Lubrication',
        desc: '60 PSI high-volume pump driven via distributor hex shaft with 0.375" brazed pickup pan clearance.',
        torque: 'Oil Pump Stud: 65 ft-lbs',
        partNumber: 'MEL-M55HV'
      }
    },
    {
      key: 'oilPan',
      label: '08b_OilPan_Dipstick_Sump',
      code: 'MIL-30900',
      isolation: 'lubrication',
      specBadge: '6-Qt Deep Sump',
      inspection: {
        name: 'SBC 6-Quart Deep-Sump Oil Pan & Dipstick',
        category: 'Lubrication',
        desc: 'Finned performance oil sump with perimeter rail gasket, 16 bolts, brass magnetic drain plug, and chrome dipstick.',
        torque: 'Pan Rail Bolts: 12 ft-lbs',
        partNumber: 'MIL-30900'
      }
    },
    {
      key: 'cooling',
      label: '09_WaterPump_Bypass_160A_Alt',
      code: 'PWM-47294',
      isolation: 'cooling',
      specBadge: '35 GPM + 160A',
      inspection: {
        name: 'Victor Water Pump, Bypass Hose & 160A Alternator',
        category: 'Cooling & Drive',
        desc: '35 GPM high-flow aluminum pump with molded bypass hose + HD vented copper-stator alternator & coplanar belt drive.',
        partNumber: 'PWM-47294'
      }
    },
    {
      key: 'fuel',
      label: '10_Fuel_Holley_110GPH_Pump',
      code: 'HLY-12-327',
      isolation: 'fuel',
      specBadge: `${specs.fuelGph} GPH`,
      inspection: {
        name: 'Holley 110 GPH Mechanical Fuel Pump',
        category: 'Fuel System',
        desc: `Cam-eccentric fuel pump feeding braided supply line to dual-feed fuel log (${specs.fuelGph} GPH peak demand).`,
        partNumber: 'HLY-12-327-11'
      }
    },
    {
      key: 'starter',
      label: '11_Starter_Powermaster_Mini',
      code: 'PWM-9600',
      isolation: 'starter',
      specBadge: '4.4:1 Gear',
      inspection: {
        name: 'Powermaster MasterTorque Mini Starter',
        category: 'Starting System',
        desc: '4.4:1 planetary reduction engaging 168T ring gear at 0.035" backlash.',
        partNumber: 'PWM-9600'
      }
    },
    {
      key: 'chassis',
      label: '12_ShopStand_MotorMounts',
      code: 'SBC-STAND',
      isolation: 'all',
      specBadge: 'Shop / Chassis',
      inspection: {
        name: 'Tubular Shop Display Stand / Hot-Rod Chassis',
        category: 'Shop Fixture & Mounts',
        desc: 'Tubular chrome display stand mounted to SBC 3-bolt side bosses and rear bellhousing flange (toggleable to Hot-Rod Chassis).',
        partNumber: 'SBC-STAND'
      }
    }
  ];

  // Dynamic GD&T Stackup & Clash Margin calculations
  const dynamicRodStretch = +((rpm / 6500) * 0.008).toFixed(4);
  const hotRunningQuench = +(specs.quenchDistance - dynamicRodStretch).toFixed(4);
  const quenchOk = hotRunningQuench >= 0.032 && specs.quenchDistance <= 0.062;
  const ptvMargin = +(0.185 - Math.max(0, specs.totalValveLift - 0.500)).toFixed(3);
  const ptvOk = ptvMargin >= 0.080;

  return (
    <aside className="absolute top-3 right-3 bottom-3 w-72 sm:w-80 z-30 bg-[#14191f]/95 border border-cyan-500/50 rounded-xl shadow-2xl flex flex-col overflow-hidden font-mono text-[11px] text-gray-200">
      {/* CATIA Specification Tree Title Bar */}
      <div className="px-3 py-2 bg-[#1a222b] border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Box className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold text-white uppercase tracking-wider text-[10px]">
            CATIA SPEC TREE &amp; MODSIM
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white p-0.5 rounded hover:bg-gray-800 transition"
          title="Collapse Specification Tree"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Tree Content */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
        {/* Root Product Node */}
        <div className="space-y-1">
          <button
            onClick={() => toggleExpand('assy')}
            className="w-full flex items-center gap-1 text-left font-bold text-cyan-300 hover:text-white py-0.5"
          >
            {expandedNodes.assy ? (
              <ChevronDown className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            )}
            <span className="truncate">SBC350_MODSIM.CATProduct</span>
          </button>

          {expandedNodes.assy && (
            <div className="pl-2.5 border-l border-gray-700/80 space-y-1">
              {treeNodes.map((node) => {
                const isHidden = !!hiddenParts[node.key];
                const isActiveIso =
                  subsystemIsolation !== 'all' && subsystemIsolation === node.isolation;
                return (
                  <div
                    key={node.key}
                    className={`flex items-center justify-between gap-1 px-1.5 py-1 rounded border transition ${
                      isActiveIso
                        ? 'bg-cyan-950/50 border-cyan-500/60 text-white'
                        : 'bg-[#181e24]/80 border-gray-800/80 hover:border-gray-700'
                    }`}
                  >
                    <button
                      onClick={() => onSelectPart(node.inspection)}
                      className="flex-1 text-left min-w-0"
                      title={`Inspect ${node.label}`}
                    >
                      <div
                        className={`truncate font-semibold text-[10px] ${
                          isHidden ? 'line-through text-gray-500' : 'text-gray-200'
                        }`}
                      >
                        {node.label}
                      </div>
                      <div className="text-[9px] text-amber-400/90 truncate">{node.specBadge}</div>
                    </button>

                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() =>
                          onSelectIsolation(
                            subsystemIsolation === node.isolation && node.isolation !== 'all'
                              ? 'all'
                              : node.isolation
                          )
                        }
                        className={`p-1 rounded transition ${
                          isActiveIso
                            ? 'bg-cyan-500 text-black'
                            : 'text-gray-400 hover:text-cyan-300 hover:bg-gray-800'
                        }`}
                        title="Isolate Subassembly"
                      >
                        <Crosshair className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => onTogglePartVisibility(node.key)}
                        className={`p-1 rounded transition ${
                          isHidden
                            ? 'text-red-400 bg-red-950/40'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                        }`}
                        title={isHidden ? 'Show Component' : 'Hide Component'}
                      >
                        {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live Parametric Feature Dimensions (CATIA Knowledgeware / Parameters) */}
        <div className="space-y-1.5 pt-1 border-t border-gray-800">
          <button
            onClick={() => toggleExpand('params')}
            className="w-full flex items-center gap-1 text-left font-bold text-orange-400 hover:text-orange-300"
          >
            {expandedNodes.params ? (
              <ChevronDown className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            )}
            <Sliders className="w-3 h-3 mr-0.5" />
            <span>f(x) Parametric Constraints</span>
          </button>

          {expandedNodes.params && (
            <div className="pl-2 space-y-2 bg-black/40 p-2 rounded-lg border border-gray-800">
              <div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-400">Cylinder_Bore:</span>
                  <span className="text-white font-bold">{config.bore.toFixed(3)}"</span>
                </div>
                <input
                  type="range"
                  min="3.980"
                  max="4.155"
                  step="0.005"
                  value={config.bore}
                  onChange={(e) => onUpdateConfig({ bore: parseFloat(e.target.value) })}
                  className="w-full accent-orange-500 h-1.5 bg-gray-800 rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-400">Crank_Stroke:</span>
                  <span className="text-white font-bold">{config.stroke.toFixed(3)}"</span>
                </div>
                <input
                  type="range"
                  min="3.250"
                  max="3.875"
                  step="0.005"
                  value={config.stroke}
                  onChange={(e) => onUpdateConfig({ stroke: parseFloat(e.target.value) })}
                  className="w-full accent-orange-500 h-1.5 bg-gray-800 rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-400">Rod_Length_CtoC:</span>
                  <span className="text-emerald-400 font-bold">{config.rodLength.toFixed(3)}"</span>
                </div>
                <input
                  type="range"
                  min="5.565"
                  max="6.200"
                  step="0.005"
                  value={config.rodLength}
                  onChange={(e) => onUpdateConfig({ rodLength: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-400 h-1.5 bg-gray-800 rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-400">Gasket_Compressed:</span>
                  <span className="text-cyan-400 font-bold">{config.gasketThickness.toFixed(3)}"</span>
                </div>
                <input
                  type="range"
                  min="0.015"
                  max="0.060"
                  step="0.001"
                  value={config.gasketThickness}
                  onChange={(e) => onUpdateConfig({ gasketThickness: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400 h-1.5 bg-gray-800 rounded cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* GD&T Tolerance Stackup & Interference Clash Audit */}
        <div className="space-y-1.5 pt-1 border-t border-gray-800">
          <button
            onClick={() => toggleExpand('gdt')}
            className="w-full flex items-center gap-1 text-left font-bold text-emerald-400 hover:text-emerald-300"
          >
            {expandedNodes.gdt ? (
              <ChevronDown className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            )}
            <ShieldCheck className="w-3 h-3 mr-0.5" />
            <span>GD&amp;T Clash &amp; Stackup</span>
          </button>

          {expandedNodes.gdt && (
            <div className="space-y-1.5 bg-black/50 p-2 rounded-lg border border-gray-800 text-[10px]">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Cold Quench Gap:</span>
                <span className="text-white font-bold">{specs.quenchDistance.toFixed(3)}"</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Rod Stretch @ {rpm} RPM:</span>
                <span className="text-amber-400">-{dynamicRodStretch.toFixed(4)}"</span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-800 pt-1">
                <span className="text-gray-300 font-bold">Hot Dynamic Quench:</span>
                <span className={`font-bold flex items-center gap-1 ${quenchOk ? 'text-emerald-400' : 'text-red-400'}`}>
                  {quenchOk ? <ShieldCheck className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                  {hotRunningQuench.toFixed(4)}"
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300 font-bold">Piston-to-Valve Margin:</span>
                <span className={`font-bold ${ptvOk ? 'text-emerald-400' : 'text-amber-400'}`}>
                  +{ptvMargin.toFixed(3)}" ({ptvOk ? 'CLEAR' : 'CHECK'})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Piston Mean Speed @ 6K:</span>
                <span className="text-cyan-300 font-bold">{specs.meanPistonSpeed6000} FPM</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
