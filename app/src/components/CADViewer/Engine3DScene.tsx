/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import {
  EngineConfig,
  CoordinatedSpecs,
  CutawayMode,
  SubsystemIsolation,
  InspectionData,
  MeasurementState,
  TechDrawingSheet,
  InductionDressMode
} from '../../types/engine';
import {
  createProceduralTextureSet,
  createARP12PointBolt,
  createGearGeometry,
  createCamLobeGeometry,
  createCounterweightGeometry,
  createHelicalSpringGeometry,
  createHBeamConnectingRod,
  createV8BlockProfileGeometry,
  createRollerRockerGroup,
  createCrankTriggerWheelGeometry,
  createVentedAlternatorGroup,
  createDetailedOilPanGroup,
  createTimingCoverGroup,
  createChassisAndRadiatorGroup,
  createHollowValveCoverGroup,
  createStudGirdleBarGroup,
  createHolley4150CarburetorGroup,
  createEngineTestStandGroup,
  applyTechnicalEdges
} from './mechanicalGeometry';

import { AnalysisMode } from './SpecificationTreeDrawer';

export type EngineViewMode = 'realistic' | 'dark' | 'ghost' | 'wireframe' | 'drawing';
export type CameraPresetId = 'iso' | 'front' | 'right' | 'top' | 'rear';
export type { InductionDressMode };
export type SupportMode = 'shop_stand' | 'hotrod_chassis';

interface Engine3DSceneProps {
  config: EngineConfig;
  specs: CoordinatedSpecs;
  cutawayMode: CutawayMode;
  subsystemIsolation: SubsystemIsolation;
  explodedAmount: number;
  sectionOffset?: number;
  cameraPreset?: { id: CameraPresetId; nonce: number } | null;
  analysisMode?: AnalysisMode;
  inductionDress?: InductionDressMode;
  supportMode?: SupportMode;
  hiddenParts?: Record<string, boolean>;
  onRegisterCapture?: (fn: (() => void) | null) => void;
  rpm: number;
  isRunning: boolean;
  viewMode: EngineViewMode;
  showMarkups: boolean;
  onSelectPart: (data: InspectionData | null) => void;
  selectedPart: InspectionData | null;
  measurementState: MeasurementState;
  onUpdateMeasurement: (state: MeasurementState) => void;
  techDrawing?: TechDrawingSheet | null;
  focusPartRequest?: { key: string; nonce: number } | null;
}

const _rayMouse = new THREE.Vector2();
const _ptA = new THREE.Vector3();
const _camGoalPos = new THREE.Vector3();
const _camGoalTarget = new THREE.Vector3(0, 1.0, 0);
const _engineFocusBox = new THREE.Box3();
const _engineFocusCenter = new THREE.Vector3();

const CAMERA_PRESET_COORDS: Record<CameraPresetId, [number, number, number]> = {
  iso: [17.5, 12.0, 21.0],
  front: [0, 1.8, 25.0],
  right: [24.0, 2.5, 0],
  top: [0, 26.5, 0.05],
  rear: [0, 2.2, -25.0]
};

