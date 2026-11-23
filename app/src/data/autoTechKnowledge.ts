/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TabId } from '../types/engine';

export interface TechKnowledgeArticle {
  id: string;
  domainId: string;
  title: string;
  subsystemTag: string;
  relatedTab: TabId;
  summary: string;
  engineeringSpecs: Array<{ label: string; value: string }>;
  formula?: string;
  keyPrinciples: string[];
  failureDiagnostics: string[];
}

export interface TechKnowledgeDomain {
  id: string;
  name: string;
  shortDesc: string;
  relatedTab: TabId;
}

export const TECH_KNOWLEDGE_DOMAINS: TechKnowledgeDomain[] = [
  {
    id: 'block_architecture',
    name: '01. Block Architecture & Metallurgy',
    shortDesc: 'Cylinder layouts, cast iron vs aluminum, deck stiffness & bore geometry.',
    relatedTab: 'block3d'
  },
  {
    id: 'rotating_kinematics',
    name: '02. Rotating Assembly & Kinematics',
    shortDesc: 'Crankshafts, connecting rods, piston alloys, ring gaps & bearing oil film.',
    relatedTab: 'rotating'
  },
  {
    id: 'valvetrain_thermo',
    name: '03. Valvetrain, Quench & Flow',
    shortDesc: 'Camshaft lobes, IVC dynamic compression, quench squish & head port flow.',
    relatedTab: 'valvetrain'
  },
  {
    id: 'induction_boost',
    name: '04. Induction, Carburetion & Boost',
    shortDesc: 'Plenum resonance, CFM sizing, EFI, turbochargers & AFR stoichiometry.',
    relatedTab: 'induction'
  },
  {
    id: 'ignition_electronics',
    name: '05. Ignition, Spark & ECU Controls',
    shortDesc: 'MBT advance curves, HEI/CDI/CNP ignition, knock sensing & trigger wheels.',
    relatedTab: 'ignition'
  },
  {
    id: 'lubrication_cooling',
    name: '06. Lubrication, Cooling & Starters',
    shortDesc: 'Oil pump cavitation, ZDDP chemistry, reverse-flow cooling & cranking torque.',
    relatedTab: 'block3d'
  },
  {
    id: 'driveline_trans',
    name: '07. Transmissions & Driveline Physics',
    shortDesc: 'Planetary ratios, stall converters, bellhousing patterns & pinion angles.',
    relatedTab: 'trans'
  },
  {
    id: 'metrology_shop',
    name: '08. Machine Shop Metrology & Dyno',
    shortDesc: 'Torque-plate honing, ARP bolt stretch, 17-bolt sequences & SAE J1349 math.',
    relatedTab: 'shop'
  }
];

