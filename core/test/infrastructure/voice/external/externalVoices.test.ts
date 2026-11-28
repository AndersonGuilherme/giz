import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { VoiceRequest } from '../../../../src/application/ports/VoiceProvider.ts';
import { Language } from '../../../../src/domain/values/Language.ts';
import { apiKeyOf } from '../../../../src/infrastructure/voice/external/apiKey.ts';
import { ElevenLabsVoice } from '../../../../src/infrastructure/voice/external/ElevenLabsVoice.ts';
import { FishVoice } from '../../../../src/infrastructure/voice/external/FishVoice.ts';
import { externalSettings } from '../../../../src/infrastructure/voice/external/externalSettings.ts';
import { withPauses } from '../../../../src/infrastructure/voice/external/sentencePauses.ts';

const KEY = 'sk-secreta-123';
const request: VoiceRequest = { lineId: '1', text: 'Oi. Tudo bem, Ana?', voice: 'voz-abc', language: Language.PORTUGUESE };
type Call = { url: string; init: RequestInit };

// PCM 16-bit little endian: 0, half, -half, full.
const PCM = Buffer.from(Int16Array.from([0, 16384, -16384, 32767]).buffer);

function fakeFetch(responses: Array<Response | Error>) {
  const calls: Call[] = [];
  const fetch = async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    const next = responses.shift() ?? new Response(PCM);
    if (next instanceof Error) throw next;
    return next;
  };
  return { calls, fetch: fetch as typeof globalThis.fetch };
}

function waits() {
  const delays: number[] = [];
  return { delays, wait: async (milliseconds: number) => void delays.push(milliseconds) };
}

const settings = externalSettings({});

test('sentence ends and colons get an explicit <break>; commas only when a comma pause is set', () => {
  assert.equal(withPauses('Primeiro, os nomes. Cada empresa: um nome!', { sentence: 0.15, comma: 0 }),
    'Primeiro, os nomes. <break time="0.15s" /> Cada empresa: <break time="0.15s" /> um nome!');
  assert.equal(withPauses('a, b', { sentence: 0.15, comma: 0.1 }), 'a, <break time="0.1s" /> b');
  assert.equal(withPauses('Fim.', { sentence: 0.15, comma: 0 }), 'Fim.');
  assert.equal(withPauses('a. b', { sentence: 0, comma: 0 }), 'a. b');
});

test('the settings come from the environment, with the motor defaults and the motor variable names as fallback', () => {
  assert.deepEqual(settings, { elevenLabsModel: 'eleven_multilingual_v2', fishModel: 's1', pauses: { sentence: 0.15, comma: 0 } });
  const legacy = externalSettings({ ELEVEN_MODEL: 'eleven_v3', FISH_MODEL: 's2', PAUSA_PONTO: '0.3', PAUSA_VIRGULA: '0.05' });
  assert.deepEqual(legacy, { elevenLabsModel: 'eleven_v3', fishModel: 's2', pauses: { sentence: 0.3, comma: 0.05 } });
  const english = externalSettings({ GIZZY_ELEVENLABS_MODEL: 'a', ELEVEN_MODEL: 'b', GIZZY_SENTENCE_PAUSE: '0.2', PAUSA_PONTO: '0.3' });
  assert.equal(english.elevenLabsModel, 'a');
  assert.equal(english.pauses.sentence, 0.2);
});

test('the key comes from the environment first, then from ~/.config/gizzycera/<service>.key (trimmed)', () => {
  const home = mkdtempSync(join(tmpdir(), 'gizzy-home-'));
  mkdirSync(join(home, '.config', 'gizzycera'), { recursive: true });
  writeFileSync(join(home, '.config', 'gizzycera', 'fish.key'), `  ${KEY}\n`);
  assert.equal(apiKeyOf('fish', { env: {}, home }), KEY);
  assert.equal(apiKeyOf('fish', { env: { FISH_API_KEY: 'da-env' }, home }), 'da-env');
  assert.throws(() => apiKeyOf('elevenlabs', { env: {}, home }), /ELEVENLABS_API_KEY.*elevenlabs\.key/);
});

