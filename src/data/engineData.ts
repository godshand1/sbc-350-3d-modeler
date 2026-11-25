/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EngineConfig,
  EngineCatalogItem,
  TransmissionItem,
  VehicleItem,
  TorqueSpec,
  MechanicSpec,
  BOMItem,
  HeadFlowPoint
} from '../types/engine';

export const RAY_BASELINE_CONFIG: EngineConfig = {
  engineId: 'sbc_350_ray',
  engineName: "Chevrolet SBC 350 V8 (Ray's Confirmed Baseline)",
  configLabel: 'V8',
  color: 0xd83b01,          // Classic Chevy Orange
  firingOrder: '1-8-4-3-6-5-7-2',
  pattern: 'GM_Chevy_V8',
  balance: 'Internal / Neutral (2-pc rear seal)',
  flywheelTeeth: '153 or 168-Tooth',
  boreSpacing: 4.400,       // OEM Gen-I SBC bore spacing
  valvetrainType: 'OHV',
  blockMaterial: 'iron',
  headMaterial: 'aluminum', // Ray's Edelbrock E-Street 64cc aluminum heads
  valveAngleDeg: 23,        // OEM SBC 23-deg valve angle
  bankAngleDeg: 90,         // OEM 90-deg V8
  cylinders: 8,
  bore: 4.000,              // in (Ray's Confirmed Baseline)
  stroke: 3.480,            // in (Ray's Confirmed Baseline)
  rodLength: 5.700,         // in (Ray's Confirmed Baseline: 5.700")
  deckHeight: 9.025,        // in (Ray's Confirmed Baseline: 9.025")
  deckClearance: 0.015,     // in (Ray's Confirmed Baseline: 0.015")
  gasketThickness: 0.039,   // in (Ray's Confirmed Baseline: 0.039")
  chamberCc: 64.0,          // cc (Ray's Confirmed Baseline: 64.0cc)
  pistonReliefCc: 5.0,      // cc (4-eyebrow flat top)
  pistonAlloy: '4032',      // '4032' street/strip low-expansion
  ringApplication: 'street_strip', // street/strip (.0050" factor)
  camProfile: 'street',     // Ray's Street/Strip Roller
  rockerRatio: 1.5,         // 1.5:1 GM standard
  selectedIntake: 'dualplane_rpm',
  carbCfm: 650,             // 650 CFM
  carbStyle: '4150_dp',     // Holley 4150 Mechanical Double Pumper
  carbVenturiIn: 1.375,     // 1-3/8" primary venturi / 1.688" throttle bore
  airFilterCfmBonus: 15,    // 14"x3" open-element street air cleaner
  intakePortCc: 185,        // 185 cc CNC street/strip intake runner
  intakeValveIn: 2.02,      // 2.020" stainless swirl-polished intake valve
  exhaustPortCc: 68,        // 68 cc D-port exhaust runner
  exhaustPortShape: 'd_port',
  exhaustValveIn: 1.60,     // 1.600" Inconel-grade exhaust valve
  headerPrimaryIn: 1.625,   // 1-5/8" long-tube header primary OD
  targetAFR: 12.9,          // 12.9:1 optimal power
  ignitionTiming: 36,       // 36° total advance @ 3000 RPM
  sparkPlugGap: 0.040,      // 0.040" for HEI
  selectedTrans: 'th350',   // TH350 3-speed
  stallSpeed: 2400,         // 2,400 RPM stall
  rearGear: 3.73,           // 3.73:1 rear axle
  tireDiameter: 26.0,       // 26.0" tire diameter
  selectedVehicle: 'camaro1969',
  inductionDress: 'carb_hei'
};

export const CARB_STYLE_OPTIONS = [
  { id: '2bbl', label: '2-BBL Economizer (2300 Flange)', venturiIn: 1.250, defaultCfm: 500, throttleBoreIn: '1.500"', flowCoeff: 0.94, notes: 'Crisp idle vacuum & street economy, dual 50mm-class barrels.' },
  { id: '4150_dp', label: '4150 4-BBL Double Pumper', venturiIn: 1.375, defaultCfm: 650, throttleBoreIn: '1.688"', flowCoeff: 1.00, notes: 'Square-bore mechanical secondary circuit with dual accelerator pumps.' },
  { id: '4500_dominator', label: '4500 Dominator Pro Race', venturiIn: 1.688, defaultCfm: 1050, throttleBoreIn: '2.000"', flowCoeff: 1.07, notes: 'Oversized 2.00" throttle bores for high-RPM drag & big-inch strokers.' },
  { id: 'dual_quad', label: 'Dual-Quad (2×4150 Twin Carb)', venturiIn: 1.312, defaultCfm: 900, throttleBoreIn: '1.563"×2', flowCoeff: 1.05, notes: 'Tunnel-ram or cross-ram twin 4-barrel staging for high plenum volume.' },
  { id: 'mpfi_tb', label: '4-BBL Billet EFI Throttle Body', venturiIn: 1.500, defaultCfm: 850, throttleBoreIn: '1.750"', flowCoeff: 1.04, notes: 'Dry-flow annular TPS throttle body with crisp cold-start & altitude compensation.' }
] as const;

export const AIR_INDUCTION_PACKAGES = [
  { id: 'stock_snorkel', label: 'OE Single-Snorkel Air Cleaner', bonusCfm: -15, desc: 'Restrictive factory snorkel (-15 CFM)' },
  { id: 'open_14x3', label: '14"×3" Open-Element Street Filter', bonusCfm: 15, desc: 'Ray Baseline clean radial air flow (+15 CFM)' },
  { id: 'cowl_coldair', label: 'Sealed Cowl / Cold-Air Duct', bonusCfm: 30, desc: 'Pressurized dense cowl intake charge (+30 CFM)' },
  { id: 'velocity_scoop', label: 'Pro Velocity Stack / Hood Scoop', bonusCfm: 45, desc: 'Zero-restriction race ram-air bellmouth (+45 CFM)' }
] as const;

export const INTAKE_PORT_PRESETS = [
  { cc: 165, valveIn: 1.94, label: '165 cc · 1.94" Stock Vortec/Truck', flowScale: 0.89, desc: 'High intake velocity (< 4,800 RPM torque).' },
  { cc: 185, valveIn: 2.02, label: '185 cc · 2.02" Street/Strip CNC', flowScale: 1.00, desc: 'Ray Baseline CNC runner & 5-angle valve job.' },
  { cc: 210, valveIn: 2.08, label: '210 cc · 2.08" Pro Comp Port', flowScale: 1.08, desc: 'Opened pinch & short-turn radius for 6,500+ RPM.' },
  { cc: 235, valveIn: 2.125, label: '235 cc · 2.125" Raised-Runner Race', flowScale: 1.15, desc: 'Full CNC competition port for big-stroke / radical cam.' }
] as const;

export const EXHAUST_PORT_PRESETS = [
  { shape: 'oval_stock' as const, label: 'OEM Oval Exhaust Port', cc: 62, valveIn: 1.50, flowScale: 0.91, desc: 'Factory as-cast thermal port.' },
  { shape: 'd_port' as const, label: 'CNC D-Port Anti-Reversion', cc: 68, valveIn: 1.60, flowScale: 1.00, desc: 'Ray Baseline raised roof + flat floor D-port.' },
  { shape: 'raised_runner' as const, label: 'Raised Square-Port (+0.250")', cc: 78, valveIn: 1.60, flowScale: 1.07, desc: 'Straightened short-turn radius for header scavenging.' },
  { shape: 'cnc_race' as const, label: 'Full 5-Axis Hogged Spread-Port', cc: 88, valveIn: 1.625, flowScale: 1.13, desc: 'Max wet-flow exhaust evacuation for high-lift cams.' }
] as const;

