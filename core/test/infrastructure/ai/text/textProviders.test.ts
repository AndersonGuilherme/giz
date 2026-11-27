import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { KeyStore } from '../../../../src/application/ports/KeyStore.ts';
import type { TextRequest } from '../../../../src/application/ports/TextProvider.ts';
import { ANTHROPIC_API } from '../../../../src/infrastructure/ai/text/anthropicApi.ts';
import { GEMINI_API } from '../../../../src/infrastructure/ai/text/geminiApi.ts';
import { HttpTextProvider } from '../../../../src/infrastructure/ai/text/HttpTextProvider.ts';
import { OPENAI_API } from '../../../../src/infrastructure/ai/text/openAiApi.ts';
import type { TextApi } from '../../../../src/infrastructure/ai/text/textApi.ts';

const KEY = 'sk-secreta-987';
const request: TextRequest = { system: 'Você escreve roteiros.', prompt: 'Uma fala sobre gatos.', maxTokens: 300 };
type Call = { url: string; init: RequestInit };

const ANTHROPIC_OK = { content: [{ type: 'thinking', thinking: '' }, { type: 'text', text: 'Olá, ' }, { type: 'text', text: 'gatos!' }], usage: { input_tokens: 12, output_tokens: 5 }, stop_reason: 'end_turn' };
const OPENAI_OK = { choices: [{ index: 0, message: { role: 'assistant', content: 'Olá, gatos!', refusal: null }, finish_reason: 'stop' }], usage: { prompt_tokens: 12, completion_tokens: 5, total_tokens: 17 } };
const GEMINI_OK = {
  candidates: [{ content: { role: 'model', parts: [{ text: 'pensando', thought: true }, { text: 'Olá, ' }, { text: 'gatos!' }] }, finishReason: 'STOP' }],
  usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 3, thoughtsTokenCount: 2, totalTokenCount: 17 },
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

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

function provider(api: TextApi, responses: Array<Response | Error>, model?: string) {
  const delays: number[] = [];
  const fake = fakeFetch(responses);
  const wait = async (milliseconds: number) => void delays.push(milliseconds);
  return { ...fake, delays, text: new HttpTextProvider(api, { fetch: fake.fetch, keys: keys(true), wait }, model) };
}

const headersOf = (call: Call | undefined) => call?.init.headers as Record<string, string>;
const bodyOf = (call: Call | undefined) => JSON.parse(String(call?.init.body));

test('Anthropic: Messages API, the key in x-api-key, the API version, system apart, max_tokens', async () => {
  const { calls, text } = provider(ANTHROPIC_API, [json(ANTHROPIC_OK)]);
  const answer = await text.generate(request);
  assert.equal(calls[0]?.url, 'https://api.anthropic.com/v1/messages');
  assert.equal(calls[0]?.init.method, 'POST');
  assert.deepEqual(headersOf(calls[0]), { 'x-api-key': KEY, 'anthropic-version': '2026-10-21', 'content-type': 'application/json' });
  assert.deepEqual(bodyOf(calls[0]), {
    model: 'claude-sonnet-5-5', max_tokens: 300, system: 'Você escreve roteiros.', messages: [{ role: 'user', content: 'Uma fala sobre gatos.' }],
  });
  assert.deepEqual(answer, { text: 'Olá, gatos!', usage: { inputTokens: 12, outputTokens: 5 } });
});

test('OpenAI: Chat Completions, Bearer key, system as developer message, max_completion_tokens', async () => {
  const { calls, text } = provider(OPENAI_API, [json(OPENAI_OK)]);
  const answer = await text.generate(request);
  assert.equal(calls[0]?.url, 'https://api.openai.com/v1/chat/completions');
  assert.deepEqual(headersOf(calls[0]), { authorization: `Bearer ${KEY}`, 'content-type': 'application/json' });
  assert.deepEqual(bodyOf(calls[0]), {
    model: 'gpt-6.2-astra', max_completion_tokens: 300,
    messages: [{ role: 'developer', content: 'Você escreve roteiros.' }, { role: 'user', content: 'Uma fala sobre gatos.' }],
  });
  assert.deepEqual(answer, { text: 'Olá, gatos!', usage: { inputTokens: 12, outputTokens: 5 } });
});

