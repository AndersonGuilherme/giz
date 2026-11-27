import { test } from 'node:test';
import assert from 'node:assert/strict';
import { castVoices, checkCharacter, rigCatalog, voiceSamplerWith } from '../../../src/presentation/cli/composition/casting.ts';
import { Language } from '../../../src/domain/values/Language.ts';
import { fromWav } from '../../../src/infrastructure/voice/wav.ts';
import { FakeVoice } from '../../doubles/FakeVoice.ts';

test('the rig catalog: giz and lia-style with every parameter definition', () => {
  const rigs = rigCatalog();
  assert.deepEqual(rigs.map(({ id }) => id), ['giz', 'lia-style']);
  const giz = rigs[0]!;
  assert.equal(giz.parameters.species!.type, 'option');
  assert.ok(giz.parameters.outfit!.options!.includes('hoodie'));
  assert.deepEqual([giz.parameters.eyeScale!.min, giz.parameters.eyeScale!.max], [0.8, 1.4]);
});

test('a character is checked against the real rigs (a "roxo" skin color on lia-style, an unknown outfit on giz)', () => {
  const base = { id: 'ana', name: 'Ana', voice: { id: 'vivian' }, defaultExpression: 'neutral' };
  assert.deepEqual(checkCharacter({ ...base, rig: 'giz', parameters: { outfit: 'hoodie', species: 'robot' } }), []);
  const [outfit] = checkCharacter({ ...base, rig: 'giz', parameters: { outfit: 'tuxedo' } });
  assert.equal(outfit!.path, 'parameters.outfit');
  const [skin] = checkCharacter({ ...base, rig: 'lia-style', parameters: { skin: 'roxo' } });
  assert.equal(skin!.path, 'parameters.skin');
});

test('the voices a character can get, and the default style per language', () => {
  const voices = castVoices();
  assert.ok(voices.qwen.includes('vivian'));
  assert.deepEqual([...voices.providers], ['qwen', 'recording', 'elevenlabs', 'fish']);
  assert.match(voices.styles['pt-BR'], /português do Brasil/);
});

test('a sample with any voice: a 16-bit mono WAV, with the mouth of each frame', async () => {
  const voice = new FakeVoice();
  const sample = await voiceSamplerWith(voice)({ text: 'Olá!', voice: 'vivian', language: Language.PORTUGUESE });
  const audio = fromWav(sample.wav);
  assert.equal(audio.rate(), 24000);
  assert.ok(Math.abs(audio.duration().value() - sample.seconds) < 0.01);
  assert.equal(sample.envelope.length, sample.visemes.length);
  assert.equal(voice.requests[0]!.lineId, 'sample');
});
