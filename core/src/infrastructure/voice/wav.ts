import { Audio } from '../../domain/speech/Audio.ts';

// 16-bit PCM WAV. Writes mono; reads mono or more channels (averaged down to mono).
const HEADER_SIZE = 44;
const BYTES_PER_SAMPLE = 2;
const MAX_16_BIT = 32767;
const PCM_FORMATS = [1, 0xfffe];

type Format = Readonly<{ code: number; channels: number; rate: number; bits: number }>;

export function toWav(audio: Audio): Buffer {
  const samples = audio.samples();
  const dataBytes = samples.length * BYTES_PER_SAMPLE;
  const wav = Buffer.alloc(HEADER_SIZE + dataBytes);
  wav.write('RIFF', 0); wav.writeUInt32LE(36 + dataBytes, 4); wav.write('WAVE', 8);
  wav.write('fmt ', 12); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(audio.rate(), 24); wav.writeUInt32LE(audio.rate() * BYTES_PER_SAMPLE, 28);
  wav.writeUInt16LE(BYTES_PER_SAMPLE, 32); wav.writeUInt16LE(16, 34);
  wav.write('data', 36); wav.writeUInt32LE(dataBytes, 40);
  samples.forEach((sample, index) => {
    const integer = Math.max(-32768, Math.min(MAX_16_BIT, Math.round(sample * MAX_16_BIT)));
    wav.writeInt16LE(integer, HEADER_SIZE + index * BYTES_PER_SAMPLE);
  });
  return wav;
}

// The RIFF chunks by name: "fmt ", "data", and others that some recorders include.
function chunks(wav: Buffer): Map<string, Buffer> {
  const found = new Map<string, Buffer>();
  let position = 12;
  while (position + 8 <= wav.length) {
    const size = wav.readUInt32LE(position + 4);
    found.set(wav.toString('ascii', position, position + 4), wav.subarray(position + 8, position + 8 + size));
    position += 8 + size + (size % 2);
  }
  return found;
}

function validFormat(chunk: Buffer | undefined): Format {
  if (!chunk || chunk.length < 16) throw new Error('arquivo WAV sem o bloco "fmt "');
  const format = { code: chunk.readUInt16LE(0), channels: chunk.readUInt16LE(2), rate: chunk.readUInt32LE(4), bits: chunk.readUInt16LE(14) };
  if (!PCM_FORMATS.includes(format.code) || format.bits !== 16) {
    throw new Error(`o WAV precisa ser PCM de 16 bits (veio formato ${format.code} com ${format.bits} bits)`);
  }
  return format;
}

function monoSample(data: Buffer, frame: number, channels: number): number {
  const values = [...Array(channels).keys()].map((channel) => data.readInt16LE((frame * channels + channel) * BYTES_PER_SAMPLE));
  return values.reduce((sum, value) => sum + value, 0) / channels / 32768;
}

export function fromWav(wav: Buffer): Audio {
  if (wav.length < 12 || wav.toString('ascii', 0, 4) !== 'RIFF' || wav.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error('não é um arquivo WAV (faltam as marcas RIFF/WAVE)');
  }
  const found = chunks(wav);
  const { channels, rate } = validFormat(found.get('fmt '));
  const data = found.get('data') ?? Buffer.alloc(0);
  const frames = Math.floor(data.length / (BYTES_PER_SAMPLE * channels));
  const samples = Float32Array.from(Array(frames).keys(), (frame) => monoSample(data, frame, channels));
  return Audio.of(samples, rate);
}
