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

function provider(api: ImageApi, responses: Array<Response | Error>, options: { model?: string; key?: boolean; maximumBytes?: number } = {}) {
  const delays: number[] = [];
  const fake = fakeFetch(responses);
  const wait = async (milliseconds: number) => void delays.push(milliseconds);
  const dependencies = { fetch: fake.fetch, keys: keys(options.key ?? true), wait, maximumBytes: options.maximumBytes };
  const images = new HttpImageProvider(api, dependencies, options.model);
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

const falAt = (url: string) => json({ images: [{ url }] });
const refused = (reason: RegExp) => (error: Error) => /^fal\.ai: imagem recusada: /.test(error.message) && reason.test(error.message);

test('fal.ai download: only https, only fal hosts (subdomains too, not look-alikes); nothing else is fetched', async () => {
  for (const [url, reason] of [
    ['http://v3.fal.media/files/a.png', /o endereço da imagem não é https/],
    ['https://evil.example.com/a.png', /o endereço da imagem é de outro servidor \(evil\.example\.com\)/],
    ['https://fal.media.evil.com/a.png', /outro servidor \(fal\.media\.evil\.com\)/],
    ['file:///etc/passwd', /não é https/],
    ['não é um endereço', /não é https/],
  ] as const) {
    const { calls, images } = provider(FAL_IMAGE_API, [falAt(url)]);
    await assert.rejects(images.generate(vertical), refused(reason), url);
    assert.equal(calls.length, 1, url);
  }
  const { calls, images } = provider(FAL_IMAGE_API, [falAt('https://v3b.fal.media/files/b/x.png'), bytes(PIXELS)]);
  await images.generate(vertical);
  assert.equal(calls[1]?.url, 'https://v3b.fal.media/files/b/x.png');
});

const redirectTo = (location: string, status = 302) => new Response(null, { status, headers: { location } });

test('fal.ai download: redirects are not followed blindly (manual); one to a foreign host is refused, unfetched', async () => {
  const { calls, images } = provider(FAL_IMAGE_API, [json(FAL_OK), redirectTo('https://evil.example.com/x.png')]);
  await assert.rejects(images.generate(vertical), refused(/o endereço da imagem é de outro servidor \(evil\.example\.com\)/));
  assert.equal(calls.length, 2);
  assert.equal(calls[1]?.init.redirect, 'manual');
  const toHttp = provider(FAL_IMAGE_API, [json(FAL_OK), redirectTo('http://v3.fal.media/x.png')]);
  await assert.rejects(toHttp.images.generate(vertical), refused(/não é https/));
  const nowhere = provider(FAL_IMAGE_API, [json(FAL_OK), new Response(null, { status: 301 })]);
  await assert.rejects(nowhere.images.generate(vertical), refused(/redirecionamento \(301\) sem destino válido/));
});

test('fal.ai download: a redirect to another fal.media subdomain (a relative Location too) is followed, without the key', async () => {
  const { calls, images } = provider(FAL_IMAGE_API, [json(FAL_OK), redirectTo('https://v3b.fal.media/files/b/praca.png', 307), redirectTo('/files/b/final.png'), bytes(PIXELS)]);
  const image = await images.generate(vertical);
  assert.deepEqual(calls.slice(1).map((call) => call.url), [
    'https://v3.fal.media/files/koala/praca.png', 'https://v3b.fal.media/files/b/praca.png', 'https://v3b.fal.media/files/b/final.png',
  ]);
  assert.ok(calls.slice(1).every((call) => call.init.redirect === 'manual' && !JSON.stringify(call.init).includes(KEY)));
  assert.deepEqual(Buffer.from(image.bytes), PIXELS);
});

test('fal.ai download: a redirect loop is refused after 3 hops', async () => {
  const loop = Array.from({ length: 6 }, (_unused, index) => redirectTo(`https://v3.fal.media/files/${index % 2 ? 'a' : 'b'}.png`));
  const { calls, images } = provider(FAL_IMAGE_API, [json(FAL_OK), ...loop]);
  await assert.rejects(images.generate(vertical), refused(/redirecionamentos demais \(mais de 3\)/));
  assert.equal(calls.length, 1 + 4);
});

test('fal.ai download: the final response URL is checked too (a client that followed on its own)', async () => {
  const followed = bytes(PIXELS);
  Object.defineProperty(followed, 'url', { value: 'https://evil.example.com/x.png' });
  await assert.rejects(provider(FAL_IMAGE_API, [json(FAL_OK), followed]).images.generate(vertical), refused(/outro servidor \(evil\.example\.com\)/));
});

test('fal.ai download: a declared size over the limit is refused before reading; a streamed body stops at the limit', async () => {
  const declared = new Response(new Uint8Array(PIXELS), { headers: { 'content-type': 'image/png', 'content-length': '999999999' } });
  await assert.rejects(provider(FAL_IMAGE_API, [json(FAL_OK), declared]).images.generate(vertical), refused(/maior que 50 MB/));
  let pulled = 0;
  const endless = new ReadableStream<Uint8Array>({ pull: (controller) => { pulled += 1; controller.enqueue(new Uint8Array(PIXELS)); } });
  const streamed = new Response(endless, { headers: { 'content-type': 'image/png' } });
  await assert.rejects(provider(FAL_IMAGE_API, [json(FAL_OK), streamed], { maximumBytes: 30 }).images.generate(vertical), refused(/maior que/));
  assert.ok(pulled <= 4, `read ${pulled} chunks`);
});

test('fal.ai download: a text/html answer, or image/png bytes that are not an image, are refused', async () => {
  const html = new Response('<html>oi</html>', { headers: { 'content-type': 'text/html; charset=utf-8' } });
  await assert.rejects(provider(FAL_IMAGE_API, [json(FAL_OK), html]).images.generate(vertical), refused(/o servidor mandou text\/html, não uma imagem PNG, JPEG ou WebP/));
  const fake = new Response('<html>oi</html>', { headers: { 'content-type': 'image/png' } });
  await assert.rejects(provider(FAL_IMAGE_API, [json(FAL_OK), fake]).images.generate(vertical), refused(/o conteúdo não é uma imagem PNG, JPEG ou WebP/));
});

test('fal.ai: a data URI that is not a base64 image is not decoded (and, not being https, not fetched)', async () => {
  for (const url of [`data:text/html;base64,${Buffer.from('<script>').toString('base64')}`, `data:image/svg+xml;base64,${BASE64}`, `data:image/png,${BASE64}`]) {
    const { calls, images } = provider(FAL_IMAGE_API, [falAt(url)]);
    await assert.rejects(images.generate(vertical), refused(/não é https/), url);
    assert.equal(calls.length, 1);
  }
});

test('inline images are checked too: base64 that is not an image is refused; the type comes from the bytes', async () => {
  const text = { data: [{ b64_json: Buffer.from('não sou imagem').toString('base64') }] };
  await assert.rejects(provider(OPENAI_IMAGE_API, [json(text)]).images.generate(vertical), /^Error: OpenAI: imagem recusada: o conteúdo não é uma imagem/);
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16]);
  const declaredPng = { data: [{ b64_json: jpeg.toString('base64') }], output_format: 'png' };
  assert.equal((await provider(OPENAI_IMAGE_API, [json(declaredPng)]).images.generate(vertical)).mime, 'image/jpeg');
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

test('a cancel aborts the paid image call in flight: the signal reaches fetch, the abort is not retried', async () => {
  const controller = new AbortController();
  const calls: RequestInit[] = [];
  const waits: number[] = [];
  const hanging = (_url: string | URL | Request, init?: RequestInit) => {
    calls.push(init ?? {});
    return new Promise<Response>((_done, fail) => init?.signal?.addEventListener('abort', () => fail(init.signal?.reason), { once: true }));
  };
  const images = new HttpImageProvider(FAL_IMAGE_API, { fetch: hanging as typeof fetch, keys: keys(true), wait: async (milliseconds) => void waits.push(milliseconds) });
  const answer = images.generate(vertical, { signal: controller.signal });
  await new Promise((done) => setImmediate(done));
  controller.abort();
  await assert.rejects(answer, { name: 'AbortError' });
  assert.equal(calls.length, 1);
  assert.equal(calls[0]!.signal, controller.signal);
  assert.deepEqual(waits, []);
});

test('a cancel during the image download aborts it too; an already aborted signal sends nothing', async () => {
  const controller = new AbortController();
  const seen: Array<AbortSignal | null | undefined> = [];
  const fetch = async (url: string | URL | Request, init?: RequestInit) => {
    seen.push(init?.signal);
    if (String(url).startsWith('https://fal.run')) return json(FAL_OK);
    controller.abort();
    throw init?.signal?.reason;
  };
  const images = new HttpImageProvider(FAL_IMAGE_API, { fetch: fetch as typeof globalThis.fetch, keys: keys(true), wait: async () => {} });
  await assert.rejects(images.generate(vertical, { signal: controller.signal }), { name: 'AbortError' });
  assert.deepEqual(seen, [controller.signal, controller.signal]);
  const fake = fakeFetch([json(FAL_OK)]);
  const idle = new HttpImageProvider(FAL_IMAGE_API, { fetch: fake.fetch, keys: keys(true), wait: async () => {} });
  await assert.rejects(idle.generate(vertical, { signal: AbortSignal.abort() }), { name: 'AbortError' });
  assert.equal(fake.calls.length, 0);
});
