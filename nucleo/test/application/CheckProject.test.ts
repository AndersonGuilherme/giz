import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CheckProject } from '../../src/application/use-cases/CheckProject.ts';
import { Cast } from '../../src/domain/cast/Cast.ts';
import { Character } from '../../src/domain/cast/Character.ts';
import { Box } from '../../src/domain/layout/Box.ts';
import { Boxes } from '../../src/domain/layout/Boxes.ts';
import { LayoutRegistry } from '../../src/domain/layout/LayoutRegistry.ts';
import { createLayoutRegistry } from '../../src/domain/layout/defaultLayoutRegistry.ts';
import { CAPTION_LAYOUTS, type CaptionLayout } from '../../src/domain/caption/captionLayouts.ts';
import { Project, type CaptionStyle, type Format } from '../../src/domain/project/Project.ts';
import { Chapter } from '../../src/domain/script/Chapter.ts';
import type { Scene } from '../../src/domain/script/Scene.ts';
import { Line, type Beat } from '../../src/domain/script/Line.ts';
import { Lines } from '../../src/domain/script/Lines.ts';
import { Script } from '../../src/domain/script/Script.ts';
import { CharacterId } from '../../src/domain/values/CharacterId.ts';
import { Language } from '../../src/domain/values/Language.ts';
import { AspectRatio } from '../../src/domain/values/AspectRatio.ts';

type TestLine = { text?: string; scene?: Scene; beats?: Beat[] };

type Extras = Readonly<{ warnings?: string[]; format?: Format; captionStyle?: CaptionStyle; withBody?: string[]; chapters?: string[] }>;

const member = (id: string) => Character.of(CharacterId.of(id), { name: id, rig: 'test', parameters: {}, voice: { id: 'vivian' }, defaultExpression: 'neutral' });

const NO_EXTRAS = { warnings: [], format: 'lesson', withBody: ['ana'], chapters: ['Abertura'] } as const;

function project(lines: TestLine[], aspect: string, extras: Extras = {}): Project {
  const { warnings, format, captionStyle, withBody, chapters } = { ...NO_EXTRAS, ...extras };
  const ana = CharacterId.of('ana');
  const list = lines.map(({ text = 'Olá.', scene, beats }, i) => Line.of(ana, { id: String(i + 1), chapter: Chapter.of(1), text, scene, beats }));
  return Project.of(
    { title: 'T', format, language: Language.PORTUGUESE, aspect: AspectRatio.of(aspect), ...(captionStyle ? { captionStyle } : {}), voice: { provider: 'qwen' } },
    { cast: Cast.of(withBody.map(member)), script: Script.of(chapters, Lines.of(list)), warnings },
  );
}

const title = (text: string): Scene => ({ type: 'title', overline: 'Aula 1', title: text, subtitle: 'Uma introdução' });
const projectWithTitle = (text: string, aspect: string) => project([{ scene: title(text) }], aspect);
const check = (p: Project, layouts = createLayoutRegistry(), captions: Readonly<Record<CaptionStyle, CaptionLayout>> = CAPTION_LAYOUTS) => new CheckProject({ layouts, captions }).run(p);

