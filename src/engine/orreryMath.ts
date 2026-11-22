export type FinishId = 'hoang-kim' | 'bach-kim' | 'dong-co' | 'ngoc-luc-bao';

export type ScaleId = 'ngu-cung' | 'mong-ao' | 'da-khuc' | 'thien-ha';

export type CameraPresetId = 'overview' | 'tourbillon' | 'zenith' | 'hero';

export interface PlanetSpec {
  id: string;
  name: string;
  shortName: string;
  subtitle: string;
  orbitRadius: number;
  baseSpeed: number; // radians per second at 1x speed
  initialAngle: number;
  bodyRadius: number;
  armElevation: number;
  axialTilt: number;
  hasRings?: boolean;
  hasMoon?: boolean;
  hasBands?: boolean;
  isFaceted?: boolean;
  accentHex: number;
  swatchHex: string;
}

export interface FinishSpec {
  id: FinishId;
  name: string;
  shortName: string;
  swatchHex: string;
  accentSwatchHex: string;
  primaryMetal: number;
  secondaryMetal: number;
  darkSteel: number;
  enamel: number;
  pedestal: number;
  jewel: number;
  accentGlow: number;
  dialBg: string;
  dialInk: string;
  dialAccent: string;
  backdrop: number;
  fogColor: number;
}

export interface ScaleSpec {
  id: ScaleId;
  name: string;
  mood: string;
  frequencies: readonly [number, number, number, number, number, number];
  noteNames: readonly [string, string, string, string, string, string];
}

export interface CameraPresetSpec {
  id: CameraPresetId;
  name: string;
  position: readonly [number, number, number];
  target: readonly [number, number, number];
}

export interface GearSpec {
  id: string;
  teeth: number;
  outerRadius: number;
  innerRadius: number;
  thickness: number;
  spokeCount: number;
  x: number;
  y: number;
  z: number;
  parentIndex: number; // -1 for central driver
  phaseOffset: number;
}

export interface ExplodedOffsets {
  pedestalY: number;
  gearTrainY: number;
  meridianY: number;
  tourbillonY: number;
  planetsY: number;
  domeY: number;
}

export const TAU = Math.PI * 2;

export const PLANETS: readonly PlanetSpec[] = [
  {
    id: 'mercury',
    name: 'Thủy Tinh',
    shortName: 'Thủy',
    subtitle: 'Chu kỳ nhanh · 5:2',
    orbitRadius: 1.48,
    baseSpeed: 0.92,
    initialAngle: 0.45,
    bodyRadius: 0.145,
    armElevation: 0.24,
    axialTilt: 0.12,
    isFaceted: true,
    accentHex: 0xe5cfa0,
    swatchHex: '#e5cfa0',
  },
  {
    id: 'venus',
    name: 'Kim Tinh',
    shortName: 'Kim',
    subtitle: 'Ánh đồng vàng · 2:1',
    orbitRadius: 1.96,
    baseSpeed: 0.68,
    initialAngle: 1.85,
    bodyRadius: 0.185,
    armElevation: 0.44,
    axialTilt: 0.24,
    accentHex: 0xd9965b,
    swatchHex: '#d9965b',
  },
  {
    id: 'earth',
    name: 'Địa Cầu',
    shortName: 'Địa',
    subtitle: 'Men xanh lam · 3:2',
    orbitRadius: 2.52,
    baseSpeed: 0.51,
    initialAngle: 3.1,
    bodyRadius: 0.21,
    armElevation: 0.66,
    axialTilt: 0.41,
    hasMoon: true,
    accentHex: 0x3b78b8,
    swatchHex: '#4f8fd0',
  },
  {
    id: 'mars',
    name: 'Hỏa Tinh',
    shortName: 'Hỏa',
    subtitle: 'Hồng ngọc trầm · 4:3',
    orbitRadius: 3.04,
    baseSpeed: 0.39,
    initialAngle: 4.55,
    bodyRadius: 0.175,
    armElevation: 0.88,
    axialTilt: 0.44,
    accentHex: 0xc25b43,
    swatchHex: '#cf6b52',
  },
  {
    id: 'jupiter',
    name: 'Mộc Tinh',
    shortName: 'Mộc',
    subtitle: 'Vân hổ phách · 1:1',
    orbitRadius: 3.68,
    baseSpeed: 0.28,
    initialAngle: 5.5,
    bodyRadius: 0.285,
    armElevation: 1.14,
    axialTilt: 0.08,
    hasBands: true,
    accentHex: 0xc89a67,
    swatchHex: '#d4a978',
  },
  {
    id: 'saturn',
    name: 'Thổ Tinh',
    shortName: 'Thổ',
    subtitle: 'Vành tinh vân · 3:4',
    orbitRadius: 4.42,
    baseSpeed: 0.205,
    initialAngle: 2.55,
    bodyRadius: 0.245,
    armElevation: 1.4,
    axialTilt: 0.47,
    hasRings: true,
    accentHex: 0xdfb976,
    swatchHex: '#e7c688',
  },
];

