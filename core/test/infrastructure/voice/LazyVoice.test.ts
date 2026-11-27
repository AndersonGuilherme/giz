import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LazyVoice } from '../../../src/infrastructure/voice/LazyVoice.ts';
import { Language } from '../../../src/domain/values/Language.ts';
import { FakeVoice } from '../../doubles/FakeVoice.ts';

const request = (lineId: string) => ({ lineId, text: 'Oi', voice: 'vivian', language: Language.PORTUGUESE });

test('the voice is loaded only when the first line is generated, and only once', async () => {
  const inner = new FakeVoice();
  let loads = 0;
  const voice = new LazyVoice(async () => {
    loads++;
    return inner;
  });
  assert.equal(loads, 0);
  await voice.generate(request('1'));
  await voice.generate(request('2'));
  assert.deepEqual([loads, inner.calls], [1, 2]);
});

test('a load that failed is not kept: the next line loads again (a model downloaded meanwhile is found)', async () => {
  const inner = new FakeVoice();
  let loads = 0;
  const voice = new LazyVoice(async () => {
    loads++;
    if (loads === 1) throw new Error('modelo ausente');
    return inner;
  });
  await assert.rejects(voice.generate(request('1')), /modelo ausente/);
  await voice.generate(request('1'));
  assert.deepEqual([loads, inner.calls], [2, 1]);
});