export const HEADER_PRIMARY_OPTIONS = [
  { id: 1.500, label: '1.500" (1-1/2") Cast/Shorty', scavengeMult: 0.96, note: 'Tight chassis fitment, low-RPM torque' },
  { id: 1.625, label: '1.625" (1-5/8") Long-Tube Baseline', scavengeMult: 1.00, note: 'Balanced street/strip velocity' },
  { id: 1.750, label: '1.750" (1-3/4") Stepped Perf', scavengeMult: 1.03, note: 'Strong mid-to-top-end scavenging' },
  { id: 1.875, label: '1.875" (1-7/8") Race Merge', scavengeMult: 1.05, note: 'High-RPM / 383-406 stroker evacuation' },
  { id: 2.000, label: '2.000" (2.0") Pro Drag Open', scavengeMult: 1.06, note: 'Maximum exhaust mass flow > 6,500 RPM' }
] as const;

export const INTAKE_MANIFOLDS = [
  { id: 'dualplane_rpm', name: 'Edelbrock Performer RPM Dual-Plane', style: 'dualplane', runnerCc: 195, flowCfm: 265, hpMult: 1.00, tqMult: 1.00, carbCfmDefault: 650, price: 349.95 },
  { id: 'singleplane_victor', name: 'Edelbrock Victor Jr. Single-Plane', style: 'singleplane', runnerCc: 215, flowCfm: 295, hpMult: 1.06, tqMult: 0.96, carbCfmDefault: 750, price: 389.95 },
  { id: 'tunnelram_dual', name: 'Weiand Hi-Ram Dual-Quad Tunnel Ram', style: 'tunnelram', runnerCc: 235, flowCfm: 330, hpMult: 1.12, tqMult: 0.94, carbCfmDefault: 900, isDualCarb: true, price: 689.95 }
];

export const CAM_PROFILES = {
  rv: {
    id: 'rv',
    name: 'RV / High-Torque Hydraulic Flat Tappet',
    desc: 'Off-idle stump-puller torque for towing and trucks. Strong manifold vacuum (18-20 inHg).',
    intakeDur050: 212,
    exhDur050: 218,
    lobeLift: 0.300,
    advertisedIntake: 262,
    advertisedExh: 268,
    lsa: 112,
    ivcDeg: 38,
    baseHp: 310,
    baseTq: 395,
    hpRpm: 4800,
    tqRpm: 3200,
    ve: 0.84,
    recStall: 1800,
    vacuumIdle: 19
  },
  street: {
    id: 'street',
    name: "Street / Strip Hydraulic Roller (Ray's Spec)",
    desc: "Ray's confirmed street performance spec. Broad, flat powerband from 2,200 to 5,800 RPM. Good vacuum (14-16 inHg).",
    intakeDur050: 224,
    exhDur050: 230,
    lobeLift: 0.340,
    advertisedIntake: 276,
    advertisedExh: 282,
    lsa: 110,
    ivcDeg: 44,
    baseHp: 385,
    baseTq: 415,
    hpRpm: 5600,
    tqRpm: 3800,
    ve: 0.90,
    recStall: 2400,
    vacuumIdle: 15
  },
  radical: {
    id: 'radical',
    name: 'Radical Solid Roller / Drag Strip High RPM',
    desc: 'Lopey aggressive idle, high-lift profiles, requires mechanical roller lifters and 140+ lb seat springs. 6,800 RPM redline.',
    intakeDur050: 242,
    exhDur050: 248,
    lobeLift: 0.370,
    advertisedIntake: 294,
    advertisedExh: 302,
    lsa: 108,
    ivcDeg: 52,
    baseHp: 445,
    baseTq: 425,
    hpRpm: 6400,
    tqRpm: 4600,
    ve: 0.98,
    recStall: 3500,
    vacuumIdle: 10
  }
};

