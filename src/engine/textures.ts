import * as THREE from 'three';
import { FinishSpec } from './orreryMath';

const ROMAN_NUMERALS = [
  'XII',
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
  'XI',
];

const ZODIAC_MARKS = [
  '♈',
  '♉',
  '♊',
  '♋',
  '♌',
  '♍',
  '♎',
  '♏',
  '♐',
  '♑',
  '♒',
  '♓',
];

/**
 * High-resolution guilloché astronomical dial texture with Roman numerals,
 * degree scale ticks, celestial star rose, and concentric engraved rings.
 */
export function createHorologyDialTexture(
  finish: FinishSpec,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.48;

  // Deep radial enamel gradient
  const bgGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, radius);
  bgGrad.addColorStop(0, finish.dialBg);
  bgGrad.addColorStop(0.62, finish.dialBg);
  bgGrad.addColorStop(1, '#06070a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, size, size);

  // Subtle guilloché concentric wave rings
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = finish.dialAccent;
  ctx.globalAlpha = 0.2;
  ctx.lineWidth = 1;
  for (let r = 68; r < radius - 90; r += 10) {
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 2; a += 0.04) {
      const wave = Math.sin(a * 36) * 2.2;
      const x = Math.cos(a) * (r + wave);
      const y = Math.sin(a) * (r + wave);
      if (a === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();

  // Concentric chapter rings
  const ringRadii = [radius * 0.98, radius * 0.92, radius * 0.78, radius * 0.64, radius * 0.36];
  ctx.strokeStyle = finish.dialInk;
  ringRadii.forEach((r, idx) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.lineWidth = idx === 0 || idx === 2 ? 2.6 : 1.3;
    ctx.globalAlpha = idx === 4 ? 0.45 : 0.78;
    ctx.stroke();
  });

  // 360 degree outer micro-ticks
  ctx.save();
  ctx.translate(cx, cy);
  for (let deg = 0; deg < 360; deg += 2) {
    const rad = (deg * Math.PI) / 180;
    const isMajor = deg % 30 === 0;
    const isMid = deg % 10 === 0;
    const innerR = isMajor ? radius * 0.915 : isMid ? radius * 0.935 : radius * 0.952;
    const outerR = radius * 0.975;

    ctx.beginPath();
    ctx.moveTo(Math.cos(rad) * innerR, Math.sin(rad) * innerR);
    ctx.lineTo(Math.cos(rad) * outerR, Math.sin(rad) * outerR);
    ctx.strokeStyle = isMajor ? finish.dialInk : finish.dialAccent;
    ctx.globalAlpha = isMajor ? 0.95 : isMid ? 0.7 : 0.42;
    ctx.lineWidth = isMajor ? 2.4 : 1.1;
    ctx.stroke();
  }
  ctx.restore();

  // Roman numerals along chapter ring
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = finish.dialInk;
  ctx.globalAlpha = 0.92;
  ctx.font = '600 32px "Cormorant Garamond", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ROMAN_NUMERALS.forEach((num, idx) => {
    const angle = (idx / 12) * Math.PI * 2 - Math.PI / 2;
    ctx.save();
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillText(num, 0, -radius * 0.85);
    ctx.restore();
  });

  // Subtle zodiacal astronomical glyphs inside secondary ring
  ctx.fillStyle = finish.dialAccent;
  ctx.globalAlpha = 0.72;
  ctx.font = '500 22px Georgia, serif';
  ZODIAC_MARKS.forEach((glyph, idx) => {
    const angle = ((idx + 0.5) / 12) * Math.PI * 2 - Math.PI / 2;
    ctx.save();
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillText(glyph, 0, -radius * 0.71);
    ctx.restore();
  });

  // Central compass rose star rays
  ctx.strokeStyle = finish.dialInk;
  ctx.globalAlpha = 0.45;
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const len = i % 2 === 0 ? radius * 0.62 : radius * 0.34;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
    ctx.lineWidth = i % 4 === 0 ? 1.8 : 0.9;
    ctx.stroke();
  }

  // Signature engraving on lower dial arc
  ctx.fillStyle = finish.dialInk;
  ctx.globalAlpha = 0.78;
  ctx.font = '600 18px "Cormorant Garamond", Georgia, serif';
  ctx.fillText('A U R E L I A', 0, radius * 0.48);
  ctx.globalAlpha = 0.52;
  ctx.font = '500 11px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('CHRONOMÈTRE CÉLESTE', 0, radius * 0.535);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Tileable fine brushed-metal micro-grain grayscale texture for bumpMap & roughnessMap.
 */
export function createBrushedMetalTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  // Deterministic pseudo-random brushed streaks
  let seed = 4219;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let y = 0; y < size; y++) {
    const lum = Math.floor(110 + rand() * 44);
    ctx.fillStyle = `rgb(${lum},${lum},${lum})`;
    ctx.fillRect(0, y, size, 1);
  }

  for (let i = 0; i < 420; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const w = 18 + rand() * 84;
    const lum = Math.floor(96 + rand() * 72);
    ctx.fillStyle = `rgba(${lum},${lum},${lum},0.45)`;
    ctx.fillRect(x, y, w, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Veined stone/obsidian bump texture for the carved horological pedestal.
 */
export function createStoneVeinsTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#7a7a7a';
  ctx.fillRect(0, 0, size, size);

  let seed = 9187;
  const rand = () => {
    seed = (seed * 48271) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < 18; i++) {
    ctx.beginPath();
    let x = rand() * size;
    let y = rand() * size;
    ctx.moveTo(x, y);
    for (let s = 0; s < 14; s++) {
      x += (rand() - 0.35) * 32;
      y += (rand() - 0.5) * 28;
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = i % 2 === 0 ? 'rgba(220,210,190,0.22)' : 'rgba(35,35,40,0.3)';
    ctx.lineWidth = 0.8 + rand() * 2.1;
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Soft radial contact shadow disc for grounding the pedestal on the studio floor.
 */
export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const half = size / 2;

  const grad = ctx.createRadialGradient(half, half, 12, half, half, half);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.82)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.42)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Soft glowing star sprite for atmospheric celestial dust in the observatory backdrop.
 */
export function createStarSpriteTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const half = size / 2;

  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0, 'rgba(255, 248, 226, 1)');
  grad.addColorStop(0.28, 'rgba(245, 224, 175, 0.65)');
  grad.addColorStop(1, 'rgba(245, 224, 175, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
