import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REQUEST_SCHEMAS } from '../../../src/main/ipc/schemas.ts';

const IDEA = { format: 'story', aspect: '9:16', targetSeconds: 30, theme: 'Gatos', audience: 'jovens', tone: 'leve', language: 'pt-BR' };
const ok = (name: keyof typeof REQUEST_SCHEMAS, payload: unknown) => REQUEST_SCHEMAS[name].safeParse(payload).success;

test('an idea within core limits passes; outside them, or with a path as a preset, it is refused', () => {
  assert.equal(ok('projects.create', { idea: IDEA }), true);
  assert.equal(ok('script.generate', { idea: { ...IDEA, cast: ['bia'], scenes: ['castle-rain'] } }), true);
  assert.equal(ok('script.generate', { idea: { ...IDEA, targetSeconds: 5 } }), false);
  assert.equal(ok('script.generate', { idea: { ...IDEA, targetSeconds: 30.5 } }), false);
  assert.equal(ok('script.estimate', { idea: { ...IDEA, theme: '   ' } }), false);
  assert.equal(ok('script.estimate', { idea: { ...IDEA, format: 'podcast' } }), false);
  assert.equal(ok('projects.create', { idea: { ...IDEA, cast: ['../../etc'] } }), false);
  assert.equal(ok('projects.create', { idea: { ...IDEA, extra: 1 } }), false);
});

test('a script in the middle of an edit can be saved; anything that is not a script cannot', () => {
  assert.equal(ok('script.save', { folder: '/p', script: { chapters: [''], lines: [{ id: '', text: 3 }] } }), true);
  assert.equal(ok('script.save', { folder: '/p', script: { chapters: [], lines: ['texto'] } }), false);
  assert.equal(ok('script.save', { folder: '/p', script: { lines: [] } }), false);
  assert.equal(ok('script.checkScene', { scene: { type: 'talk' } }), true);
  assert.equal(ok('projects.trash', { folder: '' }), false);
});
