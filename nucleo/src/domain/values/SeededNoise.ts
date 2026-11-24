// FNV-1a of the seed text.
function seedHash(seed: string): number {
  let hash = 2166136261;
  for (const char of seed) {
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  }
  return hash >>> 0;
}

// One-step mulberry32: mixes seed and index into a fraction in [0, 1).
function fractionOf(hash: number, index: number): number {
  let value = (hash + Math.imul(index + 1, 0x6d2b79f5)) >>> 0;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}

/** Pseudo-random fractions fixed by a seed: the same seed and index always give the same number (no Math.random). */
export class SeededNoise {
  readonly #hash: number;

  private constructor(hash: number) {
    this.#hash = hash;
  }

  static for(seed: string): SeededNoise {
    return new SeededNoise(seedHash(seed));
  }

  /** A fraction in [0, 1) for this index. */
  fraction(index: number): number {
    return fractionOf(this.#hash, index);
  }
}
