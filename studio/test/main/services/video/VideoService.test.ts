import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BuildService } from '../../../../src/main/services/video/BuildService.ts';
import { HISTORY_FILE } from '../../../../src/main/services/video/outputFiles.ts';
import { VideoService } from '../../../../src/main/services/video/VideoService.ts';
import { grantsFor } from '../../../doubles/fakes.ts';
import { MemoryMediaFiles } from '../../../doubles/mediaFakes.ts';
import { FakeShell, FakeVideoCore, NO_ITEMS } from '../../../doubles/videoFakes.ts';

const bytes = (text: string) => new TextEncoder().encode(text);

function setup() {
  const core = new FakeVideoCore();
  const grants = grantsFor('/p');
  const files = new MemoryMediaFiles();
  const shell = new FakeShell();
  const service = new VideoService({ core, build: new BuildService({ core, grants, serve: () => undefined }), files, shell, grants });
  return { core, files, shell, service };
}

test('the preview: the montage with a gizzy-media URL per file, the numbered lines, the check, and nothing missing', async () => {
  const { service } = setup();
  const document = await service.preview('/p');
  assert.deepEqual([document.aspect, document.projectAspect, document.title], ['16:9', '16:9', 'O cupom']);
  assert.deepEqual(document.lines.map(({ lineId, number }) => [lineId, number]), [['a1', 1], ['a2', 2], ['a3', 3]]);
  assert.deepEqual(Object.keys(document.montage?.files ?? {}), ['voice/a1.wav', 'sounds/pop.wav']);
  assert.match(document.montage?.files['voice/a1.wav'] ?? '', /^gizzy-media:\/\/file\/%2Fp%2Fvoice%2Fa1\.wav\?v=/);
  assert.equal(document.montage?.seconds, 62.5);
  assert.deepEqual([document.failure, document.rendered, document.renders], [null, [], []]);
});

test('what is missing comes from the stages: voices to make or remake, images to make, remake or resolve', async () => {
  const { core, service } = setup();
  core.items_ = { ...NO_ITEMS, voices: { stale: ['a2'], missing: ['a3'] }, scenarios: { stale: ['a1'], missing: ['a2'], blocked: ['a3'], problems: [] } };
  const document = await service.preview('/p', '9:16');
  assert.deepEqual(document.missing, { voices: ['a3'], staleVoices: ['a2'], images: ['a2'], staleImages: ['a1'], blockedImages: ['a3'] });
  assert.equal(document.montage, null);
  assert.deepEqual(document.failure?.voices, ['a3']);
  assert.equal(document.aspect, '9:16');
});

test('the videos rendered in each aspect can be played; the history comes newest first', async () => {
  const { files, service } = setup();
  await files.write('/p', 'output/video.mp4', bytes('mp4'));
  await files.write('/p', 'output/captions.srt', bytes('1\n00:00:00,500 --> 00:00:01,000\nOi.\n'));
  await files.write('/p', 'output/video-9x16.mp4', bytes('mp4'));
  const record = { at: '2026-11-27T15:00:00.000Z', aspect: '16:9', seconds: 62.5, video: '/p/output/video.mp4', captions: '/p/output/captions.srt' };
  await files.write('/p', HISTORY_FILE, bytes(JSON.stringify([record, { broken: true }])));
  const document = await service.preview('/p');
  assert.deepEqual(document.rendered.map(({ aspect, captions }) => [aspect, captions]), [['9:16', false], ['16:9', true]]);
  assert.match(document.rendered[1]?.url ?? '', /^gizzy-media:\/\/file\/%2Fp%2Foutput%2Fvideo\.mp4\?v=/);
  assert.deepEqual(document.renders, [record]);
});

test('open folder shows the output folder (the project folder before any render, or when output is not a folder)', async () => {
  const { files, shell, service } = setup();
  await service.openFolder('/p');
  await files.write('/p', 'output', bytes('not a folder'));
  await service.openFolder('/p');
  await files.remove('/p', 'output');
  await files.write('/p', 'output/video.mp4', bytes('mp4'));
  await service.openFolder('/p');
  assert.deepEqual(shell.opened, ['/p', '/p', '/p/output']);
  await assert.rejects(service.openFolder('/etc'), { code: 'invalid-request' });
});

test('the captions of an aspect are copied as text or saved where the person chooses; none yet is a readable refusal', async () => {
  const { files, shell, service } = setup();
  await assert.rejects(service.copyCaptions('/p', '9:16'), { code: 'invalid-request', message: /legenda em 9:16/ });
  await files.write('/p', 'output/captions-9x16.srt', bytes('1\nOi.\n'));
  await service.copyCaptions('/p', '9:16');
  assert.deepEqual(shell.copied, ['1\nOi.\n']);
  assert.equal(await service.exportCaptions('/p', '9:16'), '/home/ana/Documentos/cupom.srt');
  assert.deepEqual(shell.saved, [{ from: '/p/output/captions-9x16.srt', name: 'p-9x16.srt' }]);
  shell.saveTo = null;
  assert.equal(await service.exportCaptions('/p', '9:16'), null);
});

test("the captions only read the project's aspect: no montage, no check", async () => {
  const { core, files, service } = setup();
  await files.write('/p', 'output/captions.srt', bytes('1\nOi.\n'));
  await service.copyCaptions('/p', '16:9');
  assert.deepEqual([core.built, core.inspected], [[], []]);
  assert.deepEqual(core.aspectsRead, ['/p']);
});
