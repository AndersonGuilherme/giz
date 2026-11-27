// Builds the app icon set from assets/icon/icon.svg: the PNGs (16 to 1024 px), icon.ico (Windows) and icon.icns
// (macOS). Both containers are written by hand around PNG data, so no icon tool is needed. sharp comes from core's
// node_modules (the Studio does not depend on it). Run: node scripts/build-icons.ts
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

type Sharp = (input: Buffer, options: { density: number }) => {
  resize: (width: number, height: number) => { png: () => { toBuffer: () => Promise<Buffer> } };
};

const sharp = createRequire(new URL('../../core/package.json', import.meta.url))('sharp') as Sharp;
const FOLDER = fileURLToPath(new URL('../assets/icon/', import.meta.url));
const SIZES = [16, 32, 48, 64, 128, 256, 512, 1024];
const ICO_SIZES = [16, 32, 48, 64, 128, 256];
// The PNG-holding ICNS entries and the pixel size each one takes.
const ICNS_TYPES: ReadonlyArray<readonly [string, number]> = [
  ['icp4', 16], ['icp5', 32], ['icp6', 64], ['ic07', 128], ['ic08', 256], ['ic09', 512], ['ic10', 1024],
  ['ic11', 32], ['ic12', 64], ['ic13', 256], ['ic14', 512],
];

// Rendered large and scaled down, so the small sizes keep clean edges.
async function render(svg: Buffer, size: number): Promise<Buffer> {
  return sharp(svg, { density: 1152 }).resize(size, size).png().toBuffer();
}

function icoEntry(size: number, length: number, offset: number): Buffer {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size % 256, 0);
  entry.writeUInt8(size % 256, 1);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(length, 8);
  entry.writeUInt32LE(offset, 12);
  return entry;
}

function ico(images: ReadonlyMap<number, Buffer>): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(ICO_SIZES.length, 4);
  let offset = 6 + 16 * ICO_SIZES.length;
  const entries = ICO_SIZES.map((size) => {
    const length = images.get(size)?.length ?? 0;
    const entry = icoEntry(size, length, offset);
    offset += length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...ICO_SIZES.map((size) => images.get(size) ?? Buffer.alloc(0))]);
}

function icnsChunk(type: string, data: Buffer): Buffer {
  const head = Buffer.alloc(8);
  head.write(type, 0, 'ascii');
  head.writeUInt32BE(data.length + 8, 4);
  return Buffer.concat([head, data]);
}

function icns(images: ReadonlyMap<number, Buffer>): Buffer {
  const body = Buffer.concat(ICNS_TYPES.map(([type, size]) => icnsChunk(type, images.get(size) ?? Buffer.alloc(0))));
  return icnsChunk('icns', body);
}

async function main(): Promise<void> {
  const svg = await readFile(`${FOLDER}icon.svg`);
  const images = new Map<number, Buffer>();
  for (const size of SIZES) images.set(size, await render(svg, size));
  await Promise.all(SIZES.map((size) => writeFile(`${FOLDER}icon-${size}.png`, images.get(size) ?? Buffer.alloc(0))));
  await writeFile(`${FOLDER}icon.png`, images.get(512) ?? Buffer.alloc(0));
  await writeFile(`${FOLDER}icon.ico`, ico(images));
  await writeFile(`${FOLDER}icon.icns`, icns(images));
  console.log(`icons written to ${FOLDER}`);
}

await main();
