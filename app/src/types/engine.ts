/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TabId = 
  | 'block3d'
  | 'rotating'
  | 'valvetrain'
  | 'induction'
  | 'ignition'
  | 'trans'
  | 'dyno'
  | 'shop'
  | 'drawings';

export type CutawayMode = 'none' | 'rightBank' | 'centerLongitudinal' | 'valvetrain';
export type SubsystemIsolation = 'all' | 'rotating' | 'valvetrain' | 'ignition' | 'lubrication' | 'cooling' | 'fuel' | 'starter';
export type PistonAlloy = '4032' | '2618' | 'hypereutectic';
export type RingApplication = 'street' | 'street_strip' | 'nitrous';
export type CamProfileId = 'rv' | 'street' | 'radical';
export type InductionDressMode = 'carb_hei' | 'mpfi_cnp';

export interface EngineConfig {
  bore: number;              // inches (Ray's 4.000)
  stroke: number;            // inches (Ray's 3.480)
  rodLength: number;         // inches (Ray's 5.700)
  deckHeight: number;        // inches (Ray's 9.025)
  deckClearance: number;     // inches (Ray's 0.015)
  gasketThickness: number;   // inches (Ray's 0.039)
  chamberCc: number;         // cc (Ray's 64.0)
  pistonReliefCc: number;    // cc (5.0)
  cylinders?: number;        // cylinder count (default 8)
  pistonAlloy: PistonAlloy;  // '4032' | '2618' | 'hypereutectic'
  ringApplication: RingApplication; // 'street' | 'street_strip' | 'nitrous'
  camProfile: CamProfileId;  // 'rv' | 'street' | 'radical'
  rockerRatio: number;       // 1.5 or 1.6
  selectedIntake: string;    // 'dualplane_rpm' | 'singleplane_victor' | 'tunnelram_dual'
  carbCfm: number;           // 600, 650, 750, 900
  targetAFR: number;         // e.g. 12.9
  ignitionTiming: number;    // Total advance degrees BTDC (e.g. 36)
  sparkPlugGap: number;      // inches (0.040)
  selectedTrans: string;     // transmission key
  stallSpeed: number;        // RPM
  rearGear: number;          // e.g. 3.73
  tireDiameter: number;      // inches e.g. 26.0
  selectedVehicle: string;   // vehicle id
  inductionDress?: InductionDressMode; // 'carb_hei' | 'mpfi_cnp'
}

export interface EngineCatalogItem {
  id: string;
  name: string;
  shortName: string;
  make: string;
  era: string;
  pattern: string;
  balance: string;
  flywheelTeeth: string;
  cylinders?: number;
  bore: number;
  stroke: number;
  rodLength: number;
  deckHeight: number;
  chamberCc: number;
  gasketThickness: number;
  deckClearance: number;
  quenchDistance: number;
  staticCR: number;
  color: number;
  firingOrder: string;
  dyno: {
    baseHp: number;
    baseTq: number;
    hpPeakRpm: number;
    tqPeakRpm: number;
    ve: number;
  };
  torqueSpecs: TorqueSpec[];
  bom: BOMItem[];
}

export interface TransmissionItem {
  id: string;
  name: string;
  category: string;
  type: 'Automatic' | 'Manual';
  ratios: number[];
  reverse: number;
  nativePattern: string;
  lengthInches: number;
  defaultStall: number;
  clutch: string;
  tunnelProfile: string;
  desc: string;
}

export interface VehicleItem {
  id: string;
  make: string;
  model: string;
  yearRange: [number, number];
  gen: string;
  tunnelSize: string;
}

export type PartsGradeTier = 'oe_standard' | 'pro_hd' | 'street_perf' | 'race_forged';

export interface StorePartOption {
  id: string;
  category: string;
  brand: string;
  sku: string;
  name: string;
  tier: PartsGradeTier;
  price: number;
  coreCharge?: number;
  warranty: string;
  specSummary: string;
  inStock: string;
}

export interface StoreVehicleModel {
  id: string;
  make: string;
  model: string;
  yearStart: number;
  yearEnd: number;
  chassisCode: string;
  tunnelSize: string;
  engineIds: string[];
}

export interface StoreEngineSpec {
  id: string;
  make: string;
  family: string;
  code: string;
  name: string;
  liters: number;
  cid: number;
  cylinders: number;
  configLabel: 'V8' | 'V6' | 'I6' | 'I4' | 'V10' | 'H4';
  yearStart: number;
  yearEnd: number;
  bore: number;
  stroke: number;
  rodLength: number;
  deckHeight: number;
  deckClearance: number;
  gasketThickness: number;
  chamberCc: number;
  pistonReliefCc: number;
  firingOrder: string;
  pattern: string;
  fuelSystem: string;
  baseHp: number;
  baseTq: number;
  recommendedTransId: string;
  partsPrefix: string;
}