export const TECH_KNOWLEDGE_ARTICLES: TechKnowledgeArticle[] = [
  // 01. BLOCK ARCHITECTURE
  {
    id: 'engine_layouts',
    domainId: 'block_architecture',
    title: 'Multi-Cylinder Layouts: I4, I6, V6, Boxer H4/H6 & 90° V8',
    subsystemTag: 'Block Geometry',
    relatedTab: 'block3d',
    summary:
      'Cylinder bank angle and crank-pin phasing govern primary and secondary inertial balance. Inline-6 engines cancel both primary and secondary forces inherently, while a 90° cross-plane V8 uses 90° crank throws and heavy counterweights to achieve smooth V8 firing intervals (90° apart).',
    engineeringSpecs: [
      { label: '90° Cross-Plane V8 Firing Interval', value: '90° Crank Rotation' },
      { label: 'Inline-6 Inherent Balance', value: '1st & 2nd Order Zero Force' },
      { label: '60° V6 Bank Phasing', value: '120° Even-Fire Crank Pins' },
      { label: 'Flat-Plane V8 Interval', value: '180° Crank / High-RPM Scavenging' }
    ],
    formula: 'Swept Displacement (CID) = (π / 4) × Bore² × Stroke × Cylinders',
    keyPrinciples: [
      'Cross-plane V8 crank throws sit at 0°, 90°, 270°, and 180°, requiring precision bobweight dynamic balancing.',
      'Siamese cylinder bores (e.g. Chevy 400 SBC) eliminate water jackets between adjacent cylinders for 4.125"+ bores, requiring steam holes in heads and gaskets.',
      'Closed-deck aluminum blocks (e.g. 2JZ iron / LS sleeved) resist cylinder wall walk under high boost compared to open-deck commuter blocks.'
    ],
    failureDiagnostics: [
      'Core shift in seasoned cast-iron blocks causes uneven cylinder wall thickness; sonic-check walls before boring +.060".',
      'Over-torqued main caps without line-honing distort main bearing housing bores out-of-round.'
    ]
  },
  {
    id: 'block_metallurgy',
    domainId: 'block_architecture',
    title: 'Block Casting Metallurgy: Class 30 Gray Iron vs 356-T6 Aluminum vs CGI',
    subsystemTag: 'Materials Engineering',
    relatedTab: 'block3d',
    summary:
      'Cast iron absorbs vibration and retains cylinder roundness at minimal cost. 356-T6 aluminum cuts ~95 lbs off the nose of an SBC/LS chassis while requiring pressed ductile-iron or Nikasil liners and adjusted cold-to-hot bearing clearance specs.',
    engineeringSpecs: [
      { label: 'SBC 350 Cast Iron Weight', value: '~170 lbs Bare Block' },
      { label: 'LS3 319/356-T6 Aluminum Block', value: '~106 lbs Bare Block' },
      { label: 'Compacted Graphite Iron (CGI)', value: '2× Fatigue Strength vs Gray Iron' },
      { label: 'Deck Height Reference (SBC)', value: '9.025" Factory Spec' }
    ],
    keyPrinciples: [
      'Aluminum expands roughly twice as fast as cast iron (~23 vs 11 µm/m·K), opening main bearing vertical oil clearance when hot unless factored during machining.',
      '4-bolt main caps (outer splayed 12°–20° on aftermarket blocks) tie into thicker bulkheads to arrest crank cap walk above 550 HP.'
    ],
    failureDiagnostics: [
      'Deck surface warpage > 0.003" across cylinder head bank induces coolant seepage or compression combustion gas breach into water jackets.'
    ]
  },

  // 02. ROTATING ASSEMBLY
  {
    id: 'rod_stroke_kinematics',
    domainId: 'rotating_kinematics',
    title: 'Rod-to-Stroke Ratio, Piston Dwell & Side-Thrust Angularity',
    subsystemTag: 'Kinematics',
    relatedTab: 'rotating',
    summary:
      'Connecting rod length divided by crankshaft stroke determines connecting rod angularity at mid-stroke, cylinder wall side-thrust friction, and piston dwell time near Top Dead Center (TDC).',
    engineeringSpecs: [
      { label: "Ray's SBC 350 Ratio (5.700 / 3.480)", value: '1.638 : 1' },
      { label: 'Long-Rod 350 (6.000 / 3.480)', value: '1.724 : 1' },
      { label: 'SBC 400 Short Rod (5.565 / 3.750)', value: '1.484 : 1' },
      { label: 'Safe Forged Piston Speed', value: '< 4,500 FPM Mean' }
    ],
    formula: 'Max Rod Angle = arcsin((Stroke / 2) / RodLength) | Mean Piston Speed = (2 × Stroke × RPM) / 12',
    keyPrinciples: [
      'Lower R/S ratios (< 1.55) increase piston acceleration right off TDC, boosting low-RPM intake port signal at the cost of higher thrust-wall wear.',
      'Higher R/S ratios (> 1.65) prolong TDC dwell for cleaner peak-pressure leverage and lower side-loading at 6,500+ RPM.'
    ],
    failureDiagnostics: [
      'Short-rod strokers (e.g. 383/400 with 5.565" rods) must be checked for rod bolt shoulder interference against the camshaft base circle and bottom of cylinder skirts.'
    ]
  },
  {
    id: 'piston_metallurgy_rings',
    domainId: 'rotating_kinematics',
    title: 'Piston Alloys (Hypereutectic vs 4032 vs 2618) & Ring End-Gap Thermal Math',
    subsystemTag: 'Pistons & Rings',
    relatedTab: 'rotating',
    summary:
      'Silicon content controls thermal expansion in aluminum pistons. Tight piston-to-wall clearance quiets cold start slap, while high-boost/nitrous builds require ductile 2618 forgings and wider top ring end gaps to prevent ring-end butting.',
    engineeringSpecs: [
      { label: 'Hypereutectic (16% Si) PTW', value: '0.0018" – 0.0025"' },
      { label: 'Forged 4032 (11% Si) PTW', value: '0.0028" – 0.0035"' },
      { label: 'Forged 2618 (<2% Si) PTW', value: '0.0045" – 0.0055"' },
      { label: '2nd Ring Rule', value: 'Top Gap + 0.003" (Anti-Flutter)' }
    ],
    formula: 'Top Ring Gap = Bore × Factor (0.0045" Street N/A | 0.0050" Street/Strip | 0.0065"+ Boost/Nitrous)',
    keyPrinciples: [
      'Setting the 2nd compression ring end gap slightly wider than the top ring prevents trapped inter-ring pressure from lifting the top ring off its land at high RPM.',
      'Cast hypereutectic pistons run tight clearances and high scuff resistance for street builds, whereas 2618 forgings survive mild detonation without brittle ring-land fracture.'
    ],
    failureDiagnostics: [
      'Too-tight top ring gap causes ends to butt under WOT heat, snapping off piston top ring lands and gouging the cylinder wall vertically.'
    ]
  },
  {
    id: 'crank_bearings_hydrodynamics',
    domainId: 'rotating_kinematics',
    title: 'Crankshaft Metallurgy & Hydrodynamic Tri-Metal Bearing Oil Wedge',
    subsystemTag: 'Bearings & Crank',
    relatedTab: 'rotating',
    summary:
      'Rotating journals never touch the bearing shell during operation; eccentric shaft rotation pumps pressurized oil into a converging hydrodynamic wedge capable of supporting thousands of pounds of combustion load.',
    engineeringSpecs: [
      { label: 'Main & Rod Oil Clearance (Street)', value: '0.0022" – 0.0028"' },
      { label: 'Crankshaft End Play (#5 Thrust)', value: '0.003" – 0.007"' },
      { label: 'Rod Big-End Side Clearance', value: '0.012" – 0.020"' },
      { label: 'Bearing Alloy Stack', value: 'Steel Back + Copper-Lead + Babbitt' }
    ],
    keyPrinciples: [
      '4340 forged alloy steel cranks use large fillet radii (`0.125"`) requiring narrowed Clevite H-Series bearings so bearing edges never ride on the crank radius.',
      'Thrust bearing alignment must be tapped forward/rearward before final main cap torque to eliminate manual-clutch or converter balloon thrust wear.'
    ],
    failureDiagnostics: [
      'Copper showing evenly on upper rod shells indicates insufficient oil viscosity or detonation hammering; edge-loading indicates crank whip or rod big-end housing out-of-round.'
    ]
  },

  // 03. VALVETRAIN & QUENCH
  {
    id: 'quench_dcr_physics',
    domainId: 'valvetrain_thermo',
    title: 'Quench Distance (Squish Velocity) & Dynamic Compression Ratio (DCR)',
    subsystemTag: 'Combustion Chamber',
    relatedTab: 'valvetrain',
    summary:
      'The flat quench pad between the piston crown at TDC and the cylinder head deck violently ejects trapped end-gas toward the spark plug. Tightening quench into the 0.038"–0.055" window dramatically suppresses pump-gas detonation.',
    engineeringSpecs: [
      { label: "Ray's Confirmed Quench (.015 + .039)", value: '0.054" (Optimal)' },
      { label: 'Zero-Deck + .040" Gasket', value: '0.040" (Max Squish Turbulence)' },
      { label: 'Ideal Pump-Gas Static CR (Alum)', value: '9.5:1 – 10.5:1' },
      { label: 'Ideal Pump-Gas Dynamic CR', value: '7.8:1 – 8.5:1' }
    ],
    formula: 'Quench = DeckClearance + CompressedGasketThickness | SCR = (SweptCC + ClearanceCC) / ClearanceCC',
    keyPrinciples: [
      'Quench tighter than 0.035" risks piston-to-head contact at 6,500+ RPM due to rod stretch and piston rock.',
      'Quench looser than 0.060" loses turbulence, leaving pockets of stagnant end-gas in the perimeter that auto-ignite (pinging) on 91–93 octane fuel.'
    ],
    failureDiagnostics: [
      'Using thick stock 0.051"+ gaskets over 0.025" in-the-hole pistons yields 0.076" quench—worse for detonation than slightly higher compression with 0.040" quench!'
    ]
  },
  {
    id: 'camshaft_valvetrain_dynamics',
    domainId: 'valvetrain_thermo',
    title: 'Camshaft Profiles, Lobe Separation Angle (LSA) & Valve Spring Control',
    subsystemTag: 'Cam & Heads',
    relatedTab: 'valvetrain',
    summary:
      'Duration @ 0.050" tappet lift determines the RPM powerband; Intake Valve Closing (IVC) point dictates trapped dynamic compression; valve spring seat and open loads keep the lifter tracking the cam lobe without valve float.',
    engineeringSpecs: [
      { label: 'Hydraulic Roller Seat Load', value: '125–145 lbs Closed' },
      { label: 'Open Spring Pressure @ Lift', value: '320–380 lbs Open' },
      { label: 'Minimum Retainer-to-Seal Clearance', value: '0.060" Safety Margin' },
      { label: 'Piston-to-Valve (P-to-V) Min', value: '0.080" Intake / 0.100" Exhaust' }
    ],
    formula: 'Total Valve Lift = Lobe Lift × Rocker Arm Ratio (e.g. 0.340" × 1.5 = 0.510")',
    keyPrinciples: [
      'Tighter LSA (106°–108°) increases valve overlap, intensifying exhaust scavenging at mid/high RPM and creating a choppy idle with lower vacuum.',
      'Rocker ratio changes from 1.5:1 to 1.6:1 amplify lift by ~6.7% without swapping the camshaft, provided pushrod slot clearance and spring coil bind are checked.'
    ],
    failureDiagnostics: [
      'Valve float above 5,800 RPM causes immediate nose-over on the dyno curve and risks valve-to-piston collision.'
    ]
  },

  // 04. INDUCTION & BOOST
  {
    id: 'plenum_cfm_afr',
    domainId: 'induction_boost',
    title: 'Volumetric Efficiency (VE), Plenum Tuning & Air-Fuel Ratio (AFR)',
    subsystemTag: 'Airflow & Fuel',
    relatedTab: 'induction',
    summary:
      'Engines act as dynamic air pumps whose intake runner length and plenum volume harness Helmholtz pressure pulses. Matching carburetor or throttle-body CFM to true engine airflow preserves crisp throttle response without choking peak horsepower.',
    engineeringSpecs: [
      { label: 'Stoichiometric Gasoline AFR', value: '14.7 : 1 (λ = 1.00)' },
      { label: 'Best N/A Power Rich AFR', value: '12.6 : 1 – 13.0 : 1' },
      { label: 'E85 Stoichiometric / Power', value: '9.8 : 1 Stoich / ~7.2 : 1 WOT' },
      { label: 'Dual-Plane RPM Band', value: '1,500 – 6,500 RPM' }
    ],
    formula: 'Peak CFM = (CID × MaxRPM / 3456) × VolumetricEfficiency',
    keyPrinciples: [
      'Dual-plane manifolds divide left/right banks across two plenums to boost runner velocity and bottom-end torque.',
      'Single-plane open-plenum manifolds eliminate turns and equalization restrictions above 4,500 RPM for peak high-RPM horsepower.',
      'Direct Injection (GDI) vaporizes fuel inside the cylinder, cooling the charge and permitting 11.0:1+ static compression on pump gasoline.'
    ],
    failureDiagnostics: [
      'Over-sized carburetors (e.g., 850+ CFM on a mild 350) drop booster venturi vacuum velocity, causing bogging off idle.'
    ]
  },
  {
    id: 'forced_induction_turbo_super',
    domainId: 'induction_boost',
    title: 'Forced Induction: Turbochargers, Twin-Screw Superchargers & Intercooling',
    subsystemTag: 'Boost Systems',
    relatedTab: 'induction',
    summary:
      'Increasing intake manifold density above atmospheric pressure (14.7 psia) multiplies mass airflow per stroke. Intercooling density recovery and proper boost-referenced enrichment prevent pre-ignition.',
    engineeringSpecs: [
      { label: '14.7 PSI Boost Mass Multiplier', value: '~2.0× Atmospheric Density' },
      { label: 'Target Boosted Pump-Gas AFR', value: '11.4 : 1 – 11.8 : 1' },
      { label: 'Intercooler Efficiency Target', value: '75% – 85% Thermal Drop' },
      { label: 'Turbo Compressor Surge Limit', value: 'Keep Peak VE Inside Island' }
    ],
    formula: 'Pressure Ratio (PR) = (Boost_PSI + 14.7) / 14.7',
    keyPrinciples: [
      'Centrifugal superchargers scale boost quadratically with RPM; Roots/Twin-Screw blowers produce flat, instantaneous off-idle torque.',
      'Turbochargers recover otherwise wasted exhaust enthalpy, making smaller-displacement DOHC engines (2JZ, EcoBoost, K20) achieve V8+ torque.'
    ],
    failureDiagnostics: [
      'Wastegate boost creep or plugged intercooler core causes intake air temps (IAT) to exceed 160°F, triggering knock.'
    ]
  },

  // 05. IGNITION & CONTROLS
  {
    id: 'ignition_timing_curves',
    domainId: 'ignition_electronics',
    title: 'Ignition Timing Advance, MBT & Knock Avoidance',
    subsystemTag: 'Spark Delivery',
    relatedTab: 'ignition',
    summary:
      'Combustion takes ~1.5–2.0 milliseconds to reach peak cylinder pressure regardless of RPM. Ignition must fire earlier Before Top Dead Center (BTDC) as RPM climbs so peak cylinder pressure lands reliably at 12°–15° After TDC.',
    engineeringSpecs: [
      { label: "Ray's SBC 350 Base + Mechanical", value: '12° Initial + 24° Mech = 36° Total' },
      { label: 'Vacuum Advance (Light Cruise)', value: '+10° to +14° Part-Throttle' },
      { label: 'HEI Spark Plug Electrode Gap', value: '0.040" (50,000V Coil)' },
      { label: 'Fast-Burn LS/Hemi Total Timing', value: '26° – 29° BTDC' }
    ],
    keyPrinciples: [
      'Efficient modern pent-roof or LS chambers burn faster than 1970s wedge chambers, requiring 6°–10° less total spark advance for MBT.',
      'Vacuum advance improves part-throttle fuel economy and crispness by lighting lean cruise mixtures earlier without affecting WOT timing.'
    ],
    failureDiagnostics: [
      'Too much total advance (>38° on SBC wedge heads) builds peak pressure before TDC, causing metallic knock ping, peppered spark plug porcelain, and crushed rod bearings.'
    ]
  },

  // 06. LUBRICATION, COOLING & ELECTRICAL
  {
    id: 'oiling_cooling_electrical',
    domainId: 'lubrication_cooling',
    title: 'Oil Flow, ZDDP Chemistry, Coolant Boiling Physics & Gear Starters',
    subsystemTag: 'Subsystems',
    relatedTab: 'block3d',
    summary:
      'Every horsepower of shaft output rejects roughly an equal amount of heat into the oil and coolant. Oil provides both hydrodynamic film separation and piston-crown cooling.',
    engineeringSpecs: [
      { label: 'Rule-of-Thumb Hot Oil Pressure', value: '10 PSI per 1,000 RPM (Min)' },
      { label: 'Flat-Tappet Break-In ZDDP', value: '1,200 – 1,600 ppm Zinc/Phos' },
      { label: '16 PSI Cap Coolant Boiling Pt', value: '~260°F (50/50 Glycol)' },
      { label: 'High-Torque Gear Reduction Starter', value: '4:1 Ratio / 1.4–2.0 kW' }
    ],
    keyPrinciples: [
      'A high-volume oil pump compensates for looser race bearing clearances; excessive pump volume on tight street clearances can pump a stock 5-qt pan dry at sustained 6,000+ RPM.',
      'Pressurizing the radiator to 16 PSI raises boiling point ~45°F and prevents localized nucleate boiling around exhaust valve seats.'
    ],
    failureDiagnostics: [
      'Low oil pressure at hot idle with high cold pressure points to excessive bearing clearance or worn oil pump bypass spring.'
    ]
  },

  // 07. TRANSMISSIONS & DRIVELINE
  {
    id: 'driveline_trans_math',
    domainId: 'driveline_trans',
    title: 'Transmission Gear Ratios, Torque Converters & Driveline Geometry',
    subsystemTag: 'Driveline',
    relatedTab: 'trans',
    summary:
      'Transmission ratios multiply engine torque to overcome vehicle inertia while overdrive gears drop highway cruise RPM into an efficient BSFC window. Bellhousing bolt pattern, input spline, and U-joint working angles govern swap fitment.',
    engineeringSpecs: [
      { label: 'Chevy V8 Bellhousing Bolts', value: '6-Bolt Standard Pattern' },
      { label: 'Torque Converter Flash Stall', value: 'Match Cam Torque Peak (~2,400+)' },
      { label: 'Ideal Driveshaft U-Joint Angle', value: '1° – 3° Equal & Opposite' },
      { label: 'Flywheel Ring Gear Teeth (GM)', value: '153-Tooth (12.75") or 168-Tooth (14.1")' }
    ],
    formula: 'Cruise RPM = (MPH × TransRatio × RearGear × 336) / TireDiameter',
    keyPrinciples: [
      'Deep 3.06 first gears (700R4/4L60E) accelerate heavy cars harder off the line, while 0.67–0.70 overdrives cut highway cruise RPM by 30%.',
      'Equal and opposite pinion-vs-transmission output angles cancel U-joint velocity fluctuations and driveline vibration.'
    ],
    failureDiagnostics: [
      'Incorrect TV cable adjustment on 700R4/200-4R burns 3-4 clutch packs within miles due to insufficient line pressure.'
    ]
  },

  // 08. MACHINE SHOP METROLOGY & DYNO
  {
    id: 'machine_shop_dyno_metrology',
    domainId: 'metrology_shop',
    title: 'Machine Shop Blueprinting, ARP Bolt Stretch & SAE J1349 Dyno Correction',
    subsystemTag: 'Metrology & Dyno',
    relatedTab: 'shop',
    summary:
      'Blueprinting verifies every factory casting against target tolerances using micrometers, dial bore gauges, and stretch gauges rather than assuming catalog specs match reality.',
    engineeringSpecs: [
      { label: 'ARP Rod Bolt Preload Stretch', value: '0.0055" – 0.0065" Elongation' },
      { label: 'SBC 17-Bolt Head Torque', value: '25 → 45 → 65–70 ft-lbs Spiral' },
      { label: 'Dyno Crossover Constant', value: 'HP = TQ Always @ 5,252 RPM' },
      { label: 'Typical N/A BSFC', value: '0.45 – 0.50 lb/hr per HP' }
    ],
    formula: 'Brake Horsepower (HP) = (Torque_ft_lbs × RPM) / 5252',
    keyPrinciples: [
      'Torque wrenches lose accuracy to thread friction variations; measuring fastener elongation (stretch) with a dial stretch gauge measures true clamping preload directly.',
      'Bolting a torque plate onto the deck before final cylinder honing simulates cylinder head bolt distortion so bores stay dead-round once assembled.'
    ],
    failureDiagnostics: [
      'Dry head bolts into cast-iron SBC water-jacket holes seep pressurized coolant into crankcase oil; always apply PTFE thread sealant (Loctite 567).'
    ]
  }
];
