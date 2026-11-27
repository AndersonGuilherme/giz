import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FORMATS } from '../../../../src/domain/project/Project.ts';
import { Language } from '../../../../src/domain/values/Language.ts';
import { answerSchema } from '../../../../src/infrastructure/ai/script/answerSchema.ts';
import { DiskScriptMaterials } from '../../../../src/infrastructure/ai/script/DiskScriptMaterials.ts';

const CORE = fileURLToPath(new URL('../../../../', import.meta.url));
const materials = new DiskScriptMaterials({
  formats: join(CORE, 'formats'),
  casts: [join(CORE, 'casts/presets/present'), join(CORE, 'casts/example')],
  scenes: join(CORE, 'presets/scenes'),
});

const RULES = {
  'pt-BR': { pace: /1,8 palavras por segundo/, originality: /Nunca imite, copie ou cite um vídeo,\s+canal/, hook: /## Um bom gancho|Gancho/ },
  en: { pace: /2\.2 words per second/, originality: /Never imitate, copy or reference any\s+specific existing video,\s+channel/, hook: /## A good hook|Hook/ },
} as const;

test('every format has a guide in pt-BR and in English, with the pace, the hook and the originality rule', async () => {
  const pairs = FORMATS.flatMap((format) => [Language.PORTUGUESE, Language.ENGLISH].map((language) => ({ format, language })));
  for (const { format, language } of pairs) {
    const guide = await materials.guide(format, language);
    Object.values(RULES[language.code()]).forEach((rule) => assert.match(guide, rule, `${format} ${language.code()}`));
  }
});

test('the cast presets come from their folders with name, personality, voice, rig and the whole file', async () => {
  const presets = await materials.castPresets();
  const bia = presets.find(({ id }) => id === 'bia');
  assert.deepEqual({ ...bia, json: undefined }, { id: 'bia', name: 'Bia', personality: 'streamer animada que narra a própria vida em voz alta', voice: 'vivian', rig: 'giz', json: undefined });
  assert.equal(bia?.json.outfit, undefined);
  assert.equal((bia?.json.parameters as Record<string, unknown>).outfit, 'hoodie');
  assert.ok(presets.some(({ id, rig }) => id === 'teo' && rig === 'lia-style'));
  const ids = presets.map(({ id }) => id);
  assert.equal(new Set(ids).size, ids.length, 'no repeated id');
});

test('the scene presets carry their name, description and scene', async () => {
  const scenes = await materials.scenePresets();
  assert.equal(scenes.length, 16);
  const rain = scenes.find(({ id }) => id === 'castle-rain');
  assert.equal(rain?.name, 'castelo sob chuva');
  assert.equal((rain?.scene as { type: string }).type, 'scenario');
});

test('the answer reference is the JSON schema of the real schemas, compact', () => {
  const reference = materials.answerReference();
  const schema = JSON.parse(reference);
  assert.deepEqual(schema.required, ['project', 'cast', 'script']);
  assert.ok(reference.includes('"hands-on-mouth"'), 'the poses come from the domain');
  assert.ok(reference.includes('"holdAfter"'), 'the line fields come from the script schema');
  assert.doesNotMatch(reference, /\$schema|9007199254740991/);
  assert.ok(reference.length < 14_000, `${reference.length}`);
  assert.equal(materials.voices()[0], 'serena');
});

test('the answer schema accepts the shape the use case reads (a preset id or a whole character)', () => {
  const answer = { project: { title: 'T' }, cast: ['bia', { id: 'narrator', name: 'N', voice: { id: 'ryan' }, defaultExpression: 'neutral' }], script: { chapters: ['A'], lines: [{ id: '1', chapter: 1, speaker: 'bia', text: 'Oi' }] } };
  assert.equal(answerSchema.safeParse(answer).success, true);
  assert.equal(answerSchema.safeParse({ ...answer, extra: 1 }).success, false);
});
