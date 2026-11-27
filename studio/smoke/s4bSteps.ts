// The S4b steps: taking a character out of the cast, the framing crop of an uploaded picture, and the window answering
// while the voice worker makes every line.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import type { Page } from './devtools.ts';
import type { Context } from './scriptSteps.ts';

const jsonOf = async (folder: string, file: string) => JSON.parse(await readFile(join(folder, file), 'utf8'));

async function until(check: () => Promise<boolean>, what: string, deadline = Date.now() + 60_000): Promise<void> {
  if (await check()) return;
  if (Date.now() > deadline) throw new Error(`timed out waiting for: ${what}`);
  await new Promise((done) => setTimeout(done, 200));
  return until(check, what, deadline);
}

/** Bia still says lines: the dialog says why she cannot go; Prof. Rui, who says none, leaves the cast (his file stays). */
export async function removeMember({ page, shoot }: Context, folder: string): Promise<void> {
  await page.click('[data-testid="tab-cast"]');
  await page.until('[data-testid="member-bia"]');
  await page.click('[data-testid="member-bia"]');
  await page.click('[data-testid="member-remove"]');
  await page.until('[data-testid="remove-still-speaks"]');
  await shoot(page, 's4b-01-tirar-do-elenco');
  await page.click('[data-testid="confirm-yes"]');
  await page.untilText('[data-testid="cast-screen"] .failure', /ainda diz/);
  assert.ok((await jsonOf(folder, 'project.json')).cast.includes('bia'), 'one who still speaks stays in the cast');
  await page.click('[data-testid="member-prof-rui"]');
  await page.click('[data-testid="member-remove"]');
  await page.click('[data-testid="confirm-yes"]');
  await until(async () => !(await jsonOf(folder, 'project.json')).cast.includes('prof-rui'), 'Prof. Rui out of the cast');
  await page.until('[data-testid="cast-list"]:not(:has([data-testid="member-prof-rui"]))');
  await readFile(join(folder, 'cast', 'prof-rui.json'));
}

// A mouse drag over the crop stage (Chromium turns it into pointer events).
async function drag(page: Page, from: Readonly<{ x: number; y: number }>, by: Readonly<{ x: number; y: number }>): Promise<void> {
  const mouse = (type: string, x: number, y: number) => page.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1 });
  await mouse('mousePressed', from.x, from.y);
  for (const step of [0.25, 0.5, 0.75, 1]) await mouse('mouseMoved', from.x + by.x * step, from.y + by.y * step);
  await mouse('mouseReleased', from.x + by.x, from.y + by.y);
}

const centerOf = async (page: Page, selector: string) => (await page.evaluate(`(() => { const box = document.querySelector('${selector}').getBoundingClientRect(); return { x: box.x + box.width / 2, y: box.y + box.height / 2 }; })()`)) as { x: number; y: number };

// A square picture with something to see (the app icon), uploaded over scene 1's one-color square.
const ICON = fileURLToPath(new URL('../assets/icon/icon-1024.png', import.meta.url));

async function upload(page: Page, selector: string, path: string): Promise<void> {
  const { root } = (await page.send('DOM.getDocument')) as { root: { nodeId: number } };
  const { nodeId } = (await page.send('DOM.querySelector', { nodeId: root.nodeId, selector })) as { nodeId: number };
  await page.send('DOM.setFileInputFiles', { nodeId, files: [path] });
}

/** A square picture of scene 1: zoomed and dragged under the 9:16 frame; the crop is data in the script, the file untouched. */
export async function cropPicture({ page, shoot }: Context, folder: string): Promise<void> {
  await upload(page, '[data-testid="scene-file-1"]', ICON);
  await page.untilText('[data-testid="scene-warning-1"]', /1024×1024/);
  const before = await readFile(join(folder, 'scenes', 'own', '1.png'));
  await page.click('[data-testid="scene-crop-1"]');
  await page.until('[data-testid="crop-stage"] img');
  await page.evaluate(`(() => { const input = document.querySelector('[data-testid="crop-zoom"]'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, '1.6'); input.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  await drag(page, await centerOf(page, '[data-testid="crop-stage"]'), { x: 60, y: -40 });
  await shoot(page, 's4b-02-recorte');
  await page.click('[data-testid="crop-save"]');
  await page.until('[data-testid="scene-cropped-1"]');
  const crop = (await jsonOf(folder, 'script.json')).lines[0].scene.background.crop;
  assert.equal(crop.zoom, 1.6);
  assert.ok(crop.x < 0.5 && crop.y > 0.5, `dragged right and up: more of the left and bottom (${JSON.stringify(crop)})`);
  assert.deepEqual(await readFile(join(folder, 'scenes', 'own', '1.png')), before, 'the picture file is never changed');
  await shoot(page, 's4b-03-recortada');
}

/** While the voice worker makes every line, the window answers its main process at once (a round trip, measured). */
export async function answersDuringJob({ page, shoot }: Context): Promise<void> {
  const round = await page.evaluate(`(async () => { const times = []; for (let i = 0; i < 10; i++) { const start = performance.now(); await window.giz.cast.catalog(); times.push(performance.now() - start); } return Math.max(...times); })()`);
  console.log(`smoke: during the voice job, the slowest of 10 round trips to main took ${Number(round).toFixed(1)} ms`);
  assert.ok(Number(round) < 500, 'the main process answers while voices are made');
  await shoot(page, 's4b-04-vozes-durante-o-trabalho');
}
