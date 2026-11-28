/** The digests gizzy keys its caches by (the voices use SHA-1, the scenario images SHA-256). */
export type DigestAlgorithm = 'SHA-1' | 'SHA-256';

// Web Crypto (a Node and browser global): the application does not import node:crypto.
/** The hex digest of a text (UTF-8) or of bytes. */
export async function hexDigest(algorithm: DigestAlgorithm, data: string | Uint8Array): Promise<string> {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const digest = await crypto.subtle.digest(algorithm, bytes as Uint8Array<ArrayBuffer>);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
