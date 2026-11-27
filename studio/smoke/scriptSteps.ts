// The S3 part of the smoke test: the projects list, the new-project wizard (by hand and with the rehearsal text AI)
// and the script editor (lines, a validation error that appears and clears, undo, a scene as JSON, duplicate, trash).
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import type { Page } from './devtools.ts';

type Shoot = (page: Page, name: string) => Promise<void>;
export type Context = Readonly<{ page: Page; shoot: Shoot; home: string }>;

const PROJECTS = (home: string) => join(home, 'giz', 'projetos');
const scriptOf = async (folder: string) => JSON.parse(await readFile(join(folder, 'script.json'), 'utf8'));
const count = (page: Page, selector: string) => page.evaluate(`document.querySelectorAll(${JSON.stringify(selector)}).length`) as Promise<number>;
const until = async (check: () => Promise<boolean>, what: string, deadline = Date.now() + 60_000): Promise<void> => {
  if (await check()) return;
  if (Date.now() > deadline) throw new Error(`timed out waiting for: ${what}`);
  await new Promise((done) => setTimeout(done, 200));
  return until(check, what, deadline);
};

/** Replaces the whole value of a text box, as typing would (React sees an input event). */
async function replace(page: Page, selector: string, text: string): Promise<void> {
  await page.until(selector);
  await page.evaluate(`(() => { const box = document.querySelector(${JSON.stringify(selector)}); box.focus(); box.select(); })()`);
  await page.send('Input.insertText', { text });
}

