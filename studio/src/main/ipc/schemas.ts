import { z } from 'zod';
import { INTERFACE_LANGUAGE, translate } from '../text.ts';
import { ASPECTS, KEY_PROVIDERS, type ChannelName, type RequestOf } from '../../shared/contract.ts';

// zod's own messages (wrong type, unknown key, invalid option) in the interface language.
const ZOD_LOCALES = { 'pt-BR': z.locales.ptBR, en: z.locales.en } as const;
z.config(ZOD_LOCALES[INTERFACE_LANGUAGE]());

const nothing = z.object({}).strict();
const folder = z.string().trim().min(1, translate('errors.emptyFolder'));
const provider = z.enum(KEY_PROVIDERS);

/** The zod schema of each channel's payload: the main process trusts nothing the window sends before this. */
export const REQUEST_SCHEMAS: { readonly [Name in ChannelName]: z.ZodType<RequestOf<Name>> } = {
  'projects.pick': nothing,
  'projects.launched': nothing,
  'projects.open': z.object({ folder }).strict(),
  'projects.check': z.object({ folder }).strict(),
  'video.render': z.object({ folder, aspect: z.enum(ASPECTS) }).strict(),
  'video.cancel': nothing,
  'keys.set': z.object({ provider, key: z.string().trim().min(1, translate('errors.emptyKey')).max(4096) }).strict(),
  'keys.has': z.object({ provider }).strict(),
  'keys.remove': z.object({ provider }).strict(),
};
