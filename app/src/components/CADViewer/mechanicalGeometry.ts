/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

/**
 * Procedural Canvas Textures (Zero-404, Performance CAD Surface Finishes)
 */
export interface ProceduralTextureSet {
  castIronBump: THREE.CanvasTexture;
  crosshatchHone: THREE.CanvasTexture;
  machinedSwirl: THREE.CanvasTexture;
  harmonicTimingTape: THREE.CanvasTexture;
  blueprintScaleMap: THREE.CanvasTexture;
  braidedSteelMap: THREE.CanvasTexture;
  studioFloorShadowMap: THREE.CanvasTexture;
  radiatorCoreMap: THREE.CanvasTexture;
  dispose: () => void;
}

export function createProceduralTextureSet(maxAnisotropy: number): ProceduralTextureSet {
  // 1. Sand-cast iron micro-grain bump/roughness map
  const castCanvas = document.createElement('canvas');
  castCanvas.width = 256;
  castCanvas.height = 256;
  const castCtx = castCanvas.getContext('2d')!;
  const imgData = castCtx.createImageData(256, 256);
  for (let i = 0; i < imgData.data.length; i += 4) {
    // Deterministic pseudo-random grain
    const p = i / 4;
    const n = ((Math.sin(p * 12.9898 + 78.233) * 43758.5453) % 1 + 1) % 1;
    const v = Math.floor(110 + n * 70);
    imgData.data[i] = v;
    imgData.data[i + 1] = v;
    imgData.data[i + 2] = v;
    imgData.data[i + 3] = 255;
  }
  castCtx.putImageData(imgData, 0, 0);
  const castIronBump = new THREE.CanvasTexture(castCanvas);
  castIronBump.wrapS = THREE.RepeatWrapping;
  castIronBump.wrapT = THREE.RepeatWrapping;
  castIronBump.repeat.set(4, 4);
  castIronBump.anisotropy = maxAnisotropy;

  // 2. 45-degree cylinder bore plateau crosshatch hone pattern
  const honeCanvas = document.createElement('canvas');
  honeCanvas.width = 256;
  honeCanvas.height = 256;
  const honeCtx = honeCanvas.getContext('2d')!;
  honeCtx.fillStyle = '#64748b';
  honeCtx.fillRect(0, 0, 256, 256);
  honeCtx.strokeStyle = 'rgba(226, 232, 240, 0.35)';
  honeCtx.lineWidth = 1.2;
  for (let i = -256; i < 512; i += 10) {
    honeCtx.beginPath();
    honeCtx.moveTo(i, 0);
    honeCtx.lineTo(i + 256, 256);
    honeCtx.stroke();
    honeCtx.beginPath();
    honeCtx.moveTo(i + 256, 0);
    honeCtx.lineTo(i, 256);
    honeCtx.stroke();
  }
  const crosshatchHone = new THREE.CanvasTexture(honeCanvas);
  crosshatchHone.colorSpace = THREE.SRGBColorSpace;
  crosshatchHone.wrapS = THREE.RepeatWrapping;
  crosshatchHone.wrapT = THREE.RepeatWrapping;
  crosshatchHone.repeat.set(3, 2);
  crosshatchHone.anisotropy = maxAnisotropy;

  // 3. CNC Fly-Cut / Brushed Aluminum Machined Deck Swirl
  const swirlCanvas = document.createElement('canvas');
  swirlCanvas.width = 256;
  swirlCanvas.height = 256;
  const swirlCtx = swirlCanvas.getContext('2d')!;
  swirlCtx.fillStyle = '#cbd5e1';
  swirlCtx.fillRect(0, 0, 256, 256);
  swirlCtx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  swirlCtx.lineWidth = 1;
  for (let y = 0; y < 256; y += 6) {
    swirlCtx.beginPath();
    swirlCtx.arc(128, y, 90, 0, Math.PI, false);
    swirlCtx.stroke();
  }
  const machinedSwirl = new THREE.CanvasTexture(swirlCanvas);
  machinedSwirl.colorSpace = THREE.SRGBColorSpace;
  machinedSwirl.wrapS = THREE.RepeatWrapping;
  machinedSwirl.wrapT = THREE.RepeatWrapping;
  machinedSwirl.repeat.set(2, 2);
  machinedSwirl.anisotropy = maxAnisotropy;

  // 4. SFI Harmonic Balancer Timing Degree Tape (0-50 BTDC / ATDC)
  const tapeCanvas = document.createElement('canvas');
  tapeCanvas.width = 1024;
  tapeCanvas.height = 128;
  const tapeCtx = tapeCanvas.getContext('2d')!;
  tapeCtx.fillStyle = '#0f172a';
  tapeCtx.fillRect(0, 0, 1024, 128);
  tapeCtx.strokeStyle = '#f8fafc';
  tapeCtx.fillStyle = '#f8fafc';
  tapeCtx.font = 'bold 18px monospace';
  tapeCtx.textAlign = 'center';
  for (let deg = 0; deg < 360; deg += 2) {
    const x = (deg / 360) * 1024;
    const isMajor = deg % 10 === 0;
    const isTDC = deg === 0 || deg === 90 || deg === 180 || deg === 270;
    tapeCtx.strokeStyle = isTDC ? '#f97316' : isMajor ? '#38bdf8' : '#94a3b8';
    tapeCtx.lineWidth = isMajor ? 3 : 1.5;
    tapeCtx.beginPath();
    tapeCtx.moveTo(x, 128);
    tapeCtx.lineTo(x, isMajor ? 58 : 88);
    tapeCtx.stroke();
    if (deg <= 50 && deg % 10 === 0) {
      tapeCtx.fillStyle = deg === 0 ? '#f97316' : '#f8fafc';
      tapeCtx.fillText(`${deg}°`, x, 40);
    } else if (deg === 90 || deg === 180 || deg === 270) {
      tapeCtx.fillStyle = '#38bdf8';
      tapeCtx.fillText(`TDC`, x, 40);
    }
  }
  const harmonicTimingTape = new THREE.CanvasTexture(tapeCanvas);
  harmonicTimingTape.colorSpace = THREE.SRGBColorSpace;
  harmonicTimingTape.wrapS = THREE.RepeatWrapping;
  harmonicTimingTape.anisotropy = maxAnisotropy;

  // 5. Technical CAD Floor Stage Reticle & Datum Grid
  const stageCanvas = document.createElement('canvas');
  stageCanvas.width = 512;
  stageCanvas.height = 512;
  const sCtx = stageCanvas.getContext('2d')!;
  sCtx.clearRect(0, 0, 512, 512);
  const grad = sCtx.createRadialGradient(256, 256, 20, 256, 256, 250);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
  grad.addColorStop(0.65, 'rgba(6, 18, 28, 0.35)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  sCtx.fillStyle = grad;
  sCtx.fillRect(0, 0, 512, 512);

  sCtx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
  sCtx.lineWidth = 1.5;
  [120, 185, 240].forEach((r) => {
    sCtx.beginPath();
    sCtx.arc(256, 256, r, 0, Math.PI * 2);
    sCtx.stroke();
  });
  // Degree ticks around outer datum circle
  for (let a = 0; a < 360; a += 15) {
    const rad = (a * Math.PI) / 180;
    const r1 = a % 45 === 0 ? 226 : 233;
    sCtx.beginPath();
    sCtx.moveTo(256 + Math.cos(rad) * r1, 256 + Math.sin(rad) * r1);
    sCtx.lineTo(256 + Math.cos(rad) * 240, 256 + Math.sin(rad) * 240);
    sCtx.stroke();
  }
  const blueprintScaleMap = new THREE.CanvasTexture(stageCanvas);
  blueprintScaleMap.colorSpace = THREE.SRGBColorSpace;
  blueprintScaleMap.anisotropy = maxAnisotropy;

  // 6. Stainless-Steel Braided AN Fuel / High-Voltage Hose Weave
  const braidCanvas = document.createElement('canvas');
  braidCanvas.width = 128;
  braidCanvas.height = 128;
  const bCtx = braidCanvas.getContext('2d')!;
  bCtx.fillStyle = '#475569';
  bCtx.fillRect(0, 0, 128, 128);
  for (let i = -128; i < 256; i += 12) {
    bCtx.strokeStyle = '#e2e8f0';
    bCtx.lineWidth = 4.2;
    bCtx.beginPath();
    bCtx.moveTo(i, 0);
    bCtx.lineTo(i + 128, 128);
    bCtx.stroke();

    bCtx.strokeStyle = '#94a3b8';
    bCtx.lineWidth = 2.6;
    bCtx.beginPath();
    bCtx.moveTo(i + 128, 0);
    bCtx.lineTo(i, 128);
    bCtx.stroke();
  }
  const braidedSteelMap = new THREE.CanvasTexture(braidCanvas);
  braidedSteelMap.colorSpace = THREE.SRGBColorSpace;
  braidedSteelMap.wrapS = THREE.RepeatWrapping;
  braidedSteelMap.wrapT = THREE.RepeatWrapping;
  braidedSteelMap.repeat.set(16, 3);
  braidedSteelMap.anisotropy = maxAnisotropy;

  // 7. Soft Studio Cyclorama Floor Contact Shadow & Clean Showroom Grid
  const studioCanvas = document.createElement('canvas');
  studioCanvas.width = 512;
  studioCanvas.height = 512;
  const stCtx = studioCanvas.getContext('2d')!;
  stCtx.clearRect(0, 0, 512, 512);
  const stGrad = stCtx.createRadialGradient(256, 256, 30, 256, 256, 248);
  stGrad.addColorStop(0, 'rgba(15, 23, 42, 0.24)');
  stGrad.addColorStop(0.55, 'rgba(30, 41, 59, 0.10)');
  stGrad.addColorStop(1, 'rgba(203, 213, 225, 0)');
  stCtx.fillStyle = stGrad;
  stCtx.fillRect(0, 0, 512, 512);

  stCtx.strokeStyle = 'rgba(100, 116, 139, 0.16)';
  stCtx.lineWidth = 1;
  [130, 195, 245].forEach((r) => {
    stCtx.beginPath();
    stCtx.arc(256, 256, r, 0, Math.PI * 2);
    stCtx.stroke();
  });
  const studioFloorShadowMap = new THREE.CanvasTexture(studioCanvas);
  studioFloorShadowMap.colorSpace = THREE.SRGBColorSpace;
  studioFloorShadowMap.anisotropy = maxAnisotropy;

  // 8. TIG-Welded Aluminum Crossflow Radiator Core Fin Louvers
  const radCanvas = document.createElement('canvas');
  radCanvas.width = 256;
  radCanvas.height = 256;
  const rCtx = radCanvas.getContext('2d')!;
  rCtx.fillStyle = '#94a3b8';
  rCtx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 8) {
    rCtx.fillStyle = '#cbd5e1';
    rCtx.fillRect(0, y, 256, 3);
    rCtx.fillStyle = '#334155';
    rCtx.fillRect(0, y + 4, 256, 2);
  }
  rCtx.strokeStyle = 'rgba(51, 65, 85, 0.45)';
  rCtx.lineWidth = 1.2;
  for (let x = 0; x < 256; x += 6) {
    rCtx.beginPath();
    rCtx.moveTo(x, 0);
    rCtx.lineTo(x + 3, 256);
    rCtx.stroke();
  }
  const radiatorCoreMap = new THREE.CanvasTexture(radCanvas);
  radiatorCoreMap.colorSpace = THREE.SRGBColorSpace;
  radiatorCoreMap.wrapS = THREE.RepeatWrapping;
  radiatorCoreMap.wrapT = THREE.RepeatWrapping;
  radiatorCoreMap.repeat.set(3, 3);
  radiatorCoreMap.anisotropy = maxAnisotropy;

  return {
    castIronBump,
    crosshatchHone,
    machinedSwirl,
    harmonicTimingTape,
    blueprintScaleMap,
    braidedSteelMap,
    studioFloorShadowMap,
    radiatorCoreMap,
    dispose: () => {
      castIronBump.dispose();
      crosshatchHone.dispose();
      machinedSwirl.dispose();
      harmonicTimingTape.dispose();
      blueprintScaleMap.dispose();
      braidedSteelMap.dispose();
      studioFloorShadowMap.dispose();
      radiatorCoreMap.dispose();
    }
  };
}

