// Seeded randomness: the same line always generates the same audio (mulberry32, as in the motor).
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

export type Sampling = Readonly<{ temperature: number; topK: number; random: () => number }>;

// The finite logits, best first (ties keep the index order), at most topK of them.
function candidates(logits: Float32Array, topK: number): number[] {
  const finite = [...logits.keys()].filter((index) => Number.isFinite(logits[index]));
  finite.sort((first, second) => logits[second] - logits[first]);
  return finite.slice(0, Math.min(topK, finite.length));
}

/** Top-k sampling with temperature (temperature 0: the best token). Draws one random number when it samples. */
export function sampleToken(logits: Float32Array, { temperature, topK, random }: Sampling): number {
  const kept = candidates(logits, topK);
  if (temperature <= 0) return kept[0];
  const highest = logits[kept[0]] / temperature;
  const weights = kept.map((index) => Math.exp(logits[index] / temperature - highest));
  let remaining = random() * weights.reduce((sum, weight) => sum + weight, 0);
  const position = weights.findIndex((weight) => (remaining -= weight) <= 0);
  return kept[position === -1 ? kept.length - 1 : position];
}
