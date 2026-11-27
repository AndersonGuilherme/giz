import { createWriteStream, existsSync, mkdirSync, renameSync, statSync } from 'node:fs';
import { dirname } from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

// Large downloads (voice model, NVIDIA libraries) that survive a dropped connection: the bytes go to `<file>.part`,
// a new run asks only for the rest (HTTP Range) and the file gets its name only when complete.
export type Download = Readonly<{ url: string; destination: string; label: string; expectedBytes?: number }>;
/** `onBytes` receives the bytes on disk so far (a resumed download starts from the ones the .part already had). */
export type DownloadOptions = Readonly<{ fetch?: typeof fetch; onStart?: (totalBytes: number) => void; onBytes?: (receivedBytes: number) => void }>;
/** How far one file of a larger install is (the Studio shows it as a progress bar). */
export type DownloadProgress = Readonly<{ label: string; receivedBytes: number; totalBytes: number }>;

const sizeOf = (path: string) => (existsSync(path) ? statSync(path).size : 0);

function alreadyThere({ destination, expectedBytes }: Download): boolean {
  if (!existsSync(destination)) return false;
  return expectedBytes === undefined || sizeOf(destination) === expectedBytes;
}

function totalOf(response: Response, download: Download, resumedFrom: number): number {
  if (download.expectedBytes !== undefined) return download.expectedBytes;
  return Number(response.headers.get('content-length') ?? 0) + resumedFrom;
}

// 416 to a Range from the end of the .part: there is nothing left to send. The .part is whole when its size is the
// expected one (or the size the server gives in Content-Range: bytes */<size>).
function partIsWhole(response: Response, download: Download, have: number): boolean {
  if (response.status !== 416 || have === 0) return false;
  const total = download.expectedBytes ?? Number(response.headers.get('content-range')?.split('/')[1]);
  return total === have;
}

/** The answer with the bytes still missing, or null when the .part already has them all. */
async function request(download: Download, have: number, options: DownloadOptions): Promise<Response | null> {
  const send = options.fetch ?? fetch;
  const response = await send(download.url, { headers: have ? { Range: `bytes=${have}-` } : {} });
  if (partIsWhole(response, download, have)) return null;
  if (!response.ok || !response.body) throw new Error(`falha ao baixar ${download.label}: HTTP ${response.status}`);
  return response;
}

// 206: the server sent only the missing bytes, which go after the ones already in the .part.
const resumedFrom = (response: Response, have: number) => (have > 0 && response.status === 206 ? have : 0);

// Passes the bytes through, counting them.
function counter(start: number, onBytes: (receivedBytes: number) => void): Transform {
  let received = start;
  onBytes(received);
  return new Transform({
    transform(chunk: Buffer, _encoding, done) {
      received += chunk.length;
      onBytes(received);
      done(null, chunk);
    },
  });
}

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
  if (response === null) return renameSync(part, download.destination);
  await receive(response, { download, part }, options);
}

// Writes the answer after the bytes the .part already has (or over them, when the server sent the whole file).
async function receive(response: Response, { download, part }: Readonly<{ download: Download; part: string }>, options: DownloadOptions): Promise<void> {
  const kept = resumedFrom(response, sizeOf(part));
  const total = totalOf(response, download, kept);
  options.onStart?.(total);
  const counted = counter(kept, options.onBytes ?? (() => undefined));
  await pipeline(Readable.fromWeb(response.body as never), counted, createWriteStream(part, { flags: kept ? 'a' : 'w' }));
  finish(part, download, total);
}
