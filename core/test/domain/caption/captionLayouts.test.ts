import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BLOCK_CAPTIONS, CAPTION_LAYOUTS, WORD_CAPTIONS } from '../../../src/domain/caption/captionLayouts.ts';
import { BlockCaption } from '../../../src/domain/caption/BlockCaption.ts';
import { captionWords } from '../../../src/domain/caption/captionWords.ts';
import { SafeArea } from '../../../src/domain/layout/SafeArea.ts';
import { scenarioBoxes } from '../../../src/domain/layout/scenarioLayout.ts';
import { LessonStage } from '../../../src/domain/lesson/LessonStage.ts';
import { Box } from '../../../src/domain/layout/Box.ts';
import { CAPTION_STYLES, FORMATS } from '../../../src/domain/project/Project.ts';
import type { ScenarioScene } from '../../../src/domain/script/Scene.ts';
import { Words } from '../../../src/domain/speech/Words.ts';
import { AspectRatio } from '../../../src/domain/values/AspectRatio.ts';

const ASPECTS = [AspectRatio.VERTICAL, AspectRatio.HORIZONTAL];
const HUGE = 'Oi pneumoultramicroscopicossilicovulcanoconiótico';
const PLACES = ASPECTS.flatMap((aspect) => FORMATS.map((format) => ({ aspect, format, name: `${aspect.text()} ${format}` })));

test('every caption style has a layout', () => {
  assert.deepEqual(Object.keys(CAPTION_LAYOUTS).sort(), [...CAPTION_STYLES].sort());
  assert.equal(CAPTION_LAYOUTS.words, WORD_CAPTIONS);
  assert.equal(CAPTION_LAYOUTS.blocks, BLOCK_CAPTIONS);
});

test('every style, in every format and aspect, stays inside the safe area', () => {
  for (const { aspect, format, name } of PLACES) {
    const boxes = Object.values(CAPTION_LAYOUTS).map((layout) => layout.box('Você acordou', aspect, format));
    assert.ok(boxes.every((box) => box.label === 'legenda' && box.isInside(SafeArea.for(aspect))), name);
  }
});

test('in a story the word caption is centered in the lower third', () => {
  for (const aspect of ASPECTS) {
    const box = WORD_CAPTIONS.box('Você acordou', aspect, 'story');
    assert.equal(box.x + box.width / 2, aspect.width() / 2, aspect.text());
    assert.ok(box.y >= aspect.height() * (2 / 3), aspect.text());
  }
});

test('in a lesson both styles sit under the content', () => {
  for (const aspect of ASPECTS) {
    const content = Box.of('conteúdo', LessonStage.for(aspect).content());
    const boxes = Object.values(CAPTION_LAYOUTS).map((layout) => layout.box('Uma fala.', aspect, 'lesson'));
    assert.ok(boxes.every((box) => !box.overlaps(content)), aspect.text());
  }
});

test('the word caption box reports a word that does not fit even at 60%', () => {
  for (const { aspect, format, name } of PLACES) {
    assert.equal(WORD_CAPTIONS.box('Você acordou sem internet hoje', aspect, format).textFits(), true, name);
    assert.equal(WORD_CAPTIONS.box(HUGE, aspect, format).textFits(), false, name);
  }
});

test('the renderer groups with the same width the check uses', () => {
  const text = 'Você acordou sem internet hoje';
  for (const { aspect, format, name } of PLACES) {
    assert.equal(WORD_CAPTIONS.caption(Words.fromText(text), aspect, format).fits(), WORD_CAPTIONS.box(text, aspect, format).textFits(), name);
  }
});

test('the lesson block caption sits under the content column: 16:9 x 600–1824 at the base of the safe area', () => {
  const box = BLOCK_CAPTIONS.box('Uma fala.', AspectRatio.HORIZONTAL, 'lesson');
  assert.deepEqual([box.x, box.x + box.width, box.y + box.height], [600, 1824, 1026]);
});

test('a long line is split into blocks, and each block fits the box with its padding', () => {
  const long = 'Uma fala de aula bem longa, com várias ideias seguidas. '.repeat(6);
  const blocks = BlockCaption.blocksOf(long, BLOCK_CAPTIONS.maximumCharacters);
  assert.ok(blocks.length > 3);
  for (const { aspect, format, name } of PLACES) {
    assert.equal(BLOCK_CAPTIONS.box(long, aspect, format).textFits(), true, name);
    const pills = blocks.map((block) => BLOCK_CAPTIONS.pill(block.text, aspect, format));
    assert.ok(pills.every((pill) => pill.fit.fits && pill.height <= BLOCK_CAPTIONS.rectangle(aspect, format).height), name);
  }
});

test('the check splits the blocks from the words the renderer draws (no [span] brackets, single spaces)', () => {
  const second = 'Depois vem outra frase que fecha a ideia bem facilmente aqui.'.replaceAll(' ', '        ');
  const raw = `Isto é [muito importante], e precisa caber.   ${second}`;
  const segmentWords = Words.fromText(raw).texts().map((text, index) => ({ text, start: index * 6, end: index * 6 + 5 }));
  const drawn = BLOCK_CAPTIONS.caption(captionWords(segmentWords, 200)).cues().map((cue) => cue.text);
  assert.deepEqual(BLOCK_CAPTIONS.blocks(raw), drawn);
  assert.deepEqual(drawn, ['Isto é muito importante, e precisa caber.', 'Depois vem outra frase que fecha a ideia bem facilmente aqui.']);
  assert.equal(BlockCaption.blocksOf(raw, BLOCK_CAPTIONS.maximumCharacters).length, 3, 'the raw text would split differently');
});

test('in a story scenario the word caption overlaps neither the HUD nor the big text', () => {
  const scene: ScenarioScene = {
    type: 'scenario',
    background: { vector: 'village' },
    characters: [{ character: 'ana', position: 'left' }],
    hud: { fields: [{ label: 'DIA', value: '3' }], bar: { label: 'PACIÊNCIA ATÉ A NOITE', value: 65 } },
    highlight: { text: 'O WI-FI CAIU NA PRAÇA INTEIRA' },
  };
  for (const aspect of ASPECTS) {
    const boxes = Object.values(CAPTION_LAYOUTS).map((layout) => layout.box('Você acordou', aspect, 'story'));
    assert.ok(boxes.every((caption) => scenarioBoxes(scene, aspect).with(caption).overlappingPairs().length === 0), aspect.text());
  }
});