/**
 * Generates an ARP 12-Point Flange Bolt Mesh (performance racing fastener)
 */
export function createARP12PointBolt(
  radius: number,
  shankLength: number,
  mat: THREE.Material
): THREE.Group {
  const g = new THREE.Group();
  const washer = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 1.95, radius * 2.05, radius * 0.28, 18),
    mat
  );
  washer.position.y = -radius * 0.14;
  // 12-point flange head
  const head12 = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 1.45, radius * 1.5, radius * 0.95, 12),
    mat
  );
  head12.position.y = radius * 0.45;
  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 1.15, radius * 1.45, radius * 0.22, 12),
    mat
  );
  collar.position.y = radius * 1.02;
  const shank = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, shankLength, 12),
    mat
  );
  shank.position.y = -shankLength / 2 - radius * 0.28;
  g.add(washer, head12, collar, shank);
  return g;
}

/**
 * Generates an extruded gear or timing sprocket geometry with real involute-style teeth
 */
export function createGearGeometry(
  pitchRadius: number,
  teeth: number,
  thickness: number,
  boreRadius: number,
  toothDepth = 0.14
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const innerR = pitchRadius - toothDepth * 0.55;
  const outerR = pitchRadius + toothDepth * 0.45;
  const step = (Math.PI * 2) / teeth;

  for (let i = 0; i < teeth; i++) {
    const a0 = i * step;
    const a1 = a0 + step * 0.22;
    const a2 = a0 + step * 0.34;
    const a3 = a0 + step * 0.62;
    const a4 = a0 + step * 0.74;

    if (i === 0) {
      shape.moveTo(Math.cos(a0) * innerR, Math.sin(a0) * innerR);
    } else {
      shape.lineTo(Math.cos(a0) * innerR, Math.sin(a0) * innerR);
    }
    shape.lineTo(Math.cos(a1) * innerR, Math.sin(a1) * innerR);
    shape.lineTo(Math.cos(a2) * outerR, Math.sin(a2) * outerR);
    shape.lineTo(Math.cos(a3) * outerR, Math.sin(a3) * outerR);
    shape.lineTo(Math.cos(a4) * innerR, Math.sin(a4) * innerR);
  }
  shape.closePath();

  if (boreRadius > 0.05) {
    const hole = new THREE.Path();
    hole.absarc(0, 0, boreRadius, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: Math.min(0.03, thickness * 0.12),
    bevelSize: Math.min(0.025, toothDepth * 0.2),
    bevelSegments: 2,
    curveSegments: 16
  });
  geo.center();
  return geo;
}