test('ElevenLabs: PCM at 24 kHz, the voice id in the URL, the key in xi-api-key, the text with pauses', async () => {
  const { calls, fetch } = fakeFetch([new Response(PCM)]);
  const voice = new ElevenLabsVoice({ fetch, key: () => KEY, wait: waits().wait }, settings);
  const audio = await voice.generate(request);
  assert.equal(calls[0]?.url, 'https://api.elevenlabs.io/v1/text-to-speech/voz-abc?output_format=pcm_24000');
  assert.equal((calls[0]?.init.headers as Record<string, string>)['xi-api-key'], KEY);
  assert.deepEqual(JSON.parse(String(calls[0]?.init.body)), { text: 'Oi. <break time="0.15s" /> Tudo bem, Ana?', model_id: 'eleven_multilingual_v2' });
  assert.equal(audio.rate(), 24000);
  assert.deepEqual([...audio.samples()], [0, 0.5, -0.5, 32767 / 32768]);
});

test('Fish: the voice as reference_id, the model in a header, PCM at 24 kHz, the text as written', async () => {
  const { calls, fetch } = fakeFetch([new Response(PCM)]);
  const voice = new FishVoice({ fetch, key: () => KEY, wait: waits().wait }, settings);
  await voice.generate(request);
  assert.equal(calls[0]?.url, 'https://api.fish.audio/v1/tts');
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers.authorization, `Bearer ${KEY}`);
  assert.equal(headers.model, 's1');
  assert.deepEqual(JSON.parse(String(calls[0]?.init.body)), { text: 'Oi. Tudo bem, Ana?', reference_id: 'voz-abc', format: 'pcm', sample_rate: 24000 });
});

test('429 and 5xx are retried (2 s, 4 s), up to 3 attempts', async () => {
  const { wait, delays } = waits();
  const { calls, fetch } = fakeFetch([new Response('lento', { status: 429 }), new Response('caiu', { status: 503 }), new Response(PCM)]);
  await new ElevenLabsVoice({ fetch, key: () => KEY, wait }, settings).generate(request);
  assert.equal(calls.length, 3);
  assert.deepEqual(delays, [2000, 4000]);
  const failing = fakeFetch([500, 502, 503].map((status) => new Response('erro do servidor', { status })));
  await assert.rejects(new ElevenLabsVoice({ fetch: failing.fetch, key: () => KEY, wait }, settings).generate(request), /elevenlabs 503: erro do servidor/);
  assert.equal(failing.calls.length, 3);
});

test('a network failure is retried (3 s, 6 s, 9 s), up to 4 attempts', async () => {
  const { wait, delays } = waits();
  const { calls, fetch } = fakeFetch([new Error('socket hang up'), new Error('ECONNRESET'), new Response(PCM)]);
  await new FishVoice({ fetch, key: () => KEY, wait }, settings).generate(request);
  assert.equal(calls.length, 3);
  assert.deepEqual(delays, [3000, 6000]);
  const down = fakeFetch([1, 2, 3, 4].map(() => new Error('ENOTFOUND')));
  await assert.rejects(new FishVoice({ fetch: down.fetch, key: () => KEY, wait }, settings).generate(request), /fish: falha de rede.*ENOTFOUND/);
  assert.equal(down.calls.length, 4);
});

test('other 4xx errors are not retried, and no error message shows the key', async () => {
  const { wait, delays } = waits();
  const { calls, fetch } = fakeFetch([new Response('{"detail":"invalid_api_key"}', { status: 401 })]);
  const error = await new ElevenLabsVoice({ fetch, key: () => KEY, wait }, settings).generate(request).catch((caught: Error) => caught);
  assert.equal(calls.length, 1);
  assert.deepEqual(delays, []);
  assert.match(String(error), /elevenlabs 401/);
  assert.doesNotMatch(String(error), new RegExp(KEY));
});

