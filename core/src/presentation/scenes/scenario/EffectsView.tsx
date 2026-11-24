import type { FC } from 'react';
import type { Effect } from '../../../domain/script/SceneElements.ts';
import type { AspectRatio } from '../../../domain/values/AspectRatio.ts';
import type { Frame } from '../../../domain/values/Time.ts';
import type { EffectSpace } from './effects/EffectModel.ts';
import { effectRegistry } from './effects/effectRegistry.ts';

type EffectsProps = Readonly<{ effects: readonly Effect[]; space: EffectSpace; aspect: AspectRatio; frame: Frame }>;

/** The scene's effects that live in one space, in the order the script lists them. */
export const EffectsView: FC<EffectsProps> = ({ effects, space, aspect, frame }) => {
  const unit = Math.min(aspect.width(), aspect.height()) / 1000;
  return (
    <>
      {effects.map((effect, index) => {
        const model = effectRegistry[effect.type];
        if (model.space !== space) return null;
        return <model.Component key={index} effect={effect} aspect={aspect} frame={frame} unit={unit} />;
      })}
    </>
  );
};