/**
 * Generates an extruded cam lobe profile (base circle + symmetric nose lift)
 */
export function createCamLobeGeometry(
  baseRadius: number,
  lift: number,
  thickness: number
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const segments = 36;
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    // Nose centered at +Y (theta = PI/2) with smooth cosine ramp over ~130 deg duration
    const angleDiff = Math.atan2(Math.sin(theta - Math.PI / 2), Math.cos(theta - Math.PI / 2));
    const rampHalf = 1.12;
    let r = baseRadius;
    if (Math.abs(angleDiff) < rampHalf) {
      const t = Math.cos((angleDiff / rampHalf) * (Math.PI / 2));
      r += lift * t * t;
    }
    const x = Math.cos(theta) * r;
    const y = Math.sin(theta) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.02,
    bevelSegments: 2
  });
  geo.center();
  return geo;
}

/**
 * Generates a teardrop / knife-edged 4340 forged crankshaft counterweight
 */
export function createCounterweightGeometry(
  radius: number,
  thickness: number
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-radius * 0.42, 0.25);
  shape.quadraticCurveTo(-radius * 0.95, -0.35, -radius * 0.72, -radius * 0.85);
  shape.quadraticCurveTo(0, -radius * 1.18, radius * 0.72, -radius * 0.85);
  shape.quadraticCurveTo(radius * 0.95, -0.35, radius * 0.42, 0.25);
  shape.quadraticCurveTo(0, 0.55, -radius * 0.42, 0.25);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.05,
    bevelSegments: 2
  });
  geo.translate(0, 0, -thickness / 2);
  return geo;
}

/**
 * Generates a true helical coil valve spring using TubeGeometry
 */
export function createHelicalSpringGeometry(
  coilRadius: number,
  wireRadius: number,
  height: number,
  turns: number
): THREE.TubeGeometry {
  const points: THREE.Vector3[] = [];
  const steps = turns * 14;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * turns * Math.PI * 2;
    // Closed end coils at bottom and top
    let yNorm = t;
    if (t < 0.08) yNorm = t * 0.4;
    else if (t > 0.92) yNorm = 1 - (1 - t) * 0.4;
    else yNorm = 0.032 + ((t - 0.08) / 0.84) * 0.936;

    points.push(
      new THREE.Vector3(
        Math.cos(angle) * coilRadius,
        (yNorm - 0.5) * height,
        Math.sin(angle) * coilRadius
      )
    );
  }
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, steps, wireRadius, 8, false);
}

/**
 * Generates a 4340 Forged H-Beam Connecting Rod with machined beam pocket,
 * bronze wrist pin eye, and split 2-bolt big-end cap.
 */
export function createHBeamConnectingRod(
  centerToCenter: number,
  bigEndRadius: number,
  smallEndRadius: number,
  rodMat: THREE.Material,
  bronzeMat: THREE.Material,
  boltMat: THREE.Material
): THREE.Group {
  const rodGroup = new THREE.Group();

  // Origin (0,0,0) = Big-End Crankpin Center; Small-End Wrist Pin Center = (0, centerToCenter, 0)
  // 1. Forged H-Beam Shank Flanges + Recessed Web
  const beamLen = Math.max(0.6, centerToCenter - bigEndRadius * 0.7 - smallEndRadius * 0.7);
  const beamMidY = bigEndRadius * 0.7 + beamLen / 2;

  const web = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, beamLen, 0.14),
    rodMat
  );
  web.position.y = beamMidY;
  rodGroup.add(web);

  // Left & Right H-beam structural flanges
  [-0.14, 0.14].forEach((xOff) => {
    const flange = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, beamLen, 0.34),
      rodMat
    );
    flange.position.set(xOff, beamMidY, 0);
    rodGroup.add(flange);
  });

  // 2. Small-End Eye & Bronze Bushing
  const smallEnd = new THREE.Mesh(
    new THREE.CylinderGeometry(smallEndRadius * 1.45, smallEndRadius * 1.45, 0.42, 20),
    rodMat
  );
  smallEnd.rotation.x = Math.PI / 2;
  smallEnd.position.y = centerToCenter;
  rodGroup.add(smallEnd);

  const bushing = new THREE.Mesh(
    new THREE.CylinderGeometry(smallEndRadius * 1.05, smallEndRadius * 1.05, 0.44, 16, 1, true),
    bronzeMat
  );
  bushing.rotation.x = Math.PI / 2;
  bushing.position.y = centerToCenter;
  rodGroup.add(bushing);

  // 3. Big-End Housing + Split Cap
  const bigHousing = new THREE.Mesh(
    new THREE.CylinderGeometry(bigEndRadius * 1.42, bigEndRadius * 1.42, 0.46, 24, 1, false, -Math.PI * 0.1, Math.PI * 1.2),
    rodMat
  );
  bigHousing.rotation.x = Math.PI / 2;
  bigHousing.rotation.y = Math.PI * 0.4;
  rodGroup.add(bigHousing);

  const bigCap = new THREE.Mesh(
    new THREE.CylinderGeometry(bigEndRadius * 1.42, bigEndRadius * 1.42, 0.46, 24),
    rodMat
  );
  bigCap.rotation.x = Math.PI / 2;
  rodGroup.add(bigCap);

  // Bolt bosses + Twin ARP 12-pt cap screws
  [-bigEndRadius * 1.32, bigEndRadius * 1.32].forEach((xOff) => {
    const boss = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.56, 0.42), rodMat);
    boss.position.set(xOff, -0.05, 0);
    rodGroup.add(boss);

    const bolt = createARP12PointBolt(0.065, 0.52, boltMat);
    bolt.position.set(xOff, -0.34, 0);
    bolt.rotation.x = Math.PI;
    rodGroup.add(bolt);
  });

  return rodGroup;
}

