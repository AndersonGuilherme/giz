import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Particles, PARTICLE_KINDS } from '../../../src/domain/scenario/Particles.ts';
import { Flicker } from '../../../src/domain/scenario/Flicker.ts';
import { Fps, Frame } from '../../../src/domain/values/Time.ts';

const fps = Fps.DEFAULT;

test('particles are deterministic per frame', () => {
  for (const kind of PARTICLE_KINDS) {
    const first = Particles.for(kind, { seed: 'praça', count: 30 }).at(Frame.of(45), fps);
    const second = Particles.for(kind, { seed: 'praça', count: 30 }).at(Frame.of(45), fps);
    assert.deepEqual(first, second);
    assert.equal(first.length, 30);
  }
});

test('the seed changes the particles, and so does the frame', () => {
  const field = Particles.for('snow', { seed: 'a', count: 10 });
  assert.notDeepEqual(field.at(Frame.of(10), fps), Particles.for('snow', { seed: 'b', count: 10 }).at(Frame.of(10), fps));
  assert.notDeepEqual(field.at(Frame.of(10), fps), field.at(Frame.of(11), fps));
});

function assertInField(kind: string, particle: { x: number; y: number; size: number; opacity: number }) {
  assert.ok(particle.x >= 0 && particle.x <= 1, `${kind} x ${particle.x}`);
  assert.ok(particle.y >= 0 && particle.y <= 1, `${kind} y ${particle.y}`);
  assert.ok(particle.opacity >= 0 && particle.opacity <= 1, `${kind} opacity ${particle.opacity}`);
  assert.ok(particle.size > 0, `${kind} size ${particle.size}`);
}

test('every particle stays inside its field, with a visible size and an opacity from 0 to 1', () => {
  const cases = PARTICLE_KINDS.flatMap((kind) => [0, 7, 45, 90, 600].map((frame) => [kind, frame] as const));
  cases.forEach(([kind, frame]) =>
    Particles.for(kind, { seed: kind, count: 40 }).at(Frame.of(frame), fps).forEach((particle) => assertInField(kind, particle)),
  );
});

test('embers rise and rain falls', () => {
  const embers = Particles.for('embers', { seed: 'fogo', count: 1 });
  const rain = Particles.for('rain', { seed: 'chuva', count: 1 });
  assert.ok(embers.at(Frame.of(2), fps)[0]!.y < embers.at(Frame.of(1), fps)[0]!.y);
  assert.ok(rain.at(Frame.of(2), fps)[0]!.y > rain.at(Frame.of(1), fps)[0]!.y);
});

test('an unknown particle kind is a readable error', () => {
  assert.throws(() => Particles.for('fumaça' as never, { seed: 'a', count: 1 }), /partícula "fumaça" desconhecida/);
});

test('the flicker is deterministic, stays between 0.6 and 1 and changes over time', () => {
  const flicker = Flicker.for('fogo');
  const values = Array.from({ length: 120 }, (_, number) => flicker.at(Frame.of(number)));
  assert.deepEqual(values, Array.from({ length: 120 }, (_, number) => Flicker.for('fogo').at(Frame.of(number))));
  assert.ok(values.every((value) => value >= 0.6 && value <= 1));
  assert.ok(new Set(values).size > 60);
});

test('an area maps the field onto pixels: the same particles, stretched and moved', () => {
  const field = Particles.for('dust', { seed: 'luz', count: 5 });
  const area = { x: 100, y: 200, width: 300, height: 400 };
  const inField = field.at(Frame.of(12), fps);
  const inArea = field.at(Frame.of(12), fps, area);
  inField.forEach((particle, i) => {
    assert.ok(Math.abs(inArea[i]!.x - (100 + particle.x * 300)) < 1e-9);
    assert.ok(Math.abs(inArea[i]!.y - (200 + particle.y * 400)) < 1e-9);
    assert.equal(inArea[i]!.opacity, particle.opacity);
  });
});
