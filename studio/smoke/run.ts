// Smoke test: boots the real app (electron-forge start) in an isolated Studio home (GIZ_STUDIO_HOME) with the rehearsal
// machine tools (GIZ_STUDIO_REHEARSAL=1: a pretend GPU and pretend downloads, no network), walks the whole first-run
// wizard through Chrome DevTools Protocol taking a screenshot of every step, then checks the bridge on core's coupon
// lesson (and that a folder never granted is refused) and opens Settings.
// Run: npm run smoke   (SMOKE_HEADLESS=1 for no display: Chromium's headless Ozone platform).
// SMOKE_APP=<program>: the same walk on the packaged app (npm run package, out/<name>-<platform>-<arch>/giz-estudio)
// instead of the dev server: `npm run smoke:packaged` packages and runs it.
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { devtools, poll, type Page } from './devtools.ts';
import { castStage, scenariosStage, storyProject, voicesStage } from './mediaSteps.ts';
import { videoStage } from './videoSteps.ts';
import { firstTour, foldedLines, tourAgain, tourInEnglish } from './s6Steps.ts';
import { brokenScript, duplicateAndTrash, editLines, failAndCancel, generateWithAi, inEnglish, projectsList, undoMoveAndScene, writeByHand } from './scriptSteps.ts';

const STUDIO = fileURLToPath(new URL('..', import.meta.url));
const FOLDER = resolve(STUDIO, '../core/examples/coupon-lesson/pt-BR');
const PACKAGED = process.env.SMOKE_APP;
const SHOTS = join(STUDIO, 'out', PACKAGED ? 'smoke-packaged' : 'smoke');
const PORT = 9400 + Math.floor(Math.random() * 400);
const HOME = await mkdtemp(join(tmpdir(), 'giz-smoke-home-'));
// A giz.config.json the CLI already made: the Studio must keep its other keys (brand) and use its models folder.
await writeFile(join(HOME, 'giz.config.json'), JSON.stringify({ brand: 'canal-de-teste', modelsDir: join(HOME, '.cache', 'giz') }));

const headless = process.env.SMOKE_HEADLESS === '1' ? ['--ozone-platform=headless'] : [];
const env = { ...process.env, GIZ_STUDIO_HOME: HOME, GIZ_STUDIO_REHEARSAL: '1', GIZ_QUIET: '1' };
const appArgs = [`--remote-debugging-port=${PORT}`, `--project=${FOLDER}`, '--lang=en-US', '--use-fake-device-for-media-stream', ...headless];
const [command, args] = PACKAGED ? [PACKAGED, appArgs] : ['npx', ['electron-forge', 'start', '--', ...appArgs]];
const app = spawn(command, args, {
  cwd: STUDIO, stdio: ['ignore', 'pipe', 'pipe'], detached: true, env,
});
let output = '';
app.stdout.on('data', (chunk) => (output += chunk));
app.stderr.on('data', (chunk) => (output += chunk));

type Target = { type: string; url: string; webSocketDebuggerUrl: string };

async function pageTarget(): Promise<Target | undefined> {
  const targets = (await fetch(`http://127.0.0.1:${PORT}/json/list`).then((answer) => answer.json()).catch(() => [])) as Target[];
  return targets.find((target) => target.type === 'page' && !target.url.startsWith('devtools://'));
}

const json = async (file: string) => JSON.parse(await readFile(file, 'utf8'));
const shots: string[] = [];

// The S3 screens are shown as the window shows them (a long script is taller than any screen).
const S3_VIEW = { width: 1280, height: 860 };

async function shoot(page: Page, name: string): Promise<void> {
  const file = join(SHOTS, `${name}.png`);
  await page.screenshot(file, /^s[3456]b?-/.test(name) ? S3_VIEW : undefined);
  shots.push(file);
}