/**
 * Generates an SBC 90-degree V8 cast-iron block cross-section extruded along Z
 */
export function createV8BlockProfileGeometry(lengthZ: number): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  // Cross-section in XY plane (90-degree V banks + deep skirt oil pan rail)
  shape.moveTo(-2.7, -2.55); // Left pan rail
  shape.lineTo(2.7, -2.55);  // Right pan rail
  shape.lineTo(3.1, -1.3);
  shape.lineTo(4.25, 0.25);  // Right bank lower water jacket
  shape.lineTo(2.15, 2.35);  // Right cylinder deck outer edge
  shape.lineTo(0.85, 1.45);  // Lifter valley right edge
  shape.lineTo(-0.85, 1.45); // Lifter valley left edge
  shape.lineTo(-2.15, 2.35); // Left cylinder deck outer edge
  shape.lineTo(-4.25, 0.25); // Left bank lower water jacket
  shape.lineTo(-3.1, -1.3);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: lengthZ,
    bevelEnabled: true,
    bevelThickness: 0.12,
    bevelSize: 0.1,
    bevelSegments: 2
  });
  geo.translate(0, 0, -lengthZ / 2);
  return geo;
}

/**
 * Generates an extruded Billet Roller Rocker Arm with fulcrum & roller tip
 */
export function createRollerRockerGroup(
  bodyMat: THREE.Material,
  steelMat: THREE.Material
): THREE.Group {
  const g = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(-0.45, -0.14);
  shape.lineTo(0.45, -0.1);
  shape.lineTo(0.52, 0.08);
  shape.lineTo(0.1, 0.18);
  shape.lineTo(-0.38, 0.14);
  shape.closePath();

  const bodyGeo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.28,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.025,
    bevelSegments: 2
  });
  bodyGeo.translate(0, 0, -0.14);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  g.add(body);

  // Fulcrum trunnion + polylock nut
  const trunnion = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.36, 12), steelMat);
  trunnion.rotation.x = Math.PI / 2;
  g.add(trunnion);

  const polylock = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.22, 6), steelMat);
  polylock.position.y = 0.22;
  g.add(polylock);

  // Roller tip wheel
  const rollerTip = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.24, 14), steelMat);
  rollerTip.rotation.x = Math.PI / 2;
  rollerTip.position.set(0.46, -0.05, 0);
  g.add(rollerTip);

  return g;
}

/**
 * Adds crisp technical CAD EdgesGeometry linework to a mesh or group for
 * Technical Drawing / Blueprint rendering mode.
 */
export function applyTechnicalEdges(
  root: THREE.Object3D,
  lineMaterial: THREE.LineBasicMaterial,
  thresholdAngle = 22
): THREE.LineSegments[] {
  const created: THREE.LineSegments[] = [];
  root.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      // Skip tiny/high-poly tubes like helical springs or wires to keep drawing clean
      const vertexCount = child.geometry.attributes.position?.count || 0;
      if (vertexCount > 2400) return;
      const edges = new THREE.EdgesGeometry(child.geometry, thresholdAngle);
      const lines = new THREE.LineSegments(edges, lineMaterial);
      lines.raycast = () => {}; // Never intercept CAD pointer raycasts
      child.add(lines);
      created.push(lines);
    }
  });
  return created;
}

/**
 * Generates a CNC-machined 60-2 Crankshaft Reluctor Trigger Wheel
 * (60 tooth positions around circumference with 2 consecutive teeth omitted at TDC index)
 */
export function createCrankTriggerWheelGeometry(
  pitchRadius: number,
  totalTeeth = 60,
  missingTeeth = 2,
  thickness = 0.22,
  boreRadius = 0.68
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const innerR = pitchRadius - 0.11;
  const outerR = pitchRadius + 0.09;
  const step = (Math.PI * 2) / totalTeeth;

  for (let i = 0; i < totalTeeth; i++) {
    const a0 = i * step;
    const a1 = a0 + step * 0.24;
    const a2 = a0 + step * 0.34;
    const a3 = a0 + step * 0.66;
    const a4 = a0 + step * 0.76;
    const isGap = i >= totalTeeth - missingTeeth;
    const tipR = isGap ? innerR : outerR;

    if (i === 0) {
      shape.moveTo(Math.cos(a0) * innerR, Math.sin(a0) * innerR);
    } else {
      shape.lineTo(Math.cos(a0) * innerR, Math.sin(a0) * innerR);
    }
    shape.lineTo(Math.cos(a1) * innerR, Math.sin(a1) * innerR);
    shape.lineTo(Math.cos(a2) * tipR, Math.sin(a2) * tipR);
    shape.lineTo(Math.cos(a3) * tipR, Math.sin(a3) * tipR);
    shape.lineTo(Math.cos(a4) * innerR, Math.sin(a4) * innerR);
  }
  shape.closePath();

  const hole = new THREE.Path();
  hole.absarc(0, 0, boreRadius, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  // 4 lightening / mounting pockets
  for (let w = 0; w < 4; w++) {
    const ang = (w / 4) * Math.PI * 2 + Math.PI / 4;
    const wHole = new THREE.Path();
    const midR = (boreRadius + innerR) * 0.52;
    wHole.absarc(Math.cos(ang) * midR, Math.sin(ang) * midR, (innerR - boreRadius) * 0.22, 0, Math.PI * 2, true);
    shape.holes.push(wHole);
  }

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.015,
    bevelSegments: 1,
    curveSegments: 16
  });
  geo.center();
  return geo;
}

/**
 * Generates a Heavy-Duty Vented High-Output Alternator / Generator with exposed
 * copper stator windings, slotted aluminum cooling frame, rear rectifier,
 * cooling fan, pulley, and CNC slotted billet bracket.
 */
