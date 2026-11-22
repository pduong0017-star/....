import * as THREE from 'three';
import {
  FinishSpec,
  GEAR_TRAIN,
  PLANETS,
  PlanetSpec,
} from './orreryMath';
import {
  createBrushedMetalTexture,
  createContactShadowTexture,
  createHorologyDialTexture,
  createStarSpriteTexture,
  createStoneVeinsTexture,
} from './textures';

export interface OrreryMaterials {
  primaryMetal: THREE.MeshPhysicalMaterial;
  secondaryMetal: THREE.MeshStandardMaterial;
  darkSteel: THREE.MeshStandardMaterial;
  enamel: THREE.MeshPhysicalMaterial;
  pedestal: THREE.MeshStandardMaterial;
  jewel: THREE.MeshPhysicalMaterial;
  sunCore: THREE.MeshStandardMaterial;
  meridianGlow: THREE.MeshStandardMaterial;
  dial: THREE.MeshStandardMaterial;
  sapphireDome: THREE.MeshPhysicalMaterial;
  orbitalTrack: THREE.MeshStandardMaterial;
  floor: THREE.MeshStandardMaterial;
  brushedBump: THREE.CanvasTexture;
  stoneBump: THREE.CanvasTexture;
  dialTexture: THREE.CanvasTexture;
  planetMaterials: THREE.MeshPhysicalMaterial[];
  rippleMaterials: THREE.MeshBasicMaterial[];
  chimePinMaterials: THREE.MeshStandardMaterial[];
}

export interface PlanetRuntimeNode {
  spec: PlanetSpec;
  index: number;
  armGroup: THREE.Group;
  bodyGroup: THREE.Group;
  moonPivot?: THREE.Group;
  colliderMesh: THREE.Mesh;
  rippleMesh: THREE.Mesh;
  rippleProgress: number; // 0..1 active, -1 idle
  chimeGlow: number; // 0..1 flash decay
  angle: number;
}

export interface OrreryAssembly {
  root: THREE.Group;
  pedestalGroup: THREE.Group;
  gearTrainGroup: THREE.Group;
  meridianGroup: THREE.Group;
  tourbillonGroup: THREE.Group;
  planetsGroup: THREE.Group;
  domeGroup: THREE.Group;
  gearMeshes: THREE.Group[];
  tourbillonOuter: THREE.Group;
  tourbillonMid: THREE.Group;
  tourbillonInner: THREE.Group;
  sunCoreMesh: THREE.Group;
  planetNodes: PlanetRuntimeNode[];
  interactables: THREE.Object3D[];
  starField: THREE.Points;
  materials: OrreryMaterials;
  dispose: () => void;
}

/**
 * Generates an extruded beveled involute-style clockwork gear with spoked cutouts.
 */
function createInvoluteGearGeometry(
  teeth: number,
  outerRadius: number,
  innerRadius: number,
  thickness: number,
  spokeCount: number
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const rootRadius = outerRadius * 0.885;
  const step = (Math.PI * 2) / teeth;

  for (let i = 0; i < teeth; i++) {
    const a0 = i * step;
    const a1 = a0 + step * 0.18;
    const a2 = a0 + step * 0.34;
    const a3 = a0 + step * 0.56;
    const a4 = a0 + step * 0.72;

    const p0x = Math.cos(a0) * rootRadius;
    const p0y = Math.sin(a0) * rootRadius;
    if (i === 0) shape.moveTo(p0x, p0y);
    else shape.lineTo(p0x, p0y);

    shape.lineTo(Math.cos(a1) * rootRadius, Math.sin(a1) * rootRadius);
    shape.lineTo(Math.cos(a2) * outerRadius, Math.sin(a2) * outerRadius);
    shape.lineTo(Math.cos(a3) * outerRadius, Math.sin(a3) * outerRadius);
    shape.lineTo(Math.cos(a4) * rootRadius, Math.sin(a4) * rootRadius);
  }
  shape.closePath();

  // Central arbor bore hole
  const bore = new THREE.Path();
  bore.absarc(0, 0, innerRadius * 0.38, 0, Math.PI * 2, true);
  shape.holes.push(bore);

  // Skeletonized horological sector cutouts between spokes
  const rimInner = rootRadius * 0.84;
  const hubOuter = Math.max(innerRadius * 0.82, rootRadius * 0.3);
  if (rimInner - hubOuter > 0.14 && spokeCount >= 4) {
    const spokeStep = (Math.PI * 2) / spokeCount;
    const marginAngle = 0.14;
    for (let s = 0; s < spokeCount; s++) {
      const startA = s * spokeStep + marginAngle;
      const endA = (s + 1) * spokeStep - marginAngle;
      if (endA <= startA + 0.08) continue;

      const cutout = new THREE.Path();
      const segs = 8;
      cutout.moveTo(Math.cos(startA) * hubOuter, Math.sin(startA) * hubOuter);
      for (let k = 0; k <= segs; k++) {
        const a = startA + ((endA - startA) * k) / segs;
        cutout.lineTo(Math.cos(a) * rimInner, Math.sin(a) * rimInner);
      }
      for (let k = segs; k >= 0; k--) {
        const a = startA + ((endA - startA) * k) / segs;
        cutout.lineTo(Math.cos(a) * hubOuter, Math.sin(a) * hubOuter);
      }
      cutout.closePath();
      shape.holes.push(cutout);
    }
  }

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.012,
    bevelSegments: 2,
    curveSegments: 10,
  });

  // Orient gear horizontally in XZ plane centered on Y
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -thickness / 2, 0);
  return geo;
}

