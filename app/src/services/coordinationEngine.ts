/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EngineConfig,
  CoordinatedSpecs,
  DynoDataPoint,
  SpeedInGearRow,
  CompatibilityReport,
  TransmissionItem
} from '../types/engine';
import {
  CAM_PROFILES,
  INTAKE_MANIFOLDS,
  TRANSMISSIONS_DB,
  VEHICLES_CATALOG,
  ENGINE_CATALOG
} from '../data/engineData';
import { STORE_VEHICLE_MODELS } from '../data/autoPartsCatalog';

export function calculateCoordinatedSpecs(
  config: EngineConfig,
  transOverridesById?: Record<string, Partial<TransmissionItem>>
): CoordinatedSpecs {
  const {
    bore,
    stroke,
    rodLength,
    deckClearance,
    gasketThickness,
    chamberCc,
    pistonReliefCc,
    pistonAlloy,
    ringApplication,
    camProfile,
    rockerRatio,
    selectedIntake,
    carbCfm,
    targetAFR,
    ignitionTiming,
    selectedTrans,
    rearGear,
    tireDiameter,
    selectedVehicle
  } = config;

  // 1. DISPLACEMENT & CYLINDER VOLUMES
  const cylCount = config.cylinders ?? 8;
  // (PI / 4) * bore^2 * stroke * cylinders
  const displacementCi = +((Math.PI / 4) * Math.pow(bore, 2) * stroke * cylCount).toFixed(2);
  const displacementL = +(displacementCi * 0.016387064).toFixed(3);
  const singleCylinderCc = +((displacementCi * 16.387064) / cylCount).toFixed(2);

  // 2. QUENCH / SQUISH DISTANCE (Ray's Confirmed Spec: .039" gasket + .015" deck = .054")
  const quenchDistance = +(gasketThickness + deckClearance).toFixed(4);
  const quenchStatus = 
    quenchDistance >= 0.038 && quenchDistance <= 0.055
      ? "OPTIMAL DETONATION SHIELD (0.038\" - 0.055\")"
      : quenchDistance < 0.038
      ? "DANGER: EXCESSIVE ROD STRETCH & PISTON-TO-HEAD CONTACT RISK"
      : "POOR: END-GAS DETONATION ZONE (> 0.055\")";

  // 3. COMPRESSION VOLUMES & STATIC COMPRESSION RATIO (SCR)
  // Deck volume (in cc) = (PI / 4) * bore^2 * deckClearance * 16.387064
  const deckVolumeCc = +(((Math.PI / 4) * Math.pow(bore, 2) * deckClearance * 16.387064)).toFixed(2);
  // Gasket volume (fire-ring bore ~ bore + 0.100", exact 4.100" for 4.000" SBC 350)
  const gasketBore = bore + 0.100;
  const gasketVolumeCc = +(((Math.PI / 4) * Math.pow(gasketBore, 2) * gasketThickness * 16.387064)).toFixed(2);
  const totalClearanceCc = +(chamberCc + gasketVolumeCc + deckVolumeCc + pistonReliefCc).toFixed(2);
  const staticCR = +((singleCylinderCc + totalClearanceCc) / totalClearanceCc).toFixed(2);

  // 4. ROD-TO-STROKE RATIO & PISTON KINEMATICS
  const rodStrokeRatio = +(rodLength / stroke).toFixed(3);
  const maxRodAngleDeg = +(Math.asin((stroke / 2) / rodLength) * (180 / Math.PI)).toFixed(2);
  const meanPistonSpeed6000 = Math.round((2 * stroke * 6000) / 12); // FPM

  // 5. CAMSHAFT & VALVETRAIN COORDINATION
  const cam = CAM_PROFILES[camProfile] || CAM_PROFILES.street;
  const totalValveLift = +(cam.lobeLift * rockerRatio).toFixed(3);

  // Dynamic Compression Ratio (DCR):
  // Effective stroke accounts for Intake Valve Closing (IVC) ABDC degrees
  const effectiveStroke = stroke * (1 - (cam.ivcDeg / 180) * 0.45);
  const effectiveCylCc = (Math.PI / 4) * Math.pow(bore, 2) * effectiveStroke * 16.387064;
  const dynamicCR = +((effectiveCylCc + totalClearanceCc) / totalClearanceCc).toFixed(2);

  // 6. MACHINE SHOP RING GAPS & PTW CLEARANCES
  const ringFactorTop = 
    ringApplication === 'street' ? 0.0045 :
    ringApplication === 'street_strip' ? 0.0050 : 0.0065;
  const topRingGap = +(bore * ringFactorTop).toFixed(3);
  const secondRingGap = +(topRingGap + 0.003).toFixed(3); // 2nd ring wider prevents flutter
  const oilRingGap = 0.015;

  const ptwClearance = 
    pistonAlloy === '2618' 
      ? '0.0045" – 0.0055" (Forged 2618 High-Expansion Race Alloy)'
      : pistonAlloy === '4032'
      ? '0.0028" – 0.0035" (Forged 4032 Low-Expansion Street/Strip Alloy)'
      : '0.0018" – 0.0025" (Hypereutectic Cast Alloy)';

  // 7. INDUCTION & AIRFLOW SIZING
  const intake = INTAKE_MANIFOLDS.find(i => i.id === selectedIntake) || INTAKE_MANIFOLDS[0];
  const peakCfmDemand = Math.round(((displacementCi * cam.hpRpm) / 3456) * cam.ve);

  // 8. LIVE DYNO CALCULATIONS & POWER CURVES
  // Ignition timing optimization factor (36 deg is ideal for wedge SBC 350)
  const timingFactor = 
    ignitionTiming === 36 ? 1.0 :
    ignitionTiming > 38 ? 0.92 : // Knock retardation / power loss
    1.0 - (36 - ignitionTiming) * 0.012;

  // AFR factor (12.9:1 optimal power rich)
  const afrFactor = Math.max(0.85, 1.0 - Math.pow(targetAFR - 12.9, 2) * 0.04);
  const carbFactor = carbCfm >= peakCfmDemand ? 1.0 : 0.94;

  const dispPowerScale = Math.abs(displacementCi - 349.85) < 0.5 ? 1.0 : Math.pow(displacementCi / 349.85, 0.72);
  const peakHp = Math.round(cam.baseHp * dispPowerScale * (staticCR / 9.90) * intake.hpMult * timingFactor * afrFactor * carbFactor);
  const peakTq = Math.round(cam.baseTq * (displacementCi / 350.4) * intake.tqMult * timingFactor * afrFactor);

  const hpPeakRpm = cam.hpRpm;
  const tqPeakRpm = cam.tqRpm;

  // Brake Specific Fuel Consumption (BSFC)
  const bsfcLbHr = +(peakHp * 0.49).toFixed(1);
  const fuelGph = +(bsfcLbHr / 6.0).toFixed(1);

  // Synthesize SAE J1349 Power & Torque Absorption Sweep (1500 to 6500 RPM)
  const dynoCurve: DynoDataPoint[] = [];
  for (let r = 1500; r <= 6500; r += 250) {
    // Torque profile curve
    const tqFactor = Math.max(0.5, 1 - Math.pow((r - tqPeakRpm) / 2200, 2) * 0.45);
    const currTq = Math.round(peakTq * tqFactor);
    // Exact thermodynamic formula: HP = (Torque * RPM) / 5252
    const currHp = Math.round((currTq * r) / 5252);
    const currVe = +(cam.ve * (0.8 + 0.2 * tqFactor)).toFixed(2);
    const currFuelFlow = +(currHp * 0.49).toFixed(1);

    dynoCurve.push({
      rpm: r,
      hp: currHp,
      tq: currTq,
      ve: currVe,
      fuelFlowLbsHr: currFuelFlow
    });
  }

  // 9. TRANSMISSION SPEED IN GEAR TABLE
  const baseTrans = TRANSMISSIONS_DB[selectedTrans] || TRANSMISSIONS_DB.th350;
  const transOverride = transOverridesById?.[baseTrans.id];
  const trans = transOverride ? { ...baseTrans, ...transOverride } : baseTrans;
  const speedInGearTable: SpeedInGearRow[] = trans.ratios.map((ratio, idx) => {
    const totalReduction = +(ratio * rearGear).toFixed(3);
    const mphAt2500 = Math.round((2500 * tireDiameter) / (totalReduction * 336));
    const mphAt5500 = Math.round((5500 * tireDiameter) / (totalReduction * 336));
    const cruiseRpmAt65 = Math.round((65 * totalReduction * 336) / tireDiameter);

    return {
      gear: idx + 1,
      ratio,
      totalReduction,
      mphAt2500,
      mphAt5500,
      cruiseRpmAt65
    };
  });

  // 10. UNIVERSAL TRANSMISSION COMPATIBILITY AUDIT
  const storeVehicle = STORE_VEHICLE_MODELS.find(v => v.id === selectedVehicle);
  const vehicle = VEHICLES_CATALOG[selectedVehicle] || VEHICLES_CATALOG.camaro1969;
  const tunnelClearance = storeVehicle ? `${storeVehicle.make} ${storeVehicle.model}: ${storeVehicle.tunnelSize}` : vehicle.tunnelSize;
  const engineItem = ENGINE_CATALOG.sbc_350_ray;

  let isDirectBoltOn = false;
  let adapterRequired = "None (Direct Factory GM Bolt-On)";
  let hardwareNotes = "";
  let bellhousing = "";

  if (trans.nativePattern === "GM_Chevy_V8" || trans.nativePattern === "GM_Dual_BOP_Chevy") {
    isDirectBoltOn = true;
    bellhousing = "Direct OEM Chevy 6-Bolt Bellhousing";
    hardwareNotes = "Uses standard Chevy bellhousing bolt pattern. Match starter nose and flexplate/flywheel to 153 vs 168-tooth ring gear.";
  } else if (trans.id === "nissan_cd009") {
    adapterRequired = "Collins / Maverick SBC-to-CD009 Billet Aluminum Adapter Plate";
    hardwareNotes = "Requires custom stepped flywheel with Chevy crank pattern and 350Z friction clutch disc.";
    bellhousing = "Requires machined front bellhousing bell cut";
  } else if (trans.id === "tremecT56") {
    adapterRequired = "QuickTime RM-6023 SFI Steel Bellhousing (Chevy V8 to Tremec T56 Face)";
    hardwareNotes = "Direct bolt-in with 26-spline 11\" clutch disc and hydraulic throwout bearing.";
    bellhousing = "SFI Spec 6.1 Explosive Proof Bellhousing";
  } else if (trans.id === "zf_8hp70_universal") {
    adapterRequired = "DomTube / Sound Performance 8HP-to-SBC Billet Adapter Plate + Crank Hub Adapter";
    hardwareNotes = "Requires standalone HTG Tuning or Turbolamik TCU electronic transmission controller.";
    bellhousing = "Billet 6061-T6 Adapter Plate";
  } else {
    adapterRequired = "Aftermarket Multi-Pattern Billet Bellhousing / Adapter Kit";
    hardwareNotes = "Custom flywheel spacing and pilot bushing extension required.";
    bellhousing = "Custom SFI Swap Adapter Bellhousing";
  }

  const compatibility: CompatibilityReport = {
    isDirectBoltOn,
    adapterRequired,
    hardwareNotes,
    bellhousing,
    tunnelClearance
  };

  return {
    displacementCi,
    displacementL,
    cylinderCc: singleCylinderCc,
    deckVolumeCc,
    gasketVolumeCc,
    totalClearanceCc,
    quenchDistance,
    quenchStatus,
    staticCR,
    dynamicCR,
    rodStrokeRatio,
    maxRodAngleDeg,
    meanPistonSpeed6000,
    totalValveLift,
    topRingGap,
    secondRingGap,
    oilRingGap,
    ptwClearance,
    peakCfmDemand,
    peakHp,
    peakTq,
    hpPeakRpm,
    tqPeakRpm,
    bsfcLbHr,
    fuelGph,
    knockRisk: ignitionTiming > 38,
    camData: cam,
    intakeData: intake,
    dynoCurve,
    speedInGearTable,
    compatibility
  };
}