export function createVentedAlternatorGroup(
  housingMat: THREE.Material,
  copperMat: THREE.Material,
  pulleyMat: THREE.Material,
  darkMat: THREE.Material,
  redMat: THREE.Material,
  boltMat: THREE.Material
): THREE.Group {
  const g = new THREE.Group();

  // Exposed Copper Stator Core & Winding Stack (visible through case cooling slots)
  const statorCore = new THREE.Mesh(
    new THREE.CylinderGeometry(1.16, 1.16, 0.72, 24),
    copperMat
  );
  statorCore.rotation.x = Math.PI / 2;
  g.add(statorCore);

  // Individual radial copper coil bridges along stator perimeter
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    const coilSeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.14, 0.86),
      copperMat
    );
    coilSeg.position.set(Math.cos(a) * 1.12, Math.sin(a) * 1.12, 0);
    coilSeg.rotation.z = a;
    g.add(coilSeg);
  }

  // Front & Rear Slotted Cast Aluminum Frame Shells
  const frontShell = new THREE.Mesh(
    new THREE.CylinderGeometry(1.32, 1.38, 0.62, 24),
    housingMat
  );
  frontShell.rotation.x = Math.PI / 2;
  frontShell.position.z = 0.56;
  g.add(frontShell);

  const rearShell = new THREE.Mesh(
    new THREE.CylinderGeometry(1.34, 1.24, 0.56, 24),
    housingMat
  );
  rearShell.rotation.x = Math.PI / 2;
  rearShell.position.z = -0.54;
  g.add(rearShell);

  // 8 Structural Aluminum Tie-Struts & Through-Bolts bridging front & rear shells
  for (let s = 0; s < 8; s++) {
    const a = (s / 8) * Math.PI * 2;
    const strut = new THREE.Mesh(
      new THREE.BoxGeometry(0.20, 0.24, 1.45),
      housingMat
    );
    strut.position.set(Math.cos(a) * 1.28, Math.sin(a) * 1.28, 0.02);
    strut.rotation.z = a;
    g.add(strut);
  }

  // Mounting Ear Bosses (top & bottom pivot)
  const topEar = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.55, 0.9), housingMat);
  topEar.position.set(-0.85, 1.38, 0.15);
  const botEar = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.55, 0.9), housingMat);
  botEar.position.set(-0.85, -1.38, 0.15);
  g.add(topEar, botEar);

  // Internal Cooling Fan behind nose pulley
  for (let f = 0; f < 10; f++) {
    const a = (f / 10) * Math.PI * 2;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.14), pulleyMat);
    blade.position.set(Math.cos(a) * 0.72, Math.sin(a) * 0.72, 0.95);
    blade.rotation.z = a + 0.35;
    g.add(blade);
  }

  // Front Multi-Rib Pulley + Center Nut
  const pulley = new THREE.Mesh(
    new THREE.CylinderGeometry(0.66, 0.66, 0.46, 22),
    pulleyMat
  );
  pulley.rotation.x = Math.PI / 2;
  pulley.position.z = 1.22;
  g.add(pulley);

  const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.22, 6), boltMat);
  nut.rotation.x = Math.PI / 2;
  nut.position.z = 1.48;
  g.add(nut);

  // Rear Black Brush Regulator Housing + Red Insulated B+ Terminal Stud
  const rearCap = new THREE.Mesh(
    new THREE.CylinderGeometry(1.08, 1.15, 0.38, 20),
    darkMat
  );
  rearCap.rotation.x = Math.PI / 2;
  rearCap.position.z = -0.96;
  g.add(rearCap);

  const bPlusBoot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.36, 12), redMat);
  bPlusBoot.rotation.x = Math.PI / 2;
  bPlusBoot.position.set(0.62, 0.45, -1.16);
  g.add(bPlusBoot);

  return g;
}

/**
 * Generates anSBC Deep-Sump Oil Pan, Gasket Rail, Perimeter Bolts, Drain Plug & Dipstick Tube
 */
export function createDetailedOilPanGroup(
  panMat: THREE.Material,
  gasketMat: THREE.Material,
  boltMat: THREE.Material,
  brassMat: THREE.Material,
  chromeMat: THREE.Material,
  handleMat: THREE.Material
): THREE.Group {
  const g = new THREE.Group();

  // Oil pan perimeter rail flange (at y = -2.75)
  const flange = new THREE.Mesh(new THREE.BoxGeometry(5.65, 0.14, 11.65), panMat);
  flange.position.set(0, -2.78, 0);
  g.add(flange);

  const gasket = new THREE.Mesh(new THREE.BoxGeometry(5.72, 0.06, 11.72), gasketMat);
  gasket.position.set(0, -2.69, 0);
  g.add(gasket);

  // Contoured stepped sump shell (shallow front clearing steering linkage, deep rear sump)
  const frontShallow = new THREE.Mesh(new THREE.BoxGeometry(4.65, 0.95, 5.4), panMat);
  frontShallow.position.set(0, -3.28, 2.85);
  g.add(frontShallow);

  const deepSump = new THREE.Mesh(new THREE.BoxGeometry(4.85, 2.25, 6.2), panMat);
  deepSump.position.set(0, -3.92, -2.45);
  g.add(deepSump);

  // Sump floor cooling fins (3 longitudinal ribs)
  [-1.3, 0, 1.3].forEach((rx) => {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 5.8), chromeMat);
    fin.position.set(rx, -5.06, -2.45);
    g.add(fin);
  });

  // Brass Magnetic Oil Drain Plug
  const drainPlug = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.24, 6), brassMat);
  drainPlug.rotation.x = Math.PI / 2;
  drainPlug.position.set(0.85, -4.75, -5.58);
  g.add(drainPlug);

  // 16 Pan Rail Bolts (8 per side)
  [-2.62, 2.62].forEach((bx) => {
    for (let i = 0; i < 8; i++) {
      const bz = -5.1 + i * 1.45;
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.22, 6), boltMat);
      b.position.set(bx, -2.92, bz);
      g.add(b);
    }
  });

  // Curved Chrome Engine Oil Dipstick Tube + Billet Handle (Driver Side)
  const dipCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.65, -2.95, -2.2),
    new THREE.Vector3(-3.35, -1.85, -2.0),
    new THREE.Vector3(-3.85, 0.45, -1.6),
    new THREE.Vector3(-3.95, 2.55, -1.2)
  ]);
  const dipTube = new THREE.Mesh(new THREE.TubeGeometry(dipCurve, 18, 0.085, 8, false), chromeMat);
  g.add(dipTube);

  const dipHandle = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.065, 8, 16), handleMat);
  dipHandle.position.set(-3.95, 2.78, -1.16);
  g.add(dipHandle);

  return g;
}

/**
 * Generates Contoured Aluminum Front Timing Chain Cover + Crank Seal + Timing Pointer Tab
 */