export const FINISHES: Record<FinishId, FinishSpec> = {
  'hoang-kim': {
    id: 'hoang-kim',
    name: 'Hoàng Kim Hắc Diện',
    shortName: 'Hoàng Kim',
    swatchHex: '#d4af37',
    accentSwatchHex: '#181a22',
    primaryMetal: 0xd8b154,
    secondaryMetal: 0xb9853b,
    darkSteel: 0x26344a,
    enamel: 0x11131a,
    pedestal: 0x131419,
    jewel: 0xc81d4e,
    accentGlow: 0xf7d87c,
    dialBg: '#101219',
    dialInk: '#e3c474',
    dialAccent: '#8e6b2d',
    backdrop: 0x090a0f,
    fogColor: 0x090a0f,
  },
  'bach-kim': {
    id: 'bach-kim',
    name: 'Bạch Kim Băng Giá',
    shortName: 'Bạch Kim',
    swatchHex: '#cfd9e6',
    accentSwatchHex: '#1c293a',
    primaryMetal: 0xd8e0ea,
    secondaryMetal: 0x8ea6c2,
    darkSteel: 0x243b57,
    enamel: 0x101824,
    pedestal: 0x141b26,
    jewel: 0x3b82f6,
    accentGlow: 0xaad4ff,
    dialBg: '#0f1722',
    dialInk: '#dce6f2',
    dialAccent: '#698bb2',
    backdrop: 0x080c14,
    fogColor: 0x080c14,
  },
  'dong-co': {
    id: 'dong-co',
    name: 'Đồng Cổ Phục Hưng',
    shortName: 'Đồng Cổ',
    swatchHex: '#b87649',
    accentSwatchHex: '#241b16',
    primaryMetal: 0xc07b4a,
    secondaryMetal: 0x6f9687,
    darkSteel: 0x362821,
    enamel: 0x1a1411,
    pedestal: 0x1c1512,
    jewel: 0xe07a32,
    accentGlow: 0xffc684,
    dialBg: '#19130f',
    dialInk: '#e2b587',
    dialAccent: '#709888',
    backdrop: 0x0d0a08,
    fogColor: 0x0d0a08,
  },
  'ngoc-luc-bao': {
    id: 'ngoc-luc-bao',
    name: 'Ngọc Lục Bảo Đế Vương',
    shortName: 'Lục Bảo',
    swatchHex: '#2f9e75',
    accentSwatchHex: '#0f241d',
    primaryMetal: 0xdcc07a,
    secondaryMetal: 0x3f8f72,
    darkSteel: 0x16382c,
    enamel: 0x0b1f18,
    pedestal: 0x0d1b16,
    jewel: 0x10b981,
    accentGlow: 0x7ef2c2,
    dialBg: '#0b1d17',
    dialInk: '#e6cf92',
    dialAccent: '#3d9876',
    backdrop: 0x07100d,
    fogColor: 0x07100d,
  },
};

export const FINISH_LIST: readonly FinishSpec[] = [
  FINISHES['hoang-kim'],
  FINISHES['bach-kim'],
  FINISHES['dong-co'],
  FINISHES['ngoc-luc-bao'],
];

