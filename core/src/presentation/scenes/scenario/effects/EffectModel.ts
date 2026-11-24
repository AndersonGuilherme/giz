import type { FC } from 'react';
import type { Effect } from '../../../../domain/script/SceneElements.ts';
import type { AspectRatio } from '../../../../domain/values/AspectRatio.ts';
import type { Frame } from '../../../../domain/values/Time.ts';

/** `unit` is 1/1000 of the shorter side of the frame, as in the backgrounds. */
export type EffectProps = Readonly<{ effect: Effect; aspect: AspectRatio; frame: Frame; unit: number }>;

/** `world` effects move with the camera (a fire on the floor); `screen` ones stay on the glass (vignette, rain). */
export type EffectSpace = 'world' | 'screen';
export type EffectModel = Readonly<{ Component: FC<EffectProps>; space: EffectSpace }>;
