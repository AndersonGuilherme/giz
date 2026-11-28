import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { env } from '@huggingface/transformers';
import type { Aligner } from '../../../src/application/ports/Aligner.ts';
import { Audio } from '../../../src/domain/speech/Audio.ts';
import type { WordJson } from '../../../src/domain/speech/WordJson.ts';
import type { Words } from '../../../src/domain/speech/Words.ts';
import { Language } from '../../../src/domain/values/Language.ts';
import { EnvelopeAligner } from '../../../src/infrastructure/alignment/EnvelopeAligner.ts';
import { WhisperAligner, type Listener } from '../../../src/infrastructure/alignment/WhisperAligner.ts';
import { WHISPER_MODEL, WhisperListener } from '../../../src/infrastructure/alignment/WhisperListener.ts';
import { WHISPER_REVISION } from '../../../src/infrastructure/alignment/whisperModel.ts';
import { fromWav } from '../../../src/infrastructure/voice/wav.ts';

const sound = Audio.of(new Float32Array(24000), 24000);

class FakeListener implements Listener {
  readonly languages: Language[] = [];
  readonly #heard: WordJson[];

  constructor(heard: WordJson[]) {
    this.#heard = heard;
  }

  async listen(_audio: Audio, language: Language): Promise<WordJson[]> {
    this.languages.push(language);
    return this.#heard;
  }
}

class FakeFallback implements Aligner {
  calls = 0;

  async align(_audio: Audio, text: string): Promise<Words> {
    this.calls++;
    return new EnvelopeAligner().align(sound, text);
  }
}

test('WhisperAligner reconciles what it heard with the script text', async () => {
  const fallback = new FakeFallback();
  const listener = new FakeListener([{ text: ' ola', start: 0, end: 0.3 }, { text: ' teu', start: 0.3, end: 0.6 }]);
  const words = await new WhisperAligner(fallback, listener).align(sound, 'Olá, Téo!', Language.ENGLISH);
  assert.deepEqual(words.toJson(), [{ text: 'Olá,', start: 0, end: 0.3 }, { text: 'Téo!', start: 0.3, end: 0.6 }]);
  assert.equal(fallback.calls, 0);
  assert.deepEqual(listener.languages, [Language.ENGLISH]);
});

test('WhisperAligner falls back when the alignment is too poor', async () => {
  const fallback = new FakeFallback();
  const listener = new FakeListener([{ text: 'banana', start: 0, end: 1 }]);
  const words = await new WhisperAligner(fallback, listener).align(sound, 'um dois três quatro', Language.PORTUGUESE);
  assert.equal(fallback.calls, 1);
  assert.deepEqual(words.texts(), ['um', 'dois', 'três', 'quatro']);
});

class FailingListener implements Listener {
  async listen(): Promise<WordJson[]> {
    throw new Error('sem rede para baixar o modelo');
  }
}

test('WhisperAligner warns and uses the fallback when Whisper fails', async () => {
  const fallback = new FakeFallback();
  const warnings: string[] = [];
  const aligner = new WhisperAligner(fallback, new FailingListener(), (message) => warnings.push(message));
  const words = await aligner.align(sound, 'um dois', Language.PORTUGUESE);
  assert.equal(fallback.calls, 1);
  assert.deepEqual(words.texts(), ['um', 'dois']);
  assert.deepEqual(warnings, ['alinhamento por Whisper falhou (sem rede para baixar o modelo); usando o envelope da voz']);
});

test('WhisperAligner without a warning sink also uses the fallback when Whisper fails', async () => {
  const fallback = new FakeFallback();
  await new WhisperAligner(fallback, new FailingListener()).align(sound, 'um', Language.PORTUGUESE);
  assert.equal(fallback.calls, 1);
});

test('WhisperAligner limits the times to the audio duration', async () => {
  const listener = new FakeListener([{ text: 'um', start: 0, end: 5 }]);
  const words = await new WhisperAligner(new FakeFallback(), listener).align(sound, 'um', Language.PORTUGUESE);
  assert.deepEqual(words.toJson(), [{ text: 'um', start: 0, end: 1 }]);
});

// Integration with the real model: runs only if it is already in the cache and the fixture already has a voice.
// transformers keeps a pinned revision under <model>/<revision>/.
const downloadedModel = existsSync(join(env.cacheDir ?? '', WHISPER_MODEL, WHISPER_REVISION, 'config.json'));
const fixtureWav = new URL('../../fixtures/minimal-project/voice/1.wav', import.meta.url);
const withoutModel = `modelo ${WHISPER_MODEL} não está em ${env.cacheDir} (baixa sozinho na primeira voz gerada)`;
const voiceless = 'the fixture has no voice/1.wav (generate it with: node src/presentation/cli/giz.ts voice test/fixtures/minimal-project)';
const skipReason = !downloadedModel ? withoutModel : !existsSync(fixtureWav) && voiceless;

test('WhisperListener hears the fixture line with the time of each word', { skip: skipReason || false, timeout: 120_000 }, async () => {
  const audio = fromWav(readFileSync(fixtureWav));
  const listener = new WhisperListener();
  const heard = await listener.listen(audio, Language.PORTUGUESE);
  const fallback = new FakeFallback();
  const words = await new WhisperAligner(fallback, listener).align(audio, 'Oi, eu sou a Ana.', Language.PORTUGUESE);
  assert.equal(fallback.calls, 0);
  assert.ok(heard.length >= 4, JSON.stringify(heard));
  assert.deepEqual(words.texts(), ['Oi,', 'eu', 'sou', 'a', 'Ana.']);
  assert.ok((words.toJson().at(-1)?.end ?? 0) <= audio.duration().value() + 0.05);
});
