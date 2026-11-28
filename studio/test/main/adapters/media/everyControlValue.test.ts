import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GizMediaCore } from '../../../../src/main/adapters/media/GizMediaCore.ts';
import { numberStep, withParameter, withRig } from '../../../../src/renderer/cast/characterDraft.ts';
import type { CharacterFile, ParameterInfo, ParameterValue, RigInfo } from '../../../../src/shared/cast.ts';

// User bugs #1: every value a cast editor control can produce, on every parameter of every rig, passes core's check,
// also after a switch to every other rig (Lia's skin is a color, Giz's a named tone: a switch once kept "#ffffff").
const core = new GizMediaCore();

// What each control writes: an option grid or list its options; the color input a lowercase #rrggbb, and its
// "automática" box the default word or a grey; the slider min to max by its step; the switch true or false.
const fileOf = (rig: RigInfo): CharacterFile => ({ id: 'ana', name: 'Ana', rig: rig.id, parameters: {}, voice: { id: 'vivian' }, defaultExpression: 'happy' });

function sliderValues(info: ParameterInfo): readonly ParameterValue[] {
  const [min, max, step] = [info.min ?? 0, info.max ?? 1, numberStep(info)];
  return Array.from({ length: Math.round((max - min) / step) + 1 }, (_unused, index) => Number((min + index * step).toFixed(4)));
}
const CONTROLS: Readonly<Record<ParameterInfo['type'], (info: ParameterInfo) => readonly ParameterValue[]>> = {
  option: (info) => info.options ?? [],
  boolean: () => [true, false],
  color: (info) => ['#ffffff', '#000000', '#888888', '#1a2b3c', info.defaultValue],
  number: sliderValues,
};

// Every file the editor can make: one control value on a fresh character of a rig, then that file switched to each rig.
function editedFiles(rigs: readonly RigInfo[]): ReadonlyArray<Readonly<{ what: string; file: CharacterFile }>> {
  return rigs.flatMap((rig) => Object.entries(rig.parameters).flatMap(([name, info]) => CONTROLS[info.type](info).flatMap((value) => {
    const changed = withParameter(fileOf(rig), rig, { name, value });
    return [changed, ...rigs.map((other) => withRig(changed, other))].map((file) => ({ what: `${rig.id}.${name}=${JSON.stringify(value)} → ${file.rig}`, file }));
  })));
}


test('every control value of every rig parameter passes core\'s check, and so does every rig switch after it', async () => {
  const { rigs } = await core.catalog();
  const checked = await Promise.all(editedFiles(rigs).map(async ({ what, file }) => ({ what, problems: await core.checkCharacter(file) })));
  const refused = checked.filter(({ problems }) => problems.length > 0).map(({ what, problems }) => `${what}: ${problems.map(({ path, message }) => `${path} ${message}`).join('; ')}`);
  assert.ok(checked.length > 500, `every value walked (${checked.length})`);
  assert.deepEqual(refused, []);
});
