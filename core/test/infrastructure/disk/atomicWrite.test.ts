import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeAtomic, writeAtomicSync, writeInside } from '../../../src/infrastructure/disk/atomicWrite.ts';

const folder = () => mkdtempSync(join(tmpdir(), 'gizzy-atomic-'));

test('a write goes to a temp file next to the target and is renamed over it: nothing else is left', async () => {
  const where = folder();
  writeFileSync(join(where, 'a.json'), 'old');
  await writeAtomic(join(where, 'a.json'), 'new');
  writeAtomicSync(join(where, 'b.json'), 'sync');
  assert.equal(readFileSync(join(where, 'a.json'), 'utf8'), 'new');
  assert.equal(readFileSync(join(where, 'b.json'), 'utf8'), 'sync');
  assert.deepEqual(readdirSync(where).sort(), ['a.json', 'b.json']);
});

test('a write that fails leaves the old file and no temp file', async () => {
  const where = folder();
  mkdirSync(join(where, 'taken'));
  writeFileSync(join(where, 'taken', 'x'), 'kept');
  await assert.rejects(writeAtomic(join(where, 'taken'), 'new'));
  assert.throws(() => writeAtomicSync(join(where, 'taken'), 'new'));
  assert.deepEqual(readdirSync(where), ['taken']);
});

test('writeInside refuses a file whose real path leaves the project (a link to outside), and writes through a link inside', async () => {
  const project = folder();
  const outside = folder();
  writeFileSync(join(outside, 'script.json'), 'outside');
  symlinkSync(join(outside, 'script.json'), join(project, 'script.json'));
  await assert.rejects(writeInside(project, 'script.json', 'evil'), /fora da pasta do projeto/);
  assert.equal(readFileSync(join(outside, 'script.json'), 'utf8'), 'outside');
  mkdirSync(join(project, 'real'));
  symlinkSync(join(project, 'real'), join(project, 'voice'));
  await writeInside(project, 'voice/1.wav', 'wav');
  assert.equal(readFileSync(join(project, 'real', '1.wav'), 'utf8'), 'wav');
});
