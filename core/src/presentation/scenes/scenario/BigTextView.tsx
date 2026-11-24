import type { FC } from 'react';
import { BigTextLayout, Entrance } from '../../../domain/scenario/BigTextLayout.ts';
import type { BigText } from '../../../domain/script/SceneElements.ts';
import type { AspectRatio } from '../../../domain/values/AspectRatio.ts';
import type { Frame } from '../../../domain/values/Time.ts';
import { TEXT_FONT } from '../fonts.ts';

// Thumbnail lettering: heavy, white by default, with a dark outline and a drop shadow so it reads over any scene.
const OUTLINE = '0 0 2px #120b07, 0 6px 0 rgba(18, 11, 7, 0.55), 0 0 28px rgba(0, 0, 0, 0.55)';

/** The big text of the scene, fitted by `TextFit` in its box, with its entrance (`pop` or `rise`). */
export const BigTextView: FC<Readonly<{ bigText: BigText; aspect: AspectRatio; frame: Frame }>> = ({ bigText, aspect, frame }) => {
  const { rectangle, fit, font } = BigTextLayout.for(bigText, aspect);
  const step = Entrance.of(bigText.entrance).at(frame);
  return (
    <div
      style={{
        position: 'absolute', left: rectangle.x, top: rectangle.y, width: rectangle.width, height: rectangle.height,
        fontFamily: TEXT_FONT, fontWeight: 900, fontSize: fit.size, lineHeight: font.lineHeight(), color: bigText.color ?? '#ffffff',
        textShadow: OUTLINE, WebkitTextStroke: `${Math.round(fit.size / 40)}px #120b07`, paintOrder: 'stroke fill',
        opacity: step.opacity, transform: `translateY(${step.y}px) scale(${step.scale})`, transformOrigin: '0% 50%',
      }}
    >
      {fit.lines.map((line, index) => <div key={index} style={{ whiteSpace: 'nowrap' }}>{line}</div>)}
    </div>
  );
};
