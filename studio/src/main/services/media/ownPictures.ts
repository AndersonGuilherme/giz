import { MAXIMUM_IMAGE_BYTES } from '../../../shared/scenarios.ts';
import type { MediaCore, MediaFiles } from '../../ports/MediaCore.ts';
import { translate } from '../../text.ts';
import { StudioError } from '../StudioError.ts';
import { ownFile } from './sceneCards.ts';

const OWN_FORMATS = ['png', 'jpeg', 'webp'] as const;
type Parts = Readonly<{ core: MediaCore; files: MediaFiles }>;
type Upload = Readonly<{ folder: string; lineId: string; bytes: Uint8Array }>;

/**
 * Saves the person's picture of a scene as scenes/own/<id>.<ext> (its format told by its first bytes, never by its
 * name) and removes that line's picture of another format (an earlier upload); gives the file saved.
 */
export async function savedOwnPicture({ core, files }: Parts, { folder, lineId, bytes }: Upload): Promise<string> {
  if (bytes.byteLength > MAXIMUM_IMAGE_BYTES) throw new StudioError('invalid-request', translate('scenarios.tooBig', { most: MAXIMUM_IMAGE_BYTES / 1024 / 1024 }));
  const format = await core.imageFormat(bytes);
  if (!format) throw new StudioError('invalid-request', translate('scenarios.notAPicture'));
  await files.write(folder, ownFile(lineId, format), bytes);
  const others = OWN_FORMATS.filter((other) => other !== format);
  await Promise.all(others.map((other) => files.remove(folder, ownFile(lineId, other))));
  return ownFile(lineId, format);
}
