import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DraftSaver, type DraftAnswer } from '../../src/renderer/editor/draftSaver.ts';
import type { CharacterFile, CharacterSaved } from '../../src/shared/cast.ts';
import type { Result } from '../../src/shared/contract.ts';

const ANA: CharacterFile = { id: 'ana', name: 'Ana', rig: 'gizzy', parameters: {}, voice: { id: 'vivian' }, defaultExpression: 'neutral' };
const SAVED = (file: CharacterFile): Result<CharacterSaved> => ({ ok: true, value: { saved: true, problems: [], document: { file } as never } });

function saver(send: (file: CharacterFile) => Promise<Result<CharacterSaved>>) {
  const answers: Array<DraftAnswer<CharacterSaved>> = [];
  const timers: Array<() => void> = [];
  const instance = new DraftSaver<CharacterFile, CharacterSaved>({
    send, saved: ANA, delay: 500, onAnswer: (answer) => answers.push(answer),
    timers: { set: (run) => timers.push(run) - 1, clear: (timer) => { if (typeof timer === 'number') timers[timer] = () => undefined; } },
  });
  return { instance, answers };
}

test('a character change still waiting for its delay is sent when the editor goes away (flush), never lost', async () => {
  const sent: string[] = [];
  const { instance, answers } = saver(async (file) => (sent.push(file.name), SAVED(file)));
  instance.change({ ...ANA, name: 'Ana Maria' });
  assert.equal(instance.hasPending(), true);
  await instance.flush();
  assert.deepEqual(sent, ['Ana Maria']);
  assert.deepEqual(answers.map(({ status }) => status), ['pending', 'saving', 'saved']);
});

test('the file as it opened is not saved again, and a flush with nothing pending sends nothing', async () => {
  const sent: string[] = [];
  const { instance } = saver(async (file) => (sent.push(file.name), SAVED(file)));
  instance.change(ANA);
  await instance.flush();
  assert.deepEqual(sent, []);
});

test('a change taken back before its delay (back to what is on disk) sends nothing and says saved, never "pending" forever', async () => {
  const sent: string[] = [];
  const { instance, answers } = saver(async (file) => (sent.push(file.name), SAVED(file)));
  instance.change({ ...ANA, name: 'Ana Maria' });
  instance.change(ANA);
  assert.equal(instance.hasPending(), false);
  await instance.flush();
  assert.deepEqual(sent, []);
  assert.deepEqual(answers.map(({ status }) => status), ['pending', 'saved']);
});

const FAILED: Result<CharacterSaved> = { ok: false, failure: { code: 'failed', message: 'Não deu para salvar', details: [] } };

test('taken back after a failure: the version that failed is sent again, never shown as saved', async () => {
  const sent: string[] = [];
  let fail = true;
  const { instance, answers } = saver(async (file) => (sent.push(file.name), fail ? FAILED : SAVED(file)));
  const maria = { ...ANA, name: 'Ana Maria' };
  instance.change(maria);
  await instance.flush();
  assert.equal(answers.at(-1)?.status, 'failed');
  fail = false;
  instance.change({ ...maria, name: 'Ana Maria!' });
  instance.change(maria);
  assert.equal(instance.hasPending(), true, 'what failed is still to be saved');
  assert.notEqual(answers.at(-1)?.status, 'saved');
  await instance.flush();
  assert.deepEqual(sent, ['Ana Maria', 'Ana Maria']);
  assert.equal(answers.at(-1)?.status, 'saved');
});

test('taken back to what is on disk after a failure: no "saved" without the result, the failure stays shown', async () => {
  const { instance, answers } = saver(async () => FAILED);
  instance.change({ ...ANA, name: 'Ana Maria' });
  await instance.flush();
  instance.change({ ...ANA, name: 'Bia' });
  instance.change(ANA);
  assert.equal(instance.hasPending(), false, 'ANA is what the disk has');
  assert.deepEqual(answers.at(-1), { status: 'failed', result: FAILED });
});

test('taken back after a save core refused (problems): the answer carries that result again', async () => {
  const problems = [{ path: 'parameters.skin', message: 'cor inválida' }];
  const refused: Result<CharacterSaved> = { ok: true, value: { saved: false, problems, document: {} as never } };
  const { instance, answers } = saver(async () => refused);
  const roxo = { ...ANA, name: 'Ana Roxa' };
  instance.change(roxo);
  await instance.flush();
  instance.change({ ...roxo, name: 'Ana Roxa!' });
  instance.change(roxo);
  assert.deepEqual(answers.at(-1), { status: 'saved', result: refused });
});