export const TRANSMISSIONS_DB: Record<string, TransmissionItem> = {
  // 1. GM CLASSIC AUTOMATICS
  powerglide: {
    id: "powerglide",
    name: "GM Powerglide (2-Speed Drag Auto)",
    category: "GM Classic Automatic",
    type: "Automatic",
    ratios: [1.76, 1.00],
    reverse: 1.76,
    nativePattern: "GM_Chevy_V8",
    lengthInches: 27.6,
    defaultStall: 3500,
    clutch: "5-Clutch High Gear Pack / Kevlar Front Band",
    tunnelProfile: "Ultra-compact slim case (Fits all tunnels without floorpan cutting)",
    desc: "Legendary lightweight GM 2-speed automatic with planetary gear set. The undisputed king of bracket drag racing."
  },
  th350: {
    id: "th350",
    name: "Turbo-Hydramatic 350 (TH350 3-Speed Auto)",
    category: "GM Classic Automatic",
    type: "Automatic",
    ratios: [2.52, 1.52, 1.00],
    reverse: 2.07,
    nativePattern: "GM_Chevy_V8",
    lengthInches: 27.6,
    defaultStall: 2400,
    clutch: "5-Clutch Direct / Heavy-Duty Intermediate Sprag",
    tunnelProfile: "Compact factory GM A/F/X-Body fit with zero cutting",
    desc: "Lightweight, durable GM 3-speed automatic with minimal parasitic loss. Ray's proven street combination."
  },
  th400: {
    id: "th400",
    name: "Turbo-Hydramatic 400 (TH400 3-Speed Heavy Duty)",
    category: "GM Classic Automatic",
    type: "Automatic",
    ratios: [2.48, 1.48, 1.00],
    reverse: 2.08,
    nativePattern: "GM_Chevy_V8",
    lengthInches: 28.4,
    defaultStall: 3000,
    clutch: "6-Clutch Forward / 34-Element Sprag Upgrade",
    tunnelProfile: "Large bellhousing; may require minor tunnel massage in tight early floorpans",
    desc: "Virtually indestructible transmission capable of handling 1,000+ HP with stock case."
  },
  r2004r: {
    id: "r2004r",
    name: "GM 200-4R (4-Speed Overdrive Automatic)",
    category: "GM Classic Automatic",
    type: "Automatic",
    ratios: [2.74, 1.57, 1.00, 0.67],
    reverse: 2.07,
    nativePattern: "GM_Dual_BOP_Chevy",
    lengthInches: 27.7,
    defaultStall: 2400,
    clutch: "Billet Forward Drum / Dual-Pattern Bellhousing",
    tunnelProfile: "Direct swap into TH350 crossmember location",
    desc: "Buick GNX-proven 4-speed overdrive with unique dual BOP/Chevy bellhousing bolt pattern."
  },
  r7004: {
    id: "r7004",
    name: "700R4 / Early 4L60 (4-Speed Overdrive)",
    category: "GM Classic Automatic",
    type: "Automatic",
    ratios: [3.06, 1.63, 1.00, 0.70],
    reverse: 2.29,
    nativePattern: "GM_Chevy_V8",
    lengthInches: 30.7,
    defaultStall: 2200,
    clutch: "Z-Pack 3-4 Heavy Duty Clutch / Corvette Servo",
    tunnelProfile: "Slightly longer case; requires shortened driveshaft vs TH350",
    desc: "Deep 3.06 first gear launch with 30% highway overdrive. TV cable must be adjusted with pressure gauge."
  },

  // 2. GM ELECTRONIC OVERDRIVES
  r4l60e: {
    id: "r4l60e",
    name: "GM 4L60E (Electronic 4-Speed Overdrive)",
    category: "GM Electronic Overdrive",
    type: "Automatic",
    ratios: [3.06, 1.63, 1.00, 0.70],
    reverse: 2.29,
    nativePattern: "GM_Chevy_V8",
    lengthInches: 30.7,
    defaultStall: 2400,
    clutch: "Z-Pack 3-4 Heavy Duty Clutch / PWM Lockup Converter",
    tunnelProfile: "Fits stock GM tunnels; requires standalone TCU or harness",
    desc: "Computer-controlled 4-speed overdrive offering programmable electronic shift points and lockup."
  },
  r4l80e: {
    id: "r4l80e",
    name: "GM 4L80E (Heavy Duty Electronic 4-Speed Overdrive)",
    category: "GM Electronic Overdrive",
    type: "Automatic",
    ratios: [2.48, 1.48, 1.00, 0.75],
    reverse: 2.08,
    nativePattern: "GM_Chevy_V8",
    lengthInches: 32.0,
    defaultStall: 2600,
    clutch: "Overdrive Planetary + Heavy Duty TH400 Gear Train",
    tunnelProfile: "Large rear case; cooler lines require tunnel relief in tight cars",
    desc: "The overdrive equivalent of the TH400. Handles 1,200+ HP with aftermarket billet input shaft."
  },
  r6l80e: {
    id: "r6l80e",
    name: "GM 6L80E (Clutch-to-Clutch 6-Speed Automatic)",
    category: "GM Electronic Overdrive",
    type: "Automatic",
    ratios: [4.03, 2.36, 1.53, 1.15, 0.85, 0.67],
    reverse: 3.06,
    nativePattern: "GM_LS_Modular",
    lengthInches: 33.1,
    defaultStall: 2000,
    clutch: "Clutch-to-Clutch Electro-Hydraulic Mechatronic",
    tunnelProfile: "Very wide case; requires tunnel expansion in classic muscle cars",
    desc: "Modern 6-speed with massive 4.03 first gear ratio and double overdrive."
  },
  r10l90: {
    id: "r10l90",
    name: "GM / Ford Hydra-Matic 10L90 (10-Speed Performance Auto)",
    category: "GM Electronic Overdrive",
    type: "Automatic",
    ratios: [4.70, 2.99, 2.15, 1.80, 1.52, 1.28, 1.00, 0.85, 0.69, 0.64],
    reverse: 4.87,
    nativePattern: "GM_LS_Modular",
    lengthInches: 34.5,
    defaultStall: 2200,
    clutch: "4 Planetary Sets / 6 Multi-Plate Clutches",
    tunnelProfile: "Modern wide tunnel required; CAN-bus integration necessary",
    desc: "World-class 10-speed automatic with sub-100 millisecond shift speeds."
  },

  // 3. FORD AUTOMATICS
  ford_c4: {
    id: "ford_c4",
    name: "Ford C4 (Compact 3-Speed Automatic)",
    category: "Ford Automatic",
    type: "Automatic",
    ratios: [2.46, 1.46, 1.00],
    reverse: 2.20,
    nativePattern: "Ford_SBF_6Bolt",
    lengthInches: 25.5,
    defaultStall: 2400,
    clutch: "5-Clutch Direct / Rigid Intermediate Band",
    tunnelProfile: "Compact; fits early Mustangs and Falcon floorpans easily",
    desc: "Lightweight Ford 3-speed automatic favored for 289/302 small block builds."
  },
  ford_c6: {
    id: "ford_c6",
    name: "Ford C6 (Heavy Duty 3-Speed Automatic)",
    category: "Ford Automatic",
    type: "Automatic",
    ratios: [2.46, 1.46, 1.00],
    reverse: 2.18,
    nativePattern: "Ford_SBF_6Bolt",
    lengthInches: 28.6,
    defaultStall: 2800,
    clutch: "One-Piece Aluminum Case / Heavy Duty Planetary",
    tunnelProfile: "Large integral bellhousing",
    desc: "Ford's big-block and heavy-duty small-block workhorse transmission."
  },
  ford_aod: {
    id: "ford_aod",
    name: "Ford AOD (4-Speed Automatic Overdrive)",
    category: "Ford Automatic",
    type: "Automatic",
    ratios: [2.40, 1.47, 1.00, 0.67],
    reverse: 2.00,
    nativePattern: "Ford_SBF_6Bolt",
    lengthInches: 30.2,
    defaultStall: 2200,
    clutch: "Direct Split-Torque Lockup / Overdrive Band",
    tunnelProfile: "Direct fit into Fox-Body Mustangs; tight in 65-66 Mustangs",
    desc: "First American 4-speed automatic with mechanical lockup in direct and OD."
  },
  ford_10r80: {
    id: "ford_10r80",
    name: "Ford 10R80 (10-Speed Automatic for Coyote/EcoBoost)",
    category: "Ford Automatic",
    type: "Automatic",
    ratios: [4.70, 2.99, 2.15, 1.80, 1.52, 1.28, 1.00, 0.85, 0.69, 0.64],
    reverse: 4.87,
    nativePattern: "Ford_Coyote_Modular",
    lengthInches: 34.5,
    defaultStall: 2400,
    clutch: "10-Speed High Torque Capacity Mechatronic",
    tunnelProfile: "Modern wide tunnel required",
    desc: "Cutting-edge 10-speed keeping Coyote 5.0L right in its high-RPM powerband."
  },

  // 4. MOPAR TORQUEFLITE AUTOMATICS
  mopar_727: {
    id: "mopar_727",
    name: "Chrysler Torqueflite 727 (A-727 3-Speed HD)",
    category: "Mopar Automatic",
    type: "Automatic",
    ratios: [2.45, 1.45, 1.00],
    reverse: 2.22,
    nativePattern: "Chrysler_RB_Hemi",
    lengthInches: 29.0,
    defaultStall: 2800,
    clutch: "4-Clutch Direct / Heavy Duty Front Band",
    tunnelProfile: "Large bellhousing; fits B and E-body Mopars natively",
    desc: "Legendary transmission behind 426 HEMI and 440 Six-Pack muscle cars."
  },
  mopar_a500_42re: {
    id: "mopar_a500_42re",
    name: "Chrysler A500 / 40RH / 42RE / 44RE (4-Speed OD Auto)",
    category: "Mopar Automatic",
    type: "Automatic",
    ratios: [2.74, 1.54, 1.00, 0.69],
    reverse: 2.21,
    nativePattern: "Chrysler_LA_Magnum",
    lengthInches: 32.4,
    defaultStall: 2400,
    clutch: "Multi-Disc Overdrive & Direct Clutch Packs + Lockup Converter",
    tunnelProfile: "Extended overdrive tailhousing; fits Mopar A/B/F-body & Dakota/Ram tunnels",
    desc: "Overdrive evolution of TorqueFlite A904 with 0.69:1 planetary overdrive unit, multi-disc clutch packs, and lockup torque converter."
  },
  mopar_8hp70: {
    id: "mopar_8hp70",
    name: "Torqueflite 8 / ZF 8HP70 (8-Speed Modern HEMI)",
    category: "Mopar Automatic",
    type: "Automatic",
    ratios: [4.71, 3.14, 2.10, 1.67, 1.29, 1.00, 0.84, 0.67],
    reverse: 3.32,
    nativePattern: "Chrysler_Gen3_Hemi",
    lengthInches: 31.8,
    defaultStall: 2600,
    clutch: "ZF 8-Speed Mechatronic Fast-Shift Unit",
    tunnelProfile: "Compact for an 8-speed; popular restomod swap transmission",
    desc: "State-of-the-art 8-speed used across modern Scat Packs, Hellcats, and BMW M-cars."
  },

  // 5. CLASSIC MUSCLE MANUALS
  muncieM20: {
    id: "muncieM20",
    name: "Muncie M20 Wide-Ratio (4-Speed Manual)",
    category: "Classic Muscle Manual",
    type: "Manual",
    ratios: [2.52, 1.88, 1.46, 1.00],
    reverse: 2.59,
    nativePattern: "GM_Chevy_V8",
    lengthInches: 21.5,
    defaultStall: 0,
    clutch: "11.0\" 10-Spline / 27-Spline Organic Clutch",
    tunnelProfile: "Compact OEM GM fit in all A, F, X-bodies without cutting",
    desc: "Wide-ratio 4-speed providing strong launch with highway rear axle ratios (3.08 - 3.55)."
  },
  muncieM21: {
    id: "muncieM21",
    name: "Muncie M21 Close-Ratio (4-Speed Manual)",
    category: "Classic Muscle Manual",
    type: "Manual",
    ratios: [2.20, 1.64, 1.28, 1.00],
    reverse: 2.27,
    nativePattern: "GM_Chevy_V8",
    lengthInches: 21.5,
    defaultStall: 0,
    clutch: "11.0\" 26-Spline / 32-Spline Heavy Duty",
    tunnelProfile: "Compact OEM GM fit",
    desc: "Close-ratio manual designed to keep high-revving SBC 350 / 327 in the powerband."
  },
  muncieM22: {
    id: "muncieM22",
    name: "Muncie M22 'Rock Crusher' (4-Speed Manual)",
    category: "Classic Muscle Manual",
    type: "Manual",
    ratios: [2.20, 1.64, 1.28, 1.00],
    reverse: 2.27,
    nativePattern: "GM_Chevy_V8",
    lengthInches: 21.5,
    defaultStall: 0,
    clutch: "11.0\" SFI Billet Steel Flywheel + 26-Spline Disc",
    tunnelProfile: "Compact OEM GM fit",
    desc: "Low-helix straight-cut gears for maximum torque tolerance and legendary M22 gear whine."
  },
  super_t10: {
    id: "super_t10",
    name: "Borg-Warner Super T-10 (4-Speed Manual)",
    category: "Classic Muscle Manual",
    type: "Manual",
    ratios: [2.64, 1.75, 1.34, 1.00],
    reverse: 2.55,
    nativePattern: "GM_Chevy_V8",
    lengthInches: 21.8,
    defaultStall: 0,
    clutch: "26-Spline Input / Nodular Iron Case Option",
    tunnelProfile: "Direct fit into 2nd Gen Camaros, Trans Ams, and Corvettes",
    desc: "Upgraded nodular-iron case 4-speed handling higher big-block torque loads."
  },
  ford_toploader: {
    id: "ford_toploader",
    name: "Ford Toploader (Rugged 4-Speed Manual)",
    category: "Classic Muscle Manual",
    type: "Manual",
    ratios: [2.32, 1.69, 1.29, 1.00],
    reverse: 2.32,
    nativePattern: "Ford_SBF_6Bolt",
    lengthInches: 24.0,
    defaultStall: 0,
    clutch: "11.0\" 1-3/8\" Big-Spline Input Option",
    tunnelProfile: "Cast iron case; compact but heavy",
    desc: "Indestructible cast-iron manual without side cover plate (loads through the top)."
  },
  mopar_a833: {
    id: "mopar_a833",
    name: "Chrysler New Process A-833 (4-Speed Manual)",
    category: "Classic Muscle Manual",
    type: "Manual",
    ratios: [2.65, 1.93, 1.39, 1.00],
    reverse: 2.57,
    nativePattern: "Chrysler_RB_Hemi",
    lengthInches: 28.5,
    defaultStall: 0,
    clutch: "18-Spline 'Hemi' Input Shaft Option",
    tunnelProfile: "Heavy cast iron case with Hurst competition linkage",
    desc: "Mopar's bulletproof 4-speed handling brutal drag launches behind 426 Hemi engines."
  },

  // 6. MODERN OVERDRIVE MANUALS
  tremecT5: {
    id: "tremecT5",
    name: "Tremec T5 World-Class (5-Speed Manual OD)",
    category: "Modern Overdrive Manual",
    type: "Manual",
    ratios: [2.95, 1.94, 1.34, 1.00, 0.63],
    reverse: 2.76,
    nativePattern: "GM_Chevy_V8",
    lengthInches: 24.5,
    defaultStall: 0,
    clutch: "10.4\" Diaphragm Clutch / Carbon-Lined Synchros",
    tunnelProfile: "Compact; fits classic muscle car tunnels without cutting",
    desc: "Compact 5-speed overdrive with 0.63:1 fifth gear for highway cruising with 3.73 rear gears."
  },
  tremec_tkx: {
    id: "tremec_tkx",
    name: "Tremec TKX (Compact 5-Speed Manual 600 ft-lbs)",
    category: "Modern Overdrive Manual",
    type: "Manual",
    ratios: [2.87, 1.89, 1.28, 1.00, 0.68],
    reverse: 2.56,
    nativePattern: "GM_Chevy_V8",
    lengthInches: 24.2,
    defaultStall: 0,
    clutch: "26-Spline Input / Multi-Lip Seals / 8,000 RPM Synchros",
    tunnelProfile: "Ultra-Streamlined Slim Case engineered specifically for classic floorpans",
    desc: "The ultimate restomod 5-speed. Slim case slips into early Camaros and Corvettes with zero tunnel cutting."
  },
  tremec_tko600: {
    id: "tremec_tko600",
    name: "Tremec TKO 600 (Heavy Duty 5-Speed Manual)",
    category: "Modern Overdrive Manual",
    type: "Manual",
    ratios: [2.87, 1.89, 1.28, 1.00, 0.64],
    reverse: 2.56,
    nativePattern: "GM_Chevy_V8",
    lengthInches: 25.1,
    defaultStall: 0,
    clutch: "26-Spline Input / 31-Spline Output / 600 ft-lbs rated",
    tunnelProfile: "Bulkier top case; often requires crossmember and floor clearance",
    desc: "Proven heavy-duty 5-speed rated to 600 lb-ft of continuous input torque."
  },
  tremecT56: {
    id: "tremecT56",
    name: "Tremec T56 Magnum (6-Speed Manual Double OD)",
    category: "Modern Overdrive Manual",
    type: "Manual",
    ratios: [2.66, 1.78, 1.30, 1.00, 0.80, 0.63],
    reverse: 2.90,
    nativePattern: "GM_Chevy_V8",
    lengthInches: 32.5,
    defaultStall: 0,
    clutch: "Twin-Disc SFI Ceramic / Hydraulic Throwout Bearing",
    tunnelProfile: "Large rear case; requires tunnel expansion or floor stretch in early cars",
    desc: "Heavy-duty 6-speed manual with double overdrive capable of handling 700+ ft-lbs torque."
  },

  // 7. JDM & EXOTIC SWAP STANDARDS
  nissan_cd009: {
    id: "nissan_cd009",
    name: "Nissan CD009 (6-Speed Manual - V8 Swap Favorite)",
    category: "JDM & Exotic Swap",
    type: "Manual",
    ratios: [3.79, 2.32, 1.62, 1.27, 1.00, 0.79],
    reverse: 3.45,
    nativePattern: "Nissan_VQ_Block",
    lengthInches: 31.5,
    defaultStall: 0,
    clutch: "Multi-Cone Brass Synchros / Billet Adapter Plate",
    tunnelProfile: "Moderate tunnel clearance; adapter plate required for SBC/LS",
    desc: "Legendary 6-speed from 350Z. Extremely strong, handles 1,000 HP, and widely adapted to SBC, LS, and 2JZ."
  },
  toyota_v160: {
    id: "toyota_v160",
    name: "Toyota / Getrag V160 (6-Speed Manual - Supra MK4)",
    category: "JDM & Exotic Swap",
    type: "Manual",
    ratios: [3.83, 2.36, 1.69, 1.31, 1.00, 0.79],
    reverse: 3.28,
    nativePattern: "Toyota_JZ_Block",
    lengthInches: 31.0,
    defaultStall: 0,
    clutch: "Twin-Disc Push-Type / Integral SFI Bellhousing",
    tunnelProfile: "Deep bellhousing; fits Supra and large tunnels natively",
    desc: "German Getrag engineering built for Toyota. One of the strongest factory manual transmissions in existence."
  },
  zf_8hp70_universal: {
    id: "zf_8hp70_universal",
    name: "ZF 8HP70 Universal (8-Speed Mechatronic Swap)",
    category: "JDM & Exotic Swap",
    type: "Automatic",
    ratios: [4.71, 3.14, 2.10, 1.67, 1.29, 1.00, 0.84, 0.67],
    reverse: 3.32,
    nativePattern: "Universal_Adapter_Plate",
    lengthInches: 31.8,
    defaultStall: 2600,
    clutch: "8-Speed Mechatronic Fast-Shift Unit with Standalone TCU",
    tunnelProfile: "Compact round case; fits most classic tunnels with adapter plate",
    desc: "Modern 8-speed automatic swap sensation. Shifter paddles with sub-150ms shift execution."
  },
  allison_1000: {
    id: "allison_1000",
    name: "Allison 1000 6-Speed HD (Duramax Diesel Auto)",
    category: "GM Electronic Overdrive",
    type: "Automatic",
    ratios: [3.10, 1.81, 1.41, 1.00, 0.71, 0.61],
    reverse: 4.49,
    nativePattern: "GM_Chevy_V8",
    lengthInches: 33.8,
    defaultStall: 1600,
    clutch: "C1-C5 Heavy-Duty Diesel Planetary Clutch Packs",
    tunnelProfile: "Heavy-Duty 2500HD/3500HD High-Hump Truck Tunnel",
    desc: "Commercial-grade 6-speed double-overdrive automatic paired with GM 6.6L Duramax diesels."
  },
  ford_6r140: {
    id: "ford_6r140",
    name: "Ford TorqShift 6R140 (6-Speed HD Diesel Auto)",
    category: "Ford Automatic",
    type: "Automatic",
    ratios: [3.97, 2.32, 1.52, 1.15, 0.86, 0.67],
    reverse: 3.13,
    nativePattern: "Ford_Modular_Diesel",
    lengthInches: 34.2,
    defaultStall: 1700,
    clutch: "Triple-Disc Lockup Converter + Heavy-Duty Planetary",
    tunnelProfile: "Super Duty F-250/F-350/F-450 Heavy-Duty Tunnel",
    desc: "Ford's heavy-duty 6-speed automatic engineered behind 6.7L Power Stroke torque."
  },
  subaru_ty85_6mt: {
    id: "subaru_ty85_6mt",
    name: "Subaru TY85 6-Speed AWD Manual (STI Spec)",
    category: "JDM & Exotic Swap",
    type: "Manual",
    ratios: [3.64, 2.24, 1.52, 1.14, 0.89, 0.76],
    reverse: 3.54,
    nativePattern: "Subaru_EJ_FA_Boxer",
    lengthInches: 32.0,
    defaultStall: 0,
    clutch: "240mm Pull/Push Diaphragm + DCCD Center Diff",
    tunnelProfile: "Longitudinal AWD Transaxle Tunnel",
    desc: "Subaru WRX STI 6-speed AWD gearbox with helical front and DCCD center differential."
  },
  vw_dsg_dq381: {
    id: "vw_dsg_dq381",
    name: "VW / Audi DQ381 7-Speed Wet Dual-Clutch (DSG)",
    category: "JDM & Exotic Swap",
    type: "Automatic",
    ratios: [3.40, 2.75, 1.77, 0.92, 0.70, 0.76, 0.64],
    reverse: 2.90,
    nativePattern: "VW_Audi_Transverse",
    lengthInches: 20.5,
    defaultStall: 2200,
    clutch: "Concentric Wet Dual-Clutch Pack (DQ381 / DQ500 Series)",
    tunnelProfile: "Transverse AWD/FWD Engine Bay Architecture",
    desc: "Fast dual-clutch automated manual used across Golf GTI/R, S3, RS3, and TT RS."
  },
  getrag_dct_7: {
    id: "getrag_dct_7",
    name: "Getrag 7DCL750 (7-Speed Exotic Dual-Clutch Transaxle)",
    category: "JDM & Exotic Swap",
    type: "Automatic",
    ratios: [3.08, 2.18, 1.63, 1.29, 1.03, 0.84, 0.69],
    reverse: 2.75,
    nativePattern: "Exotic_DCT_Transaxle",
    lengthInches: 26.8,
    defaultStall: 2400,
    clutch: "Twin Wet Multi-Plate Carbon-Friction Dual Clutch",
    tunnelProfile: "Mid/Front-Mid Rear Transaxle Packaging",
    desc: "7-speed dual-clutch transaxle architecture found in Ferrari 488/812, AMG GT, and Ford GT."
  }
};

