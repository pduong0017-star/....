import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {
  CAMERA_PRESETS,
  CameraPresetId,
  computeLayerOffsets,
  computeMeshedGearAngles,
  detectMeridianCrossing,
  FINISHES,
  FinishId,
  GEAR_TRAIN,
  ScaleId,
} from '../engine/orreryMath';
import {
  applyFinishToMaterials,
  buildOrreryAssembly,
  OrreryAssembly,
} from '../engine/orreryScene';

export interface OrreryViewportHandle {
  pluckPlanet: (planetIndex: number) => void;
  focusCameraPreset: (presetId: CameraPresetId) => void;
  captureStudioPoster: (finishName: string, scaleName: string) => string | null;
}

interface OrreryViewportProps {
  finishId: FinishId;
  scaleId: ScaleId;
  exploded: number;
  timeScale: number;
  domeVisible: boolean;
  onPlanetChime: (planetIndex: number, manual: boolean) => void;
  onPlanetHover: (planetIndex: number | null) => void;
}

// Reusable scratch vectors allocated outside render loop (zero GC churn)
const _mouse = new THREE.Vector2();
const _targetCamPos = new THREE.Vector3();
const _targetControlsLook = new THREE.Vector3();

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export const OrreryViewport = forwardRef<OrreryViewportHandle, OrreryViewportProps>(
  function OrreryViewport(
    {
      finishId,
      scaleId,
      exploded,
      timeScale,
      domeVisible,
      onPlanetChime,
      onPlanetHover,
    },
    ref
  ) {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const [contextLost, setContextLost] = useState(false);

    // Keep live reactive state in refs so WebGLRenderer mounts strictly once
    const propsRef = useRef({
      finishId,
      scaleId,
      exploded,
      timeScale,
      domeVisible,
      onPlanetChime,
      onPlanetHover,
    });
    propsRef.current = {
      finishId,
      scaleId,
      exploded,
      timeScale,
      domeVisible,
      onPlanetChime,
      onPlanetHover,
    };

    const runtimeRef = useRef<{
      renderer: THREE.WebGLRenderer;
      scene: THREE.Scene;
      camera: THREE.PerspectiveCamera;
      controls: OrbitControls;
      assembly: OrreryAssembly;
      maxAnisotropy: number;
      cameraFlightActive: boolean;
      cameraGoalPos: THREE.Vector3;
      cameraGoalTarget: THREE.Vector3;
      triggerRipple: (planetIndex: number) => void;
    } | null>(null);

    // Sync finish changes without tearing down WebGL
    useEffect(() => {
      const rt = runtimeRef.current;
      if (!rt) return;
      const spec = FINISHES[finishId];
      applyFinishToMaterials(rt.assembly.materials, spec, rt.maxAnisotropy);
      rt.scene.background = new THREE.Color(spec.backdrop);
      if (rt.scene.fog instanceof THREE.FogExp2) {
        rt.scene.fog.color.setHex(spec.fogColor);
      }
      rt.renderer.render(rt.scene, rt.camera);
    }, [finishId]);

    useImperativeHandle(ref, () => ({
      pluckPlanet(planetIndex: number) {
        const rt = runtimeRef.current;
        if (!rt) return;
        rt.triggerRipple(planetIndex);
        propsRef.current.onPlanetChime(planetIndex, true);
      },
      focusCameraPreset(presetId: CameraPresetId) {
        const rt = runtimeRef.current;
        if (!rt) return;
        const preset = CAMERA_PRESETS[presetId];
        rt.cameraGoalPos.set(preset.position[0], preset.position[1], preset.position[2]);
        rt.cameraGoalTarget.set(preset.target[0], preset.target[1], preset.target[2]);
        rt.cameraFlightActive = true;
      },
      captureStudioPoster(finishName: string, scaleName: string): string | null {
        const rt = runtimeRef.current;
        if (!rt) return null;

        // Render a fresh frame immediately before extracting pixels
        rt.renderer.render(rt.scene, rt.camera);
        const srcCanvas = rt.renderer.domElement;

        const outW = 1440;
        const outH = 960;
        const poster = document.createElement('canvas');
        poster.width = outW;
        poster.height = outH;
        const ctx = poster.getContext('2d');
        if (!ctx) return null;

        // Studio frame backdrop
        ctx.fillStyle = '#090a0f';
        ctx.fillRect(0, 0, outW, outH);

        // Cover-crop WebGL render into frame
        const srcAspect = srcCanvas.width / srcCanvas.height;
        const dstAspect = outW / outH;
        let sx = 0;
        let sy = 0;
        let sw = srcCanvas.width;
        let sh = srcCanvas.height;
        if (srcAspect > dstAspect) {
          sw = srcCanvas.height * dstAspect;
          sx = (srcCanvas.width - sw) * 0.5;
        } else {
          sh = srcCanvas.width / dstAspect;
          sy = (srcCanvas.height - sh) * 0.5;
        }
        ctx.drawImage(srcCanvas, sx, sy, sw, sh, 0, 0, outW, outH);

        // Subtle exhibition vignette scrim at bottom
        const grad = ctx.createLinearGradient(0, outH - 220, 0, outH);
        grad.addColorStop(0, 'rgba(9, 10, 15, 0)');
        grad.addColorStop(1, 'rgba(9, 10, 15, 0.88)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, outH - 220, outW, 220);

        // Museum hairline frame
        ctx.strokeStyle = 'rgba(230, 198, 112, 0.36)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(32, 32, outW - 64, outH - 64);

        // Exhibition typography
        ctx.fillStyle = '#f3efe6';
        ctx.font = '600 44px "Cormorant Garamond", Georgia, serif';
        ctx.fillText('A U R E L I A', 64, outH - 84);

        ctx.fillStyle = 'rgba(243, 239, 230, 0.72)';
        ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(
          `Đại Thiên Văn Cơ & Hộp Nhạc 3D  ·  ${finishName}  ·  Âm giai ${scaleName}`,
          64,
          outH - 52
        );

        return poster.toDataURL('image/png');
      },
    }));

    useEffect(() => {
      const container = mountRef.current;
      if (!container) return;

      const isSoftwareGl = detectSoftwareWebGL();
      const initialFinish = FINISHES[propsRef.current.finishId];

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(initialFinish.backdrop);
      scene.fog = new THREE.FogExp2(initialFinish.fogColor, 0.038);

      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 120);
      const overview = CAMERA_PRESETS.overview;
      camera.position.set(overview.position[0], overview.position[1], overview.position[2]);

      const renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.shadowMap.enabled = !isSoftwareGl;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      // Mandatory studio reflections on every device (RoomEnvironment)
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      const envRT = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
      scene.environment = envRT.texture;
      pmremGenerator.dispose();

      // Balanced 3-point warm/cool studio lighting rig (<= 1 shadow caster)
      const hemiLight = new THREE.HemisphereLight(0xb8d4f4, 0x261d14, 0.72);
      scene.add(hemiLight);

      const keyLight = new THREE.DirectionalLight(0xffe6c2, 2.3);
      keyLight.position.set(7.5, 11.5, 6.5);
      keyLight.castShadow = !isSoftwareGl;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 2;
      keyLight.shadow.camera.far = 28;
      const d = 7.5;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0x88b4e8, 1.15);
      rimLight.position.set(-8.5, 5.5, -7.5);
      scene.add(rimLight);

      // Warm central point glow emanating from the Sun Tourbillon
      const sunPointLight = new THREE.PointLight(0xffd482, 2.4, 12, 1.8);
      sunPointLight.position.set(0, 1.62, 0);
      scene.add(sunPointLight);

      // Luxury Studio Softbox Panels (skipped only on software WebGL)
      if (!isSoftwareGl) {
        RectAreaLightUniformsLib.init();
        const softboxTop = new THREE.RectAreaLight(0xfff1dc, 2.2, 7, 4);
        softboxTop.position.set(0, 8.5, 3.5);
        softboxTop.lookAt(0, 1.0, 0);
        scene.add(softboxTop);
      }

      const maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      const assembly = buildOrreryAssembly(initialFinish, maxAnisotropy, isSoftwareGl);
      scene.add(assembly.root);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(overview.target[0], overview.target[1], overview.target[2]);
      controls.enableDamping = !isSoftwareGl;
      controls.dampingFactor = 0.055;
      controls.minDistance = 3.2;
      controls.maxDistance = 18.5;
      controls.maxPolarAngle = Math.PI * 0.49;
      controls.minPolarAngle = 0.08;
      controls.enablePan = false;
      controls.update();

      const triggerRipple = (planetIndex: number) => {
        const node = assembly.planetNodes[planetIndex];
        if (!node) return;
        node.rippleProgress = 0;
        node.chimeGlow = 1.0;
        node.rippleMesh.visible = true;
        node.rippleMesh.scale.setScalar(1);
      };

      const rtState = {
        renderer,
        scene,
        camera,
        controls,
        assembly,
        maxAnisotropy,
        cameraFlightActive: false,
        cameraGoalPos: new THREE.Vector3(...overview.position),
        cameraGoalTarget: new THREE.Vector3(...overview.target),
        triggerRipple,
      };
      runtimeRef.current = rtState;

      // Cancel camera preset flight immediately if user drags or scrolls
      const onControlsStart = () => {
        rtState.cameraFlightActive = false;
      };
      controls.addEventListener('start', onControlsStart);

      // Raycasting for clicking & hovering planets
      const raycaster = new THREE.Raycaster();
      let pointerDownX = 0;
      let pointerDownY = 0;
      let lastHoverCheck = 0;
      let lastHoveredIdx: number | null = null;

      const updateMouseNDC = (clientX: number, clientY: number) => {
        const rect = renderer.domElement.getBoundingClientRect();
        _mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        _mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      };

      const onPointerDown = (e: PointerEvent) => {
        pointerDownX = e.clientX;
        pointerDownY = e.clientY;
      };

      const onPointerUp = (e: PointerEvent) => {
        const moved = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY);
        if (moved > 8) return; // Ignore orbit drags
        updateMouseNDC(e.clientX, e.clientY);
        raycaster.setFromCamera(_mouse, camera);
        const hits = raycaster.intersectObjects(assembly.interactables, false);
        if (hits.length > 0) {
          const idx = hits[0].object.userData.planetIndex as number;
          triggerRipple(idx);
          propsRef.current.onPlanetChime(idx, true);
        }
      };

      const onPointerMove = (e: PointerEvent) => {
        const now = performance.now();
        if (now - lastHoverCheck < 50) return;
        lastHoverCheck = now;
        updateMouseNDC(e.clientX, e.clientY);
        raycaster.setFromCamera(_mouse, camera);
        const hits = raycaster.intersectObjects(assembly.interactables, false);
        const idx = hits.length > 0 ? (hits[0].object.userData.planetIndex as number) : null;
        if (idx !== lastHoveredIdx) {
          lastHoveredIdx = idx;
          renderer.domElement.style.cursor = idx !== null ? 'pointer' : 'grab';
          propsRef.current.onPlanetHover(idx);
        }
      };

      renderer.domElement.style.cursor = 'grab';
      renderer.domElement.addEventListener('pointerdown', onPointerDown);
      renderer.domElement.addEventListener('pointerup', onPointerUp);
      renderer.domElement.addEventListener('pointermove', onPointerMove);

      // WebGL context loss resilience
      const onContextLost = (e: Event) => {
        e.preventDefault();
        setContextLost(true);
      };
      const onContextRestored = () => {
        setContextLost(false);
      };
      renderer.domElement.addEventListener('webglcontextlost', onContextLost);
      renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

      // Responsive ResizeObserver
      const handleResize = () => {
        if (!container) return;
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        renderer.render(scene, camera);
      };
      window.addEventListener('resize', handleResize);

      // Pre-warm shaders on GPU only
      if (!isSoftwareGl) {
        renderer.compile(scene, camera);
      }

      // Animation simulation state
      let disposed = false;
      let frameId = 0;
      let lastTimeMs = performance.now();
      let driverAngle = 0;
      let currentExploded = propsRef.current.exploded;
      let currentTimeScale = propsRef.current.timeScale;

      const baseY = {
        pedestal: assembly.pedestalGroup.position.y,
        gearTrain: assembly.gearTrainGroup.position.y,
        meridian: assembly.meridianGroup.position.y,
        tourbillon: assembly.tourbillonGroup.position.y,
        planets: assembly.planetsGroup.position.y,
        dome: assembly.domeGroup.position.y,
      };

      function afterDraw(cb: () => void) {
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

      function tick() {
        if (disposed) return;

        const now = performance.now();
        const dt = Math.min(0.1, Math.max(0.001, (now - lastTimeMs) / 1000));
        lastTimeMs = now;

        const live = propsRef.current;

        // Smooth exponential damping for exploded view & time warp
        currentExploded = THREE.MathUtils.damp(currentExploded, live.exploded, 5.5, dt);
        currentTimeScale = THREE.MathUtils.damp(currentTimeScale, live.timeScale, 7.0, dt);

        const offsets = computeLayerOffsets(currentExploded);
        assembly.pedestalGroup.position.y = baseY.pedestal + offsets.pedestalY;
        assembly.gearTrainGroup.position.y = baseY.gearTrain + offsets.gearTrainY;
        assembly.meridianGroup.position.y = baseY.meridian + offsets.meridianY;
        assembly.tourbillonGroup.position.y = baseY.tourbillon + offsets.tourbillonY;
        assembly.planetsGroup.position.y = baseY.planets + offsets.planetsY;
        assembly.domeGroup.position.y = baseY.dome + offsets.domeY;
        assembly.domeGroup.visible = live.domeVisible;
        sunPointLight.position.y = assembly.tourbillonGroup.position.y;

        // Advance meshed clockwork gear train
        driverAngle += dt * 0.42 * currentTimeScale;
        const gearAngles = computeMeshedGearAngles(driverAngle, GEAR_TRAIN);
        for (let i = 0; i < assembly.gearMeshes.length; i++) {
          assembly.gearMeshes[i].rotation.y = gearAngles[i];
        }

        // Advance counter-rotating 3-axis Sun Tourbillon Cage
        const tourbStep = dt * currentTimeScale;
        assembly.tourbillonOuter.rotation.y += tourbStep * 0.65;
        assembly.tourbillonOuter.rotation.x += tourbStep * 0.24;
        assembly.tourbillonMid.rotation.z -= tourbStep * 1.1;
        assembly.tourbillonMid.rotation.y += tourbStep * 0.42;
        assembly.tourbillonInner.rotation.x += tourbStep * 1.65;
        assembly.sunCoreMesh.rotation.y -= tourbStep * 0.48;

        // Advance 6 planetary orbits & detect exact meridian harmonic crossings
        for (let i = 0; i < assembly.planetNodes.length; i++) {
          const node = assembly.planetNodes[i];
          const prevAngle = node.angle;
          const nextAngle = prevAngle + node.spec.baseSpeed * dt * currentTimeScale;
          node.angle = nextAngle;
          node.armGroup.rotation.y = nextAngle;
          node.bodyGroup.rotation.y += dt * (0.7 + i * 0.12) * (Math.abs(currentTimeScale) > 0.05 ? currentTimeScale : 0.35);

          if (node.moonPivot) {
            node.moonPivot.rotation.y += dt * 2.4 * (Math.abs(currentTimeScale) > 0.05 ? currentTimeScale : 0.4);
          }

          if (Math.abs(currentTimeScale) > 0.05 && detectMeridianCrossing(prevAngle, nextAngle, 0)) {
            triggerRipple(i);
            live.onPlanetChime(i, false);
          }

          // Animate expanding chime ripple & chime pin glow decay
          if (node.rippleProgress >= 0) {
            node.rippleProgress += dt * 1.45;
            if (node.rippleProgress >= 1) {
              node.rippleProgress = -1;
              node.rippleMesh.visible = false;
            } else {
              const p = node.rippleProgress;
              const eased = 1 - Math.pow(1 - p, 3);
              node.rippleMesh.scale.setScalar(1 + eased * 2.4);
              assembly.materials.rippleMaterials[i].opacity = (1 - p) * 0.85;
            }
          }

          if (node.chimeGlow > 0.001) {
            node.chimeGlow = THREE.MathUtils.damp(node.chimeGlow, 0, 4.2, dt);
          }
          const pinMat = assembly.materials.chimePinMaterials[i];
          if (pinMat) {
            pinMat.emissiveIntensity = 0.22 + node.chimeGlow * 2.2;
          }
        }

        // Slow majestic drift on distant observatory stars
        assembly.starField.rotation.y += dt * 0.015;

        // Smooth damped camera preset flight (stops cleanly upon arrival)
        if (rtState.cameraFlightActive) {
          const alpha = 1 - Math.exp(-5.2 * dt);
          _targetCamPos.copy(rtState.cameraGoalPos);
          _targetControlsLook.copy(rtState.cameraGoalTarget);
          camera.position.lerp(_targetCamPos, alpha);
          controls.target.lerp(_targetControlsLook, alpha);
          if (
            camera.position.distanceToSquared(_targetCamPos) < 0.002 &&
            controls.target.distanceToSquared(_targetControlsLook) < 0.002
          ) {
            camera.position.copy(_targetCamPos);
            controls.target.copy(_targetControlsLook);
            rtState.cameraFlightActive = false;
          }
        }

        controls.update();
        renderer.render(scene, camera);

        if (isSoftwareGl) {
          afterDraw(tick);
        } else {
          frameId = requestAnimationFrame(tick);
        }
      }

      tick();

      return () => {
        disposed = true;
        cancelAnimationFrame(frameId);
        clearTimeout(frameId);
        window.removeEventListener('resize', handleResize);
        controls.removeEventListener('start', onControlsStart);
        renderer.domElement.removeEventListener('pointerdown', onPointerDown);
        renderer.domElement.removeEventListener('pointerup', onPointerUp);
        renderer.domElement.removeEventListener('pointermove', onPointerMove);
        renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
        renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
        controls.dispose();
        assembly.dispose();
        envRT.dispose();
        renderer.dispose();
        runtimeRef.current = null;
      };
    }, []);

    return (
      <div className="relative h-full w-full overflow-hidden">
        <div
          ref={mountRef}
          data-testid="orrery-canvas-mount"
          className="h-full w-full"
          aria-label="Không gian 3D Đại Thiên Văn Cơ AURELIA — kéo để xoay góc nhìn, cuộn để thu phóng, nhấp vào hành tinh để gảy nốt nhạc"
        />
        {contextLost && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#090a0f] px-6 text-center">
            <div className="max-w-sm border border-[#e6c670]/30 bg-[#11131b] p-6">
              <p className="font-display text-2xl text-[#f3efe6]">AURELIA</p>
              <p className="mt-2 text-sm text-[#f3efe6]/70">
                Ngữ cảnh đồ họa 3D tạm thời bị gián đoạn. Đang chờ khôi phục tự động…
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }
);