export const SCALES: Record<ScaleId, ScaleSpec> = {
  'ngu-cung': {
    id: 'ngu-cung',
    name: 'Ngũ Cung',
    mood: 'Thanh thoát · Cân bằng',
    // Inner fastest planet = highest shimmering chime; outer slowest = warm bass chime
    frequencies: [880.0, 659.25, 587.33, 523.25, 392.0, 261.63],
    noteNames: ['La5', 'Mi5', 'Rê5', 'Đô5', 'Sol4', 'Đô4'],
  },
  'mong-ao': {
    id: 'mong-ao',
    name: 'Mộng Ảo',
    mood: 'Lydian · Huyền diệu',
    frequencies: [987.77, 739.99, 659.25, 523.25, 392.0, 261.63],
    noteNames: ['Si5', 'Fa#5', 'Mi5', 'Đô5', 'Sol4', 'Đô4'],
  },
  'da-khuc': {
    id: 'da-khuc',
    name: 'Dạ Khúc',
    mood: 'Dorian · Trầm lắng',
    frequencies: [880.0, 698.46, 587.33, 523.25, 440.0, 293.66],
    noteNames: ['La5', 'Fa5', 'Rê5', 'Đô5', 'La4', 'Rê4'],
  },
  'thien-ha': {
    id: 'thien-ha',
    name: 'Thiên Hà',
    mood: 'Hòa âm cổ điển · Sâu thẳm',
    frequencies: [932.33, 783.99, 622.25, 523.25, 392.0, 246.94],
    noteNames: ['Sib5', 'Sol5', 'Mib5', 'Đô5', 'Sol4', 'Si3'],
  },
};

export const SCALE_LIST: readonly ScaleSpec[] = [
  SCALES['ngu-cung'],
  SCALES['mong-ao'],
  SCALES['da-khuc'],
  SCALES['thien-ha'],
];

export const CAMERA_PRESETS: Record<CameraPresetId, CameraPresetSpec> = {
  overview: {
    id: 'overview',
    name: 'Toàn Cảnh',
    position: [0.0, 6.9, 13.9],
    target: [0.0, 0.55, 0.0],
  },
  tourbillon: {
    id: 'tourbillon',
    name: 'Cận Cảnh',
    position: [3.2, 3.1, 4.5],
    target: [0.0, 1.35, 0.0],
  },
  zenith: {
    id: 'zenith',
    name: 'Thiên Đỉnh',
    position: [0.0, 14.8, 0.9],
    target: [0.0, 0.3, 0.0],
  },
  hero: {
    id: 'hero',
    name: 'Điện Ảnh',
    position: [-8.6, 4.4, 9.8],
    target: [0.0, 0.85, 0.0],
  },
};

export const CAMERA_PRESET_LIST: readonly CameraPresetSpec[] = [
  CAMERA_PRESETS.overview,
  CAMERA_PRESETS.tourbillon,
  CAMERA_PRESETS.zenith,
  CAMERA_PRESETS.hero,
];

/**
 * Interlocking horological gear train layout.
 * Center distances strictly match (r_pitch1 + r_pitch2) so teeth mesh cleanly.
 */