/** Chooses an option of a drop-down (the native setter, so React sees the change). */
async function choose(page: Page, selector: string, value: string): Promise<void> {
  await page.until(selector);
  await page.evaluate(`(() => {
    const select = document.querySelector(${JSON.stringify(selector)});
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(select, ${JSON.stringify(value)});
    select.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
}

/** Opens a folded line (its row's toggle), so its fields are on the page. */
export async function openLine(page: Page, index: number): Promise<void> {
  const toggle = `[data-testid="line-toggle-${index}"]`;
  await page.until(toggle);
  if ((await page.evaluate(`document.querySelector(${JSON.stringify(toggle)}).getAttribute('aria-expanded')`)) !== 'true') await page.click(toggle);
  await page.until(`[data-testid="line-${index}"][data-open="true"] [data-testid="text-${index}"]`);
}

const savedAndChecked = (page: Page) => page.until('[data-testid="save-status"][data-status="saved"]');

async function fillIdea(page: Page, theme: string): Promise<void> {
  await page.click('[data-testid="new-project"]');
  await page.until('[data-testid="new-project"] [data-testid="cast-picker"]');
  await page.type('[data-testid="idea-theme"]', theme);
  await page.type('[data-testid="idea-audience"]', 'jovens nas redes sociais');
  await page.type('[data-testid="idea-tone"]', 'engraçado e curioso');
}

/** The home screen with the project the command line opened (it is remembered). */
export async function projectsList({ page, shoot }: Context): Promise<void> {
  await page.click('[data-testid="go-home"]');
  await page.until('[data-testid="projects-screen"] [data-testid="project-pt-BR"]');
  await page.until('[data-testid="project-pt-BR"] [data-testid="stage-bar"] [data-stage="script"][data-state="done"]');
  await shoot(page, 's3-01-projetos');
}

/** The wizard, written by hand: cast with portraits, a scene, then the editor on the starter line. */
export async function writeByHand({ page, shoot }: Context): Promise<void> {
  await fillIdea(page, 'E se os gatos acordassem falando?');
  await page.until('[data-testid="cast-bia"] .portrait:not(.initial)');
  await page.click('[data-testid="cast-bia"]');
  await page.click('[data-testid="cast-caio"]');
  await page.click('[data-testid="scene-castle-rain"]');
  await shoot(page, 's3-02-ideia');
  await page.evaluate(`document.querySelector('[data-testid="write-myself"]').scrollIntoView({ block: 'end' })`);
  await shoot(page, 's3-02b-ideia-elenco');
  await page.click('[data-testid="write-myself"]');
  await page.until('[data-testid="editor"] [data-testid="line-0"]');
  await page.untilText('[data-testid="check-summary"]', /Tudo certo/);
  await page.untilText('[data-testid="stage-bar"] [data-stage="script"]', /Roteiro/);
  await shoot(page, 's3-03-editor-novo');
}

/** Lines added, a `[span]` without a beat (an error by the line and in the panel), fixed, undone and redone. */
export async function editLines({ page, shoot, home }: Context): Promise<string> {
  const folder = join(PROJECTS(home), 'e-se-os-gatos-acordassem-falando');
  await page.click('[data-testid="add-line"]');
  await page.click('[data-testid="add-line"]');
  await page.until('[data-testid="line-2"][data-open="true"]');
  await openLine(page, 1);
  await replace(page, '[data-testid="text-1"]', 'Ela disse [oi] e saiu correndo.');
  await page.until('[data-testid="line-problems-1"]');
  await page.untilText('[data-testid="check-summary"]', /Erros: 1 /);
  await page.until('[data-testid="line-1"].has-error');
  await page.evaluate(`document.querySelector('[data-testid="line-1"]').scrollIntoView({ block: 'center' })`);
  await shoot(page, 's3-04-erro');
  await page.click('[data-testid="jump"]');
  await page.until('[data-testid="line-1"].selected');
  await page.click('[data-testid="fit-beats-1"]');
  await choose(page, '[data-testid="beat-1-0"] select', 'surprised');
  await until(async () => (await count(page, '[data-testid="line-problems-1"]')) === 0, 'the error to clear');
  await page.untilText('[data-testid="check-summary"]', /Tudo certo/);
  await savedAndChecked(page);
  await shoot(page, 's3-05-corrigido');
  const saved = await scriptOf(folder);
  assert.equal(saved.lines.length, 3);
  assert.deepEqual(saved.lines[1].beats, [{ expression: 'surprised' }]);
  return folder;
}

/** Undo brings the error back, redo clears it; the line moves down; a scene type without a form is edited as JSON. */
export async function undoMoveAndScene({ page, shoot }: Context, folder: string): Promise<void> {
  await page.click('[data-testid="undo"]');
  await page.until('[data-testid="line-problems-1"]');
  await page.click('[data-testid="redo"]');
  await until(async () => (await count(page, '[data-testid="line-problems-1"]')) === 0, 'redo to clear the error');
  await page.click('[data-testid="down-0"]');
  await until(async () => (await scriptOf(folder)).lines[1].id === '01', 'the first line saved one place down');
  await openLine(page, 2);
  await page.click('[data-testid="scene-mode-2"] button[data-value="new"]');
  await choose(page, '[data-testid="scene-type-2"]', 'versus');
  await page.untilText('[data-testid="scene-problems-2"]', /obrigatório/);
  await replace(page, '[data-testid="scene-json-2"]', '{ "type": "versus", "wrong": { "title": "Antes", "text": "lento" }, "right": { "title": "Depois", "text": "rápido" ');
  await page.untilText('[data-testid="scene-problems-2"]', /JSON inválido/);
  await page.evaluate(`document.querySelector('[data-testid="line-2"]').scrollIntoView({ block: 'center' })`);
  await shoot(page, 's3-06-cena-json');
  await replace(page, '[data-testid="scene-json-2"]', '{ "type": "versus", "wrong": { "title": "Antes", "text": "lento" }, "right": { "title": "Depois", "text": "rápido" } }');
  await page.untilText('[data-testid="scene-problems-2"]', /Cena válida/);
  await page.click('[data-testid="scene-mode-2"] button[data-value="inherit"]');
  await page.click('[data-testid="up-1"]');
  await until(async () => (await scriptOf(folder)).lines[0].id === '01', 'the first line saved back on top');
  await page.untilText('[data-testid="check-summary"]', /Tudo certo/);
  await savedAndChecked(page);
}

/** Back home: an edit made just before leaving is on disk; a copy is made and trashed; the outside project is only forgotten. */
export async function duplicateAndTrash({ page, shoot, home }: Context, folder: string): Promise<void> {
  await openLine(page, 2);
  await replace(page, '[data-testid="text-2"]', 'Saiu sem esperar o salvamento.');
  await page.click('[data-testid="go-home"]');
  await page.until('[data-testid="projects-screen"]');
  assert.equal((await scriptOf(folder)).lines[2].text, 'Saiu sem esperar o salvamento.', 'leaving the editor saves the last edit');
  assert.equal(await count(page, '[data-testid="project-pt-BR"] [data-testid="project-trash"]'), 0, 'a folder opened from elsewhere is never trashed');
  await page.until('[data-testid="project-pt-BR"] [data-testid="project-forget"]');
  const tile = '[data-testid="project-e-se-os-gatos-acordassem-falando"]';
  await page.click(`${tile} [data-testid="project-duplicate"]`);
  const copy = '[data-testid="project-e-se-os-gatos-acordassem-falando-copia"]';
  await page.untilText(copy, /\(cópia\)/);
  await page.click(`${copy} [data-testid="project-trash"]`);
  await page.until('[data-testid="confirm-dialog"]');
  await shoot(page, 's3-07-excluir');
  await page.click('[data-testid="confirm-yes"]');
  await until(async () => (await count(page, copy)) === 0, 'the copy to leave the list');
  const trashed = await readdir(join(home, '.lixeira'));
  assert.equal(trashed.length, 1);
  assert.match(trashed[0] ?? '', /^e-se-os-gatos-acordassem-falando-copia-\d+$/);
  await shoot(page, 's3-08-projetos');
}

/** A script.json that is not JSON opens as a readable failure, and the file is left as it was. */
export async function brokenScript({ page, shoot, home }: Context): Promise<void> {
  const folder = join(PROJECTS(home), 'roteiro-quebrado');
  await mkdir(folder, { recursive: true });
  await writeFile(join(folder, 'project.json'), JSON.stringify({ version: 2, title: 'Roteiro quebrado', format: 'story', language: 'pt-BR', aspect: '9:16', cast: [], voice: { provider: 'qwen' } }));
  await writeFile(join(folder, 'script.json'), '{ "chapters": ["Um"], "lines": [');
  await page.click('[data-testid="new-project"]');
  await page.click('[data-testid="idea-cancel"]');
  await page.click('[data-testid="project-roteiro-quebrado"] [data-testid="project-open"]');
  await page.untilText('.failure', /não pôde ser lido[\s\S]*script\.json: JSON inválido na linha 1/);
  await shoot(page, 's3-15-roteiro-quebrado');
  assert.equal(await readFile(join(folder, 'script.json'), 'utf8'), '{ "chapters": ["Um"], "lines": [');
}

/** "Gerar com IA" with the rehearsal text AI: the estimate, the confirmation, call 2 of 4 (a repair), the editor. */
export async function generateWithAi({ page, shoot }: Context): Promise<void> {
  await page.click('[data-testid="go-home"]');
  await fillIdea(page, 'Um robô aprende a cozinhar');
  await page.click('[data-testid="generate-ai"]');
  await page.until('[data-testid="generate-estimate"] [data-testid="worst-case"]');
  await page.untilText('[data-testid="generate-estimate"]', /Anthropic \(Claude\), modelo modelo de ensaio/);
  await page.untilText('[data-testid="generate-estimate"]', /4 chamadas, com 3 correções/);
  await shoot(page, 's3-09-estimativa');
  await page.click('[data-testid="generate-confirm"]');
  await page.untilText('[data-testid="generate-progress"]', /Chamada 2 de 4/);
  await shoot(page, 's3-10-gerando');
  await page.until('[data-testid="editor"] [data-testid="line-2"]');
  await page.untilText('[data-testid="check-summary"]', /Tudo certo/);
  await shoot(page, 's3-11-editor-ia');
}

/** A generation that never becomes valid shows the readable failure and the draft; another one is cancelled. */
export async function failAndCancel({ page, shoot }: Context): Promise<void> {
  await page.click('[data-testid="go-home"]');
  await fillIdea(page, 'Um teste ensaio-falha');
  await page.click('[data-testid="generate-ai"]');
  await page.click('[data-testid="generate-confirm"]');
  await page.untilText('[data-testid="draft-path"]', /um-teste-ensaio-falha\.draft$/);
  await shoot(page, 's3-12-falha');
  await page.click('[data-testid="generate-failed"] button');
  await page.click('[data-testid="generate-ai"]');
  await page.click('[data-testid="generate-confirm"]');
  await page.until('[data-testid="generate-cancel"]');
  await page.click('[data-testid="generate-cancel"]');
  await page.until('[data-testid="generate-cancelled"]');
  await page.click('[data-testid="generate-cancelled"] button');
  await page.click('[data-testid="go-home"]');
  await page.click('[data-testid="project-um-robo-aprende-a-cozinhar"] [data-testid="project-open"]');
  await page.until('[data-testid="check-report"]');
}

/** The same screens in English, after Settings switched the language. */
export async function inEnglish({ page, shoot }: Context): Promise<void> {
  await page.untilText('[data-testid="check-summary"]', /All good|no errors/i);
  await shoot(page, 's3-13-editor-en');
  await page.click('[data-testid="go-home"]');
  await page.untilText('[data-testid="projects-screen"] h2', /Projects/);
  await shoot(page, 's3-14-projects-en');
  await page.click('[data-testid="project-pt-BR"] [data-testid="project-forget"]');
  await until(async () => (await count(page, '[data-testid="project-pt-BR"]')) === 0, 'the outside project to leave the list');
}
