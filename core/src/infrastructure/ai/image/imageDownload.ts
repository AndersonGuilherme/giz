import type { GeneratedImage } from '../../../application/ports/ImageProvider.ts';
import { imageFormatOf } from '../../disk/imageSize.ts';

/** The largest image giz takes from a service (a 4K PNG is far below it). */
export const MAXIMUM_IMAGE_BYTES = 50 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

/** An answer giz refuses to save: the reason, in pt-BR, without the address's path or query. */
export class RejectedImage extends Error {}

const TOO_LARGE = `maior que ${MAXIMUM_IMAGE_BYTES / 1024 / 1024} MB`;
const hostAllowed = (host: string, hosts: readonly string[]) => hosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));

/** The link to download, only over https and only from the service's own hosts (`fal.media` is also `v3b.fal.media`). */
export function checkedLink(text: string, hosts: readonly string[]): URL {
  const url = URL.canParse(text) ? new URL(text) : undefined;
  if (url?.protocol !== 'https:') throw new RejectedImage('o endereço da imagem não é https');
  if (!hostAllowed(url.hostname, hosts)) throw new RejectedImage(`o endereço da imagem é de outro servidor (${url.hostname})`);
  return url;
}

/** The declared type must be one of the image formats (the bytes are checked too, by `checkedImage`). */
export function checkedType(response: Response): void {
  const type = (response.headers.get('content-type') ?? '').split(';')[0]!.trim().toLowerCase();
  if (!ALLOWED_TYPES.includes(type)) throw new RejectedImage(`o servidor mandou ${type || 'um tipo desconhecido'}, não uma imagem PNG, JPEG ou WebP`);
}

type Read = { chunks: Uint8Array[]; total: number };

// Counted while streaming: the download stops as soon as it passes the limit, whatever content-length said.
async function collected(reader: ReadableStreamDefaultReader<Uint8Array>, maximum: number, read: Read): Promise<Read> {
  const { done, value } = await reader.read();
  if (done) return read;
  read.total += value.length;
  read.chunks.push(value);
  if (read.total <= maximum) return collected(reader, maximum, read);
  await reader.cancel();
  throw new RejectedImage(TOO_LARGE);
}

/** The body, at most `maximum` bytes: a larger content-length is refused before reading. */
export async function cappedBytes(response: Response, maximum: number): Promise<Uint8Array> {
  if (Number(response.headers.get('content-length') ?? 0) > maximum) throw new RejectedImage(TOO_LARGE);
  const reader = response.body?.getReader();
  if (!reader) return new Uint8Array();
  const { chunks } = await collected(reader, maximum, { chunks: [], total: 0 });
  return new Uint8Array(Buffer.concat(chunks));
}

/** An image whose bytes are PNG, JPEG or WebP and within the limit; its type is the one the bytes show. */
export function checkedImage(bytes: Uint8Array, maximum: number): GeneratedImage {
  if (bytes.length > maximum) throw new RejectedImage(TOO_LARGE);
  const format = imageFormatOf(bytes);
  if (!format) throw new RejectedImage('o conteúdo não é uma imagem PNG, JPEG ou WebP');
  return { bytes, mime: `image/${format}` };
}
