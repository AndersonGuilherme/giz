import { DomainError } from '../DomainError.ts';
import { Seconds } from '../values/Time.ts';

// Values of trimSilence and normalizeLoudness from the motor (scripts/tts.ts).
const SILENCE_THRESHOLD = 0.012;
const MARGIN_IN_SECONDS = 0.04;
const NORMALIZATION_VOICE_THRESHOLD = 0.01;
const TARGET_VOLUME = 0.085;
const MAXIMUM_PEAK = 0.95;

const isAudible = (sample: number) => Math.abs(sample) >= SILENCE_THRESHOLD;

// findLastIndex on typed arrays is ES2023; the package target is ES2022.
function lastAudible(samples: Float32Array): number {
  let position = samples.length - 1;
  while (position >= 0 && !isAudible(samples[position] ?? 0)) position--;
  return position;
}

function normalizationGain(samples: Float32Array): number {
  const voiced = samples.filter((sample) => Math.abs(sample) > NORMALIZATION_VOICE_THRESHOLD);
  const energy = voiced.reduce((sum, sample) => sum + sample * sample, 0);
  const volume = Math.sqrt(energy / Math.max(1, voiced.length));
  const peak = samples.reduce((larger, sample) => Math.max(larger, Math.abs(sample)), 0);
  return Math.min(TARGET_VOLUME / volume, MAXIMUM_PEAK / Math.max(peak, 1e-6));
}

/** Mono sound: samples from -1 to 1 and the rate (samples per second). */
export class Audio {
  readonly #samples: Float32Array;
  readonly #rate: number;

  private constructor(samples: Float32Array, rate: number) {
    this.#samples = samples;
    this.#rate = rate;
  }

  static of(samples: Float32Array, rate: number): Audio {
    if (!Number.isInteger(rate) || rate <= 0) throw new DomainError(`taxa ${rate} inválida (use um inteiro maior que 0)`);
    return new Audio(samples, rate);
  }

  duration(): Seconds {
    return Seconds.of(this.#samples.length / this.#rate);
  }

  /** Cuts the silence at the ends, leaving a short margin on each side. */
  trimmed(): Audio {
    const lastPosition = Math.max(0, this.#samples.length - 1);
    const foundAtStart = this.#samples.findIndex(isAudible);
    const start = foundAtStart === -1 ? lastPosition : foundAtStart;
    const end = Math.max(start, lastAudible(this.#samples));
    const margin = Math.round(MARGIN_IN_SECONDS * this.#rate);
    const cut = this.#samples.subarray(Math.max(0, start - margin), Math.min(this.#samples.length, end + margin + 1));
    return new Audio(cut, this.#rate);
  }

  /** Brings the volume of the voiced parts to the target, without letting the peak clip. */
  normalized(): Audio {
    const gain = normalizationGain(this.#samples);
    return new Audio(this.#samples.map((sample) => sample * gain), this.#rate);
  }

  samples(): Float32Array {
    return this.#samples;
  }

  rate(): number {
    return this.#rate;
  }
}
