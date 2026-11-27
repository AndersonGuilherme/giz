import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { KeyStore } from '../../../../src/application/ports/KeyStore.ts';
import type { ImageRequest } from '../../../../src/application/ports/ImageProvider.ts';
import { FAL_IMAGE_API } from '../../../../src/infrastructure/ai/image/falImageApi.ts';
import { GEMINI_IMAGE_API } from '../../../../src/infrastructure/ai/image/geminiImageApi.ts';
import { HttpImageProvider } from '../../../../src/infrastructure/ai/image/HttpImageProvider.ts';
import type { ImageApi } from '../../../../src/infrastructure/ai/image/imageApi.ts';
import { OPENAI_IMAGE_API } from '../../../../src/infrastructure/ai/image/openAiImageApi.ts';

const KEY = 'sk-imagem-secreta-4242';
const PIXELS = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3, 4]);
const BASE64 = PIXELS.toString('base64');
const vertical: ImageRequest = { prompt: 'Uma praça ao entardecer.', size: { width: 1216, height: 2160 } };
const horizontal: ImageRequest = { prompt: 'Uma praça ao entardecer.', size: { width: 2160, height: 1216 }, seed: 7 };
type Call = { url: string; init: RequestInit };

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const bytes = (body: Buffer, type = 'image/png') => new Response(new Uint8Array(body), { status: 200, headers: { 'content-type': type } });

function fakeFetch(responses: Array<Response | Error>) {
  const calls: Call[] = [];
  const fetch = async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    const next = responses.shift();
    if (!next) throw new Error('sem resposta preparada');
    if (next instanceof Error) throw next;
    return next;
  };
  return { calls, fetch: fetch as typeof globalThis.fetch };
}

function keys(present: boolean): KeyStore {
  return { get: () => (present ? KEY : undefined), hint: (service) => `defina a chave da ${service}` };
}

function provider(api: ImageApi, responses: Array<Response | Error>, options: { model?: string; key?: boolean } = {}) {
  const delays: number[] = [];
  const fake = fakeFetch(responses);
  const wait = async (milliseconds: number) => void delays.push(milliseconds);
  const images = new HttpImageProvider(api, { fetch: fake.fetch, keys: keys(options.key ?? true), wait }, options.model);
  return { ...fake, delays, images };
}

const headersOf = (call: Call | undefined) => call?.init.headers as Record<string, string>;
const bodyOf = (call: Call | undefined) => JSON.parse(String(call?.init.body));
const OPENAI_OK = { created: 1, data: [{ b64_json: BASE64 }], output_format: 'png', size: '1216x2160', usage: { input_tokens: 80, output_tokens: 2700, total_tokens: 2780 } };
const GEMINI_OK = {
  candidates: [{ content: { role: 'model', parts: [{ text: 'Aqui está.' }, { inlineData: { mimeType: 'image/png', data: BASE64 } }] }, finishReason: 'STOP' }],
  usageMetadata: { promptTokenCount: 90, candidatesTokenCount: 1680 },
};
const FAL_OK = { images: [{ url: 'https://v3.fal.media/files/koala/praca.png', content_type: 'image/png', width: 1216, height: 2160 }], seed: 7 };

test('OpenAI: Images API, Bearer key, the size as WIDTHxHEIGHT, medium quality, PNG; the image comes in base64', async () => {
  const { calls, images } = provider(OPENAI_IMAGE_API, [json(OPENAI_OK)]);
  const image = await images.generate(vertical);
  assert.equal(calls[0]?.url, 'https://api.openai.com/v1/images/generations');
  assert.equal(calls[0]?.init.method, 'POST');
  assert.deepEqual(headersOf(calls[0]), { authorization: `Bearer ${KEY}`, 'content-type': 'application/json' });
  assert.deepEqual(bodyOf(calls[0]), {
    model: 'gpt-image-2.6-sunburst', prompt: 'Uma praça ao entardecer.', size: '1216x2160', quality: 'medium', output_format: 'png',
  });
  assert.deepEqual(Buffer.from(image.bytes), PIXELS);
  assert.equal(image.mime, 'image/png');
  assert.deepEqual(images.identity(), { provider: 'openai', model: 'gpt-image-2.6-sunburst' });
});

test('OpenAI: a size below the minimum area grows (same aspect, multiples of 16); the seed is not sent (no such field)', async () => {
  const { calls, images } = provider(OPENAI_IMAGE_API, [json(OPENAI_OK)], { model: 'gpt-image-2.5-flare' });
  await images.generate({ prompt: 'p', size: { width: 512, height: 512 }, seed: 3 });
  const body = bodyOf(calls[0]);
  assert.equal(body.model, 'gpt-image-2.5-flare');
  assert.equal(body.size, '816x816');
  assert.equal('seed' in body, false);
});