export const VEHICLES_CATALOG: Record<string, VehicleItem> = {
  camaro1969: {
    id: "camaro1969",
    make: "Chevrolet",
    model: "Camaro (1st Gen Z/28, SS & RS)",
    yearRange: [1967, 1969],
    gen: "1st Gen F-Body",
    tunnelSize: "Tight Tunnel (Tremec TKX, Muncie or TH350 fit with zero cutting; T56 requires tunnel stretch)"
  },
  camaro1979: {
    id: "camaro1979",
    make: "Chevrolet",
    model: "Camaro (2nd Gen Z28 & Split-Bumper)",
    yearRange: [1970, 1981],
    gen: "2nd Gen F-Body",
    tunnelSize: "Generous Tunnel (Fits TH400, 4L80E, T56 with minor crossmember modification)"
  },
  camaro1988: {
    id: "camaro1988",
    make: "Chevrolet",
    model: "Camaro IROC-Z (3rd Gen)",
    yearRange: [1982, 1992],
    gen: "3rd Gen F-Body",
    tunnelSize: "Factory 700R4 / T5 Tunnel (Fits T56 with aftermarket torque arm mount)"
  },
  chevelle1970: {
    id: "chevelle1970",
    make: "Chevrolet",
    model: "Chevelle SS 350 / 454",
    yearRange: [1968, 1972],
    gen: "2nd Gen A-Body",
    tunnelSize: "Massive A-Body Tunnel (Fits all transmissions up to 4L80E and T56 Magnum)"
  },
  corvette1969: {
    id: "corvette1969",
    make: "Chevrolet",
    model: "Corvette C3 Stingray Mako Shark",
    yearRange: [1968, 1982],
    gen: "C3 Sports Car",
    tunnelSize: "Very Narrow Center Backbone (Requires removable crossmember kit for large overdrives)"
  },
  c10truck: {
    id: "c10truck",
    make: "Chevrolet",
    model: "C10 Squarebody Pickup",
    yearRange: [1973, 1987],
    gen: "3rd Gen C/K Series",
    tunnelSize: "Huge Truck Transmission Hump (Fits every transmission in existence with ample room)"
  },
  mustang1967: {
    id: "mustang1967",
    make: "Ford",
    model: "Mustang Fastback / Coupe",
    yearRange: [1964, 1973],
    gen: "1st Gen Classic",
    tunnelSize: "Tight 60s Floorpan (Toploader and T5 bolt in; T56 requires tunnel lift)"
  },
  supra1994: {
    id: "supra1994",
    make: "Toyota",
    model: "Supra Twin Turbo A80",
    yearRange: [1993, 2002],
    gen: "MK4 Sports Car",
    tunnelSize: "Factory V160 / A340E Tunnel (Fits CD009, T56, and TH400 with swap bellhousing)"
  },
  datsun240z: {
    id: "datsun240z",
    make: "Nissan",
    model: "240Z / 260Z / 280Z (S30)",
    yearRange: [1969, 1978],
    gen: "S30 Fairlady Z",
    tunnelSize: "Narrow Sports Car Tunnel (T5, CD009, and Powerglide fit; T56 requires ear trimming)"
  }
};