export const Engine3DScene: React.FC<Engine3DSceneProps> = ({
  config,
  specs,
  cutawayMode,
  subsystemIsolation,
  explodedAmount,
  sectionOffset = 0,
  cameraPreset = null,
  analysisMode = 'none',
  inductionDress = 'carb_hei',
  supportMode = 'shop_stand',
  hiddenParts = {},
  onRegisterCapture,
  rpm,
  isRunning,
  viewMode,
  onSelectPart,
  selectedPart,
  measurementState,
  onUpdateMeasurement,
  techDrawing = null,
  focusPartRequest = null
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const isRunningRef = useRef(isRunning);
  const rpmRef = useRef(rpm);
  const explodedRef = useRef(explodedAmount);
  const sectionOffsetRef = useRef(sectionOffset);
  const hiddenPartsRef = useRef(hiddenParts);
  const measurementRef = useRef(measurementState);
  const selectedPartRef = useRef(selectedPart);
  const onSelectPartRef = useRef(onSelectPart);
  const onUpdateMeasurementRef = useRef(onUpdateMeasurement);
  const onRegisterCaptureRef = useRef(onRegisterCapture);
  const enginePartsRef = useRef<Record<string, THREE.Object3D>>({});
  const engineReticleStateRef = useRef<{
    reticle: THREE.Mesh;
    camera: THREE.PerspectiveCamera;
  } | null>(null);
  const camTransitionRef = useRef<{ active: boolean; pos: THREE.Vector3 }>({
    active: false,
    pos: new THREE.Vector3(...CAMERA_PRESET_COORDS.iso)
  });

  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
  useEffect(() => { rpmRef.current = rpm; }, [rpm]);
  useEffect(() => { explodedRef.current = explodedAmount; }, [explodedAmount]);
  useEffect(() => { sectionOffsetRef.current = sectionOffset; }, [sectionOffset]);
  useEffect(() => { hiddenPartsRef.current = hiddenParts; }, [hiddenParts]);
  useEffect(() => { measurementRef.current = measurementState; }, [measurementState]);
  useEffect(() => { selectedPartRef.current = selectedPart; }, [selectedPart]);
  useEffect(() => { onSelectPartRef.current = onSelectPart; }, [onSelectPart]);
  useEffect(() => { onUpdateMeasurementRef.current = onUpdateMeasurement; }, [onUpdateMeasurement]);
  useEffect(() => { onRegisterCaptureRef.current = onRegisterCapture; }, [onRegisterCapture]);
  useEffect(() => {
    if (!cameraPreset) return;
    const coords = CAMERA_PRESET_COORDS[cameraPreset.id];
    camTransitionRef.current.pos.set(coords[0], coords[1], coords[2]);
    camTransitionRef.current.active = true;
  }, [cameraPreset]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 560;

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
      : isGhost
      ? 0x050d18
      : 0x101419;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, isStudio ? 0.004 : isGhost ? 0.008 : 0.011);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance'
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isStudio ? 1.08 : isGhost ? 1.25 : 1.16;
    renderer.localClippingEnabled = true;
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 400);
    camera.position.set(17.5, 11.5, 20.5);
    camera.lookAt(0, 1.0, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 7;
    controls.maxDistance = 48;
    controls.target.set(0, 1.0, 0);
    controls.addEventListener('start', () => {
      camTransitionRef.current.active = false;
    });

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const hemiLight = new THREE.HemisphereLight(
      isStudio ? 0xffffff : isGhost ? 0x7dd3fc : 0xcbe4ff,
      isStudio ? 0x64748b : isGhost ? 0x082f49 : 0x2a1f18,
      isStudio ? 1.05 : isGhost ? 0.95 : 0.72
    );
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, isStudio ? 1.85 : 1.65);
    keyLight.position.set(18, 25, 18);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 2;
      keyLight.shadow.camera.far = 65;
      keyLight.shadow.camera.left = -14;
      keyLight.shadow.camera.right = 14;
      keyLight.shadow.camera.top = 14;
      keyLight.shadow.camera.bottom = -14;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(isStudio ? 0xe0f2fe : 0x7cc4ff, isStudio ? 0.95 : 0.9);
    rimLight.position.set(-18, 14, -18);
    scene.add(rimLight);

    const underLight = new THREE.DirectionalLight(0xffcf99, isStudio ? 0.55 : 0.45);
    underLight.position.set(2, -12, 8);
    scene.add(underLight);

    if (!isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      const softboxTop = new THREE.RectAreaLight(0xffffff, isStudio ? 3.2 : 2.4, 14, 7);
      softboxTop.position.set(0, 14, 4);
      softboxTop.lookAt(0, 1, 0);
      scene.add(softboxTop);
    }

    const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const textures = createProceduralTextureSet(maxAniso);

    const stagePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshBasicMaterial({
        map: isStudio ? textures.studioFloorShadowMap : textures.blueprintScaleMap,
        transparent: true,
        opacity: isStudio ? 0.92 : isGhost ? 0.65 : 0.85,
        depthWrite: false
      })
    );
    stagePlane.rotation.x = -Math.PI / 2;
    stagePlane.position.y = -5.78;
    scene.add(stagePlane);

    const grid = new THREE.GridHelper(
      34,
      34,
      isGhost ? 0x00f0ff : isDrawing ? 0x38bdf8 : isStudio ? 0x94a3b8 : 0x0ea5e9,
      isGhost ? 0x092b45 : isDrawing ? 0x16324f : isStudio ? 0xc5cdd8 : 0x1c2833
    );
    grid.position.y = -5.80;
    scene.add(grid);

    // Section Clipping Planes Calibration
    let activeClippingPlanes: THREE.Plane[] = [];
    let baseClipConstant = 0;
    if (cutawayMode === 'rightBank') {
      baseClipConstant = 2.15;
      activeClippingPlanes = [
        new THREE.Plane(new THREE.Vector3(-0.68, -0.38, -0.62).normalize(), baseClipConstant)
      ];
    } else if (cutawayMode === 'centerLongitudinal') {
      baseClipConstant = 0.15;
      activeClippingPlanes = [new THREE.Plane(new THREE.Vector3(-1, 0, 0), baseClipConstant)];
    } else if (cutawayMode === 'valvetrain') {
      baseClipConstant = 2.45;
      activeClippingPlanes = [new THREE.Plane(new THREE.Vector3(0, -1, 0), baseClipConstant)];
    }

    const isIsolated = (sub: SubsystemIsolation) =>
      subsystemIsolation === 'all' || subsystemIsolation === sub;
    const getAlpha = (sub: SubsystemIsolation) => (isIsolated(sub) ? 1.0 : 0.11);

    const isStress = analysisMode === 'stress';
    const isThermal = analysisMode === 'thermal';
    const isClearance = analysisMode === 'clearance';
    const quenchPass = specs.quenchDistance >= 0.038 && specs.quenchDistance <= 0.062;

    const mats = {
      chevyBlock: new THREE.MeshStandardMaterial({
        color: isStress
          ? 0x1d4ed8
          : isThermal
          ? 0x0284c7
          : isClearance
          ? 0x334155
          : isDrawing
          ? 0x102540
          : isGhost
          ? 0x38bdf8
          : 0xd83b01,
        roughness: isGhost ? 0.15 : isDrawing ? 0.85 : 0.74,
        metalness: isGhost ? 0.85 : isDrawing ? 0.1 : 0.22,
        bumpMap: isDrawing || isGhost || analysisMode !== 'none' ? null : textures.castIronBump,
        bumpScale: 0.035,
        wireframe: isWire,
        transparent: isGhost || !isIsolated('all'),
        opacity: isGhost ? 0.18 : getAlpha('all'),
        depthWrite: !isGhost,
        clippingPlanes: activeClippingPlanes
      }),
      machinedDeck: new THREE.MeshPhysicalMaterial({
        color: isStress ? 0x06b6d4 : isThermal ? 0x38bdf8 : isClearance ? 0x22d3ee : isDrawing ? 0x1c3f6b : isGhost ? 0x0ea5e9 : 0xdde3ea,
        map: isDrawing || isGhost || analysisMode !== 'none' ? null : textures.machinedSwirl,
        roughness: isGhost ? 0.15 : 0.22,
        metalness: isGhost ? 0.85 : 0.88,
        anisotropy: 0.6,
        wireframe: isWire,
        transparent: isGhost || (!isIsolated('all') && !isIsolated('rotating')),
        opacity: isGhost ? 0.18 : isIsolated('all') ? 1.0 : Math.max(getAlpha('all'), getAlpha('rotating')),
        depthWrite: !isGhost,
        clippingPlanes: activeClippingPlanes
      }),
      machinedInternal: new THREE.MeshPhysicalMaterial({
        color: isStress ? 0x06b6d4 : isThermal ? 0x38bdf8 : isClearance ? 0x22d3ee : isDrawing ? 0x1f3b5c : isGhost ? 0x7dd3fc : 0xdde3ea,
        map: isDrawing || isGhost || analysisMode !== 'none' ? null : textures.machinedSwirl,
        roughness: isGhost ? 0.16 : 0.20,
        metalness: isGhost ? 0.94 : 0.90,
        anisotropy: 0.65,
        wireframe: isWire,
        transparent: !isGhost && !isIsolated('rotating') && !isIsolated('valvetrain'),
        opacity: isGhost ? 1.0 : isIsolated('all') ? 1.0 : Math.max(getAlpha('rotating'), getAlpha('valvetrain')),
        depthWrite: true
      }),
      sleeveBore: new THREE.MeshStandardMaterial({
        color: isStress ? 0x22c55e : isThermal ? 0xf59e0b : isClearance ? (quenchPass ? 0x10b981 : 0xef4444) : isGhost ? 0x0284c7 : 0x94a3b8,
        map: analysisMode === 'none' && !isGhost ? textures.crosshatchHone : null,
        roughness: isGhost ? 0.15 : 0.20,
        metalness: isGhost ? 0.85 : 0.86,
        side: THREE.DoubleSide,
        wireframe: isWire,
        transparent: isGhost || !isIsolated('all'),
        opacity: isGhost ? 0.15 : getAlpha('all'),
        depthWrite: !isGhost,
        clippingPlanes: activeClippingPlanes
      }),
      crankForged: new THREE.MeshPhysicalMaterial({
        color: isStress ? 0xf97316 : isThermal ? 0x22c55e : isClearance ? 0x38bdf8 : isDrawing ? 0x224a7a : isGhost ? 0x00f0ff : 0xe2e8f0,
        roughness: isGhost ? 0.12 : 0.14,
        metalness: isGhost ? 0.98 : 0.96,
        anisotropy: 0.75,
        wireframe: isWire,
        transparent: !isGhost && !isIsolated('rotating'),
        opacity: isGhost ? 1.0 : getAlpha('rotating'),
        depthWrite: true
      }),
      rods4340: new THREE.MeshPhysicalMaterial({
        color: isStress ? 0xef4444 : isThermal ? 0x10b981 : isClearance ? (specs.rodStrokeRatio >= 1.6 ? 0x10b981 : 0xf59e0b) : isDrawing ? 0x1c3f6b : isGhost ? 0xffffff : 0x64748b,
        roughness: isGhost ? 0.18 : 0.32,
        metalness: isGhost ? 0.94 : 0.86,
        anisotropy: 0.5,
        wireframe: isWire,
        transparent: !isGhost && !isIsolated('rotating'),
        opacity: isGhost ? 1.0 : getAlpha('rotating'),
        depthWrite: true
      }),
      pistonsAlloy: new THREE.MeshPhysicalMaterial({
        color: isStress ? 0xfacc15 : isThermal ? 0xf97316 : isClearance ? (quenchPass ? 0x10b981 : 0xef4444) : isDrawing ? 0x265287 : isGhost ? 0xe0f2fe : 0xd8dee6,
        roughness: isGhost ? 0.14 : 0.18,
        metalness: isGhost ? 0.92 : 0.85,
        anisotropy: 0.65,
        wireframe: isWire,
        transparent: !isGhost && !isIsolated('rotating'),
        opacity: isGhost ? 1.0 : getAlpha('rotating'),
        depthWrite: true
      }),
      wristPins: new THREE.MeshStandardMaterial({
        color: isStress ? 0xef4444 : isThermal ? 0xf59e0b : isGhost ? 0x38bdf8 : 0xf8fafc,
        roughness: 0.08,
        metalness: 0.98,
        wireframe: isWire,
        transparent: !isGhost && !isIsolated('rotating'),
        opacity: isGhost ? 1.0 : getAlpha('rotating'),
        depthWrite: true
      }),
      arpBlackOxide: new THREE.MeshStandardMaterial({
        color: isStress ? 0xeab308 : isGhost ? 0x38bdf8 : 0x1e293b,
        roughness: 0.24,
        metalness: 0.92,
        wireframe: isWire,
        transparent: isGhost,
        opacity: isGhost ? 0.35 : 1.0,
        depthWrite: !isGhost
      }),
      brassBronze: new THREE.MeshStandardMaterial({
        color: isGhost ? 0xfbbf24 : 0xd97706,
        roughness: 0.28,
        metalness: 0.88,
        wireframe: isWire,
        transparent: isGhost,
        opacity: isGhost ? 0.45 : 1.0
      }),
      felProCopper: new THREE.MeshStandardMaterial({
        color: isClearance ? (quenchPass ? 0x22c55e : 0xef4444) : isThermal ? 0xfacc15 : isGhost ? 0x0ea5e9 : 0xc26d38,
        roughness: 0.26,
        metalness: 0.85,
        wireframe: isWire,
        transparent: isGhost || !isIsolated('all'),
        opacity: isGhost ? 0.20 : getAlpha('all'),
        depthWrite: !isGhost,
        clippingPlanes: activeClippingPlanes
      }),
      aluminumHeads: new THREE.MeshPhysicalMaterial({
        color: isStress ? 0x3b82f6 : isThermal ? 0xfb923c : isClearance ? 0x475569 : isDrawing ? 0x153155 : isGhost ? 0x7dd3fc : 0xc4cbd2,
        bumpMap: isDrawing || isGhost || analysisMode !== 'none' ? null : textures.castIronBump,
        bumpScale: 0.015,
        roughness: isGhost ? 0.15 : 0.36,
        metalness: isGhost ? 0.85 : 0.68,
        wireframe: isWire,
        transparent: isGhost || !isIsolated('valvetrain'),
        opacity: isGhost ? 0.18 : getAlpha('valvetrain'),
        depthWrite: !isGhost,
        clippingPlanes: activeClippingPlanes
      }),
      billetRockersBlue: new THREE.MeshPhysicalMaterial({
        color: isStress ? 0x22c55e : isDrawing ? 0x0284c7 : isGhost ? 0x38bdf8 : 0x0284c7,
        roughness: 0.22,
        metalness: 0.88,
        anisotropy: 0.6,
        wireframe: isWire,
        transparent: !isGhost && !isIsolated('valvetrain'),
        opacity: isGhost ? 1.0 : getAlpha('valvetrain'),
        depthWrite: true
      }),
      valveSpringsGold: new THREE.MeshStandardMaterial({
        color: isStress ? 0xf97316 : isDrawing ? 0x38bdf8 : isGhost ? 0xfacc15 : 0xeab308,
        roughness: 0.26,
        metalness: 0.88,
        wireframe: isWire,
        transparent: !isGhost && !isIsolated('valvetrain'),
        opacity: isGhost ? 1.0 : getAlpha('valvetrain'),
        depthWrite: true
      }),
      valvesSteel: new THREE.MeshStandardMaterial({
        color: isThermal ? 0xef4444 : isClearance ? 0x22d3ee : isGhost ? 0xffffff : 0xf1f5f9,
        roughness: 0.14,
        metalness: 0.94,
        wireframe: isWire,
        transparent: !isGhost && !isIsolated('valvetrain'),
        opacity: isGhost ? 1.0 : getAlpha('valvetrain'),
        depthWrite: true
      }),
      chromePolish: new THREE.MeshPhysicalMaterial({
        color: isDrawing ? 0x3b6998 : isGhost ? 0x7dd3fc : 0xf8fafc,
        roughness: 0.08,
        metalness: 0.98,
        clearcoat: 0.6,
        wireframe: isWire,
        transparent: isGhost || !isIsolated('all'),
        opacity: isGhost ? 0.20 : getAlpha('all'),
        depthWrite: !isGhost,
        clippingPlanes: activeClippingPlanes
      }),
      standChrome: new THREE.MeshPhysicalMaterial({
        color: isDrawing ? 0x122947 : isGhost ? 0x1e3a5f : 0xe2e8f0,
        roughness: 0.14,
        metalness: 0.92,
        clearcoat: 0.4,
        wireframe: isWire,
        transparent: isGhost,
        opacity: isGhost ? 0.18 : 1.0,
        depthWrite: !isGhost,
        clippingPlanes: activeClippingPlanes
      }),
      valveCoverBody: new THREE.MeshPhysicalMaterial({
        color: isDrawing ? 0x122947 : isGhost ? 0x0284c7 : 0x1e242c,
        roughness: isGhost ? 0.15 : 0.38,
        metalness: isGhost ? 0.85 : 0.55,
        clearcoat: 0.3,
        wireframe: isWire,
        transparent: isGhost || !isIsolated('valvetrain'),
        opacity: isGhost ? 0.15 : getAlpha('valvetrain'),
        depthWrite: !isGhost,
        clippingPlanes: activeClippingPlanes
      }),
      valveCoverFin: new THREE.MeshPhysicalMaterial({
        color: isDrawing ? 0x38bdf8 : isGhost ? 0x38bdf8 : 0xdbe2e9,
        roughness: 0.16,
        metalness: 0.92,
        wireframe: isWire,
        transparent: isGhost || !isIsolated('valvetrain'),
        opacity: isGhost ? 0.18 : getAlpha('valvetrain'),
        depthWrite: !isGhost,
        clippingPlanes: activeClippingPlanes
      }),
      headerCeramic: new THREE.MeshPhysicalMaterial({
        color: isThermal ? 0xef4444 : isDrawing ? 0x163457 : isGhost ? 0x0284c7 : 0x9ca3af,
        roughness: isGhost ? 0.15 : 0.25,
        metalness: isGhost ? 0.85 : 0.85,
        wireframe: isWire,
        transparent: isGhost || !isIsolated('all'),
        opacity: isGhost ? 0.15 : getAlpha('all'),
        depthWrite: !isGhost,
        clippingPlanes: activeClippingPlanes
      }),
      damperTiming: new THREE.MeshStandardMaterial({
        map: isGhost ? null : textures.harmonicTimingTape,
        color: isGhost ? 0x0284c7 : 0xffffff,
        roughness: 0.35,
        metalness: 0.45,
        wireframe: isWire,
        transparent: isGhost || !isIsolated('rotating'),
        opacity: isGhost ? 0.22 : getAlpha('rotating'),
        depthWrite: !isGhost,
        clippingPlanes: activeClippingPlanes
      }),
      ignitionRed: new THREE.MeshStandardMaterial({
        color: isDrawing ? 0x18375f : isGhost ? 0x38bdf8 : 0xd92626,
        roughness: isGhost ? 0.15 : 0.35,
        metalness: isGhost ? 0.85 : 0.25,
        wireframe: isWire,
        transparent: isGhost || !isIsolated('ignition'),
        opacity: isGhost ? 0.22 : getAlpha('ignition'),
        depthWrite: !isGhost,
        clippingPlanes: activeClippingPlanes
      }),
      sparkPlugWhite: new THREE.MeshStandardMaterial({
        color: isGhost ? 0x7dd3fc : 0xffffff,
        roughness: 0.12,
        metalness: 0.08,
        wireframe: isWire,
        transparent: isGhost || !isIsolated('ignition'),
        opacity: isGhost ? 0.25 : getAlpha('ignition'),
        depthWrite: !isGhost,
        clippingPlanes: activeClippingPlanes
      }),
      oilPumpBronze: new THREE.MeshStandardMaterial({
        color: isGhost ? 0x0284c7 : 0xb45309,
        roughness: 0.34,
        metalness: 0.82,
        wireframe: isWire,
        transparent: isGhost || !isIsolated('lubrication'),
        opacity: isGhost ? 0.20 : getAlpha('lubrication'),
        depthWrite: !isGhost,
        clippingPlanes: activeClippingPlanes
      }),
      filterBlue: new THREE.MeshStandardMaterial({
        color: isDrawing ? 0x153155 : isGhost ? 0x0284c7 : 0x1d4ed8,
        roughness: 0.28,
        metalness: 0.5,
        wireframe: isWire,
        transparent: isGhost || !isIsolated('lubrication'),
        opacity: isGhost ? 0.20 : getAlpha('lubrication'),
        depthWrite: !isGhost,
        clippingPlanes: activeClippingPlanes
      }),
      coolingAlum: new THREE.MeshStandardMaterial({
        color: isDrawing ? 0x142f50 : isGhost ? 0x38bdf8 : 0x94a3b8,
        roughness: isGhost ? 0.15 : 0.38,
        metalness: isGhost ? 0.85 : 0.65,
        wireframe: isWire,
        transparent: isGhost || !isIsolated('cooling'),
        opacity: isGhost ? 0.18 : getAlpha('cooling'),
        depthWrite: !isGhost,
        clippingPlanes: activeClippingPlanes
      }),
      beltsBlack: new THREE.MeshStandardMaterial({
        color: isDrawing ? 0x0c1e33 : isGhost ? 0x1e293b : 0x14171a,
        roughness: 0.85,
        metalness: 0.05,
        wireframe: isWire,
        transparent: isGhost || !isIsolated('cooling'),
        opacity: isGhost ? 0.20 : getAlpha('cooling'),
        depthWrite: !isGhost,
        clippingPlanes: activeClippingPlanes
      }),
      fuelBlueAnodized: new THREE.MeshStandardMaterial({
        color: isGhost ? 0x38bdf8 : 0x0284c7,
        roughness: 0.2,
        metalness: 0.88,
        wireframe: isWire,
        transparent: isGhost || !isIsolated('fuel'),
        opacity: isGhost ? 0.22 : getAlpha('fuel'),
        depthWrite: !isGhost,
        clippingPlanes: activeClippingPlanes
      }),
      starterDark: new THREE.MeshStandardMaterial({
        color: isDrawing ? 0x102540 : isGhost ? 0x1e3a5f : 0x1e293b,
        roughness: isGhost ? 0.15 : 0.35,
        metalness: isGhost ? 0.85 : 0.82,
        wireframe: isWire,
        transparent: isGhost || !isIsolated('starter'),
        opacity: isGhost ? 0.20 : getAlpha('starter'),
        depthWrite: !isGhost,
        clippingPlanes: activeClippingPlanes
      }),
      techEdgeLine: new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: isDrawing ? 0.95 : 0.45
      }),
      billetAlum: new THREE.MeshPhysicalMaterial({
        color: isStress ? 0x3b82f6 : isThermal ? 0xfb923c : isDrawing ? 0x18375f : isGhost ? 0x0ea5e9 : 0xdbe2e9,
        map: isDrawing || isGhost || analysisMode !== 'none' ? null : textures.machinedSwirl,
        roughness: isGhost ? 0.15 : 0.22,
        metalness: isGhost ? 0.85 : 0.86,
        anisotropy: 0.55,
        wireframe: isWire,
        transparent: isGhost || !isIsolated('valvetrain'),
        opacity: isGhost ? 0.18 : getAlpha('valvetrain'),
        depthWrite: !isGhost,
        clippingPlanes: activeClippingPlanes
      }),
      carbGoldZinc: new THREE.MeshPhysicalMaterial({
        color: isDrawing ? 0x1c3f6b : isGhost ? 0x38bdf8 : 0xc9a24b,
        roughness: isGhost ? 0.15 : 0.28,
        metalness: isGhost ? 0.85 : 0.82,
        wireframe: isWire,
        transparent: isGhost || !isIsolated('fuel'),
        opacity: isGhost ? 0.20 : isIsolated('all') ? 1.0 : getAlpha('fuel'),
        depthWrite: !isGhost,
        clippingPlanes: activeClippingPlanes
      }),
      copperWinding: new THREE.MeshStandardMaterial({
        color: isGhost ? 0x38bdf8 : 0xc26d27,
        roughness: 0.26,
        metalness: 0.88,
        wireframe: isWire,
        transparent: isGhost,
        opacity: isGhost ? 0.22 : 1.0,
        depthWrite: !isGhost,
        clippingPlanes: activeClippingPlanes
      }),
      braidedStainless: new THREE.MeshStandardMaterial({
        map: isGhost ? null : textures.braidedSteelMap,
        color: isGhost ? 0x7dd3fc : 0xe2e8f0,
        roughness: 0.36,
        metalness: 0.72,
        wireframe: isWire,
        transparent: isGhost,
        opacity: isGhost ? 0.25 : 1.0,
        depthWrite: !isGhost
      }),
      coilBlue: new THREE.MeshPhysicalMaterial({
        color: isDrawing ? 0x0284c7 : isGhost ? 0x38bdf8 : 0x1d4ed8,
        roughness: 0.26,
        metalness: 0.58,
        clearcoat: 0.45,
        wireframe: isWire,
        transparent: isGhost || !isIsolated('ignition'),
        opacity: isGhost ? 0.22 : getAlpha('ignition'),
        depthWrite: !isGhost,
        clippingPlanes: activeClippingPlanes
      }),
      chassisBlack: new THREE.MeshStandardMaterial({
        color: isDrawing ? 0x1b3452 : isGhost ? 0x1e3a5f : 0x1a1e24,
        roughness: 0.48,
        metalness: 0.48,
        wireframe: isWire,
        transparent: isGhost,
        opacity: isGhost ? 0.18 : 1.0,
        depthWrite: !isGhost,
        clippingPlanes: activeClippingPlanes
      }),
      anodizedBlack: new THREE.MeshStandardMaterial({
        color: isGhost ? 0x1e293b : 0x181c22,
        roughness: 0.30,
        metalness: 0.76,
        wireframe: isWire,
        transparent: isGhost,
        opacity: isGhost ? 0.20 : 1.0,
        depthWrite: !isGhost,
        clippingPlanes: activeClippingPlanes
      }),
      anRed: new THREE.MeshStandardMaterial({
        color: isGhost ? 0x38bdf8 : 0xdc2626,
        roughness: 0.24,
        metalness: 0.84,
        wireframe: isWire,
        transparent: isGhost,
        opacity: isGhost ? 0.25 : 1.0,
        depthWrite: !isGhost,
        clippingPlanes: activeClippingPlanes
      }),
      radiatorFin: new THREE.MeshStandardMaterial({
        map: isGhost ? null : textures.radiatorCoreMap,
        color: isGhost ? 0x38bdf8 : 0xd8dee6,
        roughness: 0.38,
        metalness: 0.76,
        wireframe: isWire,
        transparent: isGhost,
        opacity: isGhost ? 0.18 : 1.0,
        depthWrite: !isGhost,
        clippingPlanes: activeClippingPlanes
      }),
      oilPanCoat: new THREE.MeshStandardMaterial({
        color: isDrawing ? 0x102540 : isGhost ? 0x0369a1 : 0xd83b01,
        roughness: isGhost ? 0.15 : 0.46,
        metalness: isGhost ? 0.85 : 0.35,
        wireframe: isWire,
        transparent: isGhost || !isIsolated('lubrication'),
        opacity: isGhost ? 0.18 : isIsolated('all') ? 1.0 : getAlpha('lubrication'),
        depthWrite: !isGhost,
        clippingPlanes: activeClippingPlanes
      }),
      timingCoverAlum: new THREE.MeshPhysicalMaterial({
        color: isDrawing ? 0x142f50 : isGhost ? 0x38bdf8 : 0xd2d9e1,
        map: isDrawing || isGhost || analysisMode !== 'none' ? null : textures.machinedSwirl,
        roughness: isGhost ? 0.15 : 0.26,
        metalness: isGhost ? 0.85 : 0.84,
        wireframe: isWire,
        transparent: isGhost || !isIsolated('all'),
        opacity: isGhost ? 0.18 : getAlpha('all'),
        depthWrite: !isGhost,
        clippingPlanes: activeClippingPlanes
      })
    };

    const engineGroup = new THREE.Group();
    const parts: Record<string, THREE.Object3D> = {};

    const crankCenterY = -1.0;
    const boreRadius = (config.bore / 4.000) * 1.02;
    const crankRadius = (config.stroke / 3.480) * 0.64;
    const scaledRodLen = crankRadius * (config.rodLength / (config.stroke * 0.5));
    const journalZ = [-3.9, -1.3, 1.3, 3.9];
    const crankPhases = [0, Math.PI / 2, (3 * Math.PI) / 2, Math.PI];

    // 1. Block Casting
    const blockGroup = new THREE.Group();
    const blockCasting = new THREE.Mesh(createV8BlockProfileGeometry(11.4), mats.chevyBlock);
    blockCasting.position.y = -0.2;
    blockCasting.castShadow = true;
    blockCasting.receiveShadow = true;
    blockCasting.userData = {
      name: 'SBC 350 Cast-Iron 4-Bolt Main Block (GM 10243880)',
      category: 'Engine Block',
      desc: `90° V8 sand-cast iron block. Deck height: ${config.deckHeight.toFixed(3)}" | Bore: ${config.bore.toFixed(3)}" | Quench: ${specs.quenchDistance}".`,
      torque: 'Main Caps: 70 ft-lbs (inner) / 65 ft-lbs (splayed outer)',
      partNumber: 'GM-10243880'
    };
    blockGroup.add(blockCasting);

    for (let m = 0; m < 5; m++) {
      const capZ = -5.2 + m * 2.6;
      const capBridge = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.15, 0.85), mats.machinedDeck);
      capBridge.position.set(0, -1.85, capZ);
      blockGroup.add(capBridge);

      [-0.85, 0.85].forEach((xOff) => {
        const innerBolt = createARP12PointBolt(0.11, 1.2, mats.arpBlackOxide);
        innerBolt.position.set(xOff, -2.42, capZ);
        innerBolt.rotation.x = Math.PI;
        blockGroup.add(innerBolt);
      });
      [-1.42, 1.42].forEach((xOff, i) => {
        const splayedBolt = createARP12PointBolt(0.10, 1.25, mats.arpBlackOxide);
        splayedBolt.position.set(xOff, -2.35, capZ);
        splayedBolt.rotation.z = i === 0 ? -0.28 : 0.28;
        splayedBolt.rotation.x = Math.PI;
        blockGroup.add(splayedBolt);
      });
    }

    [-1, 1].forEach((side) => {
      [-3.5, 0, 3.5].forEach((zPlug) => {
        const freezePlug = new THREE.Mesh(
          new THREE.CylinderGeometry(0.46, 0.44, 0.16, 20),
          mats.brassBronze
        );
        freezePlug.rotation.z = Math.PI / 2;
        freezePlug.position.set(side * 3.35, -0.45, zPlug);
        freezePlug.userData = {
          name: '1-5/8" Brass Core Freeze Plug',
          category: 'Engine Block',
          desc: 'Deep-cup brass expansion core plug sealed with Permatex #2.'
        };
        blockGroup.add(freezePlug);
      });

      for (let c = 0; c < 4; c++) {
        const zOff = journalZ[c] + (side === 1 ? 0.22 : -0.22);
        const bankRot = -side * (Math.PI / 4);
        const sleeve = new THREE.Mesh(
          new THREE.CylinderGeometry(boreRadius + 0.04, boreRadius + 0.04, 2.75, 28, 1, true),
          mats.sleeveBore
        );
        const midDist = 2.05;
        sleeve.position.set(
          -Math.sin(bankRot) * midDist,
          crankCenterY + Math.cos(bankRot) * midDist,
          zOff
        );
        sleeve.rotation.z = bankRot;
        blockGroup.add(sleeve);
      }

      const bankRot = -side * (Math.PI / 4);
      const deckDist = 3.22;
      const deckPlate = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 0.14, 11.4),
        mats.machinedDeck
      );
      deckPlate.position.set(
        -Math.sin(bankRot) * deckDist,
        crankCenterY + Math.cos(bankRot) * deckDist,
        0
      );
      deckPlate.rotation.z = bankRot;
      blockGroup.add(deckPlate);

      const headGasket = new THREE.Mesh(
        new THREE.BoxGeometry(3.15, 0.07, 11.35),
        mats.felProCopper
      );
      headGasket.position.set(
        -Math.sin(bankRot) * (deckDist + 0.11),
        crankCenterY + Math.cos(bankRot) * (deckDist + 0.11),
        0
      );
      headGasket.rotation.z = bankRot;
      headGasket.userData = {
        name: `Fel-Pro 1003 Head Gasket (${config.gasketThickness.toFixed(3)}" Compressed)`,
        category: 'Sealing & Quench',
        desc: `Pre-flattened copper wire ring armor. Sets total quench to ${specs.quenchDistance}".`,
        partNumber: 'FEL-1003'
      };
      blockGroup.add(headGasket);

      const mountBoss = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.82, 1.35),
        mats.chevyBlock
      );
      mountBoss.position.set(side * 3.15, -1.35, 0.55);
      blockGroup.add(mountBoss);
    });

    engineGroup.add(blockGroup);
    parts.block = blockGroup;

    // Timing Cover
    const timingCoverGroup = createTimingCoverGroup(
      mats.timingCoverAlum,
      mats.beltsBlack,
      mats.arpBlackOxide,
      mats.chromePolish
    );
    timingCoverGroup.position.set(0, 0, 6.28);
    timingCoverGroup.userData = {
      name: 'Billet Aluminum Timing Chain Cover & TDC Pointer',
      category: 'Engine Block',
      desc: 'CNC aluminum front timing cover enclosing double-roller timing drive with adjustable 0° TDC pointer.',
      torque: 'Timing Cover Bolts: 12 ft-lbs',
      partNumber: 'SUM-G6320'
    };
    engineGroup.add(timingCoverGroup);
    parts.timingCover = timingCoverGroup;

    // Oil Pan
    const oilPanGroup = createDetailedOilPanGroup(
      mats.oilPanCoat,
      mats.anodizedBlack,
      mats.arpBlackOxide,
      mats.brassBronze,
      mats.chromePolish,
      mats.valveSpringsGold
    );
    oilPanGroup.userData = {
      name: 'SBC 6-Quart Deep-Sump Baffled Oil Pan & Dipstick',
      category: 'Lubrication',
      desc: 'Baffled performance sump with 3/8" pickup clearance, magnetic drain plug, and chrome dipstick tube.',
      torque: 'Oil Pan Rail Bolts: 12 ft-lbs (corner nuts 15 ft-lbs)',
      partNumber: 'MIL-30900'
    };
    engineGroup.add(oilPanGroup);
    parts.oilPan = oilPanGroup;

    // 2. Crankshaft Assembly
    const crankGroup = new THREE.Group();
    crankGroup.position.set(0, crankCenterY, 0);

    for (let m = 0; m < 5; m++) {
      const mj = new THREE.Mesh(
        new THREE.CylinderGeometry(0.56, 0.56, 0.88, 22),
        mats.crankForged
      );
      mj.rotation.x = Math.PI / 2;
      mj.position.z = -5.2 + m * 2.6;
      crankGroup.add(mj);
    }

    const frontSnout = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.48, 2.3, 20),
      mats.crankForged
    );
    frontSnout.rotation.x = Math.PI / 2;
    frontSnout.position.z = 6.35;
    crankGroup.add(frontSnout);

    const cwGeo = createCounterweightGeometry(1.55, 0.36);
    journalZ.forEach((zPin, idx) => {
      const phase = crankPhases[idx];
      const px = crankRadius * Math.sin(phase);
      const py = crankRadius * Math.cos(phase);

      const rodJournal = new THREE.Mesh(
        new THREE.CylinderGeometry(0.44, 0.44, 1.15, 22),
        mats.crankForged
      );
      rodJournal.rotation.x = Math.PI / 2;
      rodJournal.position.set(px, py, zPin);
      rodJournal.userData = {
        name: `Scat 4340 Forged Crankshaft (Throw #${idx + 1})`,
        category: 'Rotating Assembly',
        desc: `Stroke: ${config.stroke.toFixed(3)}" | 2.450" Mains / 2.100" Rod Journals | Cross-plane 90° throw phasing.`,
        torque: 'Harmonic Damper Bolt: 85 ft-lbs | Flexplate Bolts: 65 ft-lbs',
        partNumber: 'SCA-43500'
      };
      crankGroup.add(rodJournal);

      [-0.78, 0.78].forEach((zOff) => {
        const cw = new THREE.Mesh(cwGeo, mats.machinedInternal);
        cw.position.z = zPin + zOff;
        cw.rotation.z = -phase;
        const drill = new THREE.Mesh(
          new THREE.CylinderGeometry(0.16, 0.16, 0.4, 12),
          mats.arpBlackOxide
        );
        drill.rotation.x = Math.PI / 2;
        drill.position.set(0.42, -1.05, 0);
        cw.add(drill);
        crankGroup.add(cw);
      });
    });

    const crankSprocket = new THREE.Mesh(
      createGearGeometry(0.68, 22, 0.38, 0.35, 0.12),
      mats.arpBlackOxide
    );
    crankSprocket.position.z = 5.95;
    crankGroup.add(crankSprocket);

    const damperHub = new THREE.Mesh(
      new THREE.CylinderGeometry(1.42, 1.42, 0.88, 32),
      mats.damperTiming
    );
    damperHub.rotation.x = Math.PI / 2;
    damperHub.position.z = 6.90;
    damperHub.userData = {
      name: 'ATI Super Damper SFI 18.1 Harmonic Balancer',
      category: 'Rotating Assembly',
      desc: `6.78" OD elastomer inertia ring with engraved timing scale.`,
      torque: 'Crank Snout ARP Bolt: 85 ft-lbs',
      partNumber: 'ATI-917781'
    };
    crankGroup.add(damperHub);

    const flexplate = new THREE.Mesh(
      createGearGeometry(2.65, 64, 0.24, 0.55, 0.11),
      mats.machinedInternal
    );
    flexplate.position.z = -6.05;
    flexplate.userData = {
      name: '168-Tooth SFI 29.1 Forged Flexplate / Flywheel',
      category: 'Driveline Interface',
      desc: '14.13" OD 168-tooth starter ring gear, internal neutral balance.',
      torque: 'ARP Flywheel Bolts: 74 ft-lbs w/ Red Loctite',
      partNumber: 'TCI-399173'
    };
    crankGroup.add(flexplate);

    if (inductionDress === 'mpfi_cnp') {
      const triggerWheel = new THREE.Mesh(
        createCrankTriggerWheelGeometry(1.62, 60, 2, 0.18, 0.65),
        mats.machinedInternal
      );
      triggerWheel.position.z = 7.36;
      triggerWheel.userData = {
        name: '60-2 CNC Billet Crank Trigger Reluctor Wheel',
        category: 'Ignition & Timing',
        desc: '60-tooth precision crank wheel with 2-tooth missing TDC index gap for sequential EFI timing.',
        torque: 'Damper Center Bolt: 85 ft-lbs',
        partNumber: 'HOL-556-112'
      };
      crankGroup.add(triggerWheel);
    }

    engineGroup.add(crankGroup);
    parts.crank = crankGroup;

    // 3. Rotating Assembly (Rods + Pistons)
    const rotatingGroup = new THREE.Group();
    const pistonNodes: Array<{
      bankRot: number;
      pinPhase: number;
      rodGroup: THREE.Group;
      pistonAsm: THREE.Group;
    }> = [];

    for (let p = 0; p < 8; p++) {
      const isRight = p % 2 === 1;
      const bankSign = isRight ? 1 : -1;
      const bankRot = -bankSign * (Math.PI / 4);
      const journalIdx = Math.floor(p / 2);
      const zPos = journalZ[journalIdx] + (isRight ? 0.22 : -0.22);
      const pinPhase = crankPhases[journalIdx];

      const bankCarrier = new THREE.Group();
      bankCarrier.position.set(0, crankCenterY, zPos);
      bankCarrier.rotation.z = bankRot;

      const rodGroup = createHBeamConnectingRod(
        scaledRodLen,
        0.44,
        0.22,
        mats.rods4340,
        mats.brassBronze,
        mats.arpBlackOxide
      );
      rodGroup.userData = {
        name: `Connecting Rod #${p + 1} (Ray's ${config.rodLength.toFixed(3)}" Spec)`,
        category: 'Connecting Rods',
        desc: `Scat 4340 Forged H-Beam ${config.rodLength.toFixed(3)}" C-to-C | Rod/Stroke ratio: ${specs.rodStrokeRatio}:1.`,
        torque: 'ARP 2000 Rod Bolts: 45 ft-lbs (0.0058" - 0.0062" stretch)',
        partNumber: 'SCA-25700'
      };
      bankCarrier.add(rodGroup);

      const pistonAsm = new THREE.Group();
      const pPts = [
        new THREE.Vector2(0.0, 0.56),
        new THREE.Vector2(boreRadius * 0.96, 0.56),
        new THREE.Vector2(boreRadius * 0.96, 0.10),
        new THREE.Vector2(boreRadius * 0.88, 0.08),
        new THREE.Vector2(boreRadius * 0.95, -0.35),
        new THREE.Vector2(boreRadius * 0.82, -0.45),
        new THREE.Vector2(0.0, -0.35)
      ];
      const pistonMesh = new THREE.Mesh(new THREE.LatheGeometry(pPts, 28), mats.pistonsAlloy);
      pistonMesh.userData = {
        name: `Forged Piston #${p + 1} (${config.pistonAlloy.toUpperCase()} Alloy)`,
        category: 'Rotating Assembly',
        desc: `Bore: ${config.bore.toFixed(3)}" | ${config.pistonReliefCc.toFixed(1)}cc valve relief | Quench: ${specs.quenchDistance}".`,
        partNumber: 'KB-115-000'
      };
      pistonAsm.add(pistonMesh);

      [0.44, 0.30, 0.16].forEach((rY, rIdx) => {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(boreRadius * 0.965, 0.032, 8, 28),
          rIdx === 0 ? mats.chromePolish : mats.arpBlackOxide
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.y = rY;
        pistonAsm.add(ring);
      });

      const wristPin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.20, 0.20, boreRadius * 1.65, 16),
        mats.wristPins
      );
      wristPin.rotation.x = Math.PI / 2;
      pistonAsm.add(wristPin);

      bankCarrier.add(pistonAsm);
      rotatingGroup.add(bankCarrier);
      pistonNodes.push({ bankRot, pinPhase, rodGroup, pistonAsm });
    }
    engineGroup.add(rotatingGroup);
    parts.rotating = rotatingGroup;

    // 4. Camshaft & Valvetrain Drive
    const camGroup = new THREE.Group();
    const camY = 1.05;

    const camCore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.36, 11.8, 18),
      mats.rods4340
    );
    camCore.rotation.x = Math.PI / 2;
    camCore.position.set(0, camY, 0.2);
    camCore.userData = {
      name: `Hydraulic Roller Camshaft (${specs.camData.name})`,
      category: 'Valvetrain',
      desc: `Intake: ${specs.camData.intakeDur050}° | Exh: ${specs.camData.exhDur050}° @ .050" | Lobe Lift: ${specs.camData.lobeLift}".`,
      partNumber: 'CCA-CL12-422-8'
    };
    camGroup.add(camCore);

    const camDistGear = new THREE.Mesh(
      createGearGeometry(0.56, 14, 0.38, 0.36, 0.10),
      mats.brassBronze
    );
    camDistGear.position.set(0, camY, -4.85);
    camGroup.add(camDistGear);

    const camSprocket = new THREE.Mesh(
      createGearGeometry(1.36, 44, 0.38, 0.36, 0.12),
      mats.arpBlackOxide
    );
    camSprocket.position.set(0, camY, 5.95);
    camGroup.add(camSprocket);

    const chainPoints: THREE.Vector3[] = [];
    const chainZ = 5.95;
    for (let i = 0; i <= 16; i++) {
      const a = (i / 16) * Math.PI;
      chainPoints.push(new THREE.Vector3(Math.cos(a) * 1.42, camY + Math.sin(a) * 1.42, chainZ));
    }
    for (let i = 0; i <= 16; i++) {
      const a = Math.PI + (i / 16) * Math.PI;
      chainPoints.push(new THREE.Vector3(Math.cos(a) * 0.74, crankCenterY + Math.sin(a) * 0.74, chainZ));
    }
    const chainCurve = new THREE.CatmullRomCurve3(chainPoints, true);
    const timingChain = new THREE.Mesh(
      new THREE.TubeGeometry(chainCurve, 48, 0.14, 8, true),
      mats.crankForged
    );
    camGroup.add(timingChain);

    // 5. Cylinder Heads & Pushrod Valvetrain
    const headsGroup = new THREE.Group();
    const headShape = new THREE.Shape();
    headShape.moveTo(-1.55, -1.05);
    headShape.lineTo(1.55, -1.05);
    headShape.lineTo(1.55, 0.72);
    headShape.lineTo(0.82, 1.12);
    headShape.lineTo(-0.92, 1.12);
    headShape.lineTo(-1.55, 0.55);
    headShape.closePath();

    const headGeo = new THREE.ExtrudeGeometry(headShape, {
      depth: 11.4,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.06,
      bevelSegments: 2
    });
    headGeo.translate(0, 0, -5.7);

    const lobeGeo = createCamLobeGeometry(0.42, 0.28, 0.30);
    const springGeo = createHelicalSpringGeometry(0.28, 0.055, 0.88, 6);
    const valvetrainNodes: Array<{
      lobe: THREE.Mesh;
      lifter: THREE.Mesh;
      pushrod: THREE.Mesh;
      pushrodBasePos: THREE.Vector3;
      pushrodAxis: THREE.Vector3;
      valve: THREE.Mesh;
      retainer: THREE.Mesh;
      spring: THREE.Mesh;
      rocker: THREE.Group;
      baseLifterPos: THREE.Vector3;
      lifterAxis: THREE.Vector3;
      baseValvePos: THREE.Vector3;
      baseRetainerPos: THREE.Vector3;
      valveAxis: THREE.Vector3;
      offset: number;
      lSide: number;
    }> = [];

    const cylFireDegLeft = [0, 270, 450, 540];
    const cylFireDegRight = [90, 180, 360, 630];
    const upVec = new THREE.Vector3(0, 1, 0);

    [-1, 1].forEach((side) => {
      const headSub = new THREE.Group();
      const bankRot = -side * (Math.PI / 4);
      const headDist = 4.45;
      const headOrigin = new THREE.Vector3(
        -Math.sin(bankRot) * headDist,
        crankCenterY + Math.cos(bankRot) * headDist,
        0
      );
      headSub.position.copy(headOrigin);
      headSub.rotation.z = bankRot;

      const headMesh = new THREE.Mesh(headGeo, mats.aluminumHeads);
      headMesh.castShadow = true;
      headMesh.userData = {
        name: `23° CNC Aluminum Cylinder Head (${side === 1 ? 'Right / Pass' : 'Left / Driver'})`,
        category: 'Cylinder Heads',
        desc: `4.400" Bore Spacing | Chamber: ${config.chamberCc.toFixed(1)}cc | Static CR: ${specs.staticCR}:1.`,
        torque: '17 Head Bolts: 25 ➔ 45 ➔ 70 ft-lbs',
        partNumber: 'EDL-5089'
      };
      headSub.add(headMesh);

      const studGirdle = createStudGirdleBarGroup(mats.billetRockersBlue, mats.valvesSteel);
      studGirdle.position.set(-side * 0.22, 1.82, side * 0.22);
      headSub.add(studGirdle);

      const valveAxisHead = new THREE.Vector3(side * Math.sin(0.14), Math.cos(0.14), 0).normalize();
      const headRotQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), bankRot);

      for (let jIdx = 0; jIdx < 4; jIdx++) {
        const cylZ = journalZ[jIdx] + (side === 1 ? 0.22 : -0.22);
        const cylNum = side === -1 ? jIdx * 2 + 1 : jIdx * 2 + 2;
        const fireDeg = side === -1 ? cylFireDegLeft[jIdx] : cylFireDegRight[jIdx];

        for (let vIdx = 0; vIdx < 2; vIdx++) {
          const isIntake = jIdx % 2 === 0 ? vIdx === 1 : vIdx === 0;
          const valveZ = cylZ + (vIdx === 0 ? -0.34 : 0.34);
          const camOffset = -((fireDeg * 0.5) * Math.PI) / 180 + (isIntake ? 0.35 : -1.45);

          const valveHeadRad = isIntake ? 0.42 : 0.34;
          const valve = new THREE.Mesh(
            new THREE.CylinderGeometry(0.072, valveHeadRad, 2.15, 16),
            mats.valvesSteel
          );
          const baseValvePos = new THREE.Vector3(side * 0.11, 0.38, valveZ);
          valve.position.copy(baseValvePos);
          valve.rotation.z = -side * 0.14;
          valve.userData = {
            name: `${isIntake ? '2.02" Intake' : '1.60" Exhaust'} Stainless Valve (Cyl #${cylNum})`,
            category: 'Valvetrain',
            desc: `Net Lift: ${specs.totalValveLift}" | ${specs.camData.intakeDur050}°/${specs.camData.exhDur050}° @ .050".`
          };
          headSub.add(valve);

          const spring = new THREE.Mesh(springGeo, mats.valveSpringsGold);
          spring.position.set(side * 0.20, 0.98, valveZ);
          spring.rotation.z = -side * 0.14;
          headSub.add(spring);

          const retainer = new THREE.Mesh(
            new THREE.CylinderGeometry(0.29, 0.23, 0.11, 16),
            mats.machinedInternal
          );
          const baseRetainerPos = new THREE.Vector3(side * 0.25, 1.39, valveZ);
          retainer.position.copy(baseRetainerPos);
          retainer.rotation.z = -side * 0.14;
          headSub.add(retainer);

          const rocker = createRollerRockerGroup(mats.billetRockersBlue, mats.valvesSteel);
          rocker.position.set(-side * 0.22, 1.54, valveZ);
          rocker.scale.x = side;
          headSub.add(rocker);

          const lobe = new THREE.Mesh(lobeGeo, mats.machinedInternal);
          lobe.position.set(0, camY, valveZ);
          lobe.rotation.z = camOffset;
          camGroup.add(lobe);

          const lifterAxis = new THREE.Vector3(side * Math.SQRT1_2, Math.SQRT1_2, 0).normalize();
          const baseLifterPos = new THREE.Vector3(side * 0.51, 1.56, valveZ);
          const lifter = new THREE.Mesh(
            new THREE.CylinderGeometry(0.20, 0.20, 0.84, 14),
            mats.machinedInternal
          );
          lifter.position.copy(baseLifterPos);
          lifter.rotation.z = -side * (Math.PI / 4);
          camGroup.add(lifter);

          const lifterTopWorld = baseLifterPos.clone().addScaledVector(lifterAxis, 0.40);
          const cupLocalHead = new THREE.Vector3(-side * 0.64, 1.49, valveZ);
          const cupWorld = cupLocalHead.clone().applyQuaternion(headRotQuat).add(headOrigin);
          const pushrodVec = cupWorld.clone().sub(lifterTopWorld);
          const pushrodLen = pushrodVec.length();
          const pushrodDir = pushrodVec.clone().normalize();
          const pushrodBasePos = lifterTopWorld.clone().lerp(cupWorld, 0.5);

          const pushrod = new THREE.Mesh(
            new THREE.CylinderGeometry(0.068, 0.068, pushrodLen, 10),
            mats.crankForged
          );
          pushrod.position.copy(pushrodBasePos);
          pushrod.quaternion.setFromUnitVectors(upVec, pushrodDir);
          camGroup.add(pushrod);

          valvetrainNodes.push({
            lobe,
            lifter,
            pushrod,
            pushrodBasePos,
            pushrodAxis: pushrodDir,
            valve,
            retainer,
            spring,
            rocker,
            baseLifterPos,
            lifterAxis,
            baseValvePos,
            baseRetainerPos,
            valveAxis: valveAxisHead,
            offset: camOffset,
            lSide: side
          });
        }
      }

      const hollowValveCover = createHollowValveCoverGroup(
        side,
        mats.valveCoverBody,
        mats.valveCoverFin,
        mats.arpBlackOxide,
        mats.chromePolish
      );
      hollowValveCover.userData = {
        name: `Hollow Finned Racing Valve Cover (${side === 1 ? 'Right' : 'Left'})`,
        category: 'Valvetrain',
        desc: 'Finned aluminum cover clearing roller rockers and blue stud girdle.'
      };
      headSub.add(hollowValveCover);

      const headerFlange = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.92, 10.8),
        mats.headerCeramic
      );
      headerFlange.position.set(side * 1.68, -0.15, 0);
      headSub.add(headerFlange);

      for (let pIdx = 0; pIdx < 4; pIdx++) {
        const portZ = journalZ[pIdx] + (side === 1 ? 0.22 : -0.22);
        const collectorZ = -3.8;
        const primaryCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(side * 1.72, -0.15, portZ),
          new THREE.Vector3(side * 3.15, -0.55, portZ * 0.75 - 0.5),
          new THREE.Vector3(side * 3.45, -2.15, (portZ + collectorZ) * 0.5),
          new THREE.Vector3(side * 2.75, -3.55, collectorZ)
        ]);
        const primaryTube = new THREE.Mesh(
          new THREE.TubeGeometry(primaryCurve, 18, 0.28, 10, false),
          mats.headerCeramic
        );
        headSub.add(primaryTube);
      }

      const collector = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.55, 2.35, 16),
        mats.headerCeramic
      );
      collector.rotation.x = Math.PI / 2;
      collector.position.set(side * 2.75, -3.55, -4.75);
      headSub.add(collector);

      headsGroup.add(headSub);
    });

    engineGroup.add(camGroup);
    parts.cam = camGroup;
    engineGroup.add(headsGroup);
    parts.heads = headsGroup;

    // 6. Intake Manifold & Fuel System
    const intakeGroup = new THREE.Group();
    const isTunnelRam = config.selectedIntake === 'tunnelram_dual';
    const isSinglePlane = config.selectedIntake === 'singleplane_victor';

    for (let r = 0; r < 8; r++) {
      const rSide = r % 2 === 0 ? 1 : -1;
      const rZ = -3.9 + Math.floor(r / 2) * 2.6 + (rSide === 1 ? 0.22 : -0.22);
      const runner = new THREE.Mesh(
        new THREE.BoxGeometry(1.75, 0.56, 0.86),
        mats.billetAlum
      );
      runner.position.set(
        rSide * 1.15,
        isSinglePlane ? 3.05 : 2.76 + (r % 2) * 0.12,
        rZ
      );
      runner.rotation.z = -rSide * 0.22;
      intakeGroup.add(runner);
    }

    const efiRailsGroup = new THREE.Group();

    if (inductionDress === 'mpfi_cnp' && !isTunnelRam) {
      const valleyPlenum = new THREE.Mesh(
        new THREE.BoxGeometry(2.75, 0.68, 9.6),
        mats.billetAlum
      );
      valleyPlenum.position.set(0, 2.58, 0);
      valleyPlenum.userData = {
        name: `${specs.intakeData.name} (MPFI Conversion)`,
        category: 'Induction',
        desc: `Sequential Port EFI | Flow: ${specs.intakeData.flowCfm} CFM.`,
        torque: 'Intake Bolts: 30 ft-lbs',
        partNumber: specs.intakeData.id
      };
      intakeGroup.add(valleyPlenum);

      const tbHousing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.95, 1.05, 1.15, 24),
        mats.billetAlum
      );
      tbHousing.rotation.x = Math.PI / 2;
      tbHousing.position.set(0, 2.68, 5.25);
      tbHousing.userData = {
        name: `90mm CNC Billet EFI Throttle Body (850 CFM Rated)`,
        category: 'Induction',
        desc: `CNC 6061-T6 throttle body feeding ${specs.peakCfmDemand} CFM demand.`
      };
      intakeGroup.add(tbHousing);

      [-1.55, 1.55].forEach((railX, rBank) => {
        const fuelRail = new THREE.Mesh(
          new THREE.BoxGeometry(0.42, 0.42, 9.4),
          rBank === 0 ? mats.anodizedBlack : mats.fuelBlueAnodized
        );
        fuelRail.position.set(railX, 3.68, 0);
        fuelRail.userData = {
          name: `Billet High-Flow MPFI Fuel Rail (${rBank === 0 ? 'Left' : 'Right'} Bank)`,
          category: 'Fuel System',
          desc: 'CNC -8 AN bored fuel rail with 8x 42 lb/hr port injectors.'
        };
        efiRailsGroup.add(fuelRail);

        for (let inj = 0; inj < 4; inj++) {
          const iz = journalZ[inj] + (rBank === 1 ? 0.22 : -0.22);
          const injector = new THREE.Mesh(
            new THREE.CylinderGeometry(0.14, 0.12, 0.85, 12),
            mats.anodizedBlack
          );
          injector.position.set(railX * 0.92, 3.22, iz);
          injector.rotation.z = rBank === 1 ? -0.26 : 0.26;
          efiRailsGroup.add(injector);
        }
      });
    } else {
      const manifoldBase = new THREE.Mesh(
        new THREE.BoxGeometry(3.05, isTunnelRam ? 2.1 : 1.08, 9.4),
        mats.aluminumHeads
      );
      manifoldBase.position.set(0, isTunnelRam ? 3.55 : 2.98, 0);
      manifoldBase.userData = {
        name: specs.intakeData.name,
        category: 'Induction',
        desc: `Style: ${specs.intakeData.style} | Flow: ${specs.intakeData.flowCfm} CFM.`,
        torque: 'Intake Bolts: 30 ft-lbs',
        partNumber: specs.intakeData.id
      };
      intakeGroup.add(manifoldBase);

      const plenumPad = new THREE.Mesh(
        new THREE.BoxGeometry(2.25, 0.42, 2.35),
        mats.billetAlum
      );
      plenumPad.position.set(0, isTunnelRam ? 4.72 : 3.62, 0);
      intakeGroup.add(plenumPad);

      const carbOffsetsZ = isTunnelRam ? [-1.85, 1.85] : [0];
      carbOffsetsZ.forEach((cz) => {
        const holleyCarb = createHolley4150CarburetorGroup(
          mats.carbGoldZinc,
          mats.billetAlum,
          mats.anodizedBlack,
          mats.brassBronze,
          mats.anRed,
          mats.fuelBlueAnodized,
          mats.braidedStainless
        );
        holleyCarb.position.set(0, isTunnelRam ? 5.65 : 4.66, cz);
        holleyCarb.userData = {
          name: `Holley 4150 Double-Pumper (${config.carbCfm} CFM)`,
          category: 'Induction',
          desc: `4-barrel mechanical secondaries | Target AFR: ${config.targetAFR}:1.`,
          partNumber: `HLY-0-4779-${config.carbCfm}`
        };
        intakeGroup.add(holleyCarb);
      });
    }

    engineGroup.add(efiRailsGroup);
    parts.efiRails = efiRailsGroup;
    engineGroup.add(intakeGroup);
    parts.intake = intakeGroup;

    // 7. Ignition System
    const ignitionGroup = new THREE.Group();

    if (inductionDress === 'mpfi_cnp' && !isTunnelRam) {
      const hallBracket = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, 0.32, 0.42),
        mats.billetAlum
      );
      hallBracket.position.set(-1.78, crankCenterY + 0.38, 7.22);
      hallBracket.rotation.z = -0.35;
      ignitionGroup.add(hallBracket);

      const hallSensor = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 0.72, 12),
        mats.anodizedBlack
      );
      hallSensor.rotation.z = Math.PI / 2 - 0.25;
      hallSensor.position.set(-1.76, crankCenterY + 0.44, 7.36);
      hallSensor.userData = {
        name: 'Hall-Effect Crankshaft Position Sensor (60-2)',
        category: 'Ignition & Timing',
        desc: `0.040" air gap to 60-2 billet trigger wheel | Total Timing: ${config.ignitionTiming}° BTDC.`,
        partNumber: 'HOL-554-118'
      };
      ignitionGroup.add(hallSensor);

      const coilBracket = new THREE.Mesh(
        new THREE.BoxGeometry(1.15, 0.18, 8.8),
        mats.billetAlum
      );
      coilBracket.position.set(0, 3.04, 0);
      ignitionGroup.add(coilBracket);

      for (let c = 0; c < 4; c++) {
        const cz = -3.3 + c * 2.2;
        const coilBlock = new THREE.Mesh(
          new THREE.BoxGeometry(1.05, 0.82, 1.35),
          mats.coilBlue
        );
        coilBlock.position.set(0, 3.52, cz);
        coilBlock.userData = {
          name: `High-Output Blue Coil-Near-Plug Pack #${c + 1}`,
          category: 'Ignition',
          desc: `IGN-1A smart coil pack | Digital timing advance: ${config.ignitionTiming}° BTDC.`,
          partNumber: 'MSD-82878'
        };
        ignitionGroup.add(coilBlock);
      }
    } else {
      const distShaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.28, 3.1, 16),
        mats.crankForged
      );
      distShaft.position.set(0, 2.65, -4.85);
      ignitionGroup.add(distShaft);

      const distHousing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.68, 0.48, 0.85, 18),
        mats.machinedInternal
      );
      distHousing.position.set(0, 3.85, -4.85);
      ignitionGroup.add(distHousing);

      const distCap = new THREE.Mesh(
        new THREE.CylinderGeometry(1.02, 1.10, 1.25, 22),
        mats.ignitionRed
      );
      distCap.position.set(0, 4.78, -4.85);
      distCap.userData = {
        name: 'MSD Pro-Billet HEI Distributor',
        category: 'Ignition',
        desc: `Mechanical centrifugal advance | Total Advance: ${config.ignitionTiming}° BTDC | Firing Order: 1-8-4-3-6-5-7-2.`,
        partNumber: 'MSD-8360'
      };
      ignitionGroup.add(distCap);
    }

    for (let sp = 0; sp < 8; sp++) {
      const spSide = sp % 2 === 1 ? 1 : -1;
      const jIdx = Math.floor(sp / 2);
      const spZ = journalZ[jIdx] + (spSide === 1 ? 0.22 : -0.22);

      const plugGroup = new THREE.Group();
      plugGroup.position.set(spSide * 4.35, 2.25, spZ);
      plugGroup.rotation.z = -spSide * 0.45;

      const plugHex = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.45, 6), mats.crankForged);
      const plugCeramic = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.45, 12), mats.sparkPlugWhite);
      plugCeramic.position.y = 0.42;
      const plugBoot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.18, 0.52, 12),
        inductionDress === 'mpfi_cnp' && !isTunnelRam ? mats.anodizedBlack : mats.ignitionRed
      );
      plugBoot.position.y = 0.78;
      plugGroup.add(plugHex, plugCeramic, plugBoot);
      ignitionGroup.add(plugGroup);

      const wireCurve =
        inductionDress === 'mpfi_cnp' && !isTunnelRam
          ? new THREE.CatmullRomCurve3([
              new THREE.Vector3(spSide * 0.52, 3.65, -3.3 + jIdx * 2.2),
              new THREE.Vector3(spSide * 1.95, 3.85, spZ),
              new THREE.Vector3(spSide * 3.75, 3.45, spZ),
              new THREE.Vector3(spSide * 4.65, 2.85, spZ)
            ])
          : new THREE.CatmullRomCurve3([
              new THREE.Vector3(spSide * 0.45, 5.25, -4.85),
              new THREE.Vector3(spSide * 2.15, 4.95, -2.5 + jIdx * 0.6),
              new THREE.Vector3(spSide * 3.85, 3.65, spZ),
              new THREE.Vector3(spSide * 4.65, 2.85, spZ)
            ]);
      const wireMesh = new THREE.Mesh(
        new THREE.TubeGeometry(wireCurve, 14, 0.055, 6, false),
        inductionDress === 'mpfi_cnp' && !isTunnelRam ? mats.braidedStainless : mats.ignitionRed
      );
      ignitionGroup.add(wireMesh);
    }
    engineGroup.add(ignitionGroup);
    parts.ignition = ignitionGroup;

    // 8. Lubrication System
    const lubeGroup = new THREE.Group();
    const oilPumpBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.45, 1.55, 1.35),
      mats.oilPumpBronze
    );
    oilPumpBody.position.set(0, -2.45, -4.8);
    oilPumpBody.userData = {
      name: 'Melling M-55HV High-Volume Oil Pump',
      category: 'Lubrication',
      desc: 'High-volume pump driven via distributor hex shaft with 0.375" pickup pan clearance.',
      torque: 'Oil Pump Stud: 65 ft-lbs',
      partNumber: 'MEL-M55HV'
    };
    lubeGroup.add(oilPumpBody);

    const oilDriveShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 4.8, 6),
      mats.crankForged
    );
    oilDriveShaft.position.set(0, -0.1, -4.8);
    lubeGroup.add(oilDriveShaft);

    const pickupCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -2.7, -4.3),
      new THREE.Vector3(0, -3.35, -3.1),
      new THREE.Vector3(0, -3.65, -1.8)
    ]);
    const pickupTube = new THREE.Mesh(
      new THREE.TubeGeometry(pickupCurve, 12, 0.18, 10, false),
      mats.crankForged
    );
    lubeGroup.add(pickupTube);

    const pickupScreen = new THREE.Mesh(
      new THREE.CylinderGeometry(1.15, 1.15, 0.32, 20),
      mats.brassBronze
    );
    pickupScreen.position.set(0, -3.72, -1.7);
    pickupScreen.userData = {
      name: 'Oil Pump Pickup Screen (3/8" Pan Clearance)',
      category: 'Lubrication',
      desc: 'TIG-brazed pickup foot verified to 0.375" pan-floor clearance.'
    };
    lubeGroup.add(pickupScreen);

    const oilFilter = new THREE.Mesh(
      new THREE.CylinderGeometry(1.15, 1.15, 2.3, 24),
      mats.filterBlue
    );
    oilFilter.rotation.x = 0.25;
    oilFilter.position.set(-2.55, -2.35, -4.8);
    oilFilter.userData = {
      name: 'Wix 51069 Spin-On Oil Filter',
      category: 'Lubrication',
      desc: '21-micron synthetic media with silicone anti-drainback valve.'
    };
    lubeGroup.add(oilFilter);

    engineGroup.add(lubeGroup);
    parts.lubrication = lubeGroup;

    // 9. Cooling System
    const coolingGroup = new THREE.Group();
    const wpCenter = new THREE.Mesh(
      new THREE.CylinderGeometry(1.12, 1.48, 1.45, 24),
      mats.coolingAlum
    );
    wpCenter.rotation.x = Math.PI / 2;
    wpCenter.position.set(0, 1.65, 6.72);
    wpCenter.userData = {
      name: 'Edelbrock Victor High-Flow Aluminum Water Pump',
      category: 'Cooling',
      desc: '35 GPM high-flow pump circulating coolant evenly.',
      partNumber: 'EDL-8810'
    };
    coolingGroup.add(wpCenter);

    [-1.45, 1.45].forEach((lx) => {
      const wpLeg = new THREE.Mesh(
        new THREE.BoxGeometry(1.65, 0.82, 0.62),
        mats.coolingAlum
      );
      wpLeg.position.set(lx, 1.38, 6.18);
      wpLeg.rotation.z = lx > 0 ? -0.18 : 0.18;
      coolingGroup.add(wpLeg);
    });

    const tStatHousing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.66, 0.82, 1.15, 16),
      mats.chromePolish
    );
    tStatHousing.rotation.x = 0.45;
    tStatHousing.position.set(0, 3.68, 4.35);
    coolingGroup.add(tStatHousing);

    const bypassCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.55, 3.15, 4.72),
      new THREE.Vector3(0.68, 2.75, 5.65),
      new THREE.Vector3(0.58, 2.25, 6.48)
    ]);
    const bypassHose = new THREE.Mesh(
      new THREE.TubeGeometry(bypassCurve, 14, 0.16, 10, false),
      mats.beltsBlack
    );
    coolingGroup.add(bypassHose);

    const crankPulley = new THREE.Mesh(
      new THREE.CylinderGeometry(1.32, 1.32, 0.52, 28),
      mats.chromePolish
    );
    crankPulley.rotation.x = Math.PI / 2;
    crankPulley.position.set(0, crankCenterY, 7.62);
    coolingGroup.add(crankPulley);

    const wpPulley = new THREE.Mesh(
      new THREE.CylinderGeometry(1.08, 1.08, 0.52, 28),
      mats.chromePolish
    );
    wpPulley.rotation.x = Math.PI / 2;
    wpPulley.position.set(0, 1.65, 7.62);
    coolingGroup.add(wpPulley);

    const alternator = createVentedAlternatorGroup(
      mats.billetAlum,
      mats.copperWinding,
      mats.chromePolish,
      mats.anodizedBlack,
      mats.anRed,
      mats.arpBlackOxide
    );
    alternator.position.set(3.85, 2.25, 6.40);
    alternator.userData = {
      name: 'Heavy-Duty 160A Vented Alternator',
      category: 'Electrical',
      desc: '160A output with coplanar bracket and cooling fan.',
      partNumber: 'PWM-47294'
    };
    coolingGroup.add(alternator);

    const beltCurve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-1.32, crankCenterY, 7.62),
        new THREE.Vector3(0, crankCenterY - 1.32, 7.62),
        new THREE.Vector3(1.28, crankCenterY - 0.28, 7.62),
        new THREE.Vector3(2.45, 0.32, 7.62),
        new THREE.Vector3(4.46, 2.02, 7.62),
        new THREE.Vector3(3.92, 2.91, 7.62),
        new THREE.Vector3(0.32, 2.71, 7.62),
        new THREE.Vector3(-1.08, 1.68, 7.62)
      ],
      true
    );
    const vBelt = new THREE.Mesh(
      new THREE.TubeGeometry(beltCurve, 56, 0.11, 8, true),
      mats.beltsBlack
    );
    coolingGroup.add(vBelt);

    engineGroup.add(coolingGroup);
    parts.cooling = coolingGroup;

    // 10. Fuel Supply & Starter
    const fuelGroup = new THREE.Group();
    const fuelPump = new THREE.Mesh(
      new THREE.CylinderGeometry(0.96, 0.96, 1.42, 18),
      mats.chromePolish
    );
    fuelPump.position.set(2.95, -0.45, 4.65);
    fuelPump.userData = {
      name: 'Holley 110 GPH Mechanical Fuel Pump',
      category: 'Fuel System',
      desc: `Cam-pushrod driven supply feeding ${specs.fuelGph} GPH demand.`,
      partNumber: 'HLY-12-327-11'
    };
    fuelGroup.add(fuelPump);

    const fuelPumpTarget =
      inductionDress === 'mpfi_cnp' && !isTunnelRam
        ? [
            new THREE.Vector3(2.95, 0.25, 4.65),
            new THREE.Vector3(3.05, 1.85, 4.75),
            new THREE.Vector3(1.95, 3.35, 4.85),
            new THREE.Vector3(1.55, 3.68, 4.85)
          ]
        : [
            new THREE.Vector3(2.95, 0.25, 4.65),
            new THREE.Vector3(2.85, 2.25, 4.05),
            new THREE.Vector3(1.85, 4.15, 2.45),
            new THREE.Vector3(1.22, 4.88, 1.46)
          ];
    const fuelLineCurve = new THREE.CatmullRomCurve3(fuelPumpTarget);
    const fuelLine = new THREE.Mesh(
      new THREE.TubeGeometry(fuelLineCurve, 18, 0.085, 8, false),
      mats.braidedStainless
    );
    fuelGroup.add(fuelLine);
    engineGroup.add(fuelGroup);
    parts.fuel = fuelGroup;

    const starterGroup = new THREE.Group();
    const starterMain = new THREE.Mesh(
      new THREE.CylinderGeometry(1.02, 1.02, 2.75, 20),
      mats.starterDark
    );
    starterMain.rotation.x = Math.PI / 2;
    starterMain.position.set(2.50, -2.05, -4.45);
    starterGroup.add(starterMain);

    const starterNose = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.72, 0.65, 16),
      mats.machinedInternal
    );
    starterNose.rotation.x = Math.PI / 2;
    starterNose.position.set(2.48, -2.05, -5.92);
    starterGroup.add(starterNose);

    const solenoid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.52, 0.52, 2.05, 16),
      mats.starterDark
    );
    solenoid.rotation.x = Math.PI / 2;
    solenoid.position.set(2.50, -1.18, -4.45);
    starterGroup.add(solenoid);
    starterGroup.userData = {
      name: 'Powermaster MasterTorque Mini Starter',
      category: 'Starting System',
      desc: '4.4:1 planetary gear reduction engaging 168-tooth ring gear.',
      partNumber: 'PWM-9600'
    };
    engineGroup.add(starterGroup);
    parts.starter = starterGroup;

    // 11. Support Mode
    if (supportMode === 'hotrod_chassis') {
      const chassisGroup = createChassisAndRadiatorGroup(
        mats.chassisBlack,
        mats.billetAlum,
        mats.radiatorFin,
        mats.beltsBlack,
        mats.anRed,
        mats.fuelBlueAnodized,
        mats.chromePolish
      );
      engineGroup.add(chassisGroup);
      parts.chassis = chassisGroup;
    } else {
      const standGroup = createEngineTestStandGroup(
        mats.standChrome,
        mats.chassisBlack,
        mats.beltsBlack
      );
      standGroup.userData = {
        name: 'Tubular Rolling Engine Display & Dyno Cradle Stand',
        category: 'Shop Fixture',
        desc: '1.5" TIG-welded tubular display cradle mounted to SBC side motor mounts.'
      };
      engineGroup.add(standGroup);
      parts.chassis = standGroup;
    }

    // Ghost X-Ray Render Order Hierarchy
    if (isGhost) {
      crankGroup.renderOrder = 0;
      rotatingGroup.renderOrder = 0;
      camGroup.renderOrder = 0;
      blockGroup.renderOrder = 2;
      headsGroup.renderOrder = 2;
      timingCoverGroup.renderOrder = 2;
      oilPanGroup.renderOrder = 2;
      intakeGroup.renderOrder = 2;
      efiRailsGroup.renderOrder = 2;
      coolingGroup.renderOrder = 2;
      fuelGroup.renderOrder = 2;
      starterGroup.renderOrder = 2;
    }

    const edgeLines: THREE.LineSegments[] = [];
    if (isDrawing) {
      edgeLines.push(...applyTechnicalEdges(engineGroup, mats.techEdgeLine, 22));
    }

    scene.add(engineGroup);

    const caliperMarkerMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    const caliperLineMat = new THREE.LineBasicMaterial({ color: 0x22d3ee });
    const caliperP1Marker = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), caliperMarkerMat);
    const caliperP2Marker = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), caliperMarkerMat);
    const caliperLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0)
    ]);
    const caliperLine = new THREE.Line(caliperLineGeo, caliperLineMat);
    caliperP1Marker.visible = false;
    caliperP2Marker.visible = false;
    caliperLine.visible = false;
    scene.add(caliperP1Marker, caliperP2Marker, caliperLine);

    const selectionRingMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      depthTest: false
    });
    const selectionReticle = new THREE.Mesh(
      new THREE.RingGeometry(0.28, 0.42, 24),
      selectionRingMat
    );
    selectionReticle.visible = false;
    scene.add(selectionReticle);

    engineGroup.traverse((obj) => {
      if (obj.userData?.name) {
        obj.userData._base = { ...obj.userData };
      }
    });
    enginePartsRef.current = parts;
    engineReticleStateRef.current = { reticle: selectionReticle, camera };

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const updateKinematics = (crankAngle: number) => {
      crankGroup.rotation.z = crankAngle;
      camCore.rotation.z = crankAngle * 0.5;
      camSprocket.rotation.z = crankAngle * 0.5;

      for (let i = 0; i < pistonNodes.length; i++) {
        const node = pistonNodes[i];
        const phi = node.pinPhase - crankAngle + node.bankRot;
        const xc = crankRadius * Math.sin(phi);
        const yc = crankRadius * Math.cos(phi);
        const yp = yc + Math.sqrt(Math.max(0.01, scaledRodLen * scaledRodLen - xc * xc));
        const rodTilt = Math.atan2(xc, yp - yc);

        node.rodGroup.position.set(xc, yc, 0);
        node.rodGroup.rotation.z = rodTilt;
        node.pistonAsm.position.set(0, yp, 0);
      }

      for (let i = 0; i < valvetrainNodes.length; i++) {
        const v = valvetrainNodes[i];
        const thetaCam = crankAngle * 0.5 + v.offset;
        v.lobe.rotation.z = thetaCam;
        const liftFactor = Math.pow(Math.max(0, Math.sin(thetaCam)), 2);
        const travel = liftFactor * 0.24;

        v.lifter.position.copy(v.baseLifterPos).addScaledVector(v.lifterAxis, travel);
        v.pushrod.position.copy(v.pushrodBasePos).addScaledVector(v.pushrodAxis, travel);
        v.rocker.rotation.z = -v.lSide * liftFactor * 0.22;
        v.valve.position.copy(v.baseValvePos).addScaledVector(v.valveAxis, -travel);
        v.retainer.position.copy(v.baseRetainerPos).addScaledVector(v.valveAxis, -travel);
        v.spring.scale.y = 1.0 - liftFactor * 0.22;
      }
    };

    let crankAngle = 0;
    updateKinematics(0);

    const raycaster = new THREE.Raycaster();
    const onPointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      _rayMouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      _rayMouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(_rayMouse, camera);
      const hits = raycaster.intersectObjects(engineGroup.children, true);

      if (hits.length > 0) {
        const hit = hits[0];
        let obj: THREE.Object3D | null = hit.object;

        while (obj && obj !== engineGroup) {
          if (obj.userData && obj.userData.name) break;
          obj = obj.parent;
        }

        if (obj && obj.userData && obj.userData.name) {
          onSelectPartRef.current(obj.userData as InspectionData);
          selectionReticle.position.copy(hit.point);
          selectionReticle.lookAt(camera.position);
          selectionReticle.visible = true;
        }

        const currentMeasure = measurementRef.current;
        if (currentMeasure.mode === 'caliper') {
          const pt: [number, number, number] = [hit.point.x, hit.point.y, hit.point.z];
          if (!currentMeasure.point1) {
            onUpdateMeasurementRef.current({
              ...currentMeasure,
              point1: pt,
              point2: null,
              distanceInches: null,
              distanceMm: null,
              surfaceLabel: obj?.userData?.name || 'Point A'
            });
          } else {
            _ptA.set(...currentMeasure.point1);
            const distScene = _ptA.distanceTo(hit.point);
            const distIn = +(distScene * 1.48).toFixed(3);
            const distMm = +(distIn * 25.4).toFixed(1);

            onUpdateMeasurementRef.current({
              ...currentMeasure,
              point2: pt,
              distanceInches: distIn,
              distanceMm: distMm
            });
          }
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

    if (onRegisterCaptureRef.current) {
      onRegisterCaptureRef.current(() => {
        if (disposed) return;
        renderer.render(scene, camera);
        const url = renderer.domElement.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = url;
        link.download = `SBC350-CAD-${config.bore.toFixed(3)}x${config.stroke.toFixed(3)}.png`;
        link.click();
      });
    }

    const tick = (now: number) => {
      if (disposed) return;
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const hidden = hiddenPartsRef.current;
      for (const key in parts) {
        if (parts[key]) {
          parts[key].visible = !hidden[key];
        }
      }

      if (camTransitionRef.current.active) {
        _camGoalPos.copy(camTransitionRef.current.pos);
        camera.position.x = THREE.MathUtils.damp(camera.position.x, _camGoalPos.x, 8, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _camGoalPos.y, 8, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _camGoalPos.z, 8, dt);
        controls.target.x = THREE.MathUtils.damp(controls.target.x, _camGoalTarget.x, 8, dt);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, _camGoalTarget.y, 8, dt);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, _camGoalTarget.z, 8, dt);
        if (camera.position.distanceTo(_camGoalPos) < 0.05) {
          camera.position.copy(_camGoalPos);
          controls.target.copy(_camGoalTarget);
          camTransitionRef.current.active = false;
        }
      }

      controls.update();

      if (activeClippingPlanes.length > 0) {
        activeClippingPlanes[0].constant = baseClipConstant + sectionOffsetRef.current;
      }

      if (!selectedPartRef.current) {
        selectionReticle.visible = false;
      } else if (selectionReticle.visible) {
        selectionReticle.lookAt(camera.position);
      }

      const m = measurementRef.current;
      if (m.mode === 'caliper' && m.point1) {
        caliperP1Marker.visible = true;
        caliperP1Marker.position.set(m.point1[0], m.point1[1], m.point1[2]);
        if (m.point2) {
          caliperP2Marker.visible = true;
          caliperP2Marker.position.set(m.point2[0], m.point2[1], m.point2[2]);
          const posAttr = caliperLine.geometry.attributes.position as THREE.BufferAttribute;
          posAttr.setXYZ(0, m.point1[0], m.point1[1], m.point1[2]);
          posAttr.setXYZ(1, m.point2[0], m.point2[1], m.point2[2]);
          posAttr.needsUpdate = true;
          caliperLine.visible = true;
        } else {
          caliperP2Marker.visible = false;
          caliperLine.visible = false;
        }
      } else {
        caliperP1Marker.visible = false;
        caliperP2Marker.visible = false;
        caliperLine.visible = false;
      }

      smoothedExploded = THREE.MathUtils.damp(smoothedExploded, explodedRef.current, 9, dt);
      const f = smoothedExploded;

      if (parts.heads && parts.heads.children.length >= 2) {
        const leftHeadRot = Math.PI / 4;
        const rightHeadRot = -Math.PI / 4;
        const headDist = 4.45 + f * 3.8;
        parts.heads.children[0].position.set(
          -Math.sin(leftHeadRot) * headDist,
          crankCenterY + Math.cos(leftHeadRot) * headDist,
          0
        );
        parts.heads.children[1].position.set(
          -Math.sin(rightHeadRot) * headDist,
          crankCenterY + Math.cos(rightHeadRot) * headDist,
          0
        );
      }
      if (parts.intake) parts.intake.position.y = f * 4.4;
      if (parts.efiRails) parts.efiRails.position.y = f * 5.8;
      if (parts.ignition) parts.ignition.position.y = f * 3.8;
      if (parts.timingCover) parts.timingCover.position.z = 6.28 + f * 2.8;
      if (parts.cooling) parts.cooling.position.z = f * 4.4;
      if (parts.oilPan) parts.oilPan.position.y = -f * 4.0;
      if (parts.lubrication) parts.lubrication.position.y = -f * 2.4;
      if (parts.fuel) parts.fuel.position.x = f * 2.5;
      if (parts.starter) parts.starter.position.x = f * 2.8;
      if (parts.chassis) parts.chassis.position.y = -f * 3.0;

      if (isRunningRef.current) {
        const radPerSec = Math.min(26, (rpmRef.current / 60) * 0.42 * Math.PI);
        crankAngle += radPerSec * dt;
        updateKinematics(crankAngle);
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
      enginePartsRef.current = {};
      engineReticleStateRef.current = null;
      onRegisterCaptureRef.current?.(null);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      controls.dispose();

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments || obj instanceof THREE.Line) {
          obj.geometry?.dispose();
        }
      });
      caliperMarkerMat.dispose();
      caliperLineMat.dispose();
      selectionRingMat.dispose();
      Object.values(mats).forEach((m) => m.dispose());
      edgeLines.forEach((l) => l.geometry.dispose());
      textures.dispose();
      if (scene.environment) scene.environment.dispose();
      renderer.dispose();
    };
  }, [
    config.bore,
    config.stroke,
    config.rodLength,
    config.deckHeight,
    config.deckClearance,
    config.gasketThickness,
    config.chamberCc,
    config.pistonReliefCc,
    config.pistonAlloy,
    config.camProfile,
    config.rockerRatio,
    config.selectedIntake,
    config.carbCfm,
    config.targetAFR,
    config.ignitionTiming,
    config.sparkPlugGap,
    cutawayMode,
    subsystemIsolation,
    viewMode,
    analysisMode,
    inductionDress,
    supportMode
  ]);

  useEffect(() => {
    const partsMap = enginePartsRef.current;
    Object.values(partsMap).forEach((groupObj) => {
      groupObj.traverse((child) => {
        if (child.userData?._base) {
          const base = child.userData._base as Record<string, unknown>;
          child.userData = { ...base, _base: base };
        }
      });
    });

    if (!techDrawing) return;

    for (const callout of techDrawing.callouts) {
      const targetGroup = partsMap[callout.targetSubassembly];
      if (!targetGroup) continue;

      let primaryNamed: THREE.Object3D | null = targetGroup.userData?.name ? targetGroup : null;
      if (!primaryNamed) {
        targetGroup.traverse((child) => {
          if (!primaryNamed && child.userData?.name) {
            primaryNamed = child;
          }
        });
      }

      const targetObj = primaryNamed || targetGroup;
      const base = (targetObj.userData?._base || targetObj.userData || {}) as Record<string, unknown>;
      targetObj.userData = {
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
  }, [techDrawing, cutawayMode, viewMode, inductionDress, supportMode]);

  useEffect(() => {
    if (!focusPartRequest) return;
    const obj = enginePartsRef.current[focusPartRequest.key];
    const reticleState = engineReticleStateRef.current;
    if (!obj || !reticleState) return;
    _engineFocusBox.setFromObject(obj);
    _engineFocusBox.getCenter(_engineFocusCenter);
    reticleState.reticle.position.copy(_engineFocusCenter);
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