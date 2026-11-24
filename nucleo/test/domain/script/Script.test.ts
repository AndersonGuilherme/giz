import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Cast } from '../../../src/domain/cast/Cast.ts';
import { Character } from '../../../src/domain/cast/Character.ts';
import { Chapter } from '../../../src/domain/script/Chapter.ts';
import { Line } from '../../../src/domain/script/Line.ts';
import { Lines } from '../../../src/domain/script/Lines.ts';
import { Script } from '../../../src/domain/script/Script.ts';
import { CharacterId } from '../../../src/domain/values/CharacterId.ts';

const ana = Character.of(CharacterId.of('ana'), {
  name: 'Ana', rig: 'test', parameters: { skin: '#f0c8a0' }, voice: { id: 'ana' }, defaultExpression: 'neutral',
});
const cast = Cast.of([ana]);
const line = (id: string, speaker: string, chapter = 1) =>
  Line.of(CharacterId.of(speaker), { id, chapter: Chapter.of(chapter), text: `fala ${id}` });

test('Cast finds the character by id', () => {
  assert.ok(cast.contains(CharacterId.of('ana')));
  assert.equal(cast.character(CharacterId.of('ana')), ana);
  assert.deepEqual(cast.each(), [ana]);
});
test('Cast rejects a missing character listing the ids', () => {
  assert.equal(cast.contains(CharacterId.of('bia')), false);
  assert.throws(() => cast.character(CharacterId.of('bia')), /"bia" não está no elenco \(ana\)/);
});
test('Character exposes its profile through methods', () => {
  assert.equal(ana.name(), 'Ana');
  assert.equal(ana.rig(), 'test');
  assert.deepEqual(ana.parameters(), { skin: '#f0c8a0' });
  assert.deepEqual(ana.voice(), { id: 'ana' });
  assert.equal(ana.defaultExpression(), 'neutral');
  assert.equal(ana.personality(), undefined);
  assert.ok(ana.hasBody());
});
test('a narrator without a rig is a voice without a body', () => {
  const narrator = Character.of(CharacterId.NARRATOR, { name: 'Narrador', parameters: {}, voice: { id: 'n' }, defaultExpression: 'neutral' });
  assert.equal(narrator.hasBody(), false);
  assert.equal(narrator.rig(), undefined);
});
test('only the narrator may have no rig', () => {
  assert.throws(() => Character.of(CharacterId.of('bia'), { name: 'Bia', parameters: {}, voice: { id: 'b' }, defaultExpression: 'neutral' }),
    /"bia" precisa de um rig/);
});
test('Line exposes its data through methods, with default pronunciation and beats', () => {
  const f = line('7', 'ana', 2);
  assert.equal(f.id(), '7');
  assert.equal(f.chapter().number(), 2);
  assert.equal(f.text(), 'fala 7');
  assert.equal(f.pronunciation(), 'fala 7');
  assert.deepEqual(f.beats(), []);
  assert.equal(f.scene(), undefined);
  assert.equal(f.pose(), undefined);
  assert.equal(f.expression(), undefined);
  assert.equal(f.look(), undefined);
  assert.equal(f.reaction(), undefined);
  assert.equal(f.holdAfter(), undefined);
  assert.equal(f.sfx(), undefined);
  assert.ok(f.speaker().equals(CharacterId.of('ana')));
});
test('Line uses the pronunciation when there is one', () => {
  const f = Line.of(CharacterId.of('ana'), { id: '1', chapter: Chapter.of(1), text: 'deploy', pronunciation: 'diplói' });
  assert.equal(f.pronunciation(), 'diplói');
});
test('Chapter rejects a number below 1 or not an integer', () => {
  assert.throws(() => Chapter.of(0), /capítulo 0 inválido/);
  assert.throws(() => Chapter.of(1.5), /capítulo 1.5 inválido/);
});
test('Lines counts and walks the lines', () => {
  const lines = Lines.of([line('1', 'ana'), line('2', 'ana')]);
  assert.equal(lines.count(), 2);
  assert.deepEqual(lines.each().map((f) => f.id()), ['1', '2']);
});
test('Lines rejects repeated ids', () => {
  assert.throws(() => Lines.of([line('1', 'ana'), line('1', 'ana')]), /id "1" repetido/);
});
test('Lines lists the ids outside the cast without repeating', () => {
  const lines = Lines.of([line('1', 'bia'), line('2', 'ana'), line('3', 'bia'), line('4', 'caio')]);
  assert.deepEqual(lines.unknownIds(cast), ['bia', 'caio']);
});
test('Script exposes chapters and lines', () => {
  const r = Script.of(['Abertura'], Lines.of([line('1', 'ana')]));
  assert.deepEqual(r.chapters(), ['Abertura']);
  assert.equal(r.lines().count(), 1);
});
test('Script rejects a script without chapters', () => {
  assert.throws(() => Script.of([], Lines.of([])), /capítulo/);
});
test('Script rejects a line in a missing chapter', () => {
  assert.throws(() => Script.of(['Abertura'], Lines.of([line('1', 'ana', 3)])), /fala 1: capítulo 3 não existe \(há 1\)/);
});
