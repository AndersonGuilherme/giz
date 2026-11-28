import type { QwenModel } from '../../../shared/cast.ts';
import type { MediaFiles } from '../../ports/MediaCore.ts';
import type { ProjectDisk } from '../../ports/ProjectDisk.ts';
import { translate } from '../../text.ts';
import { StudioError } from '../StudioError.ts';
import { projectVoiceOf } from './castFiles.ts';
import { projectOf } from './projectJson.ts';

// The local voice is never downloaded by a voice job or a sample (the Studio downloads models only from Settings): its
// model must already be there, or the person is sent to Settings.

/** Whether the local voice's model (that size, or the configured one) is downloaded. */
export type LocalVoiceReady = (model?: QwenModel) => Promise<boolean>;
type Parts = Readonly<{ disk: ProjectDisk; files: MediaFiles; localVoiceReady: LocalVoiceReady }>;
/** `takes`: whether a line with the person's own take counts as made without the model (false when the take goes). */
type Lines = Readonly<{ ids: readonly string[]; takes: boolean }>;

/** The refusal that offers Settings. */
export const modelNeeded = (): StudioError => new StudioError('needs-setup', translate('voices.needsModel'));

/** Throws when the model is required (the local voice makes at least one of these lines) and is not downloaded. */
export async function refuseWithoutModel(parts: Parts, folder: string, lines: Lines): Promise<void> {
  const { provider, model } = projectVoiceOf(await projectOf(parts.disk, folder));
  if (provider !== 'qwen') return;
  const taken = await Promise.all(lines.ids.map((id) => lines.takes && parts.files.exists(folder, `recordings/${id}.wav`)));
  if (taken.every(Boolean) || (await parts.localVoiceReady(model))) return;
  throw modelNeeded();
}
