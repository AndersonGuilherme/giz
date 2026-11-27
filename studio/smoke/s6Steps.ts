// The S6 part of the smoke test: the Script tab's first-run tour (shown once, skipped, not shown again, shown again by
// "Ver tutorial", gone through to the end), and the folded lines (a new line opens alone with the caret in its text,
// "expand all" / "collapse all", a jump opens its line, the open line survives a visit to another tab).
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import type { Page } from './devtools.ts';
import type { Context } from './scriptSteps.ts';

const pause = (milliseconds: number) => new Promise((done) => setTimeout(done, milliseconds));
const toursSeen = async (home: string) => JSON.parse(await readFile(join(home, 'userData', 'studio.json'), 'utf8')).toursSeen as string[];
const attribute = (page: Page, selector: string, name: string) => page.evaluate(`document.querySelector(${JSON.stringify(selector)})?.getAttribute(${JSON.stringify(name)}) ?? null`);
const openStates = (page: Page) => page.evaluate(`[...document.querySelectorAll('[data-testid^="line-toggle-"]')].map((toggle) => toggle.getAttribute('aria-expanded') === 'true')`) as Promise<boolean[]>;
const until = async (check: () => Promise<boolean>, what: string, deadline = Date.now() + 60_000): Promise<void> => {
  if (await check()) return;
  if (Date.now() > deadline) throw new Error(`timed out waiting for: ${what}`);
  await pause(200);
  return until(check, what, deadline);
};

async function pressTab(page: Page, shift = false): Promise<void> {
  const key = { key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, modifiers: shift ? 8 : 0 };
  await page.send('Input.dispatchKeyEvent', { type: 'keyDown', ...key });
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', ...key });
}

const focusInCard = (page: Page) => page.evaluate(`document.querySelector('[data-testid="tour"]')?.contains(document.activeElement) ?? false`);

/** The tour is modal: the page under it is inert, and Tab (and Shift+Tab) go round the card's buttons, never out. */
async function staysModal(page: Page): Promise<void> {
  assert.equal(await page.evaluate(`document.getElementById('root').hasAttribute('inert')`), true, 'the page under the tour is inert');
  for (let press = 0; press < 5; press++) {
    await pressTab(page);
    assert.equal(await focusInCard(page), true, `Tab ${press + 1} stays in the card`);
  }
  for (let press = 0; press < 5; press++) {
    await pressTab(page, true);
    assert.equal(await focusInCard(page), true, `Shift+Tab ${press + 1} stays in the card`);
  }
}

async function tourStep(page: Page, id: string, centred: boolean): Promise<void> {
  await page.until(`[data-testid="tour"][data-step="${id}"]`);
  assert.equal(await attribute(page, '[data-testid="tour"]', 'data-centred'), String(centred), `step ${id} centred: ${centred}`);
}

/** The first time the Script tab opens, the tour starts by itself; "Pular" hides it and the app settings remember it. */
export async function firstTour({ page, shoot, home }: Context): Promise<void> {
  await tourStep(page, 'intro', true);
  await page.untilText('[data-testid="tour-count"]', /^1\/9$/);
  await staysModal(page);
  await shoot(page, 's6-03-tour-1-roteiro');
  await page.click('[data-testid="tour-next"]');
  await tourStep(page, 'add', false);
  await shoot(page, 's6-04-tour-2-nova-fala');
  await page.click('[data-testid="tour-next"]');
  await page.click('[data-testid="tour-next"]');
  await tourStep(page, 'text', false);
  await shoot(page, 's6-05-tour-4-texto');
  await page.click('[data-testid="tour-skip"]');
  await until(async () => (await page.evaluate(`document.querySelector('[data-testid="tour"]') === null`)) === true, 'the tour to close');
  await until(async () => (await toursSeen(home)).includes('script'), 'the tour remembered in studio.json');
  assert.equal(await page.evaluate(`document.getElementById('root').hasAttribute('inert')`), false, 'the page is usable again');
}

/** Another tab and back: no tour. "Ver tutorial" starts it again, and "Próximo" to the end finishes it. */
export async function tourAgain({ page, shoot }: Context): Promise<void> {
  await page.click('[data-testid="tab-cast"]');
  await page.click('[data-testid="tab-script"]');
  await page.until('[data-testid="check-report"]');
  await pause(800);
  assert.equal(await page.evaluate(`document.querySelector('[data-testid="tour"]')`), null, 'a tour seen does not start again');
  await page.click('[data-testid="tour-show"]');
  await tourStep(page, 'intro', true);
  for (const id of ['add', 'speaker', 'text', 'scene', 'fold', 'check']) {
    await page.click('[data-testid="tour-next"]');
    await page.until(`[data-testid="tour"][data-step="${id}"]`);
  }
  await shoot(page, 's6-06-tour-7-verificacao');
  await page.click('[data-testid="tour-next"]');
  await tourStep(page, 'generate', true);
  await shoot(page, 's6-07-tour-8-ia-centralizado');
  await page.click('[data-testid="tour-next"]');
  await page.untilText('[data-testid="tour-next"]', /Começar/);
  await page.click('[data-testid="tour-next"]');
  await until(async () => (await page.evaluate(`document.querySelector('[data-testid="tour"]') === null`)) === true, 'the finished tour to close');
}

