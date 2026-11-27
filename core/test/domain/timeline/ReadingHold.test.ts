import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Chapter } from '../../../src/domain/script/Chapter.ts';
import { Line } from '../../../src/domain/script/Line.ts';
import type { Scene } from '../../../src/domain/script/Scene.ts';
import { lineHold } from '../../../src/domain/timeline/ReadingHold.ts';
import { CharacterId } from '../../../src/domain/values/CharacterId.ts';
import { Language } from '../../../src/domain/values/Language.ts';

const code: Scene = { type: 'code', title: 'a.ts', lines: ['const a = 1;'] };
const line = (holdAfter?: { seconds: number; label: string }) =>
  Line.of(CharacterId.of('ana'), { id: '1', chapter: Chapter.of(1), text: 'Veja.', holdAfter });

test('the reading hold label comes from the fixed texts of the video language', () => {
  assert.deepEqual(lineHold(line(), code, Language.PORTUGUESE), { seconds: 4, label: 'Leia o código' });
  assert.deepEqual(lineHold(line(), code, Language.ENGLISH), { seconds: 4, label: 'Read the code' });
});
test('an explicit hold keeps its own label and takes the longer time', () => {
  assert.deepEqual(lineHold(line({ seconds: 2, label: 'Ache o bug' }), code, Language.ENGLISH), { seconds: 4, label: 'Ache o bug' });
  assert.equal(lineHold(line(), undefined, Language.ENGLISH), undefined);
});
test('`reading` sets the reading hold of the scene the line opens: seconds, or false for none (the motor `read`)', () => {
  const reading = (value: number | false, holdAfter?: { seconds: number; label: string }) =>
    Line.of(CharacterId.of('ana'), { id: '1', chapter: Chapter.of(1), text: 'Veja.', reading: value, holdAfter });
  const title: Scene = { type: 'title', overline: 'Aula', title: 'Título' };
  assert.deepEqual(lineHold(reading(2.5), code, Language.PORTUGUESE), { seconds: 2.5, label: 'Leia o código' });
  assert.deepEqual(lineHold(reading(3), title, Language.PORTUGUESE), { seconds: 3, label: 'Leia o código' }, 'any opened scene, as in the motor');
  assert.equal(lineHold(reading(false), code, Language.PORTUGUESE), undefined);
  assert.deepEqual(lineHold(reading(false, { seconds: 2, label: 'Pense' }), code, Language.PORTUGUESE), { seconds: 2, label: 'Pense' });
  assert.deepEqual(lineHold(reading(1, { seconds: 2, label: 'Pense' }), code, Language.PORTUGUESE), { seconds: 2, label: 'Pense' });
  assert.equal(lineHold(reading(3), undefined, Language.PORTUGUESE), undefined, 'only when the line opens a scene');
});
