import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Audio } from '../../../src/domain/speech/Audio.ts';
import { Envelope } from '../../../src/domain/speech/Envelope.ts';
import { Fps } from '../../../src/domain/values/Time.ts';
import { EnvelopeAligner } from '../../../src/infrastructure/alignment/EnvelopeAligner.ts';

const RATE = 24000;
const segment = (seconds: number, amplitude: number) =>
  Array.from({ length: Math.round(seconds * RATE) }, (_, i) => amplitude * Math.sin((2 * Math.PI * 220 * i) / RATE));
const audio = (...parts: number[][]) => Audio.of(Float32Array.from(parts.flat()), RATE);

test('by envelope: words in order and within the duration', async () => {
  const sound = audio(segment(0.3, 0), segment(1.2, 0.5), segment(0.3, 0));
  const words = await new EnvelopeAligner().align(sound, 'Olá, eu sou a Ana!');
  const json = words.toJson();
  assert.deepEqual(json.map((p) => p.text), ['Olá,', 'eu', 'sou', 'a', 'Ana!']);
  json.forEach((p, i) => {
    assert.ok(p.end >= p.start);
    assert.ok(p.start >= (json[i - 1]?.end ?? 0));
    assert.ok(p.end <= sound.duration().value());
  });
});

test('by envelope: the words stay on the voiced frames', async () => {
  const sound = audio(segment(0.5, 0), segment(1, 0.5), segment(0.5, 0));
  const json = (await new EnvelopeAligner().align(sound, 'um dois três')).toJson();
  const voiced = Envelope.measure(sound, Fps.DEFAULT).voicedFrames();
  const first = voiced.indexOf(true) / 30;
  const last = (voiced.lastIndexOf(true) + 1) / 30;
  assert.ok(json[0]!.start >= first - 1e-9, `começa em ${json[0]!.start}, voz em ${first}`);
  assert.ok(json.at(-1)!.end <= last + 1e-9, `termina em ${json.at(-1)!.end}, voz até ${last}`);
});

test('by envelope: a longer word takes more time', async () => {
  const sound = audio(segment(2, 0.5));
  const [short, long] = (await new EnvelopeAligner().align(sound, 'a paralelepípedo')).toJson();
  assert.ok(long!.end - long!.start > 5 * (short!.end - short!.start));
});

test('by envelope: audio without voice spreads over the whole duration', async () => {
  const sound = audio(segment(1, 0));
  const json = (await new EnvelopeAligner().align(sound, 'um dois')).toJson();
  assert.equal(json[0]!.start, 0);
  assert.ok(json[1]!.start > 0 && json[1]!.end <= 1);
});