export function createTimingCoverGroup(
  alumMat: THREE.Material,
  sealMat: THREE.Material,
  boltMat: THREE.Material,
  pointerMat: THREE.Material
): THREE.Group {
  const g = new THREE.Group();

  const coverShape = new THREE.Shape();
  coverShape.moveTo(-2.35, -2.65);
  coverShape.lineTo(2.35, -2.65);
  coverShape.lineTo(2.55, -1.0);
  coverShape.lineTo(1.75, 2.45);
  coverShape.quadraticCurveTo(0, 2.95, -1.75, 2.45);
  coverShape.lineTo(-2.55, -1.0);
  coverShape.closePath();

  const coverGeo = new THREE.ExtrudeGeometry(coverShape, {
    depth: 0.42,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.05,
    bevelSegments: 2
  });
  coverGeo.translate(0, 0, -0.21);
  const coverMesh = new THREE.Mesh(coverGeo, alumMat);
  g.add(coverMesh);

  // Raised cam gear clearance dome
  const camDome = new THREE.Mesh(
    new THREE.CylinderGeometry(1.58, 1.72, 0.35, 24),
    alumMat
  );
  camDome.rotation.x = Math.PI / 2;
  camDome.position.set(0, 1.05, 0.25);
  g.add(camDome);

  // Front Crankshaft Harmonic Balancer Seal Housing + Lip Seal
  const sealBoss = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 1.05, 0.45, 22),
    alumMat
  );
  sealBoss.rotation.x = Math.PI / 2;
  sealBoss.position.set(0, -1.0, 0.25);
  g.add(sealBoss);

  const lipSeal = new THREE.Mesh(
    new THREE.TorusGeometry(0.68, 0.11, 10, 24),
    sealMat
  );
  lipSeal.position.set(0, -1.0, 0.46);
  g.add(lipSeal);

  // Billet TDC Timing Pointer Tab pointing toward ATI Damper Degree Tape
  const pointer = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.16, 0.55), pointerMat);
  pointer.position.set(-1.35, 0.22, 0.65);
  pointer.rotation.z = -0.52;
  g.add(pointer);

  // 10 Perimeter Fasteners
  const boltCoords: Array<[number, number]> = [
    [-2.05, -2.3], [0, -2.42], [2.05, -2.3],
    [-2.25, -0.9], [2.25, -0.9],
    [-1.85, 0.75], [1.85, 0.75],
    [-1.45, 2.25], [0, 2.55], [1.45, 2.25]
  ];
  boltCoords.forEach(([bx, by]) => {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.56, 6), boltMat);
    b.rotation.x = Math.PI / 2;
    b.position.set(bx, by, 0.12);
    g.add(b);
  });

  return g;
}

/**
 * Generates Top-Mounted Intake & Exhaust Billet Solenoid Valve Actuators + Clear Waterproof Connectors + High-Voltage Braided Rail
 */
export function createSolenoidActuatorBank(
  side: number,
  billetMat: THREE.Material,
  copperMat: THREE.Material,
  clearConnMat: THREE.Material,
  braidedMat: THREE.Material,
  darkMat: THREE.Material
): THREE.Group {
  const g = new THREE.Group();
  const zPositions = [-3.9, -1.3, 1.3, 3.9].map((z) => z + (side === 1 ? 0.22 : -0.22));

  // Two rows per head: Intake Solenoids (inner x = -side*0.58) & Exhaust Solenoids (outer x = side*0.58)
  [-side * 0.58, side * 0.58].forEach((rowX, rIdx) => {
    const railPts: THREE.Vector3[] = [];
    zPositions.forEach((zPos, cIdx) => {
      const actuator = new THREE.Group();
      actuator.position.set(rowX, 2.65, zPos);

      // CNC Billet Cylindrical Solenoid Canister
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.36, 0.36, 0.85, 18),
        billetMat
      );
      actuator.add(body);

      // Machined Copper Internal Coil Collar Ring
      const copperBand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.375, 0.375, 0.14, 18),
        copperMat
      );
      copperBand.position.y = -0.18;
      actuator.add(copperBand);

      // Stepped Billet Top Cap + Mounting Base
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.36, 0.16, 18),
        billetMat
      );
      cap.position.y = 0.48;
      actuator.add(cap);

      const baseFlange = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.44, 0.12, 16),
        darkMat
      );
      baseFlange.position.y = -0.44;
      actuator.add(baseFlange);

      // Clear Waterproof Deutsch Connector & Individual Control Leads
      const conn = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.22, 0.30),
        clearConnMat
      );
      conn.position.set(-side * 0.32, 0.25, 0);
      actuator.add(conn);

      actuator.userData = {
        name: `${rIdx === 0 ? 'Intake' : 'Exhaust'} Solenoid Valve Actuator #${cIdx + 1} (${side === 1 ? 'Right' : 'Left'})`,
        category: 'Electromagnetic Valvetrain',
        desc: 'CNC billet free-valve linear electromagnetic solenoid actuator with pneumatic cushioning & waterproof Deutsch plug.',
        partNumber: rIdx === 0 ? 'FV-INT-800' : 'FV-EXH-800'
      };
      g.add(actuator);
      railPts.push(new THREE.Vector3(rowX - side * 0.34, 2.92, zPos));
    });

    // High-Voltage Braided Rail connecting all 4 actuators in this row
    const hvCurve = new THREE.CatmullRomCurve3(railPts);
    const hvRail = new THREE.Mesh(
      new THREE.TubeGeometry(hvCurve, 24, 0.085, 8, false),
      braidedMat
    );
    hvRail.userData = {
      name: `High-Voltage Braided Actuator Rail (${rIdx === 0 ? 'Intake' : 'Exhaust'})`,
      category: 'Electromagnetic Valvetrain',
      desc: 'Shielded stainless-braided 48V high-current solenoid bus harness.'
    };
    g.add(hvRail);
  });

  return g;
}

/**
 * Generates Grounded Hot-Rod Boxed Chassis Frame Rails, Urethane Motor Mounts,
 * Aluminum Crossflow Radiator, Coolant Hoses, and Rear Wiring Bulkhead.
 */
