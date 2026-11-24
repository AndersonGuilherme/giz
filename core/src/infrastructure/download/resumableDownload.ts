import { createWriteStream, existsSync, mkdirSync, renameSync, statSync } from 'node:fs';
import { dirname } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

// Large downloads (voice model, NVIDIA libraries) that survive a dropped connection: the bytes go to `<file>.part`,
// a new run asks only for the rest (HTTP Range) and the file gets its name only when complete.
export type Download = Readonly<{ url: string; destination: string; label: string; expectedBytes?: number }>;
export type DownloadOptions = Readonly<{ fetch?: typeof fetch; onStart?: (totalBytes: number) => void }>;

const sizeOf = (path: string) => (existsSync(path) ? statSync(path).size : 0);

function alreadyThere({ destination, expectedBytes }: Download): boolean {
  if (!existsSync(destination)) return false;
  return expectedBytes === undefined || sizeOf(destination) === expectedBytes;
}

function totalOf(response: Response, download: Download, resumedFrom: number): number {
  if (download.expectedBytes !== undefined) return download.expectedBytes;
  return Number(response.headers.get('content-length') ?? 0) + resumedFrom;
}

async function request(download: Download, have: number, options: DownloadOptions): Promise<Response> {
  const send = options.fetch ?? fetch;
  const response = await send(download.url, { headers: have ? { Range: `bytes=${have}-` } : {} });
  if (!response.ok || !response.body) throw new Error(`falha ao baixar ${download.label}: HTTP ${response.status}`);
  return response;
}

// 206: the server sent only the missing bytes, which go after the ones already in the .part.
const resumedFrom = (response: Response, have: number) => (have > 0 && response.status === 206 ? have : 0);

function finish(part: string, download: Download, total: number): void {
  if (total && sizeOf(part) !== total) throw new Error(`download incompleto de ${download.label}; rode de novo para retomar`);
  renameSync(part, download.destination);
}

/** Downloads `url` to `destination`, resuming a previous partial download; a complete file is left as it is. */
export async function downloadResumable(download: Download, options: DownloadOptions = {}): Promise<void> {
  if (alreadyThere(download)) return;
  mkdirSync(dirname(download.destination), { recursive: true });
  const part = `${download.destination}.part`;
  const response = await request(download, sizeOf(part), options);
  const kept = resumedFrom(response, sizeOf(part));
  const total = totalOf(response, download, kept);
  options.onStart?.(total);
  await pipeline(Readable.fromWeb(response.body as never), createWriteStream(part, { flags: kept ? 'a' : 'w' }));
  finish(part, download, total);
}
