// A small Chrome DevTools Protocol client for the smoke test: evaluate, click, type, wait and screenshot.
import { writeFile } from 'node:fs/promises';

const TIMEOUT = 120_000;
const pause = (milliseconds: number) => new Promise((done) => setTimeout(done, milliseconds));

/** Tries `attempt` every 200 ms until it gives something, or fails after TIMEOUT. */
export async function poll<T>(attempt: () => Promise<T | undefined>, what: string, deadline = Date.now() + TIMEOUT): Promise<T> {
  const found = await attempt();
  if (found !== undefined) return found;
  if (Date.now() > deadline) throw new Error(`timed out waiting for: ${what}`);
  await pause(200);
  return poll(attempt, what, deadline);
}

export type Page = ReturnType<typeof devtools>;

export function devtools(url: string) {
  const socket = new WebSocket(url);
  const pending = new Map<number, (message: { result?: unknown; error?: unknown }) => void>();
  let next = 0;
  // The page's console errors and uncaught exceptions, shown when the smoke test fails.
  const problems: string[] = [];
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data));
    if (message.method === 'Runtime.exceptionThrown') problems.push(JSON.stringify(message.params.exceptionDetails).slice(0, 800));
    if (message.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(message.params.type)) problems.push(JSON.stringify(message.params.args).slice(0, 800));
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
  const found = (selector: string) => `document.querySelector(${JSON.stringify(selector)})`;
  const until = (selector: string, deadline = Date.now() + TIMEOUT) => poll(async () => ((await evaluate(`${found(selector)} !== null`)) ? true : undefined), selector, deadline);
  const untilText = (selector: string, pattern: RegExp) =>
    poll(async () => (pattern.test(String(await evaluate(`${found(selector)}?.innerText ?? ''`))) ? true : undefined), `${selector} ~ ${pattern}`);
  const click = async (selector: string) => {
    await until(selector);
    await evaluate(`${found(selector)}.click()`);
  };
  // Real key presses into the focused field, so React sees them as typing.
  const type = async (selector: string, text: string) => {
    await until(selector);
    await evaluate(`${found(selector)}.focus()`);
    await send('Input.insertText', { text });
  };
  // The whole page in the picture: the viewport grows to the content height (at least the window's 1100×760).
  const screenshot = async (file: string) => {
    await pause(250);
    const height = Number(await evaluate('document.documentElement.scrollHeight'));
    await send('Emulation.setDeviceMetricsOverride', { width: 1100, height: Math.max(760, height), deviceScaleFactor: 1, mobile: false });
    await pause(250);
    const { data } = (await send('Page.captureScreenshot', { format: 'png' })) as { data: string };
    await send('Emulation.clearDeviceMetricsOverride');
    await writeFile(file, Buffer.from(data, 'base64'));
  };
  void send('Runtime.enable');
  return { send, evaluate, until, untilText, click, type, screenshot, problems, close: () => socket.close() };
}
