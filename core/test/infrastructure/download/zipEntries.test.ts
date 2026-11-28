import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { extractZipEntry, zipEntriesOf } from '../../../src/infrastructure/download/zipEntries.ts';

const ortRequire = createRequire(createRequire(import.meta.url).resolve('onnxruntime-node/package.json'));
type Zip = { addFile(name: string, data: Buffer): void; writeZip(path: string): void };
const AdmZip = ortRequire('adm-zip') as new () => Zip;

test('the entries of a zip are read from its central directory and one is streamed out whole (deflated or stored)', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'gizzy-zip-'));
  const zip = new AdmZip();
  const big = Buffer.alloc(200_000, 'abc');
  zip.addFile('a/big.bin', big);
  zip.addFile('a/tiny.txt', Buffer.from('t'));
  zip.writeZip(join(folder, 'x.zip'));
  const entries = await zipEntriesOf(join(folder, 'x.zip'));
  assert.deepEqual([...entries.keys()].sort(), ['a/big.bin', 'a/tiny.txt']);
  await extractZipEntry(join(folder, 'x.zip'), entries.get('a/big.bin')!, join(folder, 'big.bin'));
  assert.deepEqual(readFileSync(join(folder, 'big.bin')), big);
  await extractZipEntry(join(folder, 'x.zip'), entries.get('a/tiny.txt')!, join(folder, 'tiny.txt'));
  assert.equal(readFileSync(join(folder, 'tiny.txt'), 'utf8'), 't');
});

test('a file that is not a zip fails readably', async () => {
  const path = join(mkdtempSync(join(tmpdir(), 'gizzy-zip-')), 'no.zip');
  writeFileSync(path, 'not a zip at all');
  await assert.rejects(zipEntriesOf(path), /não é um arquivo zip/);
});