export const CYLINDER_HEAD_FLOW_BENCH: HeadFlowPoint[] = [
  { lift: 0.100, intakeCfm: 66, exhaustCfm: 52 },
  { lift: 0.200, intakeCfm: 138, exhaustCfm: 108 },
  { lift: 0.300, intakeCfm: 198, exhaustCfm: 148 },
  { lift: 0.400, intakeCfm: 242, exhaustCfm: 178 },
  { lift: 0.500, intakeCfm: 265, exhaustCfm: 195 },
  { lift: 0.600, intakeCfm: 274, exhaustCfm: 205 }
];

export const ARP_TORQUE_AND_STRETCH_SPECS: TorqueSpec[] = [
  {
    item: "Connecting Rod Bolts (Ray's 5.700\" Rods)",
    size: "3/8-24 ARP 8740 Chromoly",
    stock: "35 ft-lbs",
    arp: "45 ft-lbs (ARP Ultra-Torque lube)",
    stretch: "0.0058\" – 0.0062\" Stretch",
    notes: "Stretch gauge is the only true preload measurement. 50 ft-lbs if using SAE 30 engine oil."
  },
  {
    item: "Cylinder Head Bolts (17-Bolt Pattern)",
    size: "7/16-14 Grade 8 Hex Head",
    stock: "65 ft-lbs",
    arp: "70 ft-lbs (3 equal steps: 25, 45, 70 ft-lbs)",
    notes: "CRITICAL: Teflon thread sealant required on all threads (bolts penetrate into coolant water jacket)."
  },
  {
    item: "Main Bearing Caps (Inner 2-Bolt / 4-Bolt)",
    size: "7/16-14",
    stock: "70 ft-lbs",
    arp: "75 ft-lbs with ARP Ultra-Torque",
    notes: "Lubricate threads and washer faces. Measure bearing oil clearance with dial bore micrometer."
  },
  {
    item: "Main Bearing Caps (Outer Splayed 4-Bolt)",
    size: "7/16-14 Outer Splayed",
    stock: "65 ft-lbs",
    arp: "65 ft-lbs",
    notes: "Splayed 15° or 20° outer bolts pull load directly into block outer skirt webbing."
  },
  {
    item: "Intake Manifold Bolts",
    size: "3/8-16",
    stock: "30 ft-lbs",
    arp: "25 – 30 ft-lbs",
    notes: "Tighten in spiral pattern from intake center outwards to avoid warping manifold."
  },
  {
    item: "Harmonic Balancer Snout Bolt",
    size: "7/16-20",
    stock: "60 ft-lbs",
    arp: "85 ft-lbs with washer",
    notes: "Always install with harmonic balancer installer tool—never pull balancer on with bolt."
  },
  {
    item: "Flywheel / Flexplate to Crankshaft Bolts",
    size: "7/16-20 (6-Bolt Flange)",
    stock: "60 ft-lbs",
    arp: "65 ft-lbs + Loctite 242 (Blue)",
    notes: "Clean threads thoroughly. Blind holes on pre-1986 2-piece rear main seal cranks."
  }
];