test('the fingerprint carries the service settings: changing the model or the pauses regenerates the lines', async () => {
  const deps = { fetch: fakeFetch([]).fetch, key: () => KEY, wait: waits().wait };
  const first = await new ElevenLabsVoice(deps, settings).fingerprint();
  const otherPause = await new ElevenLabsVoice(deps, { ...settings, pauses: { sentence: 0.3, comma: 0 } }).fingerprint();
  assert.notEqual(first, otherPause);
  assert.notEqual(await new FishVoice(deps, settings).fingerprint(), await new FishVoice(deps, { ...settings, fishModel: 's2' }).fingerprint());
});

test('a missing key fails at once, without retrying or calling the service', async () => {
  const { wait, delays } = waits();
  const { calls, fetch } = fakeFetch([]);
  const missing = () => { throw new Error('chave da fish não encontrada'); };
  await assert.rejects(new FishVoice({ fetch, key: missing, wait }, settings).generate(request), /chave da fish não encontrada/);
  assert.deepEqual([calls.length, delays.length], [0, 0]);
});

test('an empty or blank key file is a missing key, with the same readable error', () => {
  const home = mkdtempSync(join(tmpdir(), 'gizzy-home-'));
  mkdirSync(join(home, '.config', 'gizzycera'), { recursive: true });
  writeFileSync(join(home, '.config', 'gizzycera', 'elevenlabs.key'), '  \n');
  assert.throws(() => apiKeyOf('elevenlabs', { env: { ELEVENLABS_API_KEY: '  ' }, home }), /chave da elevenlabs não encontrada: defina ELEVENLABS_API_KEY ou crie .*elevenlabs\.key/);
});

test('the final network failure names the real cause (code or message of error.cause)', async () => {
  const { wait } = waits();
  const withCode = () => Object.assign(new TypeError('fetch failed'), { cause: { code: 'ENOTFOUND' } });
  const coded = fakeFetch([1, 2, 3, 4].map(withCode));
  await assert.rejects(new FishVoice({ fetch: coded.fetch, key: () => KEY, wait }, settings).generate(request), /fish: falha de rede \(fetch failed: ENOTFOUND\)/);
  const withMessage = () => Object.assign(new TypeError('fetch failed'), { cause: new Error('other side closed') });
  const messaged = fakeFetch([1, 2, 3, 4].map(withMessage));
  await assert.rejects(new FishVoice({ fetch: messaged.fetch, key: () => KEY, wait }, settings).generate(request), /fetch failed: other side closed/);
});

test('a pause that is not a number keeps the default and warns', () => {
  const warnings: string[] = [];
  const result = externalSettings({ GIZZY_SENTENCE_PAUSE: 'meio', PAUSA_VIRGULA: '' }, (message) => warnings.push(message));
  assert.deepEqual(result.pauses, { sentence: 0.15, comma: 0 });
  assert.equal(warnings.length, 2);
  assert.match(warnings[0]!, /GIZZY_SENTENCE_PAUSE="meio" não é um número de segundos; usando 0\.15/);
});

test('the estimate prices the text the service bills, with the model of the settings, and reads no key nor calls anything', () => {
  const calls = fakeFetch([]);
  const deps = { fetch: calls.fetch, key: () => assert.fail('no key for an estimate'), wait: waits().wait };
  const sent = withPauses(request.text, settings.pauses);
  const eleven = new ElevenLabsVoice(deps, settings).estimate(request);
  assert.ok(Math.abs(eleven.dollars()! - ([...sent].length * 80) / 1e6) < 1e-12, 'eleven_multilingual_v2: US$ 80 per million characters, <break> included');
  const fish = new FishVoice(deps, settings).estimate(request);
  assert.ok(Math.abs(fish.dollars()! - (Buffer.byteLength(request.text) * 15) / 1e6) < 1e-12, 's1: US$ 15 per million UTF-8 bytes');
  assert.equal(new FishVoice(deps, { ...settings, fishModel: 'outro' }).estimate(request).isKnown(), false);
  assert.equal(calls.calls.length, 0);
});
