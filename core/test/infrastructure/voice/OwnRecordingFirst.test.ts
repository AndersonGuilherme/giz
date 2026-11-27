import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { VoiceRequest } from '../../../src/application/ports/VoiceProvider.ts';
import { CostEstimate } from '../../../src/domain/ai/CostEstimate.ts';
import { Audio } from '../../../src/domain/speech/Audio.ts';
import { Language } from '../../../src/domain/values/Language.ts';
import { OwnRecordingFirst } from '../../../src/infrastructure/voice/OwnRecordingFirst.ts';
import { toWav } from '../../../src/infrastructure/voice/wav.ts';
import { FakeVoice } from '../../doubles/FakeVoice.ts';

const request = (lineId: string): VoiceRequest => ({ lineId, text: 'Oi.', voice: 'vivian', language: Language.PORTUGUESE });

class PaidVoice extends FakeVoice {
  estimate(): CostEstimate {
    return CostEstimate.ofDollars(0.5);
  }

  override async fingerprint(): Promise<string> {
    return 'model-x';
  }
}

async function folderWithTake(lineId: string, samples: number[]): Promise<string> {
  const folder = await mkdtemp(join(tmpdir(), 'giz-own-take-'));
  await mkdir(join(folder, 'recordings'));
  await writeFile(join(folder, 'recordings', `${lineId}.wav`), toWav(Audio.of(Float32Array.from(samples), 24000)));
  return folder;
}

test('a line with its own take comes from recordings/<id>.wav and costs nothing; the others go to the voice', async () => {
  const inner = new PaidVoice();
  const voice = new OwnRecordingFirst(inner, await folderWithTake('2', [0.25, -0.25, 0.5]));
  const own = await voice.generate(request('2'));
  assert.equal(own.samples().length, 3);
  assert.equal(inner.calls, 0);
  assert.equal(voice.estimate(request('2')).dollars(), 0);
  await voice.generate(request('1'));
  assert.equal(inner.calls, 1);
  assert.equal(voice.estimate(request('1')).dollars(), 0.5);
});

test('the fingerprint: the inner one without a take (hashes unchanged), the take content with one', async () => {
  const folder = await folderWithTake('2', [0.25]);
  const voice = new OwnRecordingFirst(new PaidVoice(), folder);
  assert.equal(await voice.fingerprint(request('1')), 'model-x');
  const first = await voice.fingerprint(request('2'));
  assert.match(first, /^recording:[0-9a-f]{40}$/);
  await writeFile(join(folder, 'recordings', '2.wav'), toWav(Audio.of(Float32Array.from([0.5]), 24000)));
  assert.notEqual(await voice.fingerprint(request('2')), first);
});

test('an inner voice without fingerprint nor estimate stays that way for lines without a take (a free local voice)', async () => {
  const voice = new OwnRecordingFirst({ generate: async () => Audio.of(new Float32Array(1), 24000) }, await mkdtemp(join(tmpdir(), 'giz-own-')));
  assert.equal(await voice.fingerprint(request('1')), '');
  assert.equal(voice.estimate(request('1')).dollars(), 0);
});
