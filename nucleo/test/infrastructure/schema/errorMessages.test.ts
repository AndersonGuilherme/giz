import { test } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { ProjectError } from '../../../src/application/ports/ProjectError.ts';
import { ProblemCollector, readablePath } from '../../../src/infrastructure/schema/errorMessages.ts';

// The same parse options `readValidated` uses: the issues carry the refused input.
function messages(schema: z.ZodType, value: unknown): string[] {
  const result = schema.safeParse(value, { reportInput: true });
  assert.equal(result.success, false);
  const collector = new ProblemCollector();
  collector.addFromZod('f.json', result.error!.issues);
  return thrown(() => collector.fail()).problems.map(({ path, message }) => `${path}: ${message}`);
}

function thrown(run: () => unknown): ProjectError {
  try {
    run();
  } catch (error) {
    return error as ProjectError;
  }
  throw new Error('nothing was thrown');
}

const shape = z.object({
  name: z.string().min(1),
  kind: z.enum(['story', 'lesson']),
  version: z.literal(2),
  items: z.array(z.string()).min(1),
  size: z.number().min(1).max(100),
  on: z.boolean(),
}).strict();
const VALID = { name: 'a', kind: 'story', version: 2, items: ['x'], size: 5, on: true };

test('zod 4 issues keep the zod 3 pt-BR wording: required and wrong type', () => {
  assert.deepEqual(messages(shape, { ...VALID, name: undefined }), ['name: obrigatório']);
  assert.deepEqual(messages(shape, { ...VALID, name: 3 }), ['name: esperava texto, veio número']);
  assert.deepEqual(messages(shape, { ...VALID, on: 'sim' }), ['on: esperava verdadeiro ou falso, veio texto']);
  assert.deepEqual(messages(shape, { ...VALID, items: {} }), ['items: esperava lista, veio objeto']);
  assert.deepEqual(messages(shape, { ...VALID, name: null }), ['name: esperava texto, veio nulo']);
});
test('zod 4 issues keep the zod 3 pt-BR wording: options and literals', () => {
  assert.deepEqual(messages(shape, { ...VALID, kind: 'film' }), ['kind: "film" inválido (use story, lesson)']);
  assert.deepEqual(messages(shape, { ...VALID, version: 3 }), ['version: esperava 2, veio 3']);
});
test('zod 4 issues keep the zod 3 pt-BR wording: sizes and unknown fields', () => {
  assert.deepEqual(messages(shape, { ...VALID, name: '' }), ['name: não pode ser vazio']);
  assert.deepEqual(messages(shape, { ...VALID, items: [] }), ['items: precisa de pelo menos 1 item(ns)']);
  assert.deepEqual(messages(shape, { ...VALID, size: 0 }), ['size: deve ser no mínimo 1']);
  assert.deepEqual(messages(shape, { ...VALID, size: 101 }), ['size: deve ser no máximo 100']);
  assert.deepEqual(messages(shape, { ...VALID, extra: 1, more: 2 }), ['extra: campo desconhecido', 'more: campo desconhecido']);
});
test('zod 4 issues keep the zod 3 pt-BR wording: an unknown discriminator lists the types', () => {
  const scene = z.discriminatedUnion('type', [z.object({ type: z.literal('title') }), z.object({ type: z.literal('card') })]);
  assert.deepEqual(messages(z.object({ scene }), { scene: { type: 'casa' } }), ['scene.type: tipo inválido (use title, card)']);
});
test('a custom message passes through and the path reads like code', () => {
  const schema = z.string().superRefine((_text, context) => context.addIssue({ code: 'custom', message: 'cor "bege" inválida' }));
  assert.deepEqual(messages(z.object({ colors: z.record(z.string(), schema) }), { colors: { wall: 'bege' } }), ['colors.wall: cor "bege" inválida']);
  assert.equal(readablePath(['lines', 0, 'speaker']), 'lines[0].speaker');
});