const LINES = [
  'Hoje a gente vai aprender a deixar o roteiro curtinho na tela.',
  'Cada fala fica recolhida em uma linha só, com quem fala e o começo do texto.',
  'Clique na linha para abrir a fala inteira e editar tudo dela.',
  'Ela disse [oi] e saiu correndo pela porta da cozinha, sem olhar para trás nem uma vez.',
  'Quando você abre outra fala, a anterior se recolhe sozinha.',
  'Expandir todas abre o roteiro inteiro de uma vez.',
  'Recolher todas volta tudo para uma linha por fala.',
  'O selo vermelho mostra que a fala tem um erro para corrigir.',
  'E a verificação continua do lado, como sempre.',
];

// Every other line is Caio's, so the folded rows show two speakers' chips.
async function speaker(page: Page, text: string): Promise<void> {
  const who = LINES.indexOf(text) % 2 === 0 ? 'bia' : 'caio';
  await page.evaluate(`(() => {
    const select = document.activeElement.closest('.line-card').querySelector('[data-testid^="speaker-"]');
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(select, '${who}');
    select.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
}

/** Three lines added: only the last one is open, with the caret in its text (typing goes straight into it). */
async function addThree(page: Page): Promise<void> {
  for (const text of LINES.slice(0, 3)) {
    await page.click('[data-testid="add-line"]');
    const index = Number(await page.evaluate(`document.querySelectorAll('[data-testid^="line-toggle-"]').length`)) - 1;
    await until(async () => (await attribute(page, `[data-testid="line-${index}"] textarea`, 'data-testid')) !== null && (await page.evaluate(`document.activeElement?.dataset.testid`)) === `text-${index}`, `the caret in line ${index + 1}`);
    await page.evaluate(`document.activeElement.select()`);
    await page.send('Input.insertText', { text });
    await speaker(page, text);
  }
  assert.deepEqual(await openStates(page), [false, false, false, true], 'only the last line added is open');
}

/** A project of ten lines, folded, one open, all open and all folded; a jump opens its line; the tab keeps the open one. */
export async function foldedLines(context: Context): Promise<void> {
  const { page, shoot } = context;
  await page.click('[data-testid="go-home"]');
  await page.click('[data-testid="new-project"]');
  await page.until('[data-testid="new-project"] [data-testid="cast-picker"]');
  await page.type('[data-testid="idea-theme"]', 'Como dobrar as falas do roteiro');
  await page.type('[data-testid="idea-audience"]', 'quem escreve roteiros');
  await page.type('[data-testid="idea-tone"]', 'leve');
  await page.click('[data-testid="cast-bia"]');
  await page.click('[data-testid="cast-caio"]');
  await page.click('[data-testid="write-myself"]');
  await page.until('[data-testid="editor"] [data-testid="line-0"]');
  await addThree(page);
  for (const text of LINES.slice(3)) {
    await page.click('[data-testid="add-line"]');
    await until(async () => String(await page.evaluate(`document.activeElement?.dataset.testid ?? ''`)).startsWith('text-'), 'the caret in the new line');
    await page.evaluate(`document.activeElement.select()`);
    await page.send('Input.insertText', { text });
    await speaker(page, text);
  }
  await page.untilText('[data-testid="check-summary"]', /Erros: 1 /);
  await page.click('[data-testid="collapse-all"]');
  assert.deepEqual(await openStates(page), Array(10).fill(false));
  await page.until('[data-testid="row-problems-4"]');
  await page.evaluate('window.scrollTo(0, 0)');
  await shoot(page, 's6-01-falas-recolhidas');
  await page.click('[data-testid="jump"]');
  await page.until('[data-testid="line-4"][data-open="true"].selected');
  await page.click('[data-testid="line-toggle-2"]');
  assert.deepEqual((await openStates(page)).map((open, at) => [at, open]).filter(([, open]) => open), [[2, true]], 'one open at a time');
  await page.evaluate(`document.querySelector('[data-testid="line-2"]').scrollIntoView({ block: 'start' }); window.scrollBy(0, -120)`);
  await shoot(page, 's6-02-fala-aberta');
  await page.click('[data-testid="tab-cast"]');
  await page.click('[data-testid="tab-script"]');
  await page.until('[data-testid="line-2"][data-open="true"]');
  await page.click('[data-testid="expand-all"]');
  await page.click('[data-testid="line-toggle-5"]');
  assert.deepEqual(await openStates(page), Array.from({ length: 10 }, (_none, at) => at !== 5), 'all open: each folds alone');
  await page.click('[data-testid="collapse-all"]');
  assert.deepEqual(await openStates(page), Array(10).fill(false));
  const saveStatus = () => page.evaluate(`document.querySelector('[data-testid="save-status"]')?.dataset.status + ': ' + document.querySelector('[data-testid="save-status"]')?.textContent`);
  await until(async () => /^saved:/.test(String(await saveStatus())), 'the script saved').catch(async (error) => {
    throw new Error(`${error.message} (${await saveStatus()})`);
  });
}

/** In English: "Show tutorial" in the header, a step pointing at the check. */
export async function tourInEnglish({ page, shoot }: Context): Promise<void> {
  await page.until('[data-testid="tour"][data-step="intro"]');
  await page.untilText('[data-testid="tour-next"]', /Next/);
  for (let step = 0; step < 6; step++) await page.click('[data-testid="tour-next"]');
  await page.until('[data-testid="tour"][data-step="check"]');
  await shoot(page, 's6-08-tour-check-en');
  await page.click('[data-testid="tour-skip"]');
}
