import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseJson } from '../../src/shared/jsonText.ts';
import { ScriptSaver, type SaveAnswer } from '../../src/renderer/editor/scriptSaver.ts';
import type { EditorReport, ScriptJson } from '../../src/shared/script.ts';
import type { Result } from '../../src/shared/contract.ts';

test('valid JSON gives its value; broken JSON gives only where it broke (the words are the window\'s)', () => {
  assert.deepEqual(parseJson('{"a": 1}'), { value: { a: 1 } });
  assert.deepEqual(parseJson('{\n  "a": 1\n  "b": 2\n}'), { problem: { line: 3, column: 3 } });
  assert.deepEqual(parseJson('{\n  "a": ['), { problem: { line: 2, column: 9 } }, 'a text cut short breaks at its end');
});

const version = (text: string): ScriptJson => ({ chapters: ['x'], lines: [{ id: '01', chapter: 1, speaker: 'a', text }] });
const REPORT: EditorReport = { errors: [], warnings: [], stages: [] };

function saver(send: (script: ScriptJson) => Promise<Result<EditorReport>>) {
  const answers: SaveAnswer[] = [];
  const timers: Array<() => void> = [];
  const instance = new ScriptSaver({
    send, saved: version('aberto'), delay: 600, onAnswer: (answer) => answers.push(answer),
    timers: { set: (run) => timers.push(run) - 1, clear: (timer) => { if (typeof timer === 'number') timers[timer] = () => undefined; } },
  });
  return { instance, answers, fire: () => timers.at(-1)?.() };
}

test('the save waits for the typing to stop; only the last version is sent', async () => {
  const sent: string[] = [];
  const { instance, answers, fire } = saver(async (script) => (sent.push(script.lines[0]!.text), { ok: true, value: REPORT }));
  instance.change(version('a'));
  instance.change(version('ab'));
  fire();
  await instance.flush();
  assert.deepEqual(sent, ['ab']);
  assert.deepEqual(answers.map(({ status }) => status), ['pending', 'pending', 'saving', 'saved']);
});

test('saves are one after the other: a save waits for the one in flight, the newest lands last, only its answer shows', async () => {
  const disk: string[] = [];
  const releases: Array<() => void> = [];
  const slowFirst = (script: ScriptJson) => new Promise<Result<EditorReport>>((done) => {
    const text = script.lines[0]!.text;
    const write = () => (disk.push(text), done({ ok: true, value: { ...REPORT, warnings: [{ line: null, field: null, message: text }] } }));
    if (text === 'primeira') return void releases.push(write);
    write();
  });
  const { instance, answers } = saver(slowFirst);
  instance.change(version('primeira'));
  void instance.flush();
  instance.change(version('segunda'));
  const flushed = instance.flush();
  await new Promise((done) => setImmediate(done));
  assert.deepEqual(disk, [], 'the second save waits for the first');
  releases[0]!();
  await flushed;
  assert.deepEqual(disk, ['primeira', 'segunda']);
  const last = answers.at(-1)!;
  assert.equal(last.status, 'saved');
  assert.equal(last.result?.ok && last.result.value.warnings[0]!.message, 'segunda');
  assert.equal(answers.filter(({ result }) => result).length, 1, 'the older answer is not shown');
});

test('flush sends what is pending at once (leaving the editor); an empty flush sends nothing', async () => {
  const sent: string[] = [];
  const { instance } = saver(async (script) => (sent.push(script.lines[0]!.text), { ok: true, value: REPORT }));
  await instance.flush();
  instance.change(version('última'));
  assert.equal(instance.hasPending(), true);
  await instance.flush();
  assert.deepEqual(sent, ['última']);
  assert.equal(instance.hasPending(), false);
});
