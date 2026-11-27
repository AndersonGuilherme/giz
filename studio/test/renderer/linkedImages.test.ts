import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withImageOnDisk } from '../../src/renderer/editor/linkedImages.ts';
import type { ScriptJson } from '../../src/shared/script.ts';

const line = (id: string, background: object, text = 'Oi') => ({ id, chapter: 1, speaker: 'ana', text, scene: { type: 'scenario', background, characters: [] } });

test("the image a scenario job linked on disk enters the edited script, keeping the person's unsaved changes", () => {
  const edited: ScriptJson = { chapters: ['A'], lines: [line('1', { vector: 'room', generate: { prompt: 'sala' } }, 'Texto novo'), line('2', { vector: 'lab' })] };
  const disk: ScriptJson = { chapters: ['A'], lines: [line('1', { vector: 'room', generate: { prompt: 'sala' }, image: 'scenes/1.png' }), line('2', { vector: 'lab' })] };
  const merged = withImageOnDisk(edited, disk, '1');
  assert.deepEqual((merged.lines[0]!.scene as { background: object }).background, { vector: 'room', generate: { prompt: 'sala' }, image: 'scenes/1.png' });
  assert.equal(merged.lines[0]!.text, 'Texto novo');
  assert.equal(merged.lines[1], edited.lines[1]);
});

test('nothing changes when the line already shows that image, is gone, or is no longer a scenario', () => {
  const same: ScriptJson = { chapters: [], lines: [line('1', { image: 'scenes/1.png' })] };
  assert.equal(withImageOnDisk(same, same, '1'), same);
  const without: ScriptJson = { chapters: [], lines: [] };
  assert.equal(withImageOnDisk(without, same, '1'), without);
  const title: ScriptJson = { chapters: [], lines: [{ id: '1', chapter: 1, speaker: 'ana', text: 'x', scene: { type: 'title', title: 'T' } }] };
  assert.equal(withImageOnDisk(title, same, '1'), title);
});
