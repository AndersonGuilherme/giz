import { test } from 'node:test';
import assert from 'node:assert/strict';
import { previewStateAt, speechFromText } from '../../../src/presentation/studio/previewState.ts';

test('while the speech lasts the mouth follows its visemes and openings; after it, closed', () => {
  const speech = { visemes: 'XAM', envelope: [0, 0.8, 0.4] };
  const base = { id: 'ana', pose: 'explain', expression: 'happy', speech } as const;
  const talking = previewStateAt(base, 1);
  assert.deepEqual([talking.isSpeaking(), talking.viseme(), talking.opening()], [true, 'A', 0.8]);
  const after = previewStateAt(base, 3);
  assert.deepEqual([after.isSpeaking(), after.viseme(), after.opening()], [false, 'X', 0]);
  assert.equal(talking.pose(), 'explain');
  assert.equal(talking.expression(), 'happy');
});

test('without speech: nobody speaks, the body breathes and the pose gesture plays once from frame 0', () => {
  const still = previewStateAt({ id: 'ana', pose: 'celebrate', expression: 'neutral' }, 6);
  assert.equal(still.isSpeaking(), false);
  assert.ok(still.bodyOffset().y < -5, 'the celebrate hop is under way');
  assert.equal(previewStateAt({ id: 'ana', pose: 'celebrate', expression: 'neutral' }, 60).bodyOffset().y > -3, true);
});

test('a made-up mouth from the text: two frames per letter, rest at spaces, accents dropped', () => {
  const speech = speechFromText('Oí, mãe');
  assert.equal(speech.visemes, 'OOIIXXXXMMAAEE');
  assert.equal(speech.envelope.length, speech.visemes.length);
  assert.equal(speech.envelope[4], 0);
  assert.ok(speech.envelope[0]! > speech.envelope[8]!);
});
