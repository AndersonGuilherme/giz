// User bugs #1 in the smoke test: a character file with a value its rig cannot draw (a Lia color as a Giz skin, what
// a rig switch used to keep) still shows the whole cast and the preview, with a note and a refusal in words; the rig
// switch keeps only values the other rig accepts; the preview draws the usual expression and tries others.
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import type { Page } from './devtools.ts';
import type { Context } from './scriptSteps.ts';

const biaOf = async (folder: string) => JSON.parse(await readFile(join(folder, 'cast', 'bia.json'), 'utf8'));
const textOf = (page: Page, selector: string) => page.evaluate(`document.querySelector(${JSON.stringify(selector)})?.innerText ?? ''`) as Promise<string>;
const PREVIEW = '[data-testid="live-preview"]';

async function until(check: () => Promise<boolean>, what: string, deadline = Date.now() + 60_000): Promise<void> {
  if (await check()) return;
  if (Date.now() > deadline) throw new Error(`timed out waiting for: ${what}`);
  await new Promise((done) => setTimeout(done, 200));
  return until(check, what, deadline);
}

async function choose(page: Page, selector: string, value: string): Promise<void> {
  await page.until(selector);
  await page.evaluate(`(() => {
    const select = document.querySelector(${JSON.stringify(selector)});
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(select, ${JSON.stringify(value)});
    select.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
}

// The Cast screen read again from disk (the Script tab and back).
async function reopenCast(page: Page): Promise<void> {
  await page.click('[data-testid="tab-script"]');
  await page.until('[data-testid="check-report"]');
  await page.click('[data-testid="tab-cast"]');
  await page.click('[data-testid="member-bia"]');
  await page.until(`${PREVIEW} .player-frame svg`);
}

async function wrongSkinShown({ page, shoot }: Context, folder: string): Promise<void> {
  const bia = await biaOf(folder);
  await writeFile(join(folder, 'cast', 'bia.json'), JSON.stringify({ ...bia, parameters: { ...bia.parameters, skin: '#ffffff', hair: 'long', hairColor: '#ffffff' } }, null, 2));
  await reopenCast(page);
  const faces = await page.evaluate(`[...document.querySelectorAll('.cast-face:not(.voice)')].map((face) => face.querySelector('svg') !== null)`);
  assert.ok((faces as boolean[]).every(Boolean), 'every face of the list is drawn');
  await page.untilText('[data-testid="preview-wrong"]', /Pele/);
  await page.untilText('[data-testid="character-save"]', /Pele: “#ffffff” não é uma das opções do modelo Giz/);
  assert.equal((await textOf(page, '[data-testid="character-save"]')).includes('parameters.'), false, 'no path of core in the refusal');
  await shoot(page, 'bugs1-03-erro-amigavel');
  await page.click('[data-testid="param-skin"] .option-current');
  await page.click('[data-testid="param-skin"] .option-choice[data-value="tan"]');
  await until(async () => (await biaOf(folder)).parameters.skin === 'tan', 'a tone picked from the grid is saved');
  await page.until('[data-testid="character-save"][data-state="saved"]');
  assert.equal(await page.evaluate(`document.querySelector('[data-testid="preview-wrong"]')`), null);
}

// Giz → Lia → Giz: each step is saved (no refusal), and Giz never gets a color as its skin.
async function rigSwitch(page: Page, folder: string): Promise<void> {
  for (const rig of ['lia-style', 'giz']) {
    await page.click(`[data-testid="character-rig"] [data-value="${rig}"]`);
    await until(async () => (await biaOf(folder)).rig === rig, `bia drawn with ${rig}`);
    await page.until('[data-testid="character-save"][data-state="saved"]');
  }
  const parameters = (await biaOf(folder)).parameters;
  assert.deepEqual([parameters.skin, parameters.hair, parameters.hairColor], [undefined, 'long', '#ffffff'], 'a tone is no Lia color (back to the default); the long white hair stays');
  await page.until(`${PREVIEW} .player-frame svg`);
}

async function expressions({ page, shoot }: Context, folder: string): Promise<void> {
  await choose(page, '[data-testid="character-expression"]', 'surprised');
  await page.until(`${PREVIEW}[data-expression="surprised"]`);
  await page.evaluate(`document.querySelector(${JSON.stringify(PREVIEW)}).scrollIntoView({ block: 'start' })`);
  await shoot(page, 'bugs1-01-previa-expressao-de-sempre');
  await page.click('[data-testid="preview-expressions"] [data-value="angry"]');
  await page.click('[data-testid="preview-poses"] [data-value="wave"]');
  await page.click('[data-testid="preview-say"]');
  await page.until(`${PREVIEW}[data-expression="angry"][data-pose="wave"]`);
  await until(async () => (await biaOf(folder)).defaultExpression === 'surprised', 'the usual expression is saved');
  assert.equal((await biaOf(folder)).defaultExpression, 'surprised', 'a tried expression is not saved');
  await page.evaluate(`document.querySelector(${JSON.stringify(PREVIEW)}).scrollIntoView({ block: 'start' })`);
  await shoot(page, 'bugs1-02-experimente-expressao');
  await choose(page, '[data-testid="character-expression"]', 'happy');
  await page.until(`${PREVIEW}[data-expression="happy"]`);
  await until(async () => (await biaOf(folder)).defaultExpression === 'happy', 'the new usual expression is saved');
}

/** The Cast stage of the story, after its S4 walk: Bia's file goes back as it was at the end. */
export async function castRepairs(context: Context, folder: string): Promise<void> {
  const before = await readFile(join(folder, 'cast', 'bia.json'), 'utf8');
  await wrongSkinShown(context, folder);
  await rigSwitch(context.page, folder);
  await expressions(context, folder);
  await context.page.click('[data-testid="tab-script"]');
  await context.page.until('[data-testid="check-report"]');
  await writeFile(join(folder, 'cast', 'bia.json'), before);
}