export const HEAD_BOLT_17_SEQUENCE = [
  { boltNum: 1, x: 0, y: 0, row: 'top', ftLbs: '25 → 45 → 65' },
  { boltNum: 2, x: 0, y: 1, row: 'bottom', ftLbs: '25 → 45 → 65' },
  { boltNum: 3, x: 1, y: 0, row: 'top', ftLbs: '25 → 45 → 65' },
  { boltNum: 4, x: 1, y: 1, row: 'bottom', ftLbs: '25 → 45 → 65' },
  { boltNum: 5, x: -1, y: 0, row: 'top', ftLbs: '25 → 45 → 65' },
  { boltNum: 6, x: -1, y: 1, row: 'bottom', ftLbs: '25 → 45 → 65' },
  { boltNum: 7, x: 2, y: 0, row: 'top', ftLbs: '25 → 45 → 65' },
  { boltNum: 8, x: 2, y: 1, row: 'bottom', ftLbs: '25 → 45 → 65' },
  { boltNum: 9, x: -2, y: 0, row: 'top', ftLbs: '25 → 45 → 65' },
  { boltNum: 10, x: -2, y: 1, row: 'bottom', ftLbs: '25 → 45 → 65' },
  { boltNum: 11, x: 3, y: 0, row: 'top', ftLbs: '25 → 45 → 65' },
  { boltNum: 12, x: 3, y: 1, row: 'bottom', ftLbs: '25 → 45 → 65' },
  { boltNum: 13, x: -3, y: 0, row: 'top', ftLbs: '25 → 45 → 65' },
  { boltNum: 14, x: -3, y: 1, row: 'bottom', ftLbs: '25 → 45 → 65' },
  { boltNum: 15, x: 4, y: 0, row: 'top', ftLbs: '25 → 45 → 65' },
  { boltNum: 16, x: 4, y: 1, row: 'bottom', ftLbs: '25 → 45 → 65' },
  { boltNum: 17, x: 5, y: 0, row: 'top', ftLbs: '25 → 45 → 65' }
];

