import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { WordJson } from '../../../src/domain/speech/WordJson.ts';
import { Language } from '../../../src/domain/values/Language.ts';
import { projectRepository } from '../../../src/presentation/cli/composition.ts';
import { voiceWorkshop } from '../../../src/presentation/cli/composition/voiceWorkshop.ts';
import { FakeVoice } from '../../doubles/FakeVoice.ts';

async function copyOfFixture(): Promise<string> {
  const folder = join(await mkdtemp(join(tmpdir(), 'giz-workshop-')), 'project');
  await cp('test/fixtures/minimal-project', folder, { recursive: true });
  await rm(join(folder, 'voice'), { recursive: true });
  return folder;
}

class CountingListener {
  calls = 0;
  async listen(): Promise<WordJson[]> {
    this.calls++;
    return [];
  }
}

function workshopWithFakes() {
  const made: string[] = [];
  const voices = new Map<string, FakeVoice>();
  const qwen = (model: '0.6b' | '1.7b') => {
    made.push(model);
    const voice = new FakeVoice();
    voices.set(model, voice);
    return voice;
  };
  const listener = new CountingListener();
  return { workshop: voiceWorkshop({ qwen, listener, configured: () => '1.7b' }), made, voices, listener };
}

test('the voice workshop keeps one local voice per model size for every run, and one Whisper', async () => {
  const folder = await copyOfFixture();
  const project = await projectRepository().load(folder);
  const { workshop, made, voices, listener } = workshopWithFakes();
  await workshop.lines(folder, project, {}).run(project);
  await workshop.lines(folder, project, {}).run(project, () => undefined, { force: true });
  assert.deepEqual(made, ['0.6b'], 'the project model, made once');
  assert.equal(voices.get('0.6b')!.calls, 4, 'two lines, twice, with the same voice');
  assert.equal(listener.calls, 4, 'the same Whisper listens to every line');
});

test('a sample with the same model size reuses the voice the lines use; another size gets its own', async () => {
  const folder = await copyOfFixture();
  const project = await projectRepository().load(folder);
  const { workshop, made, voices } = workshopWithFakes();
  await workshop.lines(folder, project, { whisper: false }).run(project);
  const request = { text: 'Olá!', voice: 'vivian', language: Language.PORTUGUESE };
  await workshop.sampler({ provider: 'qwen', model: '0.6b', keys: () => '' })(request);
  await workshop.sampler({ provider: 'qwen', model: '1.7b', keys: () => '' })(request);
  assert.deepEqual(made, ['0.6b', '1.7b']);
  assert.equal(voices.get('0.6b')!.calls, 3);
});

test('another voice (the Studio rehearsal) replaces the project voice; no local voice is made', async () => {
  const folder = await copyOfFixture();
  const project = await projectRepository().load(folder);
  const { workshop, made } = workshopWithFakes();
  const voice = new FakeVoice();
  await workshop.lines(folder, project, { voice, whisper: false }).run(project);
  assert.equal(voice.calls, 2);
  assert.deepEqual(made, []);
});

test('no model named is the configured size: it shares the one voice of that size, never a second one', async () => {
  const { workshop, made, voices } = workshopWithFakes();
  const request = { text: 'Olá!', voice: 'vivian', language: Language.PORTUGUESE };
  await workshop.sampler({ provider: 'qwen', keys: () => '' })(request);
  await workshop.sampler({ provider: 'qwen', model: '1.7b', keys: () => '' })(request);
  assert.deepEqual(made, ['1.7b']);
  assert.equal(voices.get('1.7b')!.calls, 2);
});