export function createChassisAndRadiatorGroup(
  chassisMat: THREE.Material,
  alumMat: THREE.Material,
  radiatorMat: THREE.Material,
  hoseMat: THREE.Material,
  redMat: THREE.Material,
  blueMat: THREE.Material,
  chromeMat: THREE.Material
): THREE.Group {
  const g = new THREE.Group();

  // 1. Boxed Steel Hot-Rod Chassis Frame Rails (Left & Right)
  [-4.65, 4.65].forEach((rx) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.72, 22.0), chassisMat);
    rail.position.set(rx, -2.55, 1.2);
    rail.castShadow = true;
    rail.receiveShadow = true;
    rail.userData = {
      name: 'Hot-Rod Boxed Steel Chassis Frame Rail',
      category: 'Chassis & Mounts',
      desc: 'TIG-welded 2"×4" boxed 1018 steel frame rail with polyurethane engine mount pedestals.'
    };
    g.add(rail);

    // Side Motor Mount Pedestal + Urethane Cushion Pad bolted cleanly to SBC 3-bolt side boss
    const pedestal = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.48, 1.15), chassisMat);
    pedestal.position.set(rx * 0.78, -2.05, 0.55);
    pedestal.rotation.z = rx > 0 ? -0.32 : 0.32;
    g.add(pedestal);

    const mountPad = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.56, 0.92), redMat);
    mountPad.position.set(rx * 0.64, -1.65, 0.55);
    mountPad.userData = {
      name: 'Energy Suspension Polyurethane Motor Mount',
      category: 'Chassis & Mounts',
      desc: 'Interlocking safety polyurethane SBC 3-bolt side engine mount.'
    };
    g.add(mountPad);
  });

  // 2. Tubular Front Crossmember & Rear Transmission Crossmember
  const frontCross = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 9.4, 16), chromeMat);
  frontCross.rotation.z = Math.PI / 2;
  frontCross.position.set(0, -2.65, 9.8);
  g.add(frontCross);

  const rearCross = new THREE.Mesh(new THREE.BoxGeometry(9.3, 0.38, 0.65), chassisMat);
  rearCross.position.set(0, -2.75, -7.8);
  g.add(rearCross);

  // 3. TIG-Welded Aluminum Crossflow Radiator (Front Core + Billet End Tanks + Cap)
  const radGroup = new THREE.Group();
  radGroup.position.set(0, 0.85, 10.65);

  const core = new THREE.Mesh(new THREE.BoxGeometry(6.8, 5.1, 0.68), radiatorMat);
  core.userData = {
    name: 'Griffin 2-Row Aluminum Crossflow Radiator',
    category: 'Cooling System',
    desc: 'TIG-welded 1.25" dual-tube aluminum crossflow radiator rated to 700 HP.'
  };
  radGroup.add(core);

  [-3.68, 3.68].forEach((tx) => {
    const tank = new THREE.Mesh(new THREE.BoxGeometry(0.62, 5.35, 0.95), alumMat);
    tank.position.x = tx;
    radGroup.add(tank);
  });
  const radCap = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.34, 0.24, 16), chromeMat);
  radCap.position.set(3.68, 2.78, 0);
  radGroup.add(radCap);

  // Upper & Lower Molded Coolant Hoses connecting Radiator to Water Neck & Water Pump
  const upperHoseCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 4.15, 4.45),
    new THREE.Vector3(1.15, 4.35, 6.8),
    new THREE.Vector3(2.85, 3.45, 9.4),
    new THREE.Vector3(3.45, 2.45, 10.25)
  ]);
  const upperHose = new THREE.Mesh(new THREE.TubeGeometry(upperHoseCurve, 22, 0.26, 12, false), hoseMat);
  g.add(upperHose);

  const lowerHoseCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.95, 0.85, 6.3),
    new THREE.Vector3(-2.45, -0.45, 8.1),
    new THREE.Vector3(-3.45, -1.15, 10.25)
  ]);
  const lowerHose = new THREE.Mesh(new THREE.TubeGeometry(lowerHoseCurve, 20, 0.28, 12, false), hoseMat);
  g.add(lowerHose);

  g.add(radGroup);

  // 4. Firewall Harness Bulkhead & AN-8 Fuel Feed Pass-Through Fittings
  const bulkheadBar = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.42, 0.28), alumMat);
  bulkheadBar.position.set(0, 3.15, -7.2);
  g.add(bulkheadBar);

  [-1.25, 1.25].forEach((ax, idx) => {
    const anBulk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.45, 6),
      idx === 0 ? redMat : blueMat
    );
    anBulk.rotation.x = Math.PI / 2;
    anBulk.position.set(ax, 3.15, -7.0);
    g.add(anBulk);
  });

  // 5. Dual Rear Wiring Harness Loom sweeping into valley
  [-0.85, 0.85].forEach((hx) => {
    const loomCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(hx * 0.7, 3.15, -7.0),
      new THREE.Vector3(hx, 3.25, -5.6),
      new THREE.Vector3(hx, 2.85, -3.5)
    ]);
    const loom = new THREE.Mesh(new THREE.TubeGeometry(loomCurve, 14, 0.13, 8, false), hoseMat);
    loom.userData = {
      name: 'Mil-Spec Braided Engine Wiring Harness',
      category: 'Electrical',
      desc: 'Tefzel-jacketed Deutsch-terminated harness connecting ECU, coils, injectors, and Hall sensor.'
    };
    g.add(loom);
  });

  return g;
}

/**
 * Generates a Hollow Finned Racing Aluminum Valve Cover (U-channel shell so cutaways
 * accurately reveal the valvetrain, blue stud girdle, and springs inside).
 */
export function createHollowValveCoverGroup(
  side: number,
  bodyMat: THREE.Material,
  finMat: THREE.Material,
  boltMat: THREE.Material,
  breatherMat: THREE.Material
): THREE.Group {
  const g = new THREE.Group();

  // Hollow U-channel profile in XY plane (bottom sits at y = 1.10, top at y = 2.42)
  const vcShape = new THREE.Shape();
  vcShape.moveTo(-1.18, 1.10);
  vcShape.lineTo(-1.18, 2.25);
  vcShape.lineTo(-0.85, 2.42);
  vcShape.lineTo(0.85, 2.42);
  vcShape.lineTo(1.18, 2.25);
  vcShape.lineTo(1.18, 1.10);
  vcShape.lineTo(1.04, 1.10);
  vcShape.lineTo(1.04, 2.18);
  vcShape.lineTo(0.78, 2.28);
  vcShape.lineTo(-0.78, 2.28);
  vcShape.lineTo(-1.04, 2.18);
  vcShape.lineTo(-1.04, 1.10);
  vcShape.closePath();

  const shellGeo = new THREE.ExtrudeGeometry(vcShape, {
    depth: 10.9,
    bevelEnabled: false
  });
  shellGeo.translate(0, 0, -5.45);
  const shell = new THREE.Mesh(shellGeo, bodyMat);
  g.add(shell);

  // Front & Rear End Caps closing the hollow valve cover
  [-5.42, 5.42].forEach((ez) => {
    const cap = new THREE.Mesh(new THREE.BoxGeometry(2.28, 1.24, 0.14), bodyMat);
    cap.position.set(0, 1.74, ez);
    g.add(cap);
  });

  // Top Cooling Fins along Valve Cover Roof
  [-0.56, -0.28, 0, 0.28, 0.56].forEach((fx) => {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 10.4), finMat);
    fin.position.set(fx, 2.48, 0);
    g.add(fin);
  });

  // 8 Perimeter Valve Cover Mounting Bolts
  for (let vb = 0; vb < 4; vb++) {
    const vbZ = -4.35 + vb * 2.9;
    [-1.11, 1.11].forEach((vx) => {
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.25, 6), boltMat);
      bolt.position.set(vx, 1.16, vbZ);
      g.add(bolt);
    });
  }

  // Billet Breather / Oil Fill Cap on Top
  const breather = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.36, 0.45, 16),
    breatherMat
  );
  breather.position.set(0, 2.66, side === 1 ? 4.1 : -4.1);
  g.add(breather);

  return g;
}

/**
 * Generates an Anodized Blue Billet Stud Girdle / Shaft Rocker Bar
 * spanning all 8 rocker pivots along the cylinder head.
 */
