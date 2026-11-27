import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Where our page comes from: the Vite dev server (development) or our own index.html over file: (packaged). */
export type AppOrigin = Readonly<{ devServer?: string; indexFile?: string }>;
type WindowLike = Readonly<{ webContents: unknown }>;
export type SenderRules = Readonly<{ window: () => WindowLike | undefined; origin: AppOrigin }>;

type FrameLike = Readonly<{ url: string; parent: unknown }>;
type EventLike = Readonly<{ sender?: unknown; senderFrame?: FrameLike | null }>;

const isIndexFile = (url: URL, indexFile: string) => url.protocol === 'file:' && resolve(fileURLToPath(url)) === resolve(indexFile);

function isAppUrl(text: string, origin: AppOrigin): boolean {
  const url = URL.parse(text);
  if (!url) return false;
  if (origin.devServer) return url.origin === new URL(origin.devServer).origin;
  return origin.indexFile !== undefined && isIndexFile(url, origin.indexFile);
}

const isTopFrame = (frame: FrameLike | null | undefined): frame is FrameLike => frame !== null && frame !== undefined && frame.parent === null;

/** True only for the top frame of our own window, showing our own page. Everything else is refused. */
export function isTrustedSender(event: unknown, rules: SenderRules): boolean {
  const { sender, senderFrame } = (event ?? {}) as EventLike;
  const window = rules.window();
  if (!isTopFrame(senderFrame) || !window) return false;
  return sender === window.webContents && isAppUrl(senderFrame.url, rules.origin);
}
