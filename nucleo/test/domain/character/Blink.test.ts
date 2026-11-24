import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Blink } from '../../../src/domain/character/Blink.ts';
import { Fps, Frame } from '../../../src/domain/values/Time.ts';

function closures(seed: string, total: number): number[] {
  const blink = Blink.for(seed);
  return Array.from({ length: total }, (_, number) => blink.closureAt(Frame.of(number), Fps.DEFAULT));
}

function closedSequences(values: number[]): number[][] {
  const sequences: number[][] = [];
  values.forEach((value, number) => {
    if (value <= 0) return;
    const continues = values[number - 1]! > 0;
    if (continues) sequences[sequences.length - 1]!.push(number);
    if (!continues) sequences.push([number]);
  });
  return sequences;
}

test('the blink is deterministic by seed', () => {
  assert.deepEqual(closures('lia', 900), closures('lia', 900));
  assert.notDeepEqual(closures('lia', 900), closures('leo', 900));
});
test('each blink closes for 4 consecutive frames above 0.5', () => {
  const sequences = closedSequences(closures('lia', 1800));
  assert.ok(sequences.length >= 8);
  sequences.forEach((frames) => assert.equal(frames.length, 4));
  const values = closures('lia', 1800);
  sequences.forEach((frames) => frames.forEach((q) => assert.ok(values[q]! > 0.5 && values[q]! <= 1)));
});
test('the interval between blinks stays between 2.5 and 5.5 s', () => {
  const starts = closedSequences(closures('lia', 3000)).map((frames) => frames[0]!);
  for (let number = 1; number < starts.length; number++) {
    const seconds = (starts[number]! - starts[number - 1]!) / 30;
    assert.ok(seconds >= 2.5 && seconds <= 5.5, `intervalo ${seconds}`);
  }
});
test('eyes open at the start', () => assert.equal(closures('lia', 60).filter((value) => value > 0).length, 0));
