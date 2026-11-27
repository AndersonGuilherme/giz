import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SampleShelf } from '../../../../src/main/services/media/samples.ts';
import { FakeMediaCore, MemoryMediaFiles } from '../../../doubles/mediaFakes.ts';

const FOLDER = '/user/samples';
const said = (text: string) => ({ service: { provider: 'qwen' as const }, voice: { id: 'vivian' }, text, language: 'pt-BR' as const });

test('the shelf keeps only the most recent samples: the oldest one goes (its audio and its mouth), a kept one plays again at once', async () => {
  const [core, files] = [new FakeMediaCore(), new MemoryMediaFiles()];
  const shelf = new SampleShelf(FOLDER, { core, files, keep: 2 });
  const first = await shelf.said(said('um'));
  await shelf.said(said('dois'));
  await shelf.said(said('três'));
  const names = (await files.entries(FOLDER)).map(({ file }) => file);
  assert.equal(names.length, 4, 'two samples, each a .wav and a .json');
  const firstName = decodeURIComponent(first.audio).split('/').at(-1)!.split('?')[0]!;
  assert.equal(names.includes(firstName), false, 'the oldest is gone');
  assert.equal(names.includes(firstName.replace('.wav', '.json')), false);
  await shelf.said(said('três'));
  assert.equal(core.samples.length, 3, 'a kept sample calls nothing');
});
