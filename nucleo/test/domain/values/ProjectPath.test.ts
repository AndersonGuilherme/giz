import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ProjectPath } from '../../../src/domain/values/ProjectPath.ts';

test('a path inside the project folder is accepted as written', () => {
  assert.equal(ProjectPath.of('scenarios/room.png').text(), 'scenarios/room.png');
  assert.equal(ProjectPath.of('room.png').text(), 'room.png');
  assert.equal(ProjectPath.of('scenarios/old/../room.png').text(), 'scenarios/old/../room.png');
});
test('an absolute path is refused, Unix or Windows', () => {
  assert.throws(() => ProjectPath.of('/home/ana/room.png'), /caminho absoluto "\/home\/ana\/room\.png".*relativo à pasta do projeto/);
  assert.throws(() => ProjectPath.of('C:\\fotos\\room.png'), /caminho absoluto/);
  assert.throws(() => ProjectPath.of('\\\\server\\room.png'), /caminho absoluto/);
});
test('a path resolving outside the project folder is refused', () => {
  assert.throws(() => ProjectPath.of('../other/room.png'), /"\.\.\/other\/room\.png" sai da pasta do projeto/);
  assert.throws(() => ProjectPath.of('scenarios/../../room.png'), /sai da pasta do projeto/);
  assert.throws(() => ProjectPath.of('scenarios\\..\\..\\room.png'), /sai da pasta do projeto/);
});
test('a "./" segment is refused with the path to write instead (the render cannot serve it)', () => {
  assert.throws(() => ProjectPath.of('./scenarios/room.png'), /escreva "scenarios\/room\.png", sem "\.\/"/);
});