export function createStudGirdleBarGroup(
  barMat: THREE.Material,
  nutMat: THREE.Material
): THREE.Group {
  const g = new THREE.Group();
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.32, 9.8), barMat);
  g.add(bar);

  // 8 Billet Polylock Adjuster Nuts seated through top of stud girdle
  const zVals = [-4.25, -3.55, -1.65, -0.95, 0.95, 1.65, 3.55, 4.25];
  zVals.forEach((vz) => {
    const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.46, 6), nutMat);
    nut.position.set(0, 0.08, vz);
    g.add(nut);
  });
  return g;
}

/**
 * Generates an Authentic Holley 4150 Double-Pumper 4-Barrel Carburetor
 * with 1" Billet Carb Spacer, 4 Venturis, Dual Metering Blocks, Front & Rear Fuel Bowls,
 * Dual-Feed Braided Fuel Line, and Inline Fuel Pressure Gauge.
 */
export function createHolley4150CarburetorGroup(
  goldZincMat: THREE.Material,
  alumMat: THREE.Material,
  darkMat: THREE.Material,
  brassMat: THREE.Material,
  redMat: THREE.Material,
  blueMat: THREE.Material,
  braidedMat: THREE.Material
): THREE.Group {
  const g = new THREE.Group();

  // 1" CNC Billet Open 4-Hole Carburetor Spacer + Base Gasket
  const spacer = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.36, 2.15), alumMat);
  spacer.position.y = -0.68;
  g.add(spacer);

  // Throttle Base Plate & Linkage Arm
  const basePlate = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.24, 2.18), darkMat);
  basePlate.position.y = -0.38;
  g.add(basePlate);

  const throttleLever = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.65, 0.42), goldZincMat);
  throttleLever.position.set(-1.12, -0.35, -0.15);
  g.add(throttleLever);

  // Dichromate Main Carburetor Body + Choke Air Horn
  const mainBody = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.96, 1.72), goldZincMat);
  mainBody.position.y = 0.22;
  g.add(mainBody);

  const airHorn = new THREE.Mesh(
    new THREE.CylinderGeometry(1.04, 1.12, 0.42, 24),
    alumMat
  );
  airHorn.position.y = 0.88;
  g.add(airHorn);

  // 4 Internal Venturi Barrels visible from above
  [-0.38, 0.38].forEach((vx) => {
    [-0.36, 0.36].forEach((vz) => {
      const venturi = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.28, 0.16, 16),
        darkMat
      );
      venturi.position.set(vx, 1.04, vz);
      g.add(venturi);
    });
  });

  // Front & Rear Metering Blocks + Center-Hung Fuel Bowls + Brass Sight Plugs
  [-1.02, 1.02].forEach((mz) => {
    const metering = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.88, 0.28), alumMat);
    metering.position.set(0, 0.18, mz);
    g.add(metering);
  });

  [-1.46, 1.46].forEach((bz, idx) => {
    const bowl = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.86, 0.62), goldZincMat);
    bowl.position.set(0, 0.14, bz);
    g.add(bowl);

    // Brass fuel level sight plug
    const sightPlug = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.12, 6), brassMat);
    sightPlug.rotation.z = Math.PI / 2;
    sightPlug.position.set(-0.84, 0.18, bz);
    g.add(sightPlug);

    // Red/Blue -6 AN Dual-Feed Inlet Fitting on Passenger Side of Each Bowl
    const anInlet = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 0.34, 6),
      idx === 0 ? redMat : blueMat
    );
    anInlet.rotation.z = Math.PI / 2;
    anInlet.position.set(0.95, 0.26, bz);
    g.add(anInlet);
  });

  // Braided Dual-Feed Fuel Log linking Front & Rear Bowls + Inline Pressure Gauge
  const logCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.12, 0.26, -1.46),
    new THREE.Vector3(1.22, 0.26, 0),
    new THREE.Vector3(1.12, 0.26, 1.46)
  ]);
  const fuelLog = new THREE.Mesh(new THREE.TubeGeometry(logCurve, 16, 0.085, 8, false), braidedMat);
  g.add(fuelLog);

  const gaugeBody = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.16, 18), alumMat);
  gaugeBody.rotation.z = Math.PI / 2;
  gaugeBody.position.set(1.36, 0.36, 0);
  g.add(gaugeBody);

  return g;
}

/**
 * Generates a Tubular Chrome/Steel Shop Engine Display & Dyno Cradle Stand
 * resting cleanly on the studio floor (y = -5.78) and bolting to SBC side motor mount bosses.
 */
export function createEngineTestStandGroup(
  tubeMat: THREE.Material,
  bracketMat: THREE.Material,
  wheelMat: THREE.Material
): THREE.Group {
  const g = new THREE.Group();

  // Floor-level perimeter rectangular base rails (y = -5.45, caster wheels touch y = -5.78)
  [-3.85, 3.85].forEach((sx) => {
    const baseRail = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 11.4, 12), tubeMat);
    baseRail.rotation.x = Math.PI / 2;
    baseRail.position.set(sx, -5.45, -0.4);
    g.add(baseRail);

    // Caster Wheels at 4 corners (bottom at y = -5.78)
    [-5.6, 4.8].forEach((cz) => {
      const fork = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.26, 0.28), bracketMat);
      fork.position.set(sx, -5.56, cz);
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.16, 14), wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(sx, -5.62, cz);
      g.add(fork, wheel);
    });

    // Angled Front & Rear Uprights rising to Side Motor-Mount Cradle & Rear Bellhousing Pad
    const frontLegCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sx, -5.45, 4.6),
      new THREE.Vector3(sx * 0.92, -3.4, 2.6),
      new THREE.Vector3(sx * 0.86, -1.45, 0.55)
    ]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(frontLegCurve, 12, 0.16, 10, false), tubeMat));

    const rearLegCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sx, -5.45, -5.4),
      new THREE.Vector3(sx * 0.85, -3.5, -5.4),
      new THREE.Vector3(sx * 0.65, -1.75, -5.4)
    ]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(rearLegCurve, 12, 0.16, 10, false), tubeMat));

    // Side Motor Mount Cradle Bracket bolting cleanly into SBC 3-bolt side boss
    const mountPad = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.68, 1.15), bracketMat);
    mountPad.position.set(sx * 0.84, -1.35, 0.55);
    g.add(mountPad);
  });

  // Front, Center & Rear Transverse Floor Crossbars
  [-5.2, 0.5, 4.6].forEach((tz) => {
    const cross = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 7.7, 12), tubeMat);
    cross.rotation.z = Math.PI / 2;
    cross.position.set(0, -5.45, tz);
    g.add(cross);
  });

  // Rear Bellhousing Support Crossbar
  const rearSupport = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.34, 0.48), bracketMat);
  rearSupport.position.set(0, -1.75, -5.4);
  g.add(rearSupport);

  return g;
}


