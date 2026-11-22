import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TAU,
  GEAR_TRAIN,
  PLANETS,
  SCALE_LIST,
  FINISH_LIST,
  computeLayerOffsets,
  computeMeshedGearAngles,
  detectMeridianCrossing,
  getNoteForPlanet,
  normalizeAngle,
} from './orreryMath';

test('normalizeAngle wraps positive and negative values into [0, 2π)', () => {
  assert.ok(Math.abs(normalizeAngle(0) - 0) < 1e-9);
  assert.ok(Math.abs(normalizeAngle(TAU + 0.5) - 0.5) < 1e-9);
  assert.ok(Math.abs(normalizeAngle(-Math.PI / 2) - (3 * Math.PI) / 2) < 1e-9);
});

test('detectMeridianCrossing triggers on forward and reverse boundary crossings only', () => {
  // Forward cross across 2π
  assert.equal(detectMeridianCrossing(TAU - 0.1, TAU + 0.1), true);
  // Reverse cross across 2π
  assert.equal(detectMeridianCrossing(TAU + 0.1, TAU - 0.1), true);
  // Reverse cross across 0 into negative
  assert.equal(detectMeridianCrossing(0.05, -0.05), true);
  // No crossing inside open interval
  assert.equal(detectMeridianCrossing(1.0, 1.4), false);
  // Zero motion does not trigger
  assert.equal(detectMeridianCrossing(0, 0), false);
});

test('computeMeshedGearAngles applies opposite signs and exact tooth ratios', () => {
  const driver = 1.0;
  const angles = computeMeshedGearAngles(driver, GEAR_TRAIN);

  assert.equal(angles.length, GEAR_TRAIN.length);
  // Gear 0 is main driver (36 teeth)
  assert.ok(Math.abs(angles[0] - driver) < 1e-9);

  // Gear 1 (18 teeth) meshes directly with Gear 0 (36 teeth) => ratio -2.0
  const expectedGear1 = -2.0 * driver + GEAR_TRAIN[1].phaseOffset;
  assert.ok(Math.abs(angles[1] - expectedGear1) < 1e-9);

  // Gear 3 (14 teeth) meshes with Gear 1 (18 teeth) => rotates same direction as Gear 0
  const ratio0To3 = (36 / 18) * (18 / 14);
  const expectedGear3 = ratio0To3 * driver + GEAR_TRAIN[3].phaseOffset;
  assert.ok(Math.abs(angles[3] - expectedGear3) < 1e-9);
});

test('computeLayerOffsets preserves strict vertical ordering from pedestal to dome', () => {
  const closed = computeLayerOffsets(0);
  assert.equal(closed.pedestalY, 0);
  assert.equal(closed.domeY, 0);

  const open = computeLayerOffsets(1);
  assert.ok(open.pedestalY < open.gearTrainY);
  assert.ok(open.gearTrainY < open.meridianY);
  assert.ok(open.meridianY < open.tourbillonY);
  assert.ok(open.tourbillonY < open.planetsY);
  assert.ok(open.planetsY < open.domeY);

  // Clamping out-of-range inputs
  assert.deepEqual(computeLayerOffsets(-0.5), closed);
  assert.deepEqual(computeLayerOffsets(1.8), open);
});

test('all musical scales and finishes have valid complete entries for all 6 planets', () => {
  assert.equal(PLANETS.length, 6);
  assert.equal(FINISH_LIST.length, 4);
  assert.equal(SCALE_LIST.length, 4);

  for (const scale of SCALE_LIST) {
    for (let i = 0; i < PLANETS.length; i++) {
      const note = getNoteForPlanet(i, scale.id);
      assert.ok(note.frequency > 150 && note.frequency < 1500);
      assert.ok(note.noteName.length > 0);
    }
  }
});