/**
 * Creates a stepped sculpted LatheGeometry pedestal profile.
 */
function createPedestalProfile(): THREE.LatheGeometry {
  const pts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(5.45, 0.0),
    new THREE.Vector2(5.45, 0.18),
    new THREE.Vector2(5.26, 0.28),
    new THREE.Vector2(5.16, 0.56),
    new THREE.Vector2(4.92, 0.68),
    new THREE.Vector2(4.92, 0.94),
    new THREE.Vector2(5.04, 1.02),
    new THREE.Vector2(4.84, 1.12),
    new THREE.Vector2(4.65, 1.12),
    new THREE.Vector2(4.56, 1.02),
    new THREE.Vector2(0.0, 1.02),
  ];
  return new THREE.LatheGeometry(pts, 72);
}

/**
 * Creates the composite multi-part planetary assembly (curved armature, gimbal,
 * engraved body, rings/moon/bands, jewel cap, ripple wave, and raycast collider).
 */
function createPlanetAssembly(
  spec: PlanetSpec,
  index: number,
  materials: OrreryMaterials
): PlanetRuntimeNode {
  const armGroup = new THREE.Group();
  armGroup.name = `planet-arm-${spec.id}`;

  // 1. Central hub collar seated around the main spindle
  const collarY = 0.08 + index * 0.095;
  const collarGeo = new THREE.CylinderGeometry(
    0.26 + (5 - index) * 0.025,
    0.28 + (5 - index) * 0.025,
    0.075,
    28
  );
  const collar = new THREE.Mesh(collarGeo, materials.secondaryMetal);
  collar.position.y = collarY;
  collar.castShadow = true;
  collar.receiveShadow = true;
  armGroup.add(collar);

  // 2. Sculpted swan-neck brass armature extending to the planet's orbital radius (+Z at angle 0)
  const r = spec.orbitRadius;
  const endY = spec.armElevation;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, collarY, 0.22),
    new THREE.Vector3(0, collarY + 0.02, r * 0.35),
    new THREE.Vector3(0, collarY + (endY - collarY) * 0.35, r * 0.78),
    new THREE.Vector3(0, endY - spec.bodyRadius - 0.16, r),
    new THREE.Vector3(0, endY - spec.bodyRadius - 0.04, r),
  ]);
  const armGeo = new THREE.TubeGeometry(curve, 24, 0.024, 10, false);
  const armMesh = new THREE.Mesh(armGeo, materials.primaryMetal);
  armMesh.castShadow = true;
  armGroup.add(armMesh);

  // Counterweight brass finial on the opposite side (-Z)
  const cwLen = Math.min(0.82, r * 0.24);
  const cwStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, cwLen, 10),
    materials.darkSteel
  );
  cwStem.rotation.x = Math.PI / 2;
  cwStem.position.set(0, collarY, -cwLen * 0.5 - 0.18);
  armGroup.add(cwStem);

  const cwWeight = new THREE.Mesh(
    new THREE.SphereGeometry(0.058, 16, 12),
    materials.primaryMetal
  );
  cwWeight.scale.set(1, 0.75, 1.3);
  cwWeight.position.set(0, collarY, -cwLen - 0.2);
  armGroup.add(cwWeight);

  // 3. Gimbal cradle seat under planet
  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(spec.bodyRadius * 0.42, 0.045, 0.12, 18),
    materials.primaryMetal
  );
  cup.position.set(0, endY - spec.bodyRadius - 0.08, r);
  armGroup.add(cup);

  // 4. Composite Planet Body Group (rotates around tilted axis)
  const bodyGroup = new THREE.Group();
  bodyGroup.position.set(0, endY, r);
  bodyGroup.rotation.z = spec.axialTilt;

  const planetMat = new THREE.MeshPhysicalMaterial({
    color: spec.accentHex,
    metalness: spec.isFaceted ? 0.78 : 0.32,
    roughness: spec.isFaceted ? 0.18 : 0.38,
    clearcoat: 0.65,
    clearcoatRoughness: 0.18,
    bumpMap: materials.brushedBump,
    bumpScale: 0.008,
  });
  materials.planetMaterials.push(planetMat);

  const bodyGeo = spec.isFaceted
    ? new THREE.IcosahedronGeometry(spec.bodyRadius, 1)
    : new THREE.SphereGeometry(spec.bodyRadius, 28, 22);
  const bodyMesh = new THREE.Mesh(bodyGeo, planetMat);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  bodyGroup.add(bodyMesh);

  // Meridian brass collar around every planet for cohesive horological craft
  const meridianBand = new THREE.Mesh(
    new THREE.TorusGeometry(spec.bodyRadius * 1.15, 0.014, 10, 36),
    materials.primaryMetal
  );
  meridianBand.rotation.y = Math.PI / 2;
  bodyGroup.add(meridianBand);

  // Polar jewel pin at north pole
  const polePin = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.036, 0),
    materials.jewel
  );
  polePin.position.y = spec.bodyRadius * 1.16;
  bodyGroup.add(polePin);

  // Planet-specific architectural signatures
  if (spec.hasRings) {
    const outerRing = new THREE.Mesh(
      new THREE.RingGeometry(spec.bodyRadius * 1.48, spec.bodyRadius * 2.15, 48),
      new THREE.MeshStandardMaterial({
        color: spec.accentHex,
        metalness: 0.72,
        roughness: 0.28,
        side: THREE.DoubleSide,
      })
    );
    outerRing.rotation.x = Math.PI / 2;
    bodyGroup.add(outerRing);

    const innerRingRim = new THREE.Mesh(
      new THREE.TorusGeometry(spec.bodyRadius * 1.46, 0.012, 8, 48),
      materials.primaryMetal
    );
    innerRingRim.rotation.x = Math.PI / 2;
    bodyGroup.add(innerRingRim);

    const outerRingRim = new THREE.Mesh(
      new THREE.TorusGeometry(spec.bodyRadius * 2.16, 0.014, 8, 48),
      materials.primaryMetal
    );
    outerRingRim.rotation.x = Math.PI / 2;
    bodyGroup.add(outerRingRim);
  }

  if (spec.hasBands) {
    for (const offset of [-0.075, 0.0, 0.075]) {
      const bandRadius = Math.sqrt(Math.max(0.001, spec.bodyRadius * spec.bodyRadius - offset * offset));
      const band = new THREE.Mesh(
        new THREE.TorusGeometry(bandRadius + 0.006, 0.012, 8, 36),
        materials.secondaryMetal
      );
      band.rotation.x = Math.PI / 2;
      band.position.y = offset;
      bodyGroup.add(band);
    }
  }

  let moonPivot: THREE.Group | undefined;
  if (spec.hasMoon) {
    moonPivot = new THREE.Group();
    const moonArm = new THREE.Mesh(
      new THREE.TorusGeometry(spec.bodyRadius * 1.65, 0.007, 8, 32),
      materials.secondaryMetal
    );
    moonArm.rotation.x = Math.PI / 2;
    moonPivot.add(moonArm);

    const moonSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.052, 16, 14),
      materials.primaryMetal
    );
    moonSphere.position.set(spec.bodyRadius * 1.65, 0, 0);
    moonPivot.add(moonSphere);
    bodyGroup.add(moonPivot);
  }

  armGroup.add(bodyGroup);

  // 5. Harmonic Chime Wave Ripple Ring (expands & fades when planet strikes meridian or is plucked)
  const rippleMat = new THREE.MeshBasicMaterial({
    color: spec.accentHex,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  materials.rippleMaterials.push(rippleMat);

  const rippleMesh = new THREE.Mesh(
    new THREE.RingGeometry(spec.bodyRadius * 1.2, spec.bodyRadius * 1.48, 36),
    rippleMat
  );
  rippleMesh.rotation.x = -Math.PI / 2;
  rippleMesh.position.set(0, endY, r);
  rippleMesh.visible = false;
  armGroup.add(rippleMesh);

  // 6. Dedicated invisible proxy collider sphere for crisp raycast clicking
  const colliderMesh = new THREE.Mesh(
    new THREE.SphereGeometry(Math.max(0.32, spec.bodyRadius * 1.8), 12, 10),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  colliderMesh.position.set(0, endY, r);
  colliderMesh.userData = { planetIndex: index };
  armGroup.add(colliderMesh);

  armGroup.rotation.y = spec.initialAngle;

  return {
    spec,
    index,
    armGroup,
    bodyGroup,
    moonPivot,
    colliderMesh,
    rippleMesh,
    rippleProgress: -1,
    chimeGlow: 0,
    angle: spec.initialAngle,
  };
}

/**
 * Updates PBR material colors & regenerates the horological dial texture when switching finishes.
 */
export function applyFinishToMaterials(
  materials: OrreryMaterials,
  finish: FinishSpec,
  maxAnisotropy: number
): void {
  materials.primaryMetal.color.setHex(finish.primaryMetal);
  materials.secondaryMetal.color.setHex(finish.secondaryMetal);
  materials.darkSteel.color.setHex(finish.darkSteel);
  materials.enamel.color.setHex(finish.enamel);
  materials.pedestal.color.setHex(finish.pedestal);
  materials.jewel.color.setHex(finish.jewel);
  materials.jewel.emissive.setHex(finish.jewel);
  materials.sunCore.color.setHex(finish.primaryMetal);
  materials.sunCore.emissive.setHex(finish.secondaryMetal);
  materials.meridianGlow.color.setHex(finish.accentGlow);
  materials.meridianGlow.emissive.setHex(finish.accentGlow);
  materials.orbitalTrack.color.setHex(finish.secondaryMetal);
  materials.floor.color.setHex(finish.backdrop);

  const nextDial = createHorologyDialTexture(finish, maxAnisotropy);
  const prevDial = materials.dialTexture;
  materials.dialTexture = nextDial;
  materials.dial.map = nextDial;
  materials.dial.needsUpdate = true;
  prevDial.dispose();
}

/**
 * Builds the entire 6-layer AURELIA Mechanical Celestial Automaton assembly.
 */
export function buildOrreryAssembly(
  finish: FinishSpec,
  maxAnisotropy: number,
  isSoftwareGl: boolean
): OrreryAssembly {
  const brushedBump = createBrushedMetalTexture();
  const stoneBump = createStoneVeinsTexture();
  const dialTexture = createHorologyDialTexture(finish, maxAnisotropy);
  const contactTexture = createContactShadowTexture();
  const starTexture = createStarSpriteTexture();

  const materials: OrreryMaterials = {
    primaryMetal: new THREE.MeshPhysicalMaterial({
      color: finish.primaryMetal,
      metalness: 0.92,
      roughness: 0.22,
      anisotropy: 0.72,
      anisotropyRotation: Math.PI / 4,
      clearcoat: 0.25,
      clearcoatRoughness: 0.2,
      bumpMap: brushedBump,
      bumpScale: 0.006,
    }),
    secondaryMetal: new THREE.MeshStandardMaterial({
      color: finish.secondaryMetal,
      metalness: 0.85,
      roughness: 0.36,
      bumpMap: brushedBump,
      bumpScale: 0.008,
    }),
    darkSteel: new THREE.MeshStandardMaterial({
      color: finish.darkSteel,
      metalness: 0.82,
      roughness: 0.28,
      bumpMap: brushedBump,
      bumpScale: 0.005,
    }),
    enamel: new THREE.MeshPhysicalMaterial({
      color: finish.enamel,
      metalness: 0.08,
      roughness: 0.16,
      clearcoat: 0.9,
      clearcoatRoughness: 0.08,
    }),
    pedestal: new THREE.MeshStandardMaterial({
      color: finish.pedestal,
      metalness: 0.12,
      roughness: 0.62,
      bumpMap: stoneBump,
      bumpScale: 0.015,
    }),
    jewel: new THREE.MeshPhysicalMaterial({
      color: finish.jewel,
      emissive: finish.jewel,
      emissiveIntensity: 0.45,
      metalness: 0.1,
      roughness: 0.08,
      clearcoat: 1.0,
    }),
    sunCore: new THREE.MeshStandardMaterial({
      color: finish.primaryMetal,
      emissive: finish.secondaryMetal,
      emissiveIntensity: 0.42,
      metalness: 0.88,
      roughness: 0.22,
      bumpMap: brushedBump,
      bumpScale: 0.008,
    }),
    meridianGlow: new THREE.MeshStandardMaterial({
      color: finish.accentGlow,
      emissive: finish.accentGlow,
      emissiveIntensity: 0.65,
      metalness: 0.5,
      roughness: 0.22,
    }),
    dial: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: dialTexture,
      metalness: 0.28,
      roughness: 0.32,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    }),
    sapphireDome: new THREE.MeshPhysicalMaterial({
      color: 0xeef5ff,
      metalness: 0.0,
      roughness: 0.06,
      transmission: isSoftwareGl ? 0 : 0.88,
      ior: 1.76,
      thickness: 0.4,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      transparent: true,
      opacity: isSoftwareGl ? 0.14 : 0.96,
      depthWrite: false,
      side: THREE.FrontSide,
    }),
    orbitalTrack: new THREE.MeshStandardMaterial({
      color: finish.secondaryMetal,
      metalness: 0.82,
      roughness: 0.34,
    }),
    floor: new THREE.MeshStandardMaterial({
      color: finish.backdrop,
      metalness: 0.02,
      roughness: 0.98,
    }),
    brushedBump,
    stoneBump,
    dialTexture,
    planetMaterials: [],
    rippleMaterials: [],
    chimePinMaterials: [],
  };

  const root = new THREE.Group();
  root.name = 'aurelia-root';

  // Ground studio plinth & soft radial contact shadow
  const shadowPlane = new THREE.Mesh(
    new THREE.CircleGeometry(7.2, 48),
    new THREE.MeshBasicMaterial({
      map: contactTexture,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
    })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -1.18;
  root.add(shadowPlane);

  const floorDisc = new THREE.Mesh(
    new THREE.CircleGeometry(34, 48),
    materials.floor
  );
  floorDisc.rotation.x = -Math.PI / 2;
  floorDisc.position.y = -1.21;
  floorDisc.receiveShadow = true;
  root.add(floorDisc);

  // =========================================================================
  // LAYER 0: Pedestal & Engraved Horological Dial
  // =========================================================================
  const pedestalGroup = new THREE.Group();
  pedestalGroup.position.y = -1.16;

  const plinthMesh = new THREE.Mesh(createPedestalProfile(), materials.pedestal);
  plinthMesh.castShadow = true;
  plinthMesh.receiveShadow = true;
  pedestalGroup.add(plinthMesh);

  // Brass lower molding ring + upper bezel rim
  const lowerTrim = new THREE.Mesh(
    new THREE.TorusGeometry(5.32, 0.075, 14, 72),
    materials.primaryMetal
  );
  lowerTrim.rotation.x = Math.PI / 2;
  lowerTrim.position.y = 0.24;
  pedestalGroup.add(lowerTrim);

  const upperBezel = new THREE.Mesh(
    new THREE.TorusGeometry(4.94, 0.095, 16, 72),
    materials.primaryMetal
  );
  upperBezel.rotation.x = Math.PI / 2;
  upperBezel.position.y = 1.07;
  pedestalGroup.add(upperBezel);

  // 6 sculpted brass claw feet supporting the base
  for (let f = 0; f < 6; f++) {
    const a = (f / 6) * Math.PI * 2 + Math.PI / 6;
    const footGroup = new THREE.Group();
    const block = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.32, 0.34, 16),
      materials.secondaryMetal
    );
    block.position.y = 0.14;
    footGroup.add(block);

    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 16, 12),
      materials.primaryMetal
    );
    cap.position.y = 0.32;
    footGroup.add(cap);

    footGroup.position.set(Math.cos(a) * 5.26, 0, Math.sin(a) * 5.26);
    pedestalGroup.add(footGroup);
  }

  // Engraved Guilloché Horological Dial Plate (Y offset prevents Z-fighting)
  const dialPlate = new THREE.Mesh(
    new THREE.CylinderGeometry(4.62, 4.62, 0.04, 64),
    [materials.primaryMetal, materials.dial, materials.enamel]
  );
  dialPlate.position.y = 1.045;
  dialPlate.receiveShadow = true;
  pedestalGroup.add(dialPlate);

  // 24 Instanced Perimeter Brass Bezel Rivets
  const rivetGeo = new THREE.CylinderGeometry(0.055, 0.065, 0.06, 12);
  const rivetInst = new THREE.InstancedMesh(rivetGeo, materials.primaryMetal, 24);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    dummy.position.set(Math.cos(a) * 4.82, 1.12, Math.sin(a) * 4.82);
    dummy.rotation.set(0, -a, 0);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    rivetInst.setMatrixAt(i, dummy.matrix);
  }
  rivetInst.instanceMatrix.needsUpdate = true;
  rivetInst.computeBoundingSphere();
  pedestalGroup.add(rivetInst);

  root.add(pedestalGroup);

  // =========================================================================
  // LAYER 1: Interlocking Extruded Clockwork Gear Train
  // =========================================================================
  const gearTrainGroup = new THREE.Group();
  gearTrainGroup.position.y = 0.08;
  const gearMeshes: THREE.Group[] = [];

  GEAR_TRAIN.forEach((gearSpec, idx) => {
    const gGroup = new THREE.Group();
    gGroup.position.set(gearSpec.x, gearSpec.y, gearSpec.z);

    const gearGeo = createInvoluteGearGeometry(
      gearSpec.teeth,
      gearSpec.outerRadius,
      gearSpec.innerRadius,
      gearSpec.thickness,
      gearSpec.spokeCount
    );
    const gearMat = idx % 2 === 0 ? materials.primaryMetal : materials.secondaryMetal;
    const gearMesh = new THREE.Mesh(gearGeo, gearMat);
    gearMesh.castShadow = true;
    gearMesh.receiveShadow = true;
    gGroup.add(gearMesh);

    // Steel arbor spindle & ruby jewel pivot bearing
    const arbor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.075, 0.28, 16),
      materials.darkSteel
    );
    arbor.position.y = 0.02;
    gGroup.add(arbor);

    const jewelBearing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.085, 0.04, 16),
      materials.jewel
    );
    jewelBearing.position.y = 0.14;
    gGroup.add(jewelBearing);

    gearTrainGroup.add(gGroup);
    gearMeshes.push(gGroup);
  });

  // Skeletonized horological bridge arms anchoring gear pivots
  for (let b = 0; b < 3; b++) {
    const a = (b / 3) * Math.PI * 2 + 0.35;
    const bridge = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.06, 4.3),
      materials.darkSteel
    );
    bridge.position.set(Math.cos(a) * 2.1, -0.09, Math.sin(a) * 2.1);
    bridge.rotation.y = -a + Math.PI / 2;
    gearTrainGroup.add(bridge);
  }

  root.add(gearTrainGroup);

  // =========================================================================
  // LAYER 2: Armillary Meridian Rings & Golden Strike Needle (+Z Meridian)
  // =========================================================================
  const meridianGroup = new THREE.Group();
  meridianGroup.position.y = 0.12;

  // Grand stationary tilted ecliptic armillary ring
  const eclipticRing = new THREE.Mesh(
    new THREE.TorusGeometry(4.78, 0.065, 16, 96),
    materials.primaryMetal
  );
  eclipticRing.rotation.x = Math.PI / 2 - 0.22;
  eclipticRing.position.y = 1.25;
  meridianGroup.add(eclipticRing);

  // Twin vertical meridian arch brackets framing the orrery
  const archGeo = new THREE.TorusGeometry(4.84, 0.048, 12, 64, Math.PI);
  const arch1 = new THREE.Mesh(archGeo, materials.secondaryMetal);
  arch1.position.y = 0.02;
  meridianGroup.add(arch1);

  const arch2 = new THREE.Mesh(archGeo, materials.darkSteel);
  arch2.rotation.y = Math.PI / 2;
  arch2.position.y = 0.02;
  meridianGroup.add(arch2);

  // Golden Meridian Harmonic Strike Bridge along +Z (where angle == 0 triggers musical chimes)
  const strikeRail = new THREE.Mesh(
    new THREE.BoxGeometry(0.085, 0.06, 3.6),
    materials.primaryMetal
  );
  strikeRail.position.set(0, 0.08, 2.95);
  meridianGroup.add(strikeRail);

  // Decorative meridian spire pillar at outer +Z rim
  const spireBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.16, 1.95, 16),
    materials.primaryMetal
  );
  spireBase.position.set(0, 0.96, 4.78);
  meridianGroup.add(spireBase);

  const spireGem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.13, 0),
    materials.meridianGlow
  );
  spireGem.position.set(0, 2.02, 4.78);
  meridianGroup.add(spireGem);

  // 6 Individual Harmonic Chime Pins aligned right underneath each planet's +Z crossing
  PLANETS.forEach((p) => {
    const pinMat = new THREE.MeshStandardMaterial({
      color: finish.primaryMetal,
      emissive: p.accentHex,
      emissiveIntensity: 0.22,
      metalness: 0.7,
      roughness: 0.24,
    });
    materials.chimePinMaterials.push(pinMat);

    const pinH = Math.max(0.16, p.armElevation - p.bodyRadius - 0.14);
    const pin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.036, pinH, 12),
      pinMat
    );
    pin.position.set(0, 0.08 + pinH * 0.5, p.orbitRadius);
    meridianGroup.add(pin);

    const tip = new THREE.Mesh(
      new THREE.SphereGeometry(0.048, 12, 10),
      pinMat
    );
    tip.position.set(0, 0.08 + pinH + 0.03, p.orbitRadius);
    meridianGroup.add(tip);
  });

  root.add(meridianGroup);

  // =========================================================================
  // LAYER 3: Central Sun Gyroscopic Tourbillon Escapement Cage
  // =========================================================================
  const tourbillonGroup = new THREE.Group();
  tourbillonGroup.position.y = 1.62;

  // Central sculpted vertical column spindle connecting gears to tourbillon
  const centerSpindle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.095, 0.14, 1.68, 20),
    materials.primaryMetal
  );
  centerSpindle.position.y = -0.84;
  tourbillonGroup.add(centerSpindle);

  // Outer Tourbillon Cage Ring
  const tourbillonOuter = new THREE.Group();
  const outerRingMesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.92, 0.038, 14, 56),
    materials.primaryMetal
  );
  tourbillonOuter.add(outerRingMesh);

  // 8 Ruby Jewel Studs around outer tourbillon ring
  for (let j = 0; j < 8; j++) {
    const a = (j / 8) * Math.PI * 2;
    const stud = new THREE.Mesh(
      new THREE.SphereGeometry(0.044, 10, 8),
      materials.jewel
    );
    stud.position.set(Math.cos(a) * 0.92, Math.sin(a) * 0.92, 0);
    tourbillonOuter.add(stud);
  }
  tourbillonGroup.add(tourbillonOuter);

  // Middle Counter-Rotating Gyroscopic Ring
  const tourbillonMid = new THREE.Group();
  const midRingMesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.74, 0.032, 14, 48),
    materials.darkSteel
  );
  midRingMesh.rotation.y = Math.PI / 2;
  tourbillonMid.add(midRingMesh);

  const midBridge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 1.48, 10),
    materials.secondaryMetal
  );
  tourbillonMid.add(midBridge);
  tourbillonGroup.add(tourbillonMid);

  // Inner Escapement Balance Ring
  const tourbillonInner = new THREE.Group();
  const innerRingMesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.56, 0.026, 12, 42),
    materials.secondaryMetal
  );
  innerRingMesh.rotation.x = Math.PI / 2;
  tourbillonInner.add(innerRingMesh);
  tourbillonGroup.add(tourbillonInner);

  // Radiant Sculpted Sun Core (composite core + 12 solar rays)
  const sunCoreMesh = new THREE.Group();
  const sunSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 32, 24),
    materials.sunCore
  );
  sunCoreMesh.add(sunSphere);

  const sunEqHalo = new THREE.Mesh(
    new THREE.TorusGeometry(0.42, 0.018, 10, 36),
    materials.primaryMetal
  );
  sunEqHalo.rotation.x = Math.PI / 2;
  sunCoreMesh.add(sunEqHalo);

  for (let rIdx = 0; rIdx < 12; rIdx++) {
    const a = (rIdx / 12) * Math.PI * 2;
    const ray = new THREE.Mesh(
      new THREE.ConeGeometry(0.038, 0.17, 6),
      materials.primaryMetal
    );
    ray.position.set(Math.cos(a) * 0.42, 0, Math.sin(a) * 0.42);
    ray.rotation.z = -Math.PI / 2;
    ray.rotation.y = -a;
    sunCoreMesh.add(ray);
  }
  tourbillonGroup.add(sunCoreMesh);

  root.add(tourbillonGroup);

  // =========================================================================
  // LAYER 4: 6 Composite Planetary Orbits & Rail Tracks
  // =========================================================================
  const planetsGroup = new THREE.Group();
  planetsGroup.position.y = 0.24;

  const planetNodes: PlanetRuntimeNode[] = [];
  const interactables: THREE.Object3D[] = [];

  PLANETS.forEach((spec, idx) => {
    // Hairline metallic orbital guide rail at each planet's radius
    const track = new THREE.Mesh(
      new THREE.TorusGeometry(spec.orbitRadius, 0.011, 8, 84),
      materials.orbitalTrack
    );
    track.rotation.x = Math.PI / 2;
    track.position.y = spec.armElevation - spec.bodyRadius - 0.14;
    planetsGroup.add(track);

    const node = createPlanetAssembly(spec, idx, materials);
    planetsGroup.add(node.armGroup);
    planetNodes.push(node);
    interactables.push(node.colliderMesh);
  });

  root.add(planetsGroup);

  // =========================================================================
  // LAYER 5: Sapphire Crystal Bell Dome & Apex Finial
  // =========================================================================
  const domeGroup = new THREE.Group();
  domeGroup.position.y = 0.0;

  const domeGeo = new THREE.SphereGeometry(
    4.92,
    48,
    24,
    0,
    Math.PI * 2,
    0,
    Math.PI * 0.5
  );
  const domeMesh = new THREE.Mesh(domeGeo, materials.sapphireDome);
  domeMesh.renderOrder = 10;
  domeGroup.add(domeMesh);

  // Machined brass dome lip collar
  const domeLip = new THREE.Mesh(
    new THREE.TorusGeometry(4.92, 0.055, 12, 72),
    materials.primaryMetal
  );
  domeLip.rotation.x = Math.PI / 2;
  domeLip.position.y = 0.04;
  domeGroup.add(domeLip);

  // Apex finial crown atop the sapphire dome
  const apexBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.34, 0.16, 24),
    materials.primaryMetal
  );
  apexBase.position.y = 4.94;
  domeGroup.add(apexBase);

  const apexSpire = new THREE.Mesh(
    new THREE.ConeGeometry(0.1, 0.55, 16),
    materials.primaryMetal
  );
  apexSpire.position.y = 5.26;
  domeGroup.add(apexSpire);

  const apexJewel = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.11, 0),
    materials.jewel
  );
  apexJewel.position.y = 5.56;
  domeGroup.add(apexJewel);

  root.add(domeGroup);

  // =========================================================================
  // Subtle Observatory Celestial Dust Starfield (distant background depth)
  // =========================================================================
  const starCount = 260;
  const starPositions = new Float32Array(starCount * 3);
  let seed = 7331;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < starCount; i++) {
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(2 * rand() - 1);
    const dist = 16 + rand() * 24;
    starPositions[i * 3] = dist * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = Math.abs(dist * Math.cos(phi)) - 2.0;
    starPositions[i * 3 + 2] = dist * Math.sin(phi) * Math.sin(theta);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xf4e3b8,
    size: 0.24,
    map: starTexture,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const starField = new THREE.Points(starGeo, starMat);
  root.add(starField);

  const dispose = () => {
    root.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    materials.brushedBump.dispose();
    materials.stoneBump.dispose();
    materials.dialTexture.dispose();
    contactTexture.dispose();
    starTexture.dispose();
  };

  return {
    root,
    pedestalGroup,
    gearTrainGroup,
    meridianGroup,
    tourbillonGroup,
    planetsGroup,
    domeGroup,
    gearMeshes,
    tourbillonOuter,
    tourbillonMid,
    tourbillonInner,
    sunCoreMesh,
    planetNodes,
    interactables,
    starField,
    materials,
    dispose,
  };
}
