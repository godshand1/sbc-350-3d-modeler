/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CoordinatedSpecs, EngineConfig } from '../../types/engine';
import { MapPin, Info } from 'lucide-react';

interface MarkupAnnotationsProps {
  showMarkups: boolean;
  specs: CoordinatedSpecs;
  config: EngineConfig;
  onSelectTag: (name: string, desc: string) => void;
}

export const MarkupAnnotations: React.FC<MarkupAnnotationsProps> = ({
  showMarkups,
  specs,
  config,
  onSelectTag
}) => {
  if (!showMarkups) return null;

  const pins = [
    {
      id: 'quench',
      label: `QUENCH: ${specs.quenchDistance}"`,
      badge: 'DETONATION SHIELD',
      desc: `Quench distance is exactly ${specs.quenchDistance}" (gasket: ${config.gasketThickness}" + deck: ${config.deckClearance}"). Ray's spec delivers optimal turbulence without rod stretch contact.`,
      pos: 'top-20 left-4 sm:left-6'
    },
    {
      id: 'timing_chain',
      label: 'DOUBLE-ROLLER TIMING DRIVE',
      badge: '2:1 CAM / CRANK',
      desc: `Cloyes billet double-roller timing chain driving hydraulic roller camshaft (${specs.camData.intakeDur050}°/${specs.camData.exhDur050}° @ .050") at exact 0.5x crank speed.`,
      pos: 'bottom-14 left-4 sm:left-6'
    },
    {
      id: 'stud_girdle',
      label: 'BLUE STUD GIRDLE & ROLLER ROCKERS',
      badge: `${config.rockerRatio}:1 RATIO`,
      desc: `Anodized blue billet stud girdle stabilizing ${config.rockerRatio}:1 roller rockers, beehive springs, and 7.800" chromoly pushrods inside hollow finned valve covers.`,
      pos: 'top-4 left-4 sm:left-6'
    },
    {
      id: 'holley_carb',
      label: `HOLLEY 4150 ${config.carbCfm} CFM`,
      badge: 'DUAL-FEED LOG',
      desc: `4-barrel dichromate carburetor atop 1" billet spacer with dual metering blocks, sight plugs, braided dual-feed fuel log, and inline pressure gauge (${config.targetAFR}:1 AFR).`,
      pos: 'top-4 right-4 sm:right-6'
    },
    {
      id: 'hei_ign',
      label: `MSD HEI & MELLING M-55HV`,
      badge: `${config.ignitionTiming}° BTDC`,
      desc: `Rear Pro-Billet HEI distributor engaging cam bevel gear & driving the Melling M-55HV oil pump hex shaft (1-8-4-3-6-5-7-2 firing order).`,
      pos: 'top-20 right-4 sm:right-6'
    },
    {
      id: 'headers',
      label: '23° HEADS & E-I-I-E VALVES',
      badge: `${config.chamberCc.toFixed(0)}cc / ${specs.staticCR}:1`,
      desc: `2.02" Intake / 1.60" Exhaust valves aligned over 4.000" honed bores with 4-into-1 stainless headers and Bosch LSU 4.9 wideband O2.`,
      pos: 'bottom-20 right-4 sm:right-6'
    }
  ];

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {pins.map((pin) => (
        <div key={pin.id} className={`absolute ${pin.pos} pointer-events-auto`}>
          <button
            onClick={() => onSelectTag(pin.label, pin.desc)}
            className="group flex items-center gap-1.5 bg-black/85 hover:bg-orange-950/90 text-white px-2.5 py-1 rounded-full border border-orange-500/80 shadow-lg text-[10px] font-mono transition-all transform hover:scale-105"
          >
            <MapPin className="w-3 h-3 text-orange-400 group-hover:animate-bounce" />
            <span className="font-bold text-white">{pin.label}</span>
            <span className="bg-orange-500/30 text-orange-300 px-1.5 py-0.2 rounded text-[9px]">
              {pin.badge}
            </span>
          </button>
        </div>
      ))}
    </div>
  );
};