// On a cold Vite dev server the first page load sometimes never mounts (an empty #root, every module answered 200, no
// error): the dev server's own hiccup, not the app's. One reload, logged, gets past it; a second miss still fails.
async function firstScreen(page: Page): Promise<void> {
  const mounted = await page.until('[data-testid="wizard-language"]', Date.now() + 30_000).catch(() => false);
  if (mounted) return;
  const cause = await page.evaluate(`document.readyState + ', #root children: ' + (document.getElementById('root')?.childElementCount ?? 'none')`).catch(String);
  const mainLog = output.split('\n').filter((line) => line.includes('giz page:')).slice(-10).join(' | ');
  console.log(`smoke: the window did not mount in 30 s (page ${cause}; main: ${mainLog || 'no page problem logged'}; console: ${page.problems.join(' | ') || 'nothing'}); reloading once`);
  await page.send('Page.reload', { ignoreCache: true });
  await page.until('[data-testid="wizard-language"]');
}

async function languageStep(page: Page): Promise<void> {
  await firstScreen(page);
  const isolation = await page.evaluate(`({ require: typeof require, process: typeof process, giz: typeof window.giz })`);
  assert.deepEqual(isolation, { require: 'undefined', process: 'undefined', giz: 'object' });
  await page.untilText('h2', /Let's set up your Studio/);
  await shoot(page, '01-language-en');
  await page.click('[data-testid="language-pt-BR"] button');
  await page.untilText('h2', /Vamos preparar o seu Estúdio/);
  await shoot(page, '01-idioma');
  await page.click('[data-testid="wizard-next"]');
}

async function projectsStep(page: Page): Promise<void> {
  await page.until('[data-testid="wizard-projects"]');
  assert.equal(await page.evaluate(`document.querySelector('[data-testid="wizard-next"]').disabled`), true, 'the projects folder is required');
  await page.click('[data-testid="projects-default"]');
  await page.untilText('[data-testid="projects-folder"]', /Os projetos ficam em[\s\S]*giz\/projetos/i);
  assert.ok((await stat(join(HOME, 'giz', 'projetos'))).isDirectory());
  await shoot(page, '02-pasta-de-projetos');
  await page.click('[data-testid="wizard-next"]');
}

async function gpuStep(page: Page): Promise<void> {
  await page.until('[data-testid="gpu-install"]');
  assert.equal(await page.evaluate(`document.querySelector('[data-testid="wizard-next"]')`), null, 'an optional step not done offers only the skip');
  await page.until('[data-testid="wizard-skip"]');
  await shoot(page, '03a-gpu-detectada');
  await page.click('[data-testid="gpu-install"]');
  await page.untilText('[data-testid="task-gpu"]', /libcublas · [1-9]/);
  await shoot(page, '03b-gpu-instalando');
  await page.untilText('.panel', /A placa está pronta/);
  await page.until('.panel .option.selected [aria-checked="true"]');
  await page.untilText('.panel .option.selected', /Na placa de vídeo/);
  await shoot(page, '03c-gpu-pronta');
  assert.equal((await json(join(HOME, 'giz.config.json'))).device, 'cuda', 'a ready GPU becomes the voice device of the CLI too');
  await page.click('[data-testid="wizard-next"]');
}

async function modelsStep(page: Page): Promise<void> {
  await page.until('[data-testid="download-voice-0.6b"]');
  await page.click('[data-testid="download-voice-0.6b"]');
  await page.untilText('[data-testid="task-voice-0.6b"]', /Qwen3-TTS 0.6B · [1-9]/);
  await page.click('[data-testid="task-voice-0.6b"] button');
  await page.untilText('[data-testid="task-voice-0.6b"]', /pausado/);
  await shoot(page, '04a-modelos-pausado');
  await page.click('[data-testid="download-voice-0.6b"]');
  await page.until('[data-testid="ready-voice-0.6b"]');
  await page.click('[data-testid="download-whisper"]');
  await page.until('[data-testid="ready-whisper"]');
  await page.click('[data-testid="download-voice-1.7b"]');
  await page.untilText('[data-testid="task-voice-1.7b"]', /1.7B · [1-9]/);
  await shoot(page, '04b-modelos-baixando');
  await page.until('[data-testid="ready-voice-1.7b"]');
  await page.click('[data-testid="model-1.7b"] button');
  await page.untilText('[data-testid="model-1.7b"]', /Usado nos vídeos/);
  assert.equal((await json(join(HOME, 'giz.config.json'))).model, '1.7b');
  await page.click('[data-testid="wizard-next"]');
}

async function saveKey(page: Page, provider: string, key: string): Promise<void> {
  await page.type(`[data-testid="key-${provider}"]`, key);
  await page.click(`[data-testid="account-${provider}"] button[type="submit"]`);
  await page.until(`[data-testid="remove-${provider}"]`);
}

async function accountsStep(page: Page): Promise<void> {
  await page.until('[data-testid="account-anthropic"]');
  await shoot(page, '05a-contas-vazias');
  await saveKey(page, 'anthropic', 'sk-ensaio-ok-123');
  await page.click('[data-testid="test-anthropic"]');
  await page.untilText('[data-testid="account-anthropic"]', /Funcionou \(modelo-de-ensaio, 11 tokens/);
  await saveKey(page, 'openai', 'sk-errada');
  await page.click('[data-testid="test-openai"]');
  await page.untilText('[data-testid="account-openai"]', /a chave foi recusada \(401\)/);
  await page.click('.choice:nth-child(2) .segmented button:nth-child(3)');
  await page.until('[data-testid="missing-key-fal"]');
  await saveKey(page, 'elevenlabs', 'xi-ensaio');
  await page.untilText('[data-testid="account-elevenlabs"]', /sem teste por enquanto/);
  const status = (await page.evaluate('window.giz.keys.status()')) as { value: { secure: boolean; keys: Record<string, string | null> } };
  assert.equal(JSON.stringify(status).includes('sk-ensaio'), false, 'no answer carries a key');
  const secure = status.value.secure;
  if (!secure) assert.equal(((await stat(join(HOME, '.config', 'giz', 'anthropic.key'))).mode & 0o777), 0o600, 'without a keychain: the CLI file, mode 600');
  if (!secure) await page.until('[data-testid="no-keychain"]');
  await shoot(page, '05b-contas');
  await page.click('[data-testid="wizard-next"]');
}

async function licenseStep(page: Page): Promise<void> {
  await page.until('[data-testid="license-notice"]');
  await page.click('[data-testid="license-pessoa-fisica"] button');
  await page.untilText('.panel', /Gratuito para você/);
  await shoot(page, '06-licenca');
  const shared = await json(join(HOME, 'giz.config.json'));
  assert.deepEqual([shared.remotionLicense, shared.brand], ['pessoa-fisica', 'canal-de-teste'], 'the CLI keys the Studio does not own stay');
  await page.click('[data-testid="wizard-next"]');
}

async function studio(page: Page): Promise<Record<string, unknown>> {
  await page.until('[data-testid="check-report"]');
  const check = (await page.evaluate(`window.giz.script.check(${JSON.stringify(FOLDER)})`)) as { ok: boolean; value: { errors: unknown[]; warnings: unknown[] } };
  assert.equal(check.ok, true);
  assert.deepEqual(check.value.errors, []);
  const refused = (await page.evaluate(`window.giz.script.check('')`)) as { failure: { code: string } };
  assert.equal(refused.failure.code, 'invalid-request');
  const ungranted = (await page.evaluate(`window.giz.script.check('/tmp')`)) as { failure: { code: string } };
  assert.equal(ungranted.failure.code, 'invalid-request');
  const named = (await page.evaluate(`window.giz.settings.update({ modelsDir: '/etc' })`)) as { failure: { code: string } };
  assert.equal(named.failure.code, 'invalid-request', 'the window cannot name a folder');
  await page.untilText('[data-testid="check-report"]', /Tudo certo/);
  await shoot(page, '07-estudio');
  const app = await json(join(HOME, 'userData', 'studio.json'));
  assert.deepEqual([app.language, app.firstRunDone, app.providers.image], ['pt-BR', true, 'fal']);
  return { errors: check.value.errors.length, warnings: check.value.warnings.length, refused: refused.failure.code, ungranted: ungranted.failure.code };
}

async function settings(page: Page): Promise<void> {
  await page.click('[data-testid="open-settings"]');
  await page.until('[data-testid="settings-language"]');
  await page.click('[data-testid="settings-tab-models"]');
  await page.until('[data-testid="ready-voice-1.7b"]');
  await shoot(page, '08a-configuracoes-modelos');
  await page.click('[data-testid="tours-reset"]');
  await page.untilText('[data-testid="tours-reset-note"]', /vão aparecer de novo/);
  assert.deepEqual((await json(join(HOME, 'userData', 'studio.json'))).toursSeen, [], 'the tours are forgotten');
  await page.click('[data-testid="settings-tab-language"]');
  await page.click('[data-testid="language-en"] button');
  await page.click('[data-testid="settings-tab-accounts"]');
  await page.untilText('.settings-nav h2', /^Settings$/);
  await shoot(page, '08b-settings-accounts-en');
  await page.click('[data-testid="settings-close"]');
  await page.until('[data-testid="check-report"]');
}

// S3: the projects, the new-project wizard and the script editor (in pt-BR; Settings then switches to English).
async function scriptStage(page: Page): Promise<void> {
  const context = { page, shoot, home: HOME };
  await shoot(page, 's3-00-editor-aula');
  await projectsList(context);
  await writeByHand(context);
  const folder = await editLines(context);
  await undoMoveAndScene(context, folder);
  await duplicateAndTrash(context, folder);
  await brokenScript(context);
  await generateWithAi(context);
  await failAndCancel(context);
}

// S4: the cast, the scenarios and the voices of a story (in pt-BR, before Settings switches to English).
async function mediaStages(page: Page): Promise<void> {
  const context = { page, shoot, home: HOME };
  const folder = await storyProject(context);
  await castStage(context, folder);
  await scenariosStage(context, folder);
  await voicesStage(context, folder);
  // The sample and every voice job (all pending, one line again, a take) ran in one long-lived voice worker.
  assert.equal(output.match(/giz voices: worker ready/g)?.length, 1, 'one voice worker, kept for every job');
  await page.click('[data-testid="tab-script"]');
  await page.until('[data-testid="check-report"]');
  await page.click('[data-testid="go-home"]');
  await page.click('[data-testid="project-um-robo-aprende-a-cozinhar"] [data-testid="project-open"]');
  await page.until('[data-testid="check-report"]');
}

let lastPage: Page | undefined;

async function smoke(): Promise<void> {
  const target = await poll(pageTarget, 'the window');
  const page = devtools(target.webSocketDebuggerUrl);
  lastPage = page;
  await mkdir(SHOTS, { recursive: true });
  for (const step of [languageStep, projectsStep, gpuStep, modelsStep, accountsStep, licenseStep]) await step(page);
  const context = { page, shoot, home: HOME };
  await firstTour(context);
  const bridge = await studio(page);
  await tourAgain(context);
  await scriptStage(page);
  await foldedLines(context);
  await mediaStages(page);
  await videoStage({ page, shoot, home: HOME }, FOLDER);
  await settings(page);
  await tourInEnglish(context);
  await inEnglish({ page, shoot, home: HOME });
  // The packaged page has the strict policy (no inline style or script): nothing it shows may need what it refuses.
  if (PACKAGED) assert.deepEqual(page.violations, [], 'the packaged page breaks none of its Content-Security-Policy');
  page.close();
  console.log(JSON.stringify({ window: target.url, ...bridge, screenshots: shots }, null, 1));
}

try {
  await smoke();
  console.log('smoke: ok');
} catch (error) {
  console.error(output.slice(-3000));
  const shown = await lastPage?.evaluate(`location.href + ' | ' + document.body.innerText.slice(0, 600) + ' | ' + document.getElementById('root')?.innerHTML.length + ' | ' + performance.getEntriesByType('resource').map((entry) => entry.name.replace(location.origin, '') + ':' + entry.responseStatus).join(' ')`).catch((reason) => String(reason));
  console.error('page:', shown);
  console.error('console:', lastPage?.problems.join('\n'));
  console.error('smoke: FAILED', error);
  process.exitCode = 1;
} finally {
  const exited = new Promise((done) => app.once('exit', done));
  process.kill(-(app.pid ?? 0), 'SIGTERM');
  await Promise.race([exited, new Promise((done) => setTimeout(done, 5000))]);
  // Electron may still be writing its userData for a moment after the kill.
  const clean = () => rm(HOME, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 }).catch(() => undefined);
  await clean();
  await new Promise((done) => setTimeout(done, 2000));
  await clean();
}
