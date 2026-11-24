// The sound effects of the scripts, synthesized (no third-party file, no license to check). Port of the motor's
// scripts/sfx.ts: the same arithmetic in the same order, so `giz sounds` writes the committed files byte for byte.
export const SOUND_RATE = 48000;

type Shape = 'sine' | 'triangle';
/** A tone with an attack/decay envelope; its frequency goes from `from` to `to` over `seconds`. */
type Tone = Readonly<{ at: number; seconds: number; from: number; to: number; amplitude: number; decay?: number; shape?: Shape }>;

const ATTACK_IN_SECONDS = 0.004;
const NOISE_MODULUS = 2147483647;
const NOISE_MULTIPLIER = 16807;
const NOISE_SEED = 7;

const silence = (seconds: number) => new Float32Array(Math.round(seconds * SOUND_RATE));

function oscillator(phase: number, shape: Shape): number {
  if (shape === 'sine') return Math.sin(phase);
  return (2 / Math.PI) * Math.asin(Math.sin(phase));
}

function addTone(target: Float32Array, { at, seconds, from, to, amplitude, decay = 8, shape = 'sine' }: Tone): void {
  let phase = 0;
  const start = Math.round(at * SOUND_RATE);
  const length = Math.round(seconds * SOUND_RATE);
  for (let index = 0; index < length && start + index < target.length; index++) {
    const time = index / SOUND_RATE;
    const progress = index / length;
    phase += (2 * Math.PI * (from + (to - from) * progress)) / SOUND_RATE;
    const envelope = Math.min(1, time / ATTACK_IN_SECONDS) * Math.exp(-decay * time);
    target[start + index] += oscillator(phase, shape) * envelope * amplitude;
  }
}

// Noise through a low-pass whose cutoff rises and falls: a "whoosh".
function addWhoosh(target: Float32Array, amplitude: number): void {
  let filtered = 0;
  let seed = NOISE_SEED;
  const length = target.length;
  for (let index = 0; index < length; index++) {
    seed = (seed * NOISE_MULTIPLIER) % NOISE_MODULUS;
    const noise = (seed / NOISE_MODULUS) * 2 - 1;
    const progress = index / length;
    const cutoff = 0.02 + 0.25 * Math.sin(Math.PI * progress);
    filtered += cutoff * (noise - filtered);
    target[index] += filtered * amplitude * Math.sin(Math.PI * progress);
  }
}

function withTones(seconds: number, tones: readonly Tone[]): Float32Array {
  const samples = silence(seconds);
  tones.forEach((tone) => addTone(samples, tone));
  return samples;
}

function whoosh(): Float32Array {
  const samples = silence(0.4);
  addWhoosh(samples, 2.2);
  return samples;
}

// Nine dings that get closer and closer, in three pitches: a pile of notifications.
const DING_PILE: readonly Tone[] = [...Array(9).keys()].map((ding) => {
  const frequency = 1318 + (ding % 3) * 120;
  return { at: 2.2 * Math.pow(ding / 9, 1.6), seconds: 0.4, from: frequency, to: frequency, amplitude: 0.32, decay: 10 };
});

const CHORD: readonly Tone[] = [523, 659, 784].map((frequency, note) => ({
  at: note * 0.09, seconds: 0.45, from: frequency, to: frequency, amplitude: 0.38, decay: 7,
}));

const RECIPES: Readonly<Record<string, () => Float32Array>> = {
  pop: () => withTones(0.18, [{ at: 0, seconds: 0.18, from: 520, to: 880, amplitude: 0.7, decay: 28 }]),
  whoosh,
  ding: () => withTones(0.6, [
    { at: 0, seconds: 0.6, from: 1318, to: 1318, amplitude: 0.45, decay: 7 },
    { at: 0, seconds: 0.6, from: 1976, to: 1976, amplitude: 0.18, decay: 9 },
  ]),
  dings: () => withTones(2.6, DING_PILE),
  error: () => withTones(0.55, [
    { at: 0, seconds: 0.22, from: 330, to: 300, amplitude: 0.45, decay: 6, shape: 'triangle' },
    { at: 0.22, seconds: 0.32, from: 247, to: 220, amplitude: 0.45, decay: 6, shape: 'triangle' },
  ]),
  success: () => withTones(0.7, CHORD),
  tick: () => withTones(0.08, [{ at: 0, seconds: 0.08, from: 1800, to: 1500, amplitude: 0.4, decay: 60 }]),
};

/** Each script sound (`pop`, `whoosh`...) as mono samples at `SOUND_RATE`, clipped to -1..1. */
export function synthesizedSounds(): Record<string, Float32Array> {
  const clipped = (samples: Float32Array) => samples.map((sample) => Math.max(-1, Math.min(1, sample)));
  return Object.fromEntries(Object.entries(RECIPES).map(([name, make]) => [name, clipped(make())]));
}