test('Gemini: generateContent with the key in a header, aspect ratio and resolution class; the image is an inline part', async () => {
  const { calls, images } = provider(GEMINI_IMAGE_API, [json(GEMINI_OK), json(GEMINI_OK)]);
  const image = await images.generate(vertical);
  assert.equal(calls[0]?.url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-nano-banana-2.1:generateContent');
  assert.doesNotMatch(calls[0]!.url, new RegExp(KEY));
  assert.deepEqual(headersOf(calls[0]), { 'x-goog-api-key': KEY, 'content-type': 'application/json' });
  assert.deepEqual(bodyOf(calls[0]), {
    contents: [{ role: 'user', parts: [{ text: 'Uma praça ao entardecer.' }] }],
    generationConfig: { responseModalities: ['TEXT', 'IMAGE'], imageConfig: { aspectRatio: '9:16', imageSize: '2K' } },
  });
  assert.deepEqual(Buffer.from(image.bytes), PIXELS);
  assert.equal(image.mime, 'image/png');
  await images.generate(horizontal);
  assert.deepEqual(bodyOf(calls[1]).generationConfig, { responseModalities: ['TEXT', 'IMAGE'], imageConfig: { aspectRatio: '16:9', imageSize: '2K' }, seed: 7 });
});

test('Gemini: a blocked prompt (no image part) is a readable error, not a crash', async () => {
  const { images } = provider(GEMINI_IMAGE_API, [json({ promptFeedback: { blockReason: 'SAFETY' }, usageMetadata: { promptTokenCount: 9 } })]);
  await assert.rejects(images.generate(vertical), /^Error: Google Gemini: o serviço não devolveu imagem/);
});

test('fal.ai: fal.run with "Key" auth, a custom image_size and PNG; the image is downloaded from its URL without the key', async () => {
  const { calls, images } = provider(FAL_IMAGE_API, [json(FAL_OK), bytes(PIXELS)]);
  const image = await images.generate(horizontal);
  assert.equal(calls[0]?.url, 'https://fal.run/fal-ai/flux-2-pro');
  assert.deepEqual(headersOf(calls[0]), { authorization: `Key ${KEY}`, 'content-type': 'application/json' });
  assert.deepEqual(bodyOf(calls[0]), { prompt: 'Uma praça ao entardecer.', image_size: { width: 2160, height: 1216 }, output_format: 'png', seed: 7 });
  assert.equal(calls[1]?.url, 'https://v3.fal.media/files/koala/praca.png');
  assert.equal(JSON.stringify(calls[1]?.init ?? {}).includes(KEY), false);
  assert.deepEqual(Buffer.from(image.bytes), PIXELS);
  assert.equal(image.mime, 'image/png');
});

test('fal.ai: a data URI answer (sync mode) is decoded in place, with no download', async () => {
  const { calls, images } = provider(FAL_IMAGE_API, [json({ images: [{ url: `data:image/png;base64,${BASE64}` }] })]);
  const image = await images.generate(vertical);
  assert.equal(calls.length, 1);
  assert.deepEqual(Buffer.from(image.bytes), PIXELS);
  assert.equal(image.mime, 'image/png');
});

test('fal.ai: a validation error (422, detail list) names what the service said', async () => {
  const { images } = provider(FAL_IMAGE_API, [json({ detail: [{ loc: ['body', 'image_size'], msg: 'tamanho grande demais', type: 'value_error' }] }, 422)]);
  await assert.rejects(images.generate(vertical), /^Error: fal\.ai: pedido recusado \(422\): tamanho grande demais$/);
});

test('fal.ai: a failed download is a readable error', async () => {
  const { images } = provider(FAL_IMAGE_API, [json(FAL_OK), new Response('gone', { status: 404 })]);
  await assert.rejects(images.generate(vertical), /^Error: fal\.ai: não foi possível baixar a imagem \(404\)/);
});

for (const api of [OPENAI_IMAGE_API, GEMINI_IMAGE_API, FAL_IMAGE_API]) {
  test(`${api.label}: without a key nothing is sent and the message says where to put it`, async () => {
    const { calls, images } = provider(api, [], { key: false });
    await assert.rejects(images.generate(vertical), new RegExp(`chave da ${api.provider} não encontrada: defina a chave da ${api.provider}`));
    assert.equal(calls.length, 0);
  });

  test(`${api.label}: 401 is not retried and the message never holds the key`, async () => {
    const { calls, images } = provider(api, [json({ error: { message: `Incorrect API key provided: ${KEY}` } }, 401)]);
    const error = await images.generate(vertical).catch((caught: Error) => caught);
    assert.equal(calls.length, 1);
    assert.match(String(error), new RegExp(`${api.label.replace('.', '\\.')}: a chave foi recusada \\(401\\)`));
    assert.doesNotMatch(String(error), new RegExp(KEY));
  });

  test(`${api.label}: 429 and 5xx are retried (2 s, 4 s), then a readable error`, async () => {
    const { calls, delays, images } = provider(api, [json({}, 429), json({}, 503), json({}, 503)]);
    await assert.rejects(images.generate(vertical), /serviço indisponível \(503\)/);
    assert.equal(calls.length, 3);
    assert.deepEqual(delays, [2000, 4000]);
  });

  test(`${api.label}: a body that is not the expected shape is "resposta inesperada"`, async () => {
    const { images } = provider(api, [json({ nada: true, images: 'x', data: 3, candidates: 'y' })]);
    await assert.rejects(images.generate(vertical), new RegExp(`^Error: ${api.label.replace('.', '\\.')}: resposta inesperada do serviço$`));
  });
}

test('estimates: GPT Image by output tokens, Gemini per resolution class, Flux per started megapixel; unknown model', () => {
  const openai = provider(OPENAI_IMAGE_API, []).images.estimate(vertical).dollars();
  assert.ok(openai !== undefined && Math.abs(openai - (1216 * 2160) / 1048576 * 1031 * 30 / 1e6) < 1e-9);
  assert.equal(provider(GEMINI_IMAGE_API, []).images.estimate(vertical).dollars(), 0.0504);
  assert.ok(Math.abs(provider(FAL_IMAGE_API, []).images.estimate(vertical).dollars()! - 0.165) < 1e-9);
  assert.equal(provider(FAL_IMAGE_API, [], { model: 'fal-ai/outro' }).images.estimate(vertical).isKnown(), false);
});
