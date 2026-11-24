// Intonation check (`giz qa pitch`): how many semitones the END of a question is above (+) or below (−) the line
// average. A yes/no question in pt-BR has to end going UP. Port of the motor's scripts/pitch-check.ts.
const WINDOW_IN_SECONDS = 0.04;
const HOP_IN_SECONDS = 0.01;
const LOWEST_PITCH = 75;
const HIGHEST_PITCH = 400;
const MINIMUM_ENERGY = 1e-4;
const MINIMUM_CORRELATION = 0.6;
const MINIMUM_VOICED_WINDOWS = 10;
// ~250 ms of voiced windows at the end.
const TAIL_WINDOWS = 25;

type Window = Readonly<{ samples: Float32Array; start: number; length: number }>;
type Lags = Readonly<{ shortest: number; longest: number }>;

function energyOf({ samples, start, length }: Window): number {
  const window = samples.subarray(start, start + length);
  return window.reduce((sum, sample) => sum + sample * sample, 0);
}

// Normalized autocorrelation of the window with itself `lag` samples later.
function correlation({ samples, start, length }: Window, lag: number): number {
  let product = 0;
  let first = 0;
  let second = 0;
  for (let index = start; index < start + length; index++) {
    product += samples[index] * samples[index + lag];
    first += samples[index] ** 2;
    second += samples[index + lag] ** 2;
  }
  return product / Math.sqrt(first * second + 1e-12);
}

type Candidate = Readonly<{ lag: number; score: number }>;

// The first lag with the highest correlation.
function bestLag(window: Window, lags: Lags): Candidate {
  const all = Array.from({ length: lags.longest - lags.shortest + 1 }, (_lag, offset) => lags.shortest + offset);
  return all.reduce<Candidate>((best, lag) => {
    const score = correlation(window, lag);
    return score > best.score ? { lag, score } : best;
  }, { lag: 0, score: 0 });
}

function windowPitch(window: Window, rate: number): number | null {
  if (energyOf(window) / window.length < MINIMUM_ENERGY) return null;
  const { lag, score } = bestLag(window, { shortest: Math.floor(rate / HIGHEST_PITCH), longest: Math.floor(rate / LOWEST_PITCH) });
  return score > MINIMUM_CORRELATION ? rate / lag : null;
}

/** The pitch (Hz) of each 40 ms window, every 10 ms; `null` where there is no voice. */
export function pitchTrack(samples: Float32Array, rate: number): Array<number | null> {
  const length = Math.round(WINDOW_IN_SECONDS * rate);
  const hop = Math.round(HOP_IN_SECONDS * rate);
  const reach = Math.floor(rate / LOWEST_PITCH);
  const track: Array<number | null> = [];
  for (let start = 0; start + length + reach < samples.length; start += hop) track.push(windowPitch({ samples, start, length }, rate));
  return track;
}

const median = (values: readonly number[]) => [...values].sort((smaller, larger) => smaller - larger)[Math.floor(values.length / 2)];

/** Semitones between the median pitch of the last ~250 ms with voice and the median of the whole line. */
export function endRise(samples: Float32Array, rate: number): number | null {
  const voiced = pitchTrack(samples, rate).flatMap((pitch, index) => (pitch === null ? [] : [{ index, pitch }]));
  if (voiced.length < MINIMUM_VOICED_WINDOWS) return null;
  const lastIndex = voiced[voiced.length - 1].index;
  const tail = voiced.filter(({ index }) => index >= lastIndex - TAIL_WINDOWS).map(({ pitch }) => pitch);
  return 12 * Math.log2(median(tail) / median(voiced.map(({ pitch }) => pitch)));
}