export const GEAR_TRAIN: readonly GearSpec[] = [
  // 0: Central main drive gear
  {
    id: 'main-crown',
    teeth: 36,
    outerRadius: 1.56,
    innerRadius: 0.42,
    thickness: 0.12,
    spokeCount: 6,
    x: 0,
    y: 0,
    z: 0,
    parentIndex: -1,
    phaseOffset: 0,
  },
  // 1: East intermediate wheel meshing with main (pitch ~ 1.48 + 0.78 = 2.26)
  {
    id: 'east-wheel',
    teeth: 18,
    outerRadius: 0.84,
    innerRadius: 0.2,
    thickness: 0.11,
    spokeCount: 5,
    x: 2.26,
    y: 0.01,
    z: 0,
    parentIndex: 0,
    phaseOffset: Math.PI / 18,
  },
  // 2: West escapement relay wheel meshing with main
  {
    id: 'west-wheel',
    teeth: 24,
    outerRadius: 1.08,
    innerRadius: 0.26,
    thickness: 0.11,
    spokeCount: 6,
    x: -2.48,
    y: 0.01,
    z: 0.35,
    parentIndex: 0,
    phaseOffset: Math.PI / 24,
  },
  // 3: South-East planetary transfer pinion meshing with east-wheel
  {
    id: 'se-pinion',
    teeth: 14,
    outerRadius: 0.66,
    innerRadius: 0.16,
    thickness: 0.11,
    spokeCount: 4,
    x: 2.26 + Math.cos(-0.92) * 1.4,
    y: 0.01,
    z: Math.sin(-0.92) * 1.4,
    parentIndex: 1,
    phaseOffset: 0,
  },
  // 4: North-West calendar wheel meshing with main
  {
    id: 'nw-calendar',
    teeth: 20,
    outerRadius: 0.92,
    innerRadius: 0.22,
    thickness: 0.11,
    spokeCount: 5,
    x: Math.cos(2.18) * 2.34,
    y: 0.01,
    z: Math.sin(2.18) * 2.34,
    parentIndex: 0,
    phaseOffset: Math.PI / 20,
  },
  // 5: South harmonic chime wheel meshing with main
  {
    id: 'south-chime',
    teeth: 28,
    outerRadius: 1.24,
    innerRadius: 0.32,
    thickness: 0.11,
    spokeCount: 6,
    x: Math.cos(-1.72) * 2.66,
    y: 0.01,
    z: Math.sin(-1.72) * 2.66,
    parentIndex: 0,
    phaseOffset: Math.PI / 28,
  },
];

export function normalizeAngle(angle: number): number {
  const m = angle % TAU;
  return m < 0 ? m + TAU : m;
}

/**
 * Detects if a rotating body crossed the meridian angle (default 0 / 2π)
 * between prevAngle and nextAngle, supporting both forward and reverse rotation.
 */
export function detectMeridianCrossing(
  prevAngle: number,
  nextAngle: number,
  meridianAngle = 0
): boolean {
  const delta = nextAngle - prevAngle;
  if (Math.abs(delta) < 1e-9) return false;

  const prevRel = prevAngle - meridianAngle;
  const nextRel = nextAngle - meridianAngle;

  const prevTurn = Math.floor(prevRel / TAU);
  const nextTurn = Math.floor(nextRel / TAU);

  return prevTurn !== nextTurn;
}

/**
 * Computes exact angular positions for a meshed gear train given a driver angle.
 * Adjacent meshed gears rotate in opposite directions at ratio -parentTeeth / childTeeth.
 */
export function computeMeshedGearAngles(
  driverAngle: number,
  gears: readonly GearSpec[] = GEAR_TRAIN
): number[] {
  const angles: number[] = new Array(gears.length).fill(0);

  for (let i = 0; i < gears.length; i++) {
    const gear = gears[i];
    if (gear.parentIndex < 0) {
      angles[i] = driverAngle + gear.phaseOffset;
    } else {
      const parent = gears[gear.parentIndex];
      const parentPureAngle = angles[gear.parentIndex] - parent.phaseOffset;
      const ratio = -parent.teeth / gear.teeth;
      angles[i] = parentPureAngle * ratio + gear.phaseOffset;
    }
  }

  return angles;
}

/**
 * Computes smooth vertical Y-offsets for the 6 mechanical layers in Exploded View.
 * factor is clamped to [0, 1].
 */
export function computeLayerOffsets(factor: number): ExplodedOffsets {
  const t = Math.max(0, Math.min(1, factor));
  if (t === 0) {
    return {
      pedestalY: 0,
      gearTrainY: 0,
      meridianY: 0,
      tourbillonY: 0,
      planetsY: 0,
      domeY: 0,
    };
  }
  // Smooth ease-out curve for graceful horological separation
  const eased = t * t * (3 - 2 * t);

  return {
    pedestalY: -0.95 * eased,
    gearTrainY: -0.22 * eased,
    meridianY: 0.45 * eased,
    tourbillonY: 1.25 * eased,
    planetsY: 2.05 * eased,
    domeY: 3.15 * eased,
  };
}

export function getNoteForPlanet(
  planetIndex: number,
  scaleId: ScaleId
): { frequency: number; noteName: string } {
  const scale = SCALES[scaleId];
  const safeIdx = ((planetIndex % 6) + 6) % 6;
  return {
    frequency: scale.frequencies[safeIdx],
    noteName: scale.noteNames[safeIdx],
  };
}
