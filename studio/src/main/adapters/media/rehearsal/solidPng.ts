import { deflateSync } from 'node:zlib';

// The CRC-32 table of the PNG chunks.
const CRC_TABLE = Array.from({ length: 256 }, (_unused, start) => {
  let value = start;
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function crc32(bytes: Buffer): number {
  const value = bytes.reduce((crc, byte) => CRC_TABLE[(crc ^ byte) & 0xff]! ^ (crc >>> 8), 0xffffffff);
  return (value ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, 'latin1');
  const tail = Buffer.alloc(4);
  tail.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, tail]);
}

type Rgb = readonly [number, number, number];

// Each row fades from `top` to `bottom`, with a lighter band at the horizon (two thirds down).
function row(width: number, fraction: number, colors: Readonly<{ top: Rgb; bottom: Rgb }>): Buffer {
  const band = Math.abs(fraction - 0.66) < 0.01 ? 40 : 0;
  const pixel = colors.top.map((channel, index) => Math.min(255, Math.round(channel + (colors.bottom[index]! - channel) * fraction) + band));
  return Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: width }, () => pixel).flat())]);
}

/** A real PNG of the size: a vertical fade between two colors (the rehearsal painter's "scenario"). */
export function fadedPng(size: Readonly<{ width: number; height: number }>, colors: Readonly<{ top: Rgb; bottom: Rgb }>): Uint8Array {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size.width, 0);
  header.writeUInt32BE(size.height, 4);
  header.set([8, 2, 0, 0, 0], 8);
  const rows = Array.from({ length: size.height }, (_unused, index) => row(size.width, index / size.height, colors));
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return new Uint8Array(Buffer.concat([signature, chunk('IHDR', header), chunk('IDAT', deflateSync(Buffer.concat(rows))), chunk('IEND', Buffer.alloc(0))]));
}
