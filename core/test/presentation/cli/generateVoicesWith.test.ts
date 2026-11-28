import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Audio } from '../../../src/domain/speech/Audio.ts';
import { toWav } from '../../../src/infrastructure/voice/wav.ts';
import { generateVoicesWith, projectRepository } from '../../../src/presentation/cli/composition.ts';
import { FakeVoice } from '../../doubles/FakeVoice.ts';

async function copyOfFixture(): Promise<string> {
  const folder = join(await mkdtemp(join(tmpdir(), 'gizzy-voices-with-')), 'project');
  await cp('test/fixtures/minimal-project', folder, { recursive: true });
  await rm(join(folder, 'voice'), { recursive: true });
  return folder;
}

test('the Studio voices: a line the person recorded comes from the take, the others from the voice; a new take remakes only it', async () => {
  const folder = await copyOfFixture();
  await mkdir(join(folder, 'recordings'));
  const take = Audio.of(Float32Array.from({ length: 24000 }, (_, i) => 0.4 * Math.sin(i / 8)), 24000);
  await writeFile(join(folder, 'recordings', '1.wav'), toWav(take));
  const project = await projectRepository().load(folder);
  const voice = new FakeVoice();
  const first = await generateVoicesWith(folder, project, { voice, whisper: false }).run(project);
  assert.deepEqual(first.generated, ['1', '2']);
  assert.deepEqual(voice.requests.map(({ lineId }) => lineId), ['2']);
  const saved = JSON.parse(await readFile(join(folder, 'voice', '1.json'), 'utf8'));
  assert.ok(Math.abs(saved.durationSeconds - 1) < 0.1, 'the take, trimmed and normalized');
  await writeFile(join(folder, 'recordings', '1.wav'), toWav(Audio.of(take.samples().subarray(0, 12000), 24000)));
  const second = await generateVoicesWith(folder, project, { voice, whisper: false }).run(project);
  assert.deepEqual(second, { generated: ['1'], skipped: ['2'] });
});
