import type { ImageRequest } from '../../../application/ports/ImageProvider.ts';
import type { ImageProviderName } from '../../../domain/ai/ImageProviderName.ts';
import type { HttpCall } from '../text/textApi.ts';

/** Where the answer has the image: in it (base64, decoded) or at a link to download. */
export type ImageSource = Readonly<{ bytes: Uint8Array; mime: string }> | Readonly<{ url: string; mime?: string }>;

/** What differs between the image APIs: the request shape and where the answer has the image; the rest is HttpImageProvider. */
export type ImageApi = Readonly<{
  provider: ImageProviderName;
  /** The name people know, for the messages. */
  label: string;
  defaultModel: string;
  /** The hosts an image link may come from (with their subdomains); none: the API answers with the image itself. */
  downloadHosts: readonly string[];
  call(model: string, request: ImageRequest, key: string): HttpCall;
  /** Reads the parsed JSON answer; `undefined` when it holds no image (a refused prompt); throws on another shape. */
  image(body: unknown): ImageSource | undefined;
}>;

export const inlineImage = (base64: string, mime: string): ImageSource => ({ bytes: new Uint8Array(Buffer.from(base64, 'base64')), mime });

// Only a base64 image data URI is decoded; any other `data:` stays a link, and a link must be https (so it is refused).
const IMAGE_DATA_URI = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/s;

/** A link to the image; a `data:image/...;base64,` URI is the image itself, decoded with no download. */
export function linkedImage(url: string, mime?: string): ImageSource {
  const data = IMAGE_DATA_URI.exec(url);
  if (!data) return { url, mime };
  return inlineImage(data[2]!, data[1]!);
}
