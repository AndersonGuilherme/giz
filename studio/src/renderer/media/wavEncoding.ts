// A recorded take as the voice stage keeps it: 16-bit PCM, mono, in a WAV container (what core's recording reads).
const HEADER = 44;
const BYTES_PER_SAMPLE = 2;

/** The channels averaged into one (a stereo microphone becomes mono). */
export function mixedDown(channels: readonly Float32Array[]): Float32Array {
  const length = Math.min(...channels.map((channel) => channel.length));
  return Float32Array.from({ length: Number.isFinite(length) ? length : 0 }, (_unused, index) => channels.reduce((sum, channel) => sum + channel[index]!, 0) / channels.length);
}

function writeText(view: DataView, offset: number, text: string): void {
  [...text].forEach((letter, index) => view.setUint8(offset + index, letter.charCodeAt(0)));
}

/** The samples (from -1 to 1, clipped) as a 16-bit mono WAV at `rate`. */
export function wavOf(samples: Float32Array, rate: number): Uint8Array {
  const bytes = new Uint8Array(HEADER + samples.length * BYTES_PER_SAMPLE);
  const view = new DataView(bytes.buffer);
  const header: ReadonlyArray<readonly [number, number, 16 | 32]> = [
    [4, 36 + samples.length * BYTES_PER_SAMPLE, 32], [16, 16, 32], [20, 1, 16], [22, 1, 16],
    [24, rate, 32], [28, rate * BYTES_PER_SAMPLE, 32], [32, BYTES_PER_SAMPLE, 16], [34, 16, 16], [40, samples.length * BYTES_PER_SAMPLE, 32],
  ];
  [['RIFF', 0], ['WAVE', 8], ['fmt ', 12], ['data', 36]].forEach(([text, offset]) => writeText(view, offset as number, text as string));
  header.forEach(([offset, value, bits]) => (bits === 32 ? view.setUint32(offset, value, true) : view.setUint16(offset, value, true)));
  samples.forEach((sample, index) => view.setInt16(HEADER + index * BYTES_PER_SAMPLE, Math.round(Math.max(-1, Math.min(1, sample)) * 32767), true));
  return bytes;
}
