import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BLOCK_CAPTIONS, CAPTION_LAYOUTS, WORD_CAPTIONS } from '../../../src/domain/caption/captionLayouts.ts';
import { BlockCaption } from '../../../src/domain/caption/BlockCaption.ts';
import { SafeArea } from '../../../src/domain/layout/SafeArea.ts';
import { scenarioBoxes } from '../../../src/domain/layout/scenarioLayout.ts';
import type { ScenarioScene } from '../../../src/domain/script/Scene.ts';
import { FORMATS } from '../../../src/domain/project/Project.ts';
import { Words } from '../../../src/domain/speech/Words.ts';
import { AspectRatio } from '../../../src/domain/values/AspectRatio.ts';

const ASPECTS = [AspectRatio.VERTICAL, AspectRatio.HORIZONTAL];
const HUGE = 'Oi pneumoultramicroscopicossilicovulcanoconiótico';

test('every format has a caption layout: words in a story, blocks in a lesson', () => {
  assert.deepEqual(Object.keys(CAPTION_LAYOUTS).sort(), [...FORMATS].sort());
  assert.equal(CAPTION_LAYOUTS.story, WORD_CAPTIONS);
  assert.equal(CAPTION_LAYOUTS.lesson, BLOCK_CAPTIONS);
});

test('the word caption is centered in the lower third, inside the safe area', () => {
  for (const aspect of ASPECTS) {
    const box = WORD_CAPTIONS.box('Você nasceu', aspect);
    assert.equal(box.label, 'legenda');
    assert.ok(box.isInside(SafeArea.for(aspect)), aspect.text());
    assert.equal(box.x + box.width / 2, aspect.width() / 2, aspect.text());
    assert.ok(box.y >= aspect.height() * (2 / 3), aspect.text());
  }
});

test('the word caption box reports a word that does not fit even at 60%', () => {
  for (const aspect of ASPECTS) {
    assert.equal(WORD_CAPTIONS.box('Você nasceu em mil trezentos', aspect).textFits(), true, aspect.text());
    assert.equal(WORD_CAPTIONS.box(HUGE, aspect).textFits(), false, aspect.text());
  }
});

test('the renderer groups with the same width the check uses', () => {
  const words = Words.fromText('Você nasceu em mil trezentos');
  for (const aspect of ASPECTS) {
    const caption = WORD_CAPTIONS.caption(words, aspect);
    assert.equal(caption.fits(), WORD_CAPTIONS.box('Você nasceu em mil trezentos', aspect).textFits());
  }
});

test('the block caption sits under the lesson content: 16:9 x 600–1824 at the base of the safe area', () => {
  const box = BLOCK_CAPTIONS.box('Uma fala.', AspectRatio.HORIZONTAL);
  assert.deepEqual([box.x, box.x + box.width, box.y + box.height], [600, 1824, 1026]);
  for (const aspect of ASPECTS) assert.ok(BLOCK_CAPTIONS.box('Uma fala.', aspect).isInside(SafeArea.for(aspect)), aspect.text());
});

test('a long lesson line is split into blocks, and each block fits the box with its padding', () => {
  const long = 'Uma fala de aula bem longa, com várias ideias seguidas. '.repeat(6);
  const blocks = BlockCaption.blocksOf(long, BLOCK_CAPTIONS.maximumCharacters);
  assert.ok(blocks.length > 3);
  for (const aspect of ASPECTS) {
    assert.equal(BLOCK_CAPTIONS.box(long, aspect).textFits(), true, aspect.text());
    const pills = blocks.map((block) => BLOCK_CAPTIONS.pill(block.text, aspect));
    assert.ok(pills.every((pill) => pill.fit.fits && pill.height <= BLOCK_CAPTIONS.rectangle(aspect).height), aspect.text());
  }
});

test('in a story scenario the word caption overlaps neither the HUD nor the big text', () => {
  const scene: ScenarioScene = {
    type: 'scenario',
    background: { vector: 'village' },
    characters: [{ character: 'ana', position: 'left' }],
    hud: { fields: [{ label: 'ANO', value: '1347' }], bar: { label: 'CHANCE DE CHEGAR AOS 20', value: 65 } },
    highlight: { text: 'A PESTE CHEGOU À ALDEIA' },
  };
  for (const aspect of ASPECTS) {
    const boxes = scenarioBoxes(scene, aspect).with(WORD_CAPTIONS.box('Você nasceu', aspect));
    assert.deepEqual(boxes.overlappingPairs(), [], aspect.text());
  }
});
