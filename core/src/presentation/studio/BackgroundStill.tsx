import type { FC } from 'react';
import { Framing } from '../../domain/camera/Framing.ts';
import type { VectorBackground } from '../../domain/scenario/BackgroundSource.ts';
import { AspectRatio, type AspectRatioText } from '../../domain/values/AspectRatio.ts';
import { BackgroundView } from '../scenes/scenario/BackgroundView.tsx';

type Props = Readonly<{ vector: VectorBackground; aspect: AspectRatioText; width: number; colors?: Readonly<Record<string, string>> }>;

const NEUTRAL = Framing.neutral();
const ignore = () => undefined;

/** A vector background as a still thumbnail `width` pixels wide: every layer, no camera move, no characters. */
export const BackgroundStill: FC<Props> = ({ vector, aspect, width, colors = {} }) => {
  const ratio = AspectRatio.of(aspect);
  const scale = width / ratio.width();
  const view = { choice: { kind: 'vector', vector, colors }, camera: NEUTRAL, aspect: ratio, onImageError: ignore } as const;
  return (
    <div style={{ width, height: ratio.height() * scale, position: 'relative', overflow: 'hidden' }}>
      <div style={{ width: ratio.width(), height: ratio.height(), position: 'absolute', transform: `scale(${scale})`, transformOrigin: '0 0' }}>
        <BackgroundView {...view} part="behind" />
        <BackgroundView {...view} part="front" />
      </div>
    </div>
  );
};
