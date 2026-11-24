import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BLOCK_CAPTIONS } from '../../../src/domain/caption/captionLayouts.ts';
import { Box } from '../../../src/domain/layout/Box.ts';
import { SafeArea } from '../../../src/domain/layout/SafeArea.ts';
import { LessonStage } from '../../../src/domain/lesson/LessonStage.ts';
import { HoldLabel } from '../../../src/domain/video/HoldLabel.ts';
import { AspectRatio } from '../../../src/domain/values/AspectRatio.ts';

const ASPECTS = [AspectRatio.of('16:9'), AspectRatio.of('9:16')];

test('the hold label takes the caption place: inside it, in the safe area, clear of the lesson content', () => {
  for (const aspect of ASPECTS) {
    const drawing = HoldLabel.for('Ache o bug', aspect, 'lesson');
    const place = Box.of('legenda', BLOCK_CAPTIONS.rectangle(aspect, 'lesson'));
    const pill = Box.of('pausa', drawing.pill);
    assert.ok(pill.isInside(place), aspect.text());
    assert.ok(pill.isInside(SafeArea.for(aspect)), aspect.text());
    assert.equal(pill.overlaps(Box.of('conteúdo', LessonStage.for(aspect).content())), false, aspect.text());
    assert.equal(drawing.box().textFits(), true, aspect.text());
  }
});
test('the badge and the label sit side by side inside the pill, both centered on its height', () => {
  const { pill, badge, label } = HoldLabel.for('Ache o bug', AspectRatio.of('16:9'), 'lesson');
  assert.ok(Box.of('selo', badge).isInside(Box.of('pausa', pill)));
  assert.ok(Box.of('rótulo', label.rectangle).isInside(Box.of('pausa', pill)));
  assert.ok(label.rectangle.x >= badge.x + badge.width);
  assert.equal(Math.round(badge.y + badge.height / 2), Math.round(pill.y + pill.height / 2));
  assert.deepEqual(label.fit.lines, ['Ache o bug']);
});
test('a label too long for the pill is a check box that does not fit', () => {
  const drawing = HoldLabel.for('palavra '.repeat(30), AspectRatio.of('16:9'), 'lesson');
  assert.equal(drawing.box().label, 'rótulo da pausa');
  assert.equal(drawing.box().textFits(), false);
});
test('the countdown runs only during the hold: whole seconds left, from the hold length down to 1', () => {
  const segment = { lineDuration: 30, holdAfter: { seconds: 3, label: 'Pense' } };
  assert.equal(HoldLabel.secondsLeft(segment, 29), undefined);
  assert.equal(HoldLabel.secondsLeft(segment, 30), 3);
  assert.equal(HoldLabel.secondsLeft(segment, 59), 3);
  assert.equal(HoldLabel.secondsLeft(segment, 60), 2);
  assert.equal(HoldLabel.secondsLeft(segment, 119), 1);
  assert.equal(HoldLabel.secondsLeft(segment, 120), undefined);
  assert.equal(HoldLabel.secondsLeft({ lineDuration: 30 }, 40), undefined);
});
test('a fractional hold counts down from its rounded-up seconds', () => {
  assert.equal(HoldLabel.secondsLeft({ lineDuration: 0, holdAfter: { seconds: 1.5, label: 'x' } }, 0), 2);
});
