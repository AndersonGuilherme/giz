import { createReadStream, createWriteStream } from 'node:fs';
import { open, stat } from 'node:fs/promises';
import { PassThrough, Readable, type Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createInflateRaw } from 'node:zlib';

// Just enough of the zip format to take a few files out of a big archive (a NuGet package of ~250 MB) without reading
// it whole into memory: the central directory says where each entry is; its bytes are streamed and inflated to disk.
const END_OF_DIRECTORY = 0x06054b50;
const DIRECTORY_ENTRY = 0x02014b50;
// The end record is 22 bytes plus a comment of up to 64 KiB.
const END_SEARCH = 22 + 0xffff;
const ZIP64 = 0xffffffff;

/** Where an entry's data is and how it is stored (0 stored, 8 deflated). */
export type ZipEntry = Readonly<{ headerOffset: number; compressedSize: number; size: number; method: number }>;

async function readAt(path: string, position: number, length: number): Promise<Buffer> {
  const file = await open(path, 'r');
  try {
    const { buffer, bytesRead } = await file.read(Buffer.alloc(length), 0, length, position);
    return buffer.subarray(0, bytesRead);
  } finally {
    await file.close();
  }
}

async function directoryOf(path: string): Promise<Buffer> {
  const { size } = await stat(path);
  const start = Math.max(0, size - END_SEARCH);
  const tail = await readAt(path, start, size - start);
  const end = tail.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (end < 0 || tail.readUInt32LE(end) !== END_OF_DIRECTORY) throw new Error(`${path} não é um arquivo zip`);
  const [length, offset] = [tail.readUInt32LE(end + 12), tail.readUInt32LE(end + 16)];
  if (offset === ZIP64) throw new Error(`${path} é um zip64, que o giz não lê`);
  return readAt(path, offset, length);
}

/** The entries of the zip at `path`, by name. */
export async function zipEntriesOf(path: string): Promise<Map<string, ZipEntry>> {
  const directory = await directoryOf(path);
  const entries = new Map<string, ZipEntry>();
  for (let at = 0; at + 46 <= directory.length && directory.readUInt32LE(at) === DIRECTORY_ENTRY;) {
    const nameLength = directory.readUInt16LE(at + 28);
    const name = directory.toString('utf8', at + 46, at + 46 + nameLength);
    const entry = { method: directory.readUInt16LE(at + 10), compressedSize: directory.readUInt32LE(at + 20), size: directory.readUInt32LE(at + 24), headerOffset: directory.readUInt32LE(at + 42) };
    entries.set(name, entry);
    at += 46 + nameLength + directory.readUInt16LE(at + 30) + directory.readUInt16LE(at + 32);
  }
  return entries;
}

const unpackerOf = (method: number): Transform => {
  if (method === 8) return createInflateRaw();
  if (method === 0) return new PassThrough();
  throw new Error(`método de compressão ${method} não suportado`);
};

/** Streams one entry out to `destination` and checks its size. */
export async function extractZipEntry(path: string, entry: ZipEntry, destination: string): Promise<void> {
  const header = await readAt(path, entry.headerOffset, 30);
  const start = entry.headerOffset + 30 + header.readUInt16LE(26) + header.readUInt16LE(28);
  // An empty entry has no bytes to read (a read stream cannot end before it starts).
  const source = entry.compressedSize === 0 ? Readable.from([]) : createReadStream(path, { start, end: start + entry.compressedSize - 1 });
  await pipeline(source, unpackerOf(entry.method), createWriteStream(destination));
  if ((await stat(destination)).size !== entry.size) throw new Error(`${destination} saiu incompleto do zip`);
}
