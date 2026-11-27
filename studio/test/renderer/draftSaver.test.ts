import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DraftSaver, type DraftAnswer } from '../../src/renderer/editor/draftSaver.ts';
import type { CharacterFile, CharacterSaved } from '../../src/shared/cast.ts';
import type { Result } from '../../src/shared/contract.ts';

const ANA: CharacterFile = { id: 'ana', name: 'Ana', rig: 'giz', parameters: {}, voice: { id: 'vivian' }, defaultExpression: 'neutral' };
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
