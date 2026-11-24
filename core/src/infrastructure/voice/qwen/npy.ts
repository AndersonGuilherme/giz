import { readFileSync } from 'node:fs';

/** A NumPy array: float32, little endian, C order (the embeddings of the ONNX export). */
export type NpyArray = Readonly<{ data: Float32Array; shape: number[] }>;

// \x93NUMPY, major/minor version, header length (2 bytes in v1, 4 from v2 on).
function headerOf(file: Buffer): Readonly<{ header: string; start: number }> {
  const major = file[6];
  const length = major === 1 ? file.readUInt16LE(8) : file.readUInt32LE(8);
  const offset = major === 1 ? 10 : 12;
  return { header: file.toString('latin1', offset, offset + length), start: offset + length };
}

function shapeOf(header: string): number[] {
  const dimensions = header.match(/'shape':\s*\(([^)]*)\)/)?.[1] ?? '';
  return dimensions.split(',').map((dimension) => dimension.trim()).filter(Boolean).map(Number);
}

export function readNpy(path: string): NpyArray {
  const file = readFileSync(path);
  const { header, start } = headerOf(file);
  if (!header.includes("'<f4'")) throw new Error(`${path}: esperado float32 (<f4)`);
  if (header.includes("'fortran_order': True")) throw new Error(`${path}: fortran_order não suportado`);
  const data = new Float32Array(file.buffer.slice(file.byteOffset + start, file.byteOffset + file.length));
  return { data, shape: shapeOf(header) };
}
