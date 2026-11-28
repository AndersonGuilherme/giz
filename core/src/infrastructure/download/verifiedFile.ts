import { createHash } from 'node:crypto';
import { createReadStream, statSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';

// What every runtime download goes through before it is used: its bytes against a published hash, and the names a
// remote listing gives against the folder they land in.

/** The sha256 of a file, in lowercase hex, read as a stream (the models and archives are gigabytes). */
export async function sha256Of(path: string): Promise<string> {
  const hash = createHash('sha256');
  await pipeline(createReadStream(path), hash);
  return hash.digest('hex');
}

/** The git blob id of a file (sha1 of `blob <size>\0` and the bytes): what a git host lists for a file kept in git itself. */
export async function gitBlobOidOf(path: string): Promise<string> {
  const hash = createHash('sha1').update(`blob ${statSync(path).size}\0`);
  await pipeline(createReadStream(path), hash);
  return hash.digest('hex');
}

/** A published hash: a sha256 (hex), or `{ gitOid }`, the git blob id of a file kept in git itself. */
export type PublishedHash = string | Readonly<{ gitOid: string }>;

const matches = async (path: string, expected: PublishedHash) =>
  typeof expected === 'string' ? (await sha256Of(path)) === expected.toLowerCase() : (await gitBlobOidOf(path)) === expected.gitOid.toLowerCase();

/** Throws a readable error, after deleting the file, when its hash is not `expected` (the next run downloads it again). */
export async function refuseAnotherFile(path: string, expected: PublishedHash, label: string): Promise<void> {
  if (await matches(path, expected)) return;
  await rm(path, { force: true });
  throw new Error(`${label} baixado não confere com o hash publicado (arquivo apagado; rode de novo para baixar outra vez)`);
}

const PLAIN_SEGMENT = /^(?!\.{1,2}$)[^\\/:]+$/;

/** A path from a remote listing, accepted only as plain `a/b/c` segments: no `..`, no absolute path, no backslash. */
export function plainRelativePath(path: string, label: string): string {
  const plain = typeof path === 'string' && path.split('/').every((segment) => PLAIN_SEGMENT.test(segment));
  if (!plain) throw new Error(`caminho inválido em ${label}: ${JSON.stringify(path)}`);
  return path;
}