export const MECHANIC_SPECS_LIBRARY: MechanicSpec[] = [
  { label: "SPARK PLUG GAP", value: "0.040 in", notes: "ACDelco R45TS or NGK BPR6FS for high-energy HEI ignition." },
  { label: "INITIAL IGNITION TIMING", value: "12° BTDC @ 850 RPM Idle", notes: "Total 36° mechanical timing achieved by 3,000 RPM (vacuum hose plugged)." },
  { label: "OIL PUMP PICKUP TO PAN BOTTOM", value: "3/8\" to 1/2\" (0.375\" – 0.500\")", notes: "Use modeling clay in pan floor to verify height. Brazed or tack-welded to pump body." },
  { label: "HYDRAULIC VALVE LASH PRELOAD", value: "Zero Lash + 1/2 Turn Preload", notes: "Tighten rocker nut while spinning pushrod until slight drag is felt, then turn 1/2 turn." },
  { label: "FUEL PRESSURE TO CARB", value: "5.5 – 6.5 PSI", notes: "Mechanical high-flow pump with dual-feed fuel rail. Never exceed 7.0 PSI on needle/seats." },
  { label: "STARTER PINION BACKLASH", value: "0.030\" – 0.060\"", notes: "Check gear engagement with 1/8\" wire gauge. Use starter shims on engine block pad if binding." },
  { label: "CRANKSHAFT END PLAY", value: "0.003\" – 0.007\"", notes: "Checked with dial indicator on #5 thrust bearing face." },
  { label: "ROD SIDE CLEARANCE", value: "0.012\" – 0.020\"", notes: "Feeler gauge between pair of rods on same journal." }
];

export const BASE_BOM: BOMItem[] = [
  { cat: "Engine Block", part: "GM SBC 350 4-Bolt Main Seasoned Casting (9.025\" Deck)", num: "GM-10243880", price: 850.00 },
  { cat: "Crankshaft", part: "Scat Forged 4340 Steel Crankshaft 3.480\" Stroke", num: "SCA-43500", price: 495.00 },
  { cat: "Connecting Rods", part: "Scat Forged 4340 H-Beam Rods 5.700\" with ARP Cap Screws", num: "SCA-25700", price: 345.00 },
  { cat: "Pistons", part: "Keith Black Hypereutectic 4.000\" Bore Flat-Top 5cc Relief", num: "KB-115-000", price: 360.00 },
  { cat: "Piston Rings", part: "Total Seal Ductile Iron Moly Ring Set (.0050\" gap factor)", num: "TOT-CR3500", price: 125.00 },
  { cat: "Cylinder Heads", part: "Edelbrock E-Street 64cc Aluminum Heads 2.02/1.60\" (Pair)", num: "EDL-5089", price: 1290.00 },
  { cat: "Head Gaskets", part: "Fel-Pro Performance Pre-Flattened .039\" Compressed Gasket", num: "FEL-1003", price: 98.00 },
  { cat: "Camshaft & Lifters", part: "Comp Cams Xtreme Energy 224/230 Hydraulic Roller + Retrofit Lifters", num: "CCA-CL12-422-8", price: 489.00 },
  { cat: "Rocker Arms", part: "Scorpion Endurance Billet Aluminum 1.5:1 7/16\" Stud Rollers", num: "SCP-1024", price: 285.00 },
  { cat: "Oil Pump & Pickup", part: "Melling M-55HV High Volume Oil Pump & 3/8\" Screen", num: "MEL-M55HV", price: 84.00 },
  { cat: "Ignition Distributor", part: "MSD Pro-Billet Ready-to-Run HEI Distributor & Red 8.5mm Wires", num: "MSD-8360", price: 420.00 },
  { cat: "Water Pump", part: "Edelbrock Victor High-Flow Aluminum Water Pump (35 GPM)", num: "EDL-8810", price: 185.00 },
  { cat: "Fuel Pump", part: "Holley 110 GPH Mechanical Fuel Pump 6.5 PSI", num: "HLY-12-327-11", price: 129.00 },
  { cat: "Starter Motor", part: "Powermaster MasterTorque Mini Starter 1.4 kW 4:1 Gear", num: "PWM-9600", price: 195.00 },
  { cat: "Alternator", part: "Powermaster 100A 1-Wire Chrome Alternator with Billet Bracket", num: "PWM-17294", price: 165.00 }
];

