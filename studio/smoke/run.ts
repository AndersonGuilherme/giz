// Smoke test: boots the real app (electron-forge start), waits for the window, and through Chrome DevTools Protocol
// checks the bridge answers `projects.check` on core's coupon lesson (and refuses a folder never granted), then saves
// a screenshot of the whole page.
// Run: npm run smoke   (SMOKE_HEADLESS=1 for no display: Chromium's headless Ozone platform).
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const STUDIO = fileURLToPath(new URL('..', import.meta.url));
const FOLDER = resolve(STUDIO, '../core/examples/coupon-lesson/pt-BR');
const SHOT = join(STUDIO, 'out', 'smoke', 'window.png');
const PORT = 9400 + Math.floor(Math.random() * 400);
const TIMEOUT = 120_000;

const headless = process.env.SMOKE_HEADLESS === '1' ? ['--ozone-platform=headless'] : [];
const app = spawn('npx', ['electron-forge', 'start', '--', `--remote-debugging-port=${PORT}`, `--project=${FOLDER}`, ...headless], {
  cwd: STUDIO, stdio: ['ignore', 'pipe', 'pipe'], detached: true,
});
let output = '';
app.stdout.on('data', (chunk) => (output += chunk));
app.stderr.on('data', (chunk) => (output += chunk));

const pause = (milliseconds: number) => new Promise((done) => setTimeout(done, milliseconds));

type Target = { type: string; url: string; webSocketDebuggerUrl: string };

// Tries `attempt` every half second until it gives something, or fails after TIMEOUT.
async function poll<T>(attempt: () => Promise<T | undefined>, what: string, deadline = Date.now() + TIMEOUT): Promise<T> {
  const found = await attempt();
  if (found !== undefined) return found;
  if (Date.now() > deadline) throw new Error(`timed out waiting for: ${what}`);
  await pause(500);
  return poll(attempt, what, deadline);
}

async function pageTarget(): Promise<Target | undefined> {
  const targets = (await fetch(`http://127.0.0.1:${PORT}/json/list`).then((answer) => answer.json()).catch(() => [])) as Target[];
  return targets.find((target) => target.type === 'page' && !target.url.startsWith('devtools://'));
}

function devtools(url: string) {
  const socket = new WebSocket(url);
  const pending = new Map<number, (message: { result?: unknown; error?: unknown }) => void>();
  let next = 0;
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data));
    pending.get(message.id)?.(message);
  });
  const opened = new Promise((done) => socket.addEventListener('open', done, { once: true }));
  const send = async (method: string, params: object = {}) => {
    await opened;
    const id = ++next;
    socket.send(JSON.stringify({ id, method, params }));
    const message = await new Promise<{ result?: unknown; error?: unknown }>((done) => pending.set(id, done));
    if (message.error) throw new Error(`${method}: ${JSON.stringify(message.error)}`);
    return message.result as Record<string, unknown>;
  };
  const evaluate = async (expression: string): Promise<unknown> => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(`${expression}: ${JSON.stringify(result.exceptionDetails)}`);
    return (result.result as { value?: unknown }).value;
  };
  return { send, evaluate, close: () => socket.close() };
}

function until(evaluate: (expression: string) => Promise<unknown>, expression: string): Promise<true> {
  return poll(async () => ((await evaluate(expression).catch(() => false)) ? true : undefined), expression);
}

async function smoke(): Promise<void> {
  const page = await poll(pageTarget, 'the window');
  const { send, evaluate, close } = devtools(page.webSocketDebuggerUrl);
  await until(evaluate, `document.querySelector('[data-testid="check-report"]') !== null`);
  const isolation = await evaluate(`({ require: typeof require, process: typeof process, giz: typeof window.giz })`);
  assert.deepEqual(isolation, { require: 'undefined', process: 'undefined', giz: 'object' });
  const check = (await evaluate(`window.giz.projects.check(${JSON.stringify(FOLDER)})`)) as { ok: boolean; value: { errors: unknown[]; warnings: unknown[] } };
  assert.equal(check.ok, true);
  assert.deepEqual(check.value.errors, []);
  const refused = (await evaluate(`window.giz.projects.check('')`)) as { ok: boolean; failure: { code: string } };
  assert.equal(refused.ok, false);
  assert.equal(refused.failure.code, 'invalid-request');
  const ungranted = (await evaluate(`window.giz.projects.check('/tmp')`)) as { ok: boolean; failure: { code: string } };
  assert.equal(ungranted.ok, false);
  assert.equal(ungranted.failure.code, 'invalid-request');
  const shown = await evaluate(`document.querySelector('[data-testid="check-report"]').innerText`);
  assert.match(String(shown), /Tudo certo/);
  const title = await evaluate(`document.querySelector('h2').innerText`);
  // The whole page in the picture: the viewport grows to the content height (at least the window's 1100×760).
  const height = Number(await evaluate('document.documentElement.scrollHeight'));
  await send('Emulation.setDeviceMetricsOverride', { width: 1100, height: Math.max(760, height), deviceScaleFactor: 1, mobile: false });
  await pause(300);
  const { data } = (await send('Page.captureScreenshot', { format: 'png' })) as { data: string };
  await mkdir(dirname(SHOT), { recursive: true });
  await writeFile(SHOT, Buffer.from(data, 'base64'));
  close();
  console.log(JSON.stringify({ window: page.url, title, check: { ok: check.ok, errors: check.value.errors.length, warnings: check.value.warnings.length }, refused: refused.failure.code, ungranted: ungranted.failure.code, screenshot: SHOT }));
}

try {
  await smoke();
  console.log('smoke: ok');
} catch (error) {
  console.error(output.slice(-3000));
  console.error('smoke: FAILED', error);
  process.exitCode = 1;
} finally {
  process.kill(-(app.pid ?? 0), 'SIGTERM');
}
