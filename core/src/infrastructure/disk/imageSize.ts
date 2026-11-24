import { readFile } from 'node:fs/promises';

export type ImageSize = Readonly<{ width: number; height: number }>;

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
// The JPEG start-of-frame markers (C0–CF), less DHT (C4), JPG (C8) and DAC (CC), which are not frames.
const NOT_FRAMES = new Set([0xc4, 0xc8, 0xcc]);
const isStartOfFrame = (code: number): boolean => code >= 0xc0 && code <= 0xcf && !NOT_FRAMES.has(code);

// IHDR, the first chunk, holds the width and the height right after its type.
function pngSize(bytes: Buffer): ImageSize | undefined {
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(PNG_SIGNATURE)) return undefined;
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

// Walks the segments (marker, then a length that counts itself) up to the frame header: height, then width.
function jpegSegment(bytes: Buffer, offset: number): ImageSize | undefined {
  if (offset + 9 > bytes.length || bytes[offset] !== 0xff) return undefined;
  if (isStartOfFrame(bytes[offset + 1])) return { width: bytes.readUInt16BE(offset + 7), height: bytes.readUInt16BE(offset + 5) };
  return jpegSegment(bytes, offset + 2 + bytes.readUInt16BE(offset + 2));
}

const jpegSize = (bytes: Buffer): ImageSize | undefined => (bytes[0] === 0xff && bytes[1] === 0xd8 ? jpegSegment(bytes, 2) : undefined);

// A folder where a file was expected is the person's mistake: a readable message, not a raw EISDIR.
function notAFile(path: string): (error: NodeJS.ErrnoException) => never {
  return (error) => {
    if (error.code === 'EISDIR') throw new Error(`${path} não é um arquivo`);
    throw error;
  };
}

/** The size of a PNG or JPEG, read from its header; `undefined` for another format (or a broken header). */
export async function imageSize(path: string): Promise<ImageSize | undefined> {
  const bytes = await readFile(path).catch(notAFile(path));
  return pngSize(bytes) ?? jpegSize(bytes);
}
