import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { imageWarnings } from '../../../src/infrastructure/disk/imageWarnings.ts';
import { imageSize } from '../../../src/infrastructure/disk/imageSize.ts';
import type { ScriptJson } from '../../../src/infrastructure/schema/scriptSchema.ts';
import { AspectRatio } from '../../../src/domain/values/AspectRatio.ts';

// Only the header matters: the PNG signature and IHDR with the size (the pixels are never read).
function png(width: number, height: number): Buffer {
  const header = Buffer.alloc(24);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(header);
  header.writeUInt32BE(13, 8);
  header.write('IHDR', 12);
  header.writeUInt32BE(width, 16);
  header.writeUInt32BE(height, 20);
  return header;
}

// SOI, an APP0 segment to skip, then a baseline SOF0 with height before width.
function jpeg(width: number, height: number): Buffer {
  const app0 = Buffer.from([0xff, 0xe0, 0x00, 0x06, 0x4a, 0x46, 0x49, 0x46]);
  const sof = Buffer.alloc(11);
  sof.writeUInt16BE(0xffc0, 0);
  sof.writeUInt16BE(11 - 2, 2);
  sof[4] = 8;
  sof.writeUInt16BE(height, 5);
  sof.writeUInt16BE(width, 7);
  return Buffer.concat([Buffer.from([0xff, 0xd8]), app0, sof]);
}

const scriptWith = (images: string[]) =>
  ({
    chapters: ['A'],
    lines: images.map((image, index) => ({
      id: String(index + 1), chapter: 1, speaker: 'ana', text: 'oi', scene: { type: 'scenario', background: { image }, characters: [] },
    })),
  }) as unknown as ScriptJson;

async function folderWith(files: Record<string, Buffer>): Promise<string> {
  const folder = await mkdtemp(join(tmpdir(), 'gizzy-images-'));
  for (const [name, bytes] of Object.entries(files)) await writeFile(join(folder, name), bytes);
  return folder;
}

test('the size comes from the PNG and JPEG headers; another format has none', async () => {
  const folder = await folderWith({ 'a.png': png(270, 480), 'b.jpg': jpeg(1920, 1080), 'c.webp': Buffer.from('RIFF....WEBP') });
  assert.deepEqual(await imageSize(join(folder, 'a.png')), { width: 270, height: 480 });
  assert.deepEqual(await imageSize(join(folder, 'b.jpg')), { width: 1920, height: 1080 });
  assert.equal(await imageSize(join(folder, 'c.webp')), undefined);
  await rm(folder, { recursive: true, force: true });
});

test('a scenario image with another aspect than the project warns with the path, the size and the line', async () => {
  const folder = await folderWith({ 'wide.png': png(1920, 1080), 'tall.jpg': jpeg(1080, 1920), 'photo.jpg': jpeg(1200, 1920) });
  const warnings = await imageWarnings(folder, scriptWith(['wide.png', 'tall.jpg', 'photo.jpg']), AspectRatio.VERTICAL);
  assert.equal(warnings.length, 2);
  assert.match(warnings[0], /script\.json › lines\[0\]\.scene\.background\.image: wide\.png tem 1920×1080, outra proporção que o vídeo \(9:16\).*fala 1/);
  assert.match(warnings[1], /lines\[2\].*photo\.jpg tem 1200×1920.*fala 3/);
  await rm(folder, { recursive: true, force: true });
});

test('a missing image still warns that the render uses the vector background', async () => {
  const folder = await folderWith({});
  const warnings = await imageWarnings(folder, scriptWith(['missing.png']), AspectRatio.HORIZONTAL);
  assert.match(warnings.join('\n'), /missing\.png não encontrada \(fala 1\); o render usa o fundo vetorial padrão/);
  await rm(folder, { recursive: true, force: true });
});

test('beat images are checked too: missing and wrong aspect, with the beat path', async () => {
  const folder = await folderWith({ 'ok.png': png(1080, 1920), 'wide.png': png(1920, 1080) });
  const script = scriptWith(['ok.png']);
  (script.lines[0] as { beats?: unknown }).beats = [{ background: { image: 'wide.png' } }, { pose: 'wave' }, { background: { image: 'gone.png' } }];
  const warnings = await imageWarnings(folder, script, AspectRatio.VERTICAL);
  assert.equal(warnings.length, 2);
  assert.match(warnings[0], /lines\[0\]\.beats\[0\]\.background\.image: wide\.png tem 1920×1080.*fala 1/);
  assert.match(warnings[1], /lines\[0\]\.beats\[2\]\.background\.image: gone\.png não encontrada/);
  await rm(folder, { recursive: true, force: true });
});

test('an image path naming a folder is a readable warning, not a raw EISDIR', async () => {
  const folder = await folderWith({});
  await mkdir(join(folder, 'scenarios'));
  const warnings = await imageWarnings(folder, scriptWith(['scenarios']), AspectRatio.VERTICAL);
  assert.match(warnings.join('\n'), /lines\[0\]\.scene\.background\.image: scenarios não é um arquivo \(fala 1\)/);
  await assert.rejects(imageSize(join(folder, 'scenarios')), /scenarios não é um arquivo/);
  await rm(folder, { recursive: true, force: true });
});

test('a picture the person framed (background.crop) gives no aspect warning: what the render shows was chosen', async () => {
  const folder = await folderWith({ 'square.png': png(800, 800) });
  const script = scriptWith(['square.png']);
  (script.lines[0]!.scene as { background: Record<string, unknown> }).background.crop = { zoom: 1.2, x: 0.3, y: 0.5 };
  assert.deepEqual(await imageWarnings(folder, script, AspectRatio.VERTICAL), []);
  await rm(folder, { recursive: true, force: true });
});