test('an 80-character title without spaces does not fit and is a check error', () => {
  const r = check(projectWithTitle('A'.repeat(80), '9:16'));
  assert.equal(r.errors.length, 1);
  assert.equal(r.errors[0].line, '1');
  assert.match(r.errors[0].message, /título não cabe/);
});
test('a normal title passes without problems in both aspect ratios', () => {
  for (const aspect of ['9:16', '16:9']) {
    assert.deepEqual(check(projectWithTitle('Arquitetura hexagonal na prática', aspect)), { errors: [], warnings: [] });
  }
});
test('three characters in a 9:16 scenario are a line error, not a crash', () => {
  const crowded: Scene = {
    type: 'scenario',
    background: { vector: 'village' },
    characters: ['ana', 'bia', 'caio'].map((character) => ({ character, position: 'center' as const })),
  };
  const r = check(project([{ scene: crowded }], '9:16'));
  assert.deepEqual(r.errors.map((e) => e.line), ['1']);
  assert.match(r.errors[0].message, /no máximo 2 personagens em 9:16/);
});
test('a word caption (story) with a word too long even at 60% is a line error', () => {
  for (const aspect of ['9:16', '16:9']) {
    const r = check(project([{ text: 'Oi pneumoultramicroscopicossilicovulcanoconiótico.' }], aspect, { format: 'story' }));
    assert.deepEqual(r.errors.map((e) => [e.line, e.message]), [['1', 'legenda não cabe na caixa nem com a letra a 60%']], aspect);
  }
});
test('a long lesson line is shown in blocks, so it fits', () => {
  assert.deepEqual(check(project([{ text: 'palavra '.repeat(80) }], '9:16')).errors, []);
});
test('the caption layout is picked by style: the declared one, or the default of the format', () => {
  const seen: string[] = [];
  const spy = (style: CaptionStyle): CaptionLayout => ({
    box: (text, aspect, format) => {
      seen.push(`${style} ${format}`);
      return Box.of('legenda', { x: 0, y: 0, width: aspect.width(), height: 10 });
    },
  });
  const captions = { words: spy('words'), blocks: spy('blocks') };
  const cases: Extras[] = [{ format: 'story' }, { format: 'lesson' }, { format: 'story', captionStyle: 'blocks' }, { format: 'lesson', captionStyle: 'words' }];
  const reports = cases.map((extras) => check(project([{ text: 'Olá.' }], '9:16', extras), createLayoutRegistry(), captions));
  assert.deepEqual(seen, ['words story', 'blocks lesson', 'blocks story', 'words lesson']);
  assert.ok(reports.every((r) => r.errors.some((e) => e.message === 'legenda sai da área segura')));
});
test('an explicit style changes what the check sees: a huge word is an error in words, not in blocks', () => {
  const huge = [{ text: 'Oi pneumoultramicroscopicossilicovulcanoconiótico.' }];
  assert.deepEqual(check(project(huge, '9:16', { format: 'story', captionStyle: 'blocks' })).errors, []);
  const words = check(project(huge, '16:9', { format: 'lesson', captionStyle: 'words' }));
  assert.deepEqual(words.errors.map((e) => e.message), ['legenda não cabe na caixa nem com a letra a 60%']);
});
test('an inherited scene does not repeat the error', () => {
  const r = check(project([{ scene: title('A'.repeat(80)) }, {}, { scene: { type: 'quote', text: 'x' } }], '9:16'));
  assert.deepEqual(r.errors.map((e) => e.line), ['1']);
});
test('overlap and leaving the safe area are errors with the labels', () => {
  const layouts = LayoutRegistry.empty();
  layouts.register('quote', () => Boxes.of([
    Box.of('aspas', { x: 0, y: 0, width: 200, height: 200 }),
    Box.of('autor', { x: 200, y: 1300, width: 600, height: 100 }),
  ]));
  const r = check(project([{ scene: { type: 'quote', text: 'x' } }], '9:16'), layouts);
  assert.deepEqual(r.errors.map((e) => e.message), ['autor sobrepõe legenda', 'aspas sai da área segura']);
});
test('project warnings (missing image) come in as warnings', () => {
  const r = check(project([{}], '9:16', { warnings: ['fundo.png não encontrada (fala 1)'] }));
  assert.deepEqual(r, { errors: [], warnings: [{ line: '', message: 'fundo.png não encontrada (fala 1)' }] });
});
test('20 lines of code in 9:16 go through the real code layout: they shrink and fit; 40 lines are a line error', () => {
  const code = (count: number): Scene => ({
    type: 'code',
    title: 'passos.ts',
    lines: Array.from({ length: count }, (_, i) => `  const valor${i} = calcular(entrada, ${i}); // passo ${i}`),
  });
  assert.deepEqual(check(project([{ scene: code(20) }], '9:16')).errors, []);
  const r = check(project([{ scene: code(40) }], '9:16'));
  assert.deepEqual(r.errors.map((e) => [e.line, e.message]), [['1', 'código não cabe na caixa nem com a letra a 60%']]);
});
test('every lesson scene type has a registered layout: none is skipped any more', () => {
  const r = check(project([{ scene: { type: 'quote', text: 'palavra '.repeat(120) } }], '9:16'));
  assert.deepEqual(r.errors.map((e) => e.message), ['citação não cabe na caixa nem com a letra a 60%']);
});
test('a different number of [spans] and beats is a readable line error, not a crash at build time', () => {
  const r = check(project([{ text: 'Um [dois] e [três].', beats: [{ pose: 'point' }], scene: title('Olá') }], '9:16'));
  assert.deepEqual(r.errors.map((e) => [e.line, e.message]), [['1', '2 [trechos] no texto, mas 1 marca(s)']]);
});
test('a lesson scene with more than 2 cast members with a body is an error of the line that opens it', () => {
  const r = check(project([{ text: 'Oi.' }, { scene: title('Olá') }, { scene: title('De novo') }], '16:9', { withBody: ['ana', 'bia', 'caio'], chapters: ['Abertura'] }));
  assert.deepEqual(r.errors.map((e) => e.line), ['2', '3']);
  assert.match(r.errors[0]!.message, /no máximo 2 apresentadores numa aula \(o elenco tem 3 com corpo: ana, bia, caio\)/);
});
test('the crowd limit is a lesson rule: a scenario scene has its own limit', () => {
  const scenario: Scene = { type: 'scenario', background: { vector: 'village' }, characters: [{ character: 'ana', position: 'center' }] };
  assert.deepEqual(check(project([{ scene: scenario }], '16:9', { withBody: ['ana', 'bia', 'caio'], format: 'story' })).errors, []);
});
test('in a 16:9 lesson the chapter in the frame is checked: a name too long is an error', () => {
  const r = check(project([{ scene: title('Olá') }], '16:9', { chapters: ['Capítulo muito comprido '.repeat(6)] }));
  assert.deepEqual(r.errors.map((e) => [e.line, e.message]), [['1', 'capítulo não cabe na caixa nem com a letra a 60%']]);
});