export interface TorqueSpec {
  item: string;
  size: string;
  stock: string;
  arp: string;
  stretch?: string;
  notes: string;
}

export interface MechanicSpec {
  label: string;
  value: string;
  notes: string;
}

export interface BOMItem {
  cat: string;
  part: string;
  num: string;
  price: number;
}

export interface HeadFlowPoint {
  lift: number;
  intakeCfm: number;
  exhaustCfm: number;
}

export interface DynoDataPoint {
  rpm: number;
  hp: number;
  tq: number;
  ve: number;
  fuelFlowLbsHr: number;
}

export interface SpeedInGearRow {
  gear: number;
  ratio: number;
  totalReduction: number;
  mphAt2500: number;
  mphAt5500: number;
  cruiseRpmAt65: number;
}

export interface CompatibilityReport {
  isDirectBoltOn: boolean;
  adapterRequired: string;
  hardwareNotes: string;
  bellhousing: string;
  tunnelClearance: string;
}

export interface CoordinatedSpecs {
  displacementCi: number;
  displacementL: number;
  cylinderCc: number;
  deckVolumeCc: number;
  gasketVolumeCc: number;
  totalClearanceCc: number;
  quenchDistance: number;
  quenchStatus: string;
  staticCR: number;
  dynamicCR: number;
  rodStrokeRatio: number;
  maxRodAngleDeg: number;
  meanPistonSpeed6000: number;
  totalValveLift: number;
  topRingGap: number;
  secondRingGap: number;
  oilRingGap: number;
  ptwClearance: string;
  peakCfmDemand: number;
  peakHp: number;
  peakTq: number;
  hpPeakRpm: number;
  tqPeakRpm: number;
  bsfcLbHr: number;
  fuelGph: number;
  knockRisk: boolean;
  camData: {
    name: string;
    intakeDur050: number;
    exhDur050: number;
    lobeLift: number;
    baseHp: number;
    baseTq: number;
    hpRpm: number;
    tqRpm: number;
    ve: number;
    recStall: number;
    ivcDeg: number;
  };
  intakeData: {
    id: string;
    name: string;
    style: string;
    runnerCc: number;
    flowCfm: number;
    hpMult: number;
    tqMult: number;
  };
  dynoCurve: DynoDataPoint[];
  speedInGearTable: SpeedInGearRow[];
  compatibility: CompatibilityReport;
}

export interface TechDrawingSourceUrl {
  title: string;
  uri: string;
}

export type EngineSubassemblyKey =
  | 'block'
  | 'timingCover'
  | 'oilPan'
  | 'crank'
  | 'rotating'
  | 'cam'
  | 'heads'
  | 'intake'
  | 'efiRails'
  | 'ignition'
  | 'lubrication'
  | 'cooling'
  | 'fuel'
  | 'starter'
  | 'chassis';

export type TransSubassemblyKey =
  | 'bellhousing'
  | 'converter'
  | 'frontPump'
  | 'clutchPack'
  | 'mainCase'
  | 'valveBody'
  | 'pan'
  | 'tailhousing'
  | 'slipYoke';

export interface TechDrawingCallout {
  row: string;
  indexCode: string;
  partName: string;
  partNumber?: string;
  category: string;
  clearanceSpec?: string;
  torqueSpec?: string;
  material?: string;
  notes?: string;
  targetSubassembly: EngineSubassemblyKey | TransSubassemblyKey | string;
}

export interface TechDrawingDimensions {
  bore?: number;
  stroke?: number;
  rodLength?: number;
  deckHeight?: number;
  deckClearance?: number;
  gasketThickness?: number;
  chamberCc?: number;
  ratios?: number[];
  reverse?: number;
  lengthInches?: number;
  defaultStall?: number;
  nativePattern?: string;
}

export interface TechDrawingSheet {
  id: string;
  domain: 'engine' | 'transmission';
  drawingNumber: string;
  title: string;
  subtitle: string;
  sourceLabel: string;
  unitSummary: string;
  referenceImageUrl?: string;
  dimensions?: TechDrawingDimensions;
  callouts: TechDrawingCallout[];
  sourceUrls?: TechDrawingSourceUrl[];
  updatedAt?: string;
}

export interface InspectionData {
  name: string;
  category: string;
  desc: string;
  spec?: string;
  torque?: string;
  partNumber?: string;
  drawingIndex?: string;
  material?: string;
  sourceUrls?: TechDrawingSourceUrl[];
}

export interface MeasurementState {
  active: boolean;
  mode: 'none' | 'caliper' | 'volumetric' | 'angle';
  point1: [number, number, number] | null;
  point2: [number, number, number] | null;
  distanceInches: number | null;
  distanceMm: number | null;
  surfaceLabel: string | null;
}