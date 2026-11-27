import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SpeakSample } from '../../src/application/use-cases/SpeakSample.ts';
import { Language } from '../../src/domain/values/Language.ts';
import { FakePhonemizer } from '../doubles/FakePhonemizer.ts';
import { FakeVoice } from '../doubles/FakeVoice.ts';

test('a sample: the voice says the text; trimmed audio, an envelope and the visemes per frame, as a line gets', async () => {
  const voice = new FakeVoice();
  const sample = await new SpeakSample({ voice, phonemizer: new FakePhonemizer() }).run({ text: 'Olá, tudo bem?', voice: 'vivian', style: 'calma', language: Language.PORTUGUESE });
  assert.deepEqual(voice.requests.map(({ lineId, text, voice: id, style }) => ({ lineId, text, id, style })), [{ lineId: 'sample', text: 'Olá, tudo bem?', id: 'vivian', style: 'calma' }]);
  assert.equal(sample.envelope.length, sample.visemes.length);
  assert.ok(sample.envelope.length > 0);
  assert.ok(sample.envelope.some((opening) => opening > 0));
  assert.match(sample.visemes, /^[XMAEIOUFC]+$/);
  assert.ok(sample.audio.duration().value() < 1.2);
});
