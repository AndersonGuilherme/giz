import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Language } from '../../../src/domain/values/Language.ts';
import { QwenVoice } from '../../../src/infrastructure/voice/QwenVoice.ts';

const INSTALL = { model: '0.6b', device: 'cpu', threads: 0, modelsDir: '/nenhum' } as const;
const request = { lineId: '1', text: 'Oi', voice: 'vivian', language: Language.PORTUGUESE };

test('a model load that failed is not kept for the life of the process: the next line tries to load again', async () => {
  let loads = 0;
  const tts = { generate: async () => new Float32Array(2400) };
  const load = async () => {
    loads++;
    if (loads === 1) throw new Error('o modelo 0.6b não foi baixado');
    return tts as never;
  };
  const voice = new QwenVoice(INSTALL as never, '0.6b', load);
  await assert.rejects(voice.generate(request), /não foi baixado/);
  const audio = await voice.generate(request);
  assert.equal(audio.samples().length, 2400);
  await voice.generate(request);
  assert.equal(loads, 2, 'loaded once it worked, then kept');
});

test('loadDownloadedQwen never downloads: a model not downloaded yet fails with a readable error and no network', async () => {
  const { mkdtempSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { loadDownloadedQwen } = await import('../../../src/infrastructure/voice/QwenVoice.ts');
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async () => assert.fail('no download')) as typeof fetch;
  try {
    const install = { model: '0.6b' as const, device: 'cpu' as const, threads: 1, modelsDir: mkdtempSync(join(tmpdir(), 'giz-no-model-')) };
    await assert.rejects(loadDownloadedQwen(install), /modelo de voz .* não foi baixado: baixe-o em Configurações/);
  } finally {
    globalThis.fetch = realFetch;
  }
});
