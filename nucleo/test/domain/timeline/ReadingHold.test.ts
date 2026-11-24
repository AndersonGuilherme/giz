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
