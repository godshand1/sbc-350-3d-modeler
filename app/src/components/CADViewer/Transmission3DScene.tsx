/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { TransmissionItem, InspectionData, TechDrawingSheet } from '../../types/engine';
import {
  createProceduralTextureSet,
  createGearGeometry,
  createARP12PointBolt,
  applyTechnicalEdges
} from './mechanicalGeometry';
import { EngineViewMode } from './Engine3DScene';

interface Transmission3DSceneProps {
  transmission: TransmissionItem;
  explodedAmount: number;
  isRunning: boolean;
  viewMode?: EngineViewMode;
  techDrawing?: TechDrawingSheet | null;
  focusPartRequest?: { key: string; nonce: number } | null;
  onSelectPart: (data: InspectionData | null) => void;
}

const _rayMouse = new THREE.Vector2();
const _focusBox = new THREE.Box3();
const _focusCenter = new THREE.Vector3();

export const Transmission3DScene: React.FC<Transmission3DSceneProps> = ({
  transmission,
  explodedAmount,
  isRunning,
  viewMode = 'realistic',
  techDrawing = null,
  focusPartRequest = null,
  onSelectPart
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const explodedRef = useRef(explodedAmount);
  const isRunningRef = useRef(isRunning);
  const onSelectPartRef = useRef(onSelectPart);
  const transPartsRef = useRef<Record<string, THREE.Object3D | null>>({});
  const reticleStateRef = useRef<{
    reticle: THREE.Mesh;
    camera: THREE.PerspectiveCamera;
  } | null>(null);

  useEffect(() => { explodedRef.current = explodedAmount; }, [explodedAmount]);
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
  useEffect(() => { onSelectPartRef.current = onSelectPart; }, [onSelectPart]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 480;

    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    const isDrawing = viewMode === 'drawing';
    const isWire = viewMode === 'wireframe';
    const isGhost = viewMode === 'ghost';
    const isStudio = viewMode === 'realistic';

    const scene = new THREE.Scene();
    const bgHex = isDrawing
      ? 0x091628
      : isWire
      ? 0x07111a
      : isStudio
      ? 0xdce1e7
      : 0x101419;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, isStudio ? 0.005 : 0.012);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance'
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 300);
    camera.position.set(14.5, 9.5, 17.0);
    camera.lookAt(0.5, 0, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.target.set(0.5, 0, 0);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    scene.add(new THREE.HemisphereLight(0xcbe4ff, 0x241d17, 0.72));
    const keyLight = new THREE.DirectionalLight(0xfff5eb, 1.55);
    keyLight.position.set(16, 20, 16);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.75);
    rimLight.position.set(-14, 10, -14);
    scene.add(rimLight);

    const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const textures = createProceduralTextureSet(maxAniso);

    const stagePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 24),
      new THREE.MeshBasicMaterial({
        map: textures.blueprintScaleMap,
        transparent: true,
        opacity: 0.85,
        depthWrite: false
      })
    );
    stagePlane.rotation.x = -Math.PI / 2;
    stagePlane.position.y = -3.78;
    scene.add(stagePlane);

    const grid = new THREE.GridHelper(
      28,
      28,
      isDrawing ? 0x38bdf8 : 0xe5a823,
      isDrawing ? 0x16324f : 0x1f2e3d
    );
    grid.position.y = -3.80;
    scene.add(grid);

    // Performance CAD Materials
    const mats = {
      castAlumCase: new THREE.MeshPhysicalMaterial({
        color: isDrawing ? 0x1a3352 : 0xa3b1c2,
        bumpMap: isDrawing ? null : textures.castIronBump,
        bumpScale: 0.02,
        roughness: 0.42,
        metalness: 0.65,
        wireframe: isWire,
        transparent: isGhost,
        opacity: isGhost ? 0.28 : 1.0,
        side: THREE.DoubleSide
      }),
      machinedSteel: new THREE.MeshPhysicalMaterial({
        color: isDrawing ? 0x2b4f75 : 0xdde3ea,
        map: isDrawing ? null : textures.machinedSwirl,
        roughness: 0.18,
        metalness: 0.92,
        anisotropy: 0.6,
        wireframe: isWire
      }),
      hardenedGear: new THREE.MeshPhysicalMaterial({
        color: 0x64748b,
        roughness: 0.24,
        metalness: 0.90,
        anisotropy: 0.5,
        wireframe: isWire
      }),
      brassSynchro: new THREE.MeshStandardMaterial({
        color: 0xe5a823,
        roughness: 0.26,
        metalness: 0.88,
        wireframe: isWire
      }),
      converterGold: new THREE.MeshPhysicalMaterial({
        color: 0xd97706,
        roughness: 0.26,
        metalness: 0.85,
        clearcoat: 0.4,
        wireframe: isWire
      }),
      clutchFriction: new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.85,
        metalness: 0.08,
        wireframe: isWire
      }),
      arpBolt: new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.24,
        metalness: 0.92,
        wireframe: isWire
      }),
      techEdge: new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.9
      })
    };

    const transGroup = new THREE.Group();

    // =========================================================================
    // 1. LATHE BELLHOUSING WITH FLANGE & STARTER POCKET
    // =========================================================================
    const bellPts = [
      new THREE.Vector2(4.25, -1.7),
      new THREE.Vector2(4.25, -1.4),
      new THREE.Vector2(3.9, -1.35),
      new THREE.Vector2(3.55, -0.3),
      new THREE.Vector2(2.65, 1.3),
      new THREE.Vector2(2.45, 1.7)
    ];
    const bellhousing = new THREE.Group();
    const bellMesh = new THREE.Mesh(
      new THREE.LatheGeometry(bellPts, 28),
      mats.castAlumCase
    );
    bellMesh.rotation.z = -Math.PI / 2;
    bellhousing.add(bellMesh);

    // 6 Chevy V8 Bellhousing Mount Bolts
    for (let b = 0; b < 6; b++) {
      const a = (b / 6) * Math.PI * 2 + 0.3;
      const bolt = createARP12PointBolt(0.11, 0.45, mats.arpBolt);
      bolt.rotation.z = Math.PI / 2;
      bolt.position.set(-1.6, Math.sin(a) * 4.0, Math.cos(a) * 4.0);
      bellhousing.add(bolt);
    }
    bellhousing.position.x = -4.6;
    bellhousing.userData = {
      name: `${transmission.name} SFI Bellhousing`,
      category: 'Transmission Housing',
      desc: `Native Pattern: ${transmission.nativePattern}. Precision dowel-pinned bellhousing alignment.`
    };
    transGroup.add(bellhousing);

    // =========================================================================
    // 2. INPUT COUPLER (FINNED TORQUE CONVERTER OR SFI FLYWHEEL + CLUTCH)
    // =========================================================================
    const inputCouplerGroup = new THREE.Group();
    if (transmission.type === 'Automatic') {
      const tcPts = [
        new THREE.Vector2(0.0, -0.9),
        new THREE.Vector2(3.15, -0.82),
        new THREE.Vector2(3.45, -0.45),
        new THREE.Vector2(3.45, 0.45),
        new THREE.Vector2(2.85, 0.85),
        new THREE.Vector2(0.78, 0.92),
        new THREE.Vector2(0.78, 1.55),
        new THREE.Vector2(0.0, 1.55)
      ];
      const converter = new THREE.Mesh(new THREE.LatheGeometry(tcPts, 32), mats.converterGold);
      converter.rotation.z = -Math.PI / 2;
      converter.userData = {
        name: `Finned Lockup Torque Converter (${transmission.defaultStall} RPM Stall)`,
        category: 'Torque Converter',
        desc: 'Furnace-brazed pump & turbine impeller fins with anti-ballooning front cover.'
      };
      inputCouplerGroup.add(converter);

      // 3 Welded Flexplate Mounting Lugs
      for (let l = 0; l < 3; l++) {
        const a = (l / 3) * Math.PI * 2;
        const pad = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.55, 0.55), mats.machinedSteel);
        pad.position.set(-0.95, Math.cos(a) * 2.35, Math.sin(a) * 2.35);
        inputCouplerGroup.add(pad);
      }
    } else {
      const flywheel = new THREE.Mesh(
        createGearGeometry(3.85, 64, 0.42, 0.55, 0.14),
        mats.machinedSteel
      );
      flywheel.rotation.y = Math.PI / 2;
      flywheel.position.x = -1.1;
      flywheel.userData = {
        name: '168-Tooth SFI Billet Steel Flywheel',
        category: 'Clutch Assembly',
        desc: 'CNC-machined billet chromoly flywheel, internal neutral balance.'
      };
      inputCouplerGroup.add(flywheel);

      const disc = new THREE.Mesh(
        new THREE.CylinderGeometry(3.1, 3.1, 0.18, 28),
        mats.clutchFriction
      );
      disc.rotation.z = Math.PI / 2;
      disc.position.x = -0.68;
      inputCouplerGroup.add(disc);

      // Sprung hub damper springs inside clutch disc
      for (let s = 0; s < 6; s++) {
        const a = (s / 6) * Math.PI * 2;
        const damper = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.18, 0.55, 10),
          mats.brassSynchro
        );
        damper.rotation.x = a;
        damper.position.set(-0.55, Math.cos(a) * 1.15, Math.sin(a) * 1.15);
        inputCouplerGroup.add(damper);
      }

      const pressurePlate = new THREE.Mesh(
        new THREE.CylinderGeometry(3.35, 3.55, 0.48, 24),
        mats.converterGold
      );
      pressurePlate.rotation.z = Math.PI / 2;
      pressurePlate.position.x = -0.22;
      pressurePlate.userData = {
        name: `Diaphragm Pressure Plate (${transmission.clutch})`,
        category: 'Clutch Assembly',
        desc: transmission.clutch
      };
      inputCouplerGroup.add(pressurePlate);
    }
    inputCouplerGroup.position.x = -4.2;
    transGroup.add(inputCouplerGroup);

    // =========================================================================
    // 3. RIBBED ALUMINUM MAIN CASE + INTERNAL ROTATING GEAR TRAIN
    // =========================================================================
    const mainCaseGroup = new THREE.Group();
    const caseShape = new THREE.Shape();
    caseShape.moveTo(-2.1, -1.8);
    caseShape.lineTo(2.1, -1.8);
    caseShape.lineTo(2.35, 0.6);
    caseShape.lineTo(1.45, 2.05);
    caseShape.lineTo(-1.45, 2.05);
    caseShape.lineTo(-2.35, 0.6);
    caseShape.closePath();

    const mainCaseGeo = new THREE.ExtrudeGeometry(caseShape, {
      depth: 5.4,
      bevelEnabled: true,
      bevelThickness: 0.12,
      bevelSize: 0.1,
      bevelSegments: 2
    });
    mainCaseGeo.rotateY(Math.PI / 2);
    mainCaseGeo.translate(-2.7, 0, 0);

    const mainCaseMesh = new THREE.Mesh(mainCaseGeo, mats.castAlumCase);
    mainCaseMesh.userData = {
      name: `${transmission.name} Ribbed Aluminum Case`,
      category: 'Transmission',
      desc: `Length: ${transmission.lengthInches}" | Forward Ratios: ${transmission.ratios.join(', ')} | Reverse: ${transmission.reverse}:1.`
    };
    mainCaseGroup.add(mainCaseMesh);

    // Cast Reinforcement Case Ribs
    for (let r = -2; r <= 2; r++) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.6, 4.75), mats.castAlumCase);
      rib.position.set(r * 1.05, 0.1, 0);
      mainCaseGroup.add(rib);
    }

    // Internal Input / Output Mainshaft & Stepped Gear Train (Visible in Ghost / Drawing / Exploded)
    const inputShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 5.2, 16),
      mats.machinedSteel
    );
    inputShaft.rotation.z = Math.PI / 2;
    inputShaft.position.set(-1.1, 0.35, 0);
    mainCaseGroup.add(inputShaft);

    const gearRadii = [1.45, 1.18, 0.95, 0.78];
    const mainShaftGears: THREE.Mesh[] = [];
    const counterShaftGears: THREE.Mesh[] = [];

    gearRadii.forEach((rad, gIdx) => {
      const gx = -1.6 + gIdx * 1.08;
      const teeth = Math.round(rad * 18);
      const gear = new THREE.Mesh(
        createGearGeometry(rad, teeth, 0.46, 0.34, 0.11),
        mats.hardenedGear
      );
      gear.rotation.y = Math.PI / 2;
      gear.position.set(gx, 0.35, 0);
      mainCaseGroup.add(gear);
      mainShaftGears.push(gear);

      // Countershaft / Planetary Pinion gear below
      const cRad = 1.95 - rad;
      const cTeeth = Math.max(12, Math.round(cRad * 18));
      const cGear = new THREE.Mesh(
        createGearGeometry(cRad, cTeeth, 0.44, 0.28, 0.11),
        mats.hardenedGear
      );
      cGear.rotation.y = Math.PI / 2;
      cGear.position.set(gx, -1.18, 0);
      mainCaseGroup.add(cGear);
      counterShaftGears.push(cGear);

      // Brass Synchronizer Ring (Manual) or Clutch Drum (Auto)
      if (gIdx < 3) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(rad * 0.72, 0.08, 8, 22),
          mats.brassSynchro
        );
        ring.rotation.y = Math.PI / 2;
        ring.position.set(gx + 0.32, 0.35, 0);
        mainCaseGroup.add(ring);
      }
    });

    // Front Oil Pump Housing + Stator Support (Explodes forward from main case)
    const frontPumpGroup = new THREE.Group();
    const pumpFlange = new THREE.Mesh(
      new THREE.CylinderGeometry(2.05, 2.05, 0.55, 24),
      mats.machinedSteel
    );
    pumpFlange.rotation.z = Math.PI / 2;
    const statorSnout = new THREE.Mesh(
      new THREE.CylinderGeometry(0.65, 0.72, 1.35, 18),
      mats.machinedSteel
    );
    statorSnout.rotation.z = Math.PI / 2;
    statorSnout.position.x = -0.85;
    frontPumpGroup.add(pumpFlange, statorSnout);
    frontPumpGroup.position.set(-2.9, 0.35, 0);
    frontPumpGroup.userData = {
      name: 'Front Oil Pump & Stator Support Assembly',
      category: 'Hydraulics',
      desc: 'Gerotor / crescent front pump assembly pressurizing clutch packs and converter circuit.'
    };
    transGroup.add(frontPumpGroup);

    // Multi-Disc Clutch Pack & Planetary Carrier Exploded Stack
    const clutchPackGroup = new THREE.Group();
    for (let cp = 0; cp < 6; cp++) {
      const plate = new THREE.Mesh(
        new THREE.TorusGeometry(1.22, 0.09, 8, 24),
        cp % 2 === 0 ? mats.brassSynchro : mats.machinedSteel
      );
      plate.rotation.y = Math.PI / 2;
      plate.position.set(-0.2 + cp * 0.22, 0.35, 0);
      clutchPackGroup.add(plate);
    }
    const planetaryDrum = new THREE.Mesh(
      new THREE.CylinderGeometry(1.52, 1.52, 1.15, 24, 1, true),
      mats.hardenedGear
    );
    planetaryDrum.rotation.z = Math.PI / 2;
    planetaryDrum.position.set(1.45, 0.35, 0);
    clutchPackGroup.add(planetaryDrum);
    clutchPackGroup.userData = {
      name: 'Multi-Disc Friction/Steel Clutch Pack & Planetary Carrier',
      category: 'Internal Gear Train',
      desc: 'Alternating high-energy friction & Kolene steel plates with sun/ring planetary carrier.'
    };
    mainCaseGroup.add(clutchPackGroup);

    let valveBodyGroup: THREE.Group | null = null;
    let panMesh: THREE.Mesh | null = null;
    if (transmission.type === 'Automatic') {
      valveBodyGroup = new THREE.Group();
      const vbPlate = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.42, 3.1), mats.machinedSteel);
      const filterPlate = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.18, 2.4), mats.brassSynchro);
      filterPlate.position.y = -0.34;
      valveBodyGroup.add(vbPlate, filterPlate);
      valveBodyGroup.position.set(0, -1.65, 0);
      valveBodyGroup.userData = {
        name: 'Hydraulic Valve Body & Internal Filter',
        category: 'Hydraulics',
        desc: 'Precision-bored aluminum valve body regulating line pressure, shift accumulators, and lockup solenoid.'
      };
      transGroup.add(valveBodyGroup);

      panMesh = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.85, 3.7), mats.machinedSteel);
      panMesh.position.set(0, -2.28, 0);
      panMesh.userData = {
        name: 'Finned Cast-Aluminum Deep Sump Pan',
        category: 'Transmission',
        desc: 'Extra +2 Qt ATF cooling capacity with magnetic drain plug & deep pickup.'
      };
      transGroup.add(panMesh);
    } else {
      const shifterTurret = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 1.3, 1.3),
        mats.machinedSteel
      );
      shifterTurret.position.set(1.6, 2.35, 0);
      shifterTurret.userData = {
        name: 'Hurst Competition Plus Shifter & Linkage',
        category: 'Shifter Assembly',
        desc: 'Short-throw billet gate with adjustable 3rd/4th gear over-shift stops.'
      };
      mainCaseGroup.add(shifterTurret);

      const stick = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.18, 2.6, 12),
        mats.machinedSteel
      );
      stick.position.set(1.3, 3.85, 0);
      stick.rotation.z = 0.25;
      mainCaseGroup.add(stick);
    }

    transGroup.add(mainCaseGroup);

    // =========================================================================
    // 4. TAPERED TAILHOUSING & FORGED 1350 SLIP YOKE WITH U-JOINT
    // =========================================================================
    const tailPts = [
      new THREE.Vector2(2.3, -2.2),
      new THREE.Vector2(2.05, -0.8),
      new THREE.Vector2(1.45, 1.2),
      new THREE.Vector2(1.25, 2.2)
    ];
    const tailshaft = new THREE.Mesh(new THREE.LatheGeometry(tailPts, 24), mats.castAlumCase);
    tailshaft.rotation.z = -Math.PI / 2;
    tailshaft.position.x = 4.9;
    tailshaft.userData = {
      name: 'Ribbed Aluminum Extension Tailhousing',
      category: 'Driveline',
      desc: 'Houses rear output bushing, speedometer gear, and transmission mount pad.'
    };
    transGroup.add(tailshaft);

    const slipYokeGroup = new THREE.Group();
    const yokeBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.74, 0.74, 2.4, 20),
      mats.machinedSteel
    );
    yokeBarrel.rotation.z = -Math.PI / 2;
    slipYokeGroup.add(yokeBarrel);

    const yokeEarTop = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.28, 1.25), mats.machinedSteel);
    yokeEarTop.position.set(1.5, 0.55, 0);
    const yokeEarBot = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.28, 1.25), mats.machinedSteel);
    yokeEarBot.position.set(1.5, -0.55, 0);
    const uJointCross = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 1.25, 12),
      mats.brassSynchro
    );
    uJointCross.position.set(1.65, 0, 0);
    slipYokeGroup.add(yokeEarTop, yokeEarBot, uJointCross);

    slipYokeGroup.position.x = 7.4;
    slipYokeGroup.userData = {
      name: 'Forged 1350 Series Driveshaft Slip Yoke',
      category: 'Driveline',
      desc: 'Chromoly 1350 U-joint yoke rotating at output shaft RPM.'
    };
    transGroup.add(slipYokeGroup);

    const edgeLines: THREE.LineSegments[] = [];
    if (isDrawing) {
      edgeLines.push(...applyTechnicalEdges(transGroup, mats.techEdge, 22));
    }

    scene.add(transGroup);

    // Register subassembly map for live Technical Drawing BOM binding
    const transParts: Record<string, THREE.Object3D | null> = {
      bellhousing,
      converter: inputCouplerGroup,
      frontPump: frontPumpGroup,
      clutchPack: clutchPackGroup,
      mainCase: mainCaseMesh,
      valveBody: valveBodyGroup,
      pan: panMesh,
      tailhousing: tailshaft,
      slipYoke: slipYokeGroup
    };
    Object.values(transParts).forEach((obj) => {
      if (obj && obj.userData?.name) {
        obj.userData._base = { ...obj.userData };
      }
    });
    if (!inputCouplerGroup.userData?.name) {
      const childWithData = inputCouplerGroup.children.find((c) => c.userData?.name);
      if (childWithData) {
        inputCouplerGroup.userData = { ...childWithData.userData, _base: { ...childWithData.userData } };
      }
    }
    transPartsRef.current = transParts;

    // Selection Reticle Ring
    const selectionRingMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      depthTest: false
    });
    const selectionReticle = new THREE.Mesh(
      new THREE.RingGeometry(0.45, 0.65, 28),
      selectionRingMat
    );
    selectionReticle.visible = false;
    scene.add(selectionReticle);
    reticleStateRef.current = { reticle: selectionReticle, camera };

    // Raycasting
    const raycaster = new THREE.Raycaster();
    const onPointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      _rayMouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      _rayMouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(_rayMouse, camera);
      const hits = raycaster.intersectObjects(transGroup.children, true);
      if (hits.length > 0) {
        let obj: THREE.Object3D | null = hits[0].object;
        while (obj && obj !== transGroup) {
          if (obj.userData && obj.userData.name) break;
          obj = obj.parent;
        }
        if (obj?.userData?.name) {
          onSelectPartRef.current(obj.userData as InspectionData);
          selectionReticle.position.copy(hits[0].point);
          selectionReticle.lookAt(camera.position);
          selectionReticle.visible = true;
        }
      }
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Paced Animation Loop + Damped Explosion
    let frameId = 0;
    let disposed = false;
    let lastTime = performance.now();
    let smoothedExploded = explodedRef.current;

    function afterDraw(cb: () => void) {
      if (disposed) return;
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const tick = (now: number) => {
      if (disposed) return;
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      controls.update();

      if (selectionReticle.visible) {
        selectionReticle.lookAt(camera.position);
      }

      smoothedExploded = THREE.MathUtils.damp(smoothedExploded, explodedRef.current, 9, dt);
      const f = smoothedExploded;

      bellhousing.position.x = -4.6 - f * 6.0;
      inputCouplerGroup.position.x = -4.2 - f * 3.8;
      frontPumpGroup.position.x = -2.9 - f * 1.6;
      clutchPackGroup.position.x = f * 1.4;
      if (valveBodyGroup) valveBodyGroup.position.y = -1.65 - f * 1.6;
      if (panMesh) panMesh.position.y = -2.28 - f * 3.2;
      tailshaft.position.x = 4.9 + f * 4.4;
      slipYokeGroup.position.x = 7.4 + f * 7.2;

      if (isRunningRef.current) {
        const inputOmega = 2.8 * dt;
        const firstRatio = transmission.ratios[0] || 2.5;
        inputCouplerGroup.rotation.x += inputOmega;
        inputShaft.rotation.y += inputOmega;
        mainShaftGears.forEach((g) => { g.rotation.z += inputOmega / firstRatio; });
        counterShaftGears.forEach((g) => { g.rotation.z -= inputOmega * 0.75; });
        slipYokeGroup.rotation.x += inputOmega / firstRatio;
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(() => tick(performance.now()));
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    if (isSoftwareGl) {
      tick(performance.now());
    } else {
      frameId = requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      transPartsRef.current = {};
      reticleStateRef.current = null;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      controls.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
          obj.geometry?.dispose();
        }
      });
      selectionRingMat.dispose();
      Object.values(mats).forEach((m) => m.dispose());
      edgeLines.forEach((l) => l.geometry.dispose());
      textures.dispose();
      if (scene.environment) scene.environment.dispose();
      renderer.dispose();
    };
  }, [transmission.id, transmission.type, transmission.lengthInches, transmission.defaultStall, transmission.ratios.join(','), viewMode]);

  // Lightweight live binding of Technical Drawing callouts without tearing down WebGL
  useEffect(() => {
    const parts = transPartsRef.current;
    Object.values(parts).forEach((obj) => {
      if (obj && obj.userData?._base) {
        const base = obj.userData._base as Record<string, unknown>;
        obj.userData = { ...base, _base: base };
      }
    });
    if (!techDrawing) return;

    for (const callout of techDrawing.callouts) {
      const target = parts[callout.targetSubassembly];
      if (!target) continue;
      const base = (target.userData?._base || target.userData || {}) as Record<string, unknown>;
      target.userData = {
        ...base,
        _base: base,
        name: callout.partName || (base.name as string),
        category: callout.category || (base.category as string),
        desc: callout.notes || (base.desc as string),
        spec: callout.clearanceSpec,
        torque: callout.torqueSpec,
        partNumber: callout.partNumber,
        drawingIndex: callout.indexCode,
        material: callout.material,
        sourceUrls: techDrawing.sourceUrls
      };
    }
  }, [techDrawing, transmission.id, viewMode]);

  // Focus & reticle highlight when user clicks a BOM row in the Technical Drawing drawer
  useEffect(() => {
    if (!focusPartRequest) return;
    const obj = transPartsRef.current[focusPartRequest.key];
    const reticleState = reticleStateRef.current;
    if (!obj || !reticleState) return;
    _focusBox.setFromObject(obj);
    _focusBox.getCenter(_focusCenter);
    reticleState.reticle.position.copy(_focusCenter);
    reticleState.reticle.lookAt(reticleState.camera.position);
    reticleState.reticle.visible = true;
  }, [focusPartRequest]);

  return (
    <div className="relative w-full h-full min-h-[480px]">
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing blueprint-grid overflow-hidden"
        style={{ minHeight: '480px' }}
      />
    </div>
  );
};
