import { z } from 'zod';
import { ASPECTS, type ChannelName, type RequestOf } from '../../shared/contract.ts';
import { translate } from '../text.ts';

const nothing = z.object({}).strict();
const folder = z.string().trim().min(1, { error: () => translate('errors.emptyFolder') });
const aspect = z.enum(ASPECTS);

type VideoChannel = Extract<ChannelName, `video.${string}`>;

/** The Video stage's payloads: a folder (granted, checked by the services) and an aspect; never a file path. */
export const VIDEO_SCHEMAS: { readonly [Name in VideoChannel]: z.ZodType<RequestOf<Name>> } = {
  'video.render': z.object({ folder, aspect }).strict(),
  'video.cancel': z.object({ folder }).strict(),
  'video.status': nothing,
  'video.preview': z.object({ folder, aspect: aspect.optional() }).strict(),
  'video.openFolder': z.object({ folder }).strict(),
  'video.copyCaptions': z.object({ folder, aspect }).strict(),
  'video.exportCaptions': z.object({ folder, aspect }).strict(),
};