export const ENGINE_CATALOG: Record<string, EngineCatalogItem> = {
  sbc_350_ray: {
    id: "sbc_350_ray",
    name: "Chevrolet SBC 350 V8 (Ray's Confirmed Baseline)",
    shortName: "Chevy SBC 350",
    make: "Chevrolet",
    era: "Classic Domestic",
    pattern: "GM_Chevy_V8",
    balance: "Internal / Neutral (2-pc rear seal)",
    flywheelTeeth: "153 or 168-Tooth",
    cylinders: 8,
    configLabel: "V8",
    valvetrainType: "OHV",
    blockMaterial: "iron",
    headMaterial: "aluminum", // Ray's Edelbrock E-Street 64cc aluminum heads per BASE_BOM
    boreSpacing: 4.400,       // OEM GM Gen-I SBC factory spec
    bankAngleDeg: 90,
    valveAngleDeg: 23,        // OEM SBC 23-degree valve inclination
    stockRockerRatio: 1.5,    // OEM GM SBC rocker ratio
    intakeValveIn: 2.02,      // Ray's E-Street performance head spec
    exhaustValveIn: 1.60,
    mainCaps: 5,
    bore: 4.000,
    stroke: 3.480,
    rodLength: 5.700,      // Ray's Spec
    deckHeight: 9.025,     // Ray's Spec
    chamberCc: 64.0,       // Ray's Spec
    gasketThickness: 0.039,// Ray's Spec
    deckClearance: 0.015,  // Ray's Spec
    quenchDistance: 0.054, // .039 + .015 = .054"
    staticCR: 9.90,
    color: 0xd83b01,       // Classic Chevy Orange
    firingOrder: "1-8-4-3-6-5-7-2",
    dyno: { baseHp: 385, baseTq: 415, hpPeakRpm: 5600, tqPeakRpm: 3800, ve: 0.90 },
    torqueSpecs: ARP_TORQUE_AND_STRETCH_SPECS,
    bom: BASE_BOM
  },
  sbc_327: {
    id: "sbc_327",
    name: "Chevrolet SBC 327 V8 (Small-Journal High-Revving)",
    shortName: "Chevy SBC 327",
    make: "Chevrolet",
    era: "Classic Domestic",
    pattern: "GM_Chevy_V8",
    balance: "Internal / Neutral (2-pc rear seal)",
    flywheelTeeth: "153-Tooth",
    cylinders: 8,
    configLabel: "V8",
    valvetrainType: "OHV",
    blockMaterial: "iron",
    headMaterial: "iron",     // OEM SBC 327 double-hump iron casting
    boreSpacing: 4.400,       // OEM GM Gen-I SBC factory spec
    bankAngleDeg: 90,
    valveAngleDeg: 23,        // OEM SBC 23-degree valve inclination
    stockRockerRatio: 1.5,    // OEM GM SBC rocker ratio
    intakeValveIn: 2.02,      // OEM 327 L79 / fuelie 461-462 head spec
    exhaustValveIn: 1.60,
    mainCaps: 5,
    bore: 4.000,
    stroke: 3.250,
    rodLength: 5.700,
    deckHeight: 9.025,
    chamberCc: 64.0,
    gasketThickness: 0.039,
    deckClearance: 0.015,
    quenchDistance: 0.054,
    staticCR: 10.25,
    color: 0xd83b01,
    firingOrder: "1-8-4-3-6-5-7-2",
    dyno: { baseHp: 375, baseTq: 360, hpPeakRpm: 6200, tqPeakRpm: 4200, ve: 0.92 },
    torqueSpecs: ARP_TORQUE_AND_STRETCH_SPECS,
    bom: BASE_BOM
  },
  bbc_454: {
    id: "bbc_454",
    name: "Chevrolet Big-Block 454 V8 (Mark IV)",
    shortName: "Chevy BBC 454",
    make: "Chevrolet",
    era: "Classic Domestic",
    pattern: "GM_Chevy_V8",
    balance: "External Balance (counterweighted flywheel)",
    flywheelTeeth: "168-Tooth",
    cylinders: 8,
    configLabel: "V8",
    valvetrainType: "OHV",
    blockMaterial: "iron",
    headMaterial: "iron",     // OEM Mark IV cast-iron 118cc open-chamber head
    boreSpacing: 4.840,       // OEM GM Mark IV BBC factory spec
    bankAngleDeg: 90,
    valveAngleDeg: 26,        // OEM BBC intake 26-deg canted (exhaust 17-deg canted)
    stockRockerRatio: 1.7,    // OEM BBC 1.7:1 rocker ratio
    // High-perf Mark IV rectangular-port (LS6) valve sizes matching 460 HP spec;
    // standard passenger oval-port castings used 2.06"/1.72"
    intakeValveIn: 2.19,
    exhaustValveIn: 1.88,
    mainCaps: 5,
    bore: 4.250,
    stroke: 4.000,
    rodLength: 6.135,
    deckHeight: 9.800,
    chamberCc: 118.0,
    gasketThickness: 0.041,
    deckClearance: 0.020,
    quenchDistance: 0.061,
    staticCR: 10.00,
    color: 0xd83b01,
    firingOrder: "1-8-4-3-6-5-7-2",
    dyno: { baseHp: 460, baseTq: 520, hpPeakRpm: 5400, tqPeakRpm: 3600, ve: 0.94 },
    torqueSpecs: ARP_TORQUE_AND_STRETCH_SPECS,
    bom: BASE_BOM
  },
  ls3_62: {
    id: "ls3_62",
    name: "GM Gen-IV LS3 6.2L V8 (All-Aluminum)",
    shortName: "GM LS3 6.2L",
    make: "Chevrolet",
    era: "Modern Domestic",
    pattern: "GM_LS_Modular",
    balance: "Internal / Neutral Balance",
    flywheelTeeth: "168-Tooth Flat Flywheel",
    cylinders: 8,
    configLabel: "V8",
    valvetrainType: "OHV",
    blockMaterial: "aluminum",
    headMaterial: "aluminum", // OEM #821 rectangular-port aluminum head
    boreSpacing: 4.400,       // OEM GM Gen-III/IV LS factory spec
    bankAngleDeg: 90,
    valveAngleDeg: 15,        // OEM LS3 15-degree valve angle
    stockRockerRatio: 1.7,    // OEM LS3 1.7:1 pedestal rocker ratio
    intakeValveIn: 2.165,     // OEM LS3 #821 head spec
    exhaustValveIn: 1.590,
    mainCaps: 5,
    bore: 4.065,
    stroke: 3.622,
    rodLength: 6.098,
    deckHeight: 9.240,
    chamberCc: 68.0,
    gasketThickness: 0.051,
    deckClearance: -0.005,
    quenchDistance: 0.046,
    staticCR: 10.70,
    color: 0x8a939e,
    firingOrder: "1-8-7-2-6-5-4-3",
    dyno: { baseHp: 436, baseTq: 428, hpPeakRpm: 5900, tqPeakRpm: 4600, ve: 0.95 },
    torqueSpecs: ARP_TORQUE_AND_STRETCH_SPECS,
    bom: BASE_BOM
  },
  ford_302: {
    id: "ford_302",
    name: "Ford 302 Small-Block Windsor V8",
    shortName: "Ford 302 Windsor",
    make: "Ford",
    era: "Classic Domestic",
    pattern: "Ford_SBF_6Bolt",
    balance: "External Balance (28 oz / 50 oz)",
    flywheelTeeth: "157 or 164-Tooth",
    cylinders: 8,
    configLabel: "V8",
    valvetrainType: "OHV",
    blockMaterial: "iron",
    headMaterial: "iron",     // OEM Windsor 58cc cast-iron head
    boreSpacing: 4.380,       // OEM Ford Small-Block Windsor factory spec
    bankAngleDeg: 90,
    valveAngleDeg: 20,        // OEM Windsor 20-degree valve angle
    stockRockerRatio: 1.6,    // OEM SBF 302 1.6:1 rocker ratio
    intakeValveIn: 1.78,      // OEM 1969+ 302 Windsor valve spec
    exhaustValveIn: 1.45,
    mainCaps: 5,
    bore: 4.000,
    stroke: 3.000,
    rodLength: 5.090,
    deckHeight: 8.206,
    chamberCc: 58.0,
    gasketThickness: 0.042,
    deckClearance: 0.012,
    quenchDistance: 0.054,
    staticCR: 9.50,
    color: 0x1e40af,
    firingOrder: "1-5-4-2-6-3-7-8",
    dyno: { baseHp: 325, baseTq: 350, hpPeakRpm: 5500, tqPeakRpm: 3400, ve: 0.88 },
    torqueSpecs: ARP_TORQUE_AND_STRETCH_SPECS,
    bom: BASE_BOM
  },
  toyota_2jz: {
    id: "toyota_2jz",
    name: "Toyota 2JZ-GTE 3.0L Twin-Turbo",
    shortName: "Toyota 2JZ-GTE",
    make: "Toyota",
    era: "Japanese JDM",
    pattern: "Toyota_JZ_Block",
    balance: "Internal / Neutral Balance",
    flywheelTeeth: "154-Tooth Toyota",
    cylinders: 6,
    configLabel: "I6",
    valvetrainType: "DOHC",
    blockMaterial: "iron",    // OEM Toyota MVMA cast-iron inline-6 block (58.7 kg)
    headMaterial: "aluminum", // OEM aluminum 24-valve DOHC pentroof head
    boreSpacing: 3.661,       // OEM 93.0 mm (3.661") per Toyota MVMA spec
    bankAngleDeg: 0,          // Inline-6 vertical bank
    valveAngleDeg: 22.5,      // Half of OEM 45-deg included pentroof valve angle
    intakeValveIn: 1.319,     // OEM 33.5 mm intake valve (4-valve/cyl)
    exhaustValveIn: 1.142,    // OEM 29.0 mm exhaust valve (4-valve/cyl)
    mainCaps: 7,              // OEM 7-main-bearing I6 bottom end
    bore: 3.386,
    stroke: 3.386,
    rodLength: 5.590,
    deckHeight: 8.622,
    chamberCc: 44.0,
    gasketThickness: 0.051,
    deckClearance: 0.010,
    quenchDistance: 0.061,
    staticCR: 8.50,
    color: 0x334155,
    firingOrder: "1-5-3-6-2-4",
    dyno: { baseHp: 320, baseTq: 315, hpPeakRpm: 5800, tqPeakRpm: 3800, ve: 1.15 },
    torqueSpecs: ARP_TORQUE_AND_STRETCH_SPECS,
    bom: BASE_BOM
  }
};
