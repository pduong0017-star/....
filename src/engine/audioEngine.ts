import { getNoteForPlanet, ScaleId } from './orreryMath';

/**
 * 100% procedural Web Audio polyphonic celesta & horological music box engine.
 * Zero external audio assets; creates lush harmonic bell tones with subtle stereo echo.
 */
export class CelestialAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private delayLeft: DelayNode | null = null;
  private delayRight: DelayNode | null = null;
  private feedbackGain: GainNode | null = null;
  private enabled = false;

  public isEnabled(): boolean {
    return this.enabled;
  }

  public unlock(): boolean {
    if (typeof window === 'undefined') return false;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return false;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.36;

      // Lush subtle stereo ping-pong shimmer delay
      this.delayLeft = this.ctx.createDelay(1.0);
      this.delayRight = this.ctx.createDelay(1.0);
      this.delayLeft.delayTime.value = 0.28;
      this.delayRight.delayTime.value = 0.42;

      this.feedbackGain = this.ctx.createGain();
      this.feedbackGain.gain.value = 0.28;

      const wetFilter = this.ctx.createBiquadFilter();
      wetFilter.type = 'lowpass';
      wetFilter.frequency.value = 2800;

      const wetGain = this.ctx.createGain();
      wetGain.gain.value = 0.34;

      this.masterGain.connect(this.ctx.destination);
      this.masterGain.connect(this.delayLeft);
      this.delayLeft.connect(wetFilter);
      wetFilter.connect(this.delayRight);
      this.delayRight.connect(this.feedbackGain);
      this.feedbackGain.connect(this.delayLeft);

      wetFilter.connect(wetGain);
      this.delayRight.connect(wetGain);
      wetGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }

    this.enabled = true;
    return true;
  }

  public setEnabled(next: boolean): boolean {
    if (next) {
      return this.unlock();
    }
    this.enabled = false;
    return false;
  }

  public playPlanetNote(planetIndex: number, scaleId: ScaleId, velocity = 0.72): void {
    if (!this.enabled || !this.ctx || !this.masterGain) return;
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    const { frequency } = getNoteForPlanet(planetIndex, scaleId);

    // Stereo pan subtly spreads inner -> outer planets across the soundstage
    const pan = (planetIndex / 5) * 0.9 - 0.45;
    const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    if (panner) {
      panner.pan.setValueAtTime(pan, now);
      panner.connect(this.masterGain);
    }
    const output: AudioNode = panner ?? this.masterGain;

    // 1. Fundamental pure sine celesta body
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(frequency, now);

    const env1 = this.ctx.createGain();
    const peak = Math.min(0.32, 0.24 * velocity);
    env1.gain.setValueAtTime(0.0001, now);
    env1.gain.exponentialRampToValueAtTime(peak, now + 0.012);
    env1.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

    osc1.connect(env1);
    env1.connect(output);
    osc1.start(now);
    osc1.stop(now + 2.45);

    // 2. Warm octave triangle shimmer (music-box tine overtone)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(frequency * 2.0, now);

    const env2 = this.ctx.createGain();
    env2.gain.setValueAtTime(0.0001, now);
    env2.gain.exponentialRampToValueAtTime(peak * 0.34, now + 0.008);
    env2.gain.exponentialRampToValueAtTime(0.0001, now + 1.15);

    osc2.connect(env2);
    env2.connect(output);
    osc2.start(now);
    osc2.stop(now + 1.2);

    // 3. Crystalline metallic bell partial (3.01x slightly detuned)
    const osc3 = this.ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(frequency * 3.005, now);

    const env3 = this.ctx.createGain();
    env3.gain.setValueAtTime(0.0001, now);
    env3.gain.exponentialRampToValueAtTime(peak * 0.14, now + 0.004);
    env3.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc3.connect(env3);
    env3.connect(output);
    osc3.start(now);
    osc3.stop(now + 0.5);
  }

  public playChordCascade(scaleId: ScaleId, onNoteTrigger?: (planetIndex: number) => void): void {
    if (!this.enabled) {
      this.unlock();
    }
    // Arpeggiate from deepest outer planet (5) up to shimmering inner Mercury (0)
    const order = [5, 4, 3, 2, 1, 0];
    order.forEach((planetIdx, step) => {
      window.setTimeout(() => {
        this.playPlanetNote(planetIdx, scaleId, 0.85);
        onNoteTrigger?.(planetIdx);
      }, step * 145);
    });
  }

  public dispose(): void {
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
    this.masterGain = null;
    this.delayLeft = null;
    this.delayRight = null;
    this.feedbackGain = null;
    this.enabled = false;
  }
}
