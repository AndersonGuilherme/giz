import { z } from 'zod';
import { onInterfaceLanguage, translate } from '../text.ts';
import { ASPECTS, KEY_PROVIDERS, type ChannelName, type RequestOf } from '../../shared/contract.ts';
import { DEVICES, IMAGE_PROVIDERS, INTERFACE_LANGUAGES, REMOTION_LICENSES, TEXT_PROVIDERS, VOICE_MODELS, VOICE_PROVIDERS } from '../../shared/settings.ts';
import { SETUP_TASKS } from '../../shared/setup.ts';
import { MEDIA_SCHEMAS } from './mediaSchemas.ts';
import { IDEA_REQUEST, SCENE_REQUEST, SCRIPT_REQUEST } from './scriptSchemas.ts';

// zod's own messages (wrong type, unknown key, invalid option) in the interface language, following its changes.
const ZOD_LOCALES = { 'pt-BR': z.locales.ptBR, en: z.locales.en } as const;
onInterfaceLanguage((language) => z.config(ZOD_LOCALES[language]()));

const nothing = z.object({}).strict();
const folder = z.string().trim().min(1, { error: () => translate('errors.emptyFolder') });
const provider = z.enum(KEY_PROVIDERS);
const source = z.object({ source: z.enum(['default', 'pick']) }).strict();
const task = z.object({ task: z.enum(SETUP_TASKS) }).strict();
const providers = z.object({ text: z.enum(TEXT_PROVIDERS), image: z.enum(IMAGE_PROVIDERS), voice: z.enum(VOICE_PROVIDERS) }).partial().strict();
const patch = z.object({
  language: z.enum(INTERFACE_LANGUAGES),
  providers,
  device: z.enum(DEVICES),
  model: z.enum(VOICE_MODELS),
  remotionLicense: z.enum(REMOTION_LICENSES),
}).partial().strict();

/** The zod schema of each channel's payload: the main process trusts nothing the window sends before this. */
export const REQUEST_SCHEMAS: { readonly [Name in ChannelName]: z.ZodType<RequestOf<Name>> } = {
  ...MEDIA_SCHEMAS,
  'projects.pick': nothing,
  'projects.launched': nothing,
  'projects.open': z.object({ folder }).strict(),
  'projects.check': z.object({ folder }).strict(),
  'video.render': z.object({ folder, aspect: z.enum(ASPECTS) }).strict(),
  'video.cancel': nothing,
  'keys.set': z.object({ provider, key: z.string().trim().min(1, { error: () => translate('errors.emptyKey') }).max(4096) }).strict(),
  'keys.has': z.object({ provider }).strict(),
  'keys.remove': z.object({ provider }).strict(),
  'keys.status': nothing,
  'keys.test': z.object({ provider }).strict(),
  'settings.get': nothing,
  'settings.update': patch,
  'settings.projectsFolder': source,
  'settings.modelsFolder': source,
  'settings.finish': nothing,
  'gpu.status': nothing,
  'models.status': nothing,
  'setup.run': task,
  'setup.stop': task,
  'projects.list': nothing,
  'projects.create': IDEA_REQUEST,
  'projects.duplicate': z.object({ folder }).strict(),
  'projects.trash': z.object({ folder }).strict(),
  'projects.forget': z.object({ folder }).strict(),
  'projects.stages': z.object({ folder }).strict(),
  'ideas.presets': nothing,
  'ideas.portraits': nothing,
  'script.estimate': IDEA_REQUEST,
  'script.generate': IDEA_REQUEST,
  'script.cancel': nothing,
  'script.read': z.object({ folder }).strict(),
  'script.save': z.object({ folder, script: SCRIPT_REQUEST }).strict(),
  'script.check': z.object({ folder }).strict(),
  'script.vocabulary': nothing,
  'script.checkScene': SCENE_REQUEST,
};
