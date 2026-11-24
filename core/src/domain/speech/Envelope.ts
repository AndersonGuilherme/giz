import type { Fps, Frame } from '../values/Time.ts';
import type { Audio } from './Audio.ts';

// Values of rmsFrames/envelope from the motor (scripts/tts.ts).
const REFERENCE_PERCENTILE = 0.92;
const MINIMUM_OPENING = 0.12;
const CURVE = 0.8;

function chunkEnergy(samples: Float32Array): number {
  const sum = samples.reduce((total, sample) => total + sample * sample, 0);
  return Math.sqrt(sum / Math.max(1, samples.length));
}

// Volume (RMS) of each frame.
function volumesPerFrame(audio: Audio, fps: Fps): number[] {
  const samples = audio.samples();
  const step = audio.rate() / fps.value();
  const frames = Math.ceil(samples.length / step);
  return [...Array(frames).keys()].map((frame) =>
    chunkEnergy(samples.subarray(Math.floor(frame * step), Math.floor((frame + 1) * step))),
  );
}

// The reference volume is the 92nd percentile: rare peaks do not flatten the rest of the line.
function reference(volumes: readonly number[]): number {
  const sorted = [...volumes].sort((smaller, larger) => smaller - larger);
  return sorted[Math.floor(sorted.length * REFERENCE_PERCENTILE)] || 1;
}

// Smooths with the neighbours, normalizes by the reference and zeroes what is too low to move the mouth.
function openings(volumes: readonly number[]): number[] {
  const referenceVolume = reference(volumes);
  return volumes.map((volume, frame) => {
    const smoothed = ((volumes[frame - 1] ?? volume) + 2 * volume + (volumes[frame + 1] ?? volume)) / 4;
    const relative = Math.min(1, smoothed / referenceVolume);
    const opening = relative < MINIMUM_OPENING ? 0 : Math.pow(relative, CURVE);
    return Math.round(opening * 100) / 100;
  });
}

/** How much the mouth opens (from 0 to 1) in each frame of the line. */
export class Envelope {
  readonly #openings: readonly number[];

  private constructor(values: readonly number[]) {
    this.#openings = values;
  }

  static measure(audio: Audio, fps: Fps): Envelope {
    return new Envelope(openings(volumesPerFrame(audio, fps)));
  }

  voicedFrames(): boolean[] {
    return this.#openings.map((opening) => opening > 0);
  }

  opening(frame: Frame): number {
    return this.#openings[frame.value()] ?? 0;
  }

  toJson(): number[] {
    return [...this.#openings];
  }
}
