// The AppImage runtime (the small program at the start of every AppImage) from a fixed release of AppImage/type2-runtime,
// checked by its sha256: the maker would otherwise fetch the moving "continuous" build at each make.
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export type PinnedRuntime = Readonly<{ url: string; sha256: string }>;
const RELEASE = 'https://github.com/AppImage/type2-runtime/releases/download/20251108';

/** The pinned runtime for each architecture the AppImage is made for. */
export const APPIMAGE_RUNTIMES: Readonly<Record<'x64' | 'arm64', PinnedRuntime>> = {
  x64: { url: `${RELEASE}/runtime-x86_64`, sha256: '2fca8b443c92510f1483a883f60061ad09b46b978b2631c807cd873a47ec260d' },
  arm64: { url: `${RELEASE}/runtime-aarch64`, sha256: '00cbdfcf917cc6c0ff6d3347d59e0ca1f7f45a6df1a428a0d6d8a78664d87444' },
};

const sha256Of = (data: Buffer) => createHash('sha256').update(data).digest('hex');

async function kept(path: string, pinned: PinnedRuntime): Promise<boolean> {
  return existsSync(path) && sha256Of(await readFile(path)) === pinned.sha256;
}

/** `path` holds the pinned runtime (downloaded unless it is already there and whole); returns `path`. */
export async function ensureAppImageRuntime(path: string, pinned: PinnedRuntime, send: typeof fetch = fetch): Promise<string> {
  if (await kept(path, pinned)) return path;
  const answer = await send(pinned.url);
  if (!answer.ok) throw new Error(`AppImage runtime: HTTP ${answer.status} for ${pinned.url}`);
  const data = Buffer.from(await answer.arrayBuffer());
  if (sha256Of(data) !== pinned.sha256) throw new Error(`AppImage runtime: the sha256 of ${pinned.url} is not the pinned one`);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, data);
  return path;
}
