import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Cast } from '../../../src/domain/cast/Cast.ts';
import { Project } from '../../../src/domain/project/Project.ts';
import { Lines } from '../../../src/domain/script/Lines.ts';
import { Script } from '../../../src/domain/script/Script.ts';
import { AspectRatio } from '../../../src/domain/values/AspectRatio.ts';
import { Language } from '../../../src/domain/values/Language.ts';

const project = Project.of(
  { title: 'Cupons', format: 'lesson', language: Language.PORTUGUESE, aspect: AspectRatio.HORIZONTAL, voice: { provider: 'qwen' } },
  { cast: Cast.of([]), script: Script.of(['Abertura'], Lines.of([])), warnings: ['um aviso'] },
);

test('a project seen in the other aspect keeps everything else and leaves the original as it was', () => {
  const vertical = project.inAspect(AspectRatio.VERTICAL);
  assert.equal(vertical.aspect(), AspectRatio.VERTICAL);
  assert.equal(project.aspect(), AspectRatio.HORIZONTAL);
  assert.equal(vertical.title(), 'Cupons');
  assert.equal(vertical.script(), project.script());
  assert.equal(vertical.cast(), project.cast());
  assert.deepEqual(vertical.warnings(), ['um aviso']);
});

test('the project in its own aspect is the same project', () => {
  assert.equal(project.inAspect(AspectRatio.HORIZONTAL), project);
});