test('Gemini: generateContent with the model in the URL, the key in a header (never in the URL), thoughts left out of the text', async () => {
  const { calls, text } = provider(GEMINI_API, [json(GEMINI_OK)]);
  const answer = await text.generate(request);
  assert.equal(calls[0]?.url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent');
  assert.doesNotMatch(calls[0]?.url ?? '', new RegExp(KEY));
  assert.deepEqual(headersOf(calls[0]), { 'x-goog-api-key': KEY, 'content-type': 'application/json' });
  assert.deepEqual(bodyOf(calls[0]), {
    system_instruction: { parts: [{ text: 'Você escreve roteiros.' }] },
    contents: [{ role: 'user', parts: [{ text: 'Uma fala sobre gatos.' }] }],
    generationConfig: { maxOutputTokens: 300 },
  });
  // Thinking tokens are billed as output.
  assert.deepEqual(answer, { text: 'Olá, gatos!', usage: { inputTokens: 12, outputTokens: 5 } });
});

test('JSON mode: OpenAI response_format json_object, Gemini responseMimeType, Anthropic an instruction; all ask for JSON in the system', async () => {
  const jsonRequest = { ...request, json: true };
  const anthropic = provider(ANTHROPIC_API, [json(ANTHROPIC_OK)]);
  const openai = provider(OPENAI_API, [json(OPENAI_OK)]);
  const gemini = provider(GEMINI_API, [json(GEMINI_OK)]);
  await Promise.all([anthropic.text.generate(jsonRequest), openai.text.generate(jsonRequest), gemini.text.generate(jsonRequest)]);
  assert.match(bodyOf(anthropic.calls[0]).system, /^Você escreve roteiros\.\n\n.*JSON/);
  assert.equal(bodyOf(anthropic.calls[0]).output_config, undefined);
  assert.deepEqual(bodyOf(openai.calls[0]).response_format, { type: 'json_object' });
  assert.match(bodyOf(openai.calls[0]).messages[0].content, /JSON/);
  assert.equal(bodyOf(gemini.calls[0]).generationConfig.responseMimeType, 'application/json');
  assert.match(bodyOf(gemini.calls[0]).system_instruction.parts[0].text, /JSON/);
});

test('the model is configurable, and the estimate follows the model', async () => {
  const { calls, text } = provider(ANTHROPIC_API, [json(ANTHROPIC_OK)], 'claude-opus-5-5');
  await text.generate(request);
  assert.equal(bodyOf(calls[0]).model, 'claude-opus-5-5');
  assert.equal(text.model(), 'claude-opus-5-5');
  const sonnet = provider(ANTHROPIC_API, []).text;
  assert.ok((text.estimate(request).dollars() ?? 0) > (sonnet.estimate(request).dollars() ?? 0));
  assert.equal(provider(OPENAI_API, [], 'modelo-novo').text.estimate(request).isKnown(), false);
});

test('without maxTokens the default output limit is sent', async () => {
  const { calls, text } = provider(OPENAI_API, [json(OPENAI_OK)]);
  await text.generate({ system: 's', prompt: 'p' });
  assert.equal(bodyOf(calls[0]).max_completion_tokens, 8192);
});

test('429 and 5xx are retried (2 s, 4 s), a network failure too (3 s)', async () => {
  const busy = provider(GEMINI_API, [json({ error: { message: 'quota' } }, 429), json({}, 503), json(GEMINI_OK)]);
  assert.equal((await busy.text.generate(request)).text, 'Olá, gatos!');
  assert.deepEqual([busy.calls.length, ...busy.delays], [3, 2000, 4000]);
  const flaky = provider(OPENAI_API, [new Error('socket hang up'), json(OPENAI_OK)]);
  await flaky.text.generate(request);
  assert.deepEqual([flaky.calls.length, ...flaky.delays], [2, 3000]);
});

test('after the last attempt the errors are readable pt-BR: rate limit, unavailable service, network', async () => {
  const limited = provider(ANTHROPIC_API, [429, 429, 429].map((status) => json({ error: { message: 'rate' } }, status)));
  await assert.rejects(limited.text.generate(request), /^Error: Anthropic: limite de uso atingido \(429\)/);
  const down = provider(OPENAI_API, [500, 502, 503].map((status) => json({}, status)));
  await assert.rejects(down.text.generate(request), /OpenAI: serviço indisponível \(503\)/);
  const offline = provider(GEMINI_API, [1, 2, 3, 4].map(() => Object.assign(new TypeError('fetch failed'), { cause: { code: 'ENOTFOUND' } })));
  await assert.rejects(offline.text.generate(request), /Google Gemini: falha de rede \(fetch failed: ENOTFOUND\)/);
});

test('a missing key fails at once, without calling the service, with the hint of the key store', async () => {
  const fake = fakeFetch([]);
  const text = new HttpTextProvider(ANTHROPIC_API, { fetch: fake.fetch, keys: keys(false), wait: async () => {} });
  await assert.rejects(text.generate(request), /chave da anthropic não encontrada: defina a chave da anthropic/);
  assert.equal(fake.calls.length, 0);
});

test('401 is not retried and says the key was refused, without the key or the service body', async () => {
  const body = { error: { message: `Incorrect API key provided: ${KEY}` } };
  for (const api of [ANTHROPIC_API, OPENAI_API, GEMINI_API]) {
    const { calls, text } = provider(api, [json(body, 401)]);
    const error = await text.generate(request).catch((caught: Error) => caught);
    assert.equal(calls.length, 1);
    assert.match(String(error), /a chave foi recusada \(401\)/);
    assert.doesNotMatch(String(error), new RegExp(KEY));
  }
});

test('other 4xx show the service message, with the key blanked if the service echoes it', async () => {
  const bad = provider(GEMINI_API, [json({ error: { code: 400, message: `API key not valid: ${KEY}`, status: 'INVALID_ARGUMENT' } }, 400)]);
  const error = await bad.text.generate(request).catch((caught: Error) => caught);
  assert.match(String(error), /Google Gemini: pedido recusado \(400\): API key not valid: \*\*\*/);
  assert.doesNotMatch(String(error), new RegExp(KEY));
  const missing = provider(OPENAI_API, [json({ error: { message: 'The model `gpt-x` does not exist' } }, 404)], 'gpt-x');
  await assert.rejects(missing.text.generate(request), /OpenAI: modelo gpt-x não encontrado \(404\): The model `gpt-x` does not exist/);
  const plain = provider(ANTHROPIC_API, [new Response('proibido', { status: 403 })]);
  await assert.rejects(plain.text.generate(request), /Anthropic: acesso negado \(403\): proibido/);
});

test('an answer that is not the expected shape is a readable error', async () => {
  const odd = provider(OPENAI_API, [json({ unexpected: true })]);
  await assert.rejects(odd.text.generate(request), /OpenAI: resposta inesperada do serviço/);
  const notJson = provider(ANTHROPIC_API, [new Response('<html>')]);
  await assert.rejects(notJson.text.generate(request), /Anthropic: resposta inesperada do serviço/);
});

test('a null OpenAI content or a Gemini answer without candidates gives empty text, not a crash', async () => {
  const refusal = provider(OPENAI_API, [json({ choices: [{ message: { content: null, refusal: 'não' } }], usage: { prompt_tokens: 3, completion_tokens: 1 } })]);
  assert.deepEqual(await refusal.text.generate(request), { text: '', usage: { inputTokens: 3, outputTokens: 1 } });
  const blocked = provider(GEMINI_API, [json({ promptFeedback: { blockReason: 'SAFETY' }, usageMetadata: { promptTokenCount: 4 } })]);
  assert.deepEqual(await blocked.text.generate(request), { text: '', usage: { inputTokens: 4, outputTokens: 0 } });
});
