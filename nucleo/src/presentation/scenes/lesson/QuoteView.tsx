import type { FC } from 'react';
import { AbsoluteFill } from 'remotion';
import { Motion } from '../../../domain/lesson/Motion.ts';
import { QuoteLayout } from '../../../domain/lesson/QuoteLayout.ts';
import type { QuoteScene } from '../../../domain/script/LessonScenes.ts';
import type { SceneProps } from '../SceneRegistry.ts';
import { TEXT_FONT } from '../fonts.ts';
import { LessonFrame } from './LessonFrame.tsx';
import { useSceneClock } from './sceneClock.ts';
import { fadeUp, placed, THEME } from './theme.ts';


/** The key sentence: a big gradient quote mark, then its lines; the last paragraph in the brand color. */
export const QuoteView: FC<SceneProps<QuoteScene>> = (props) => {
  const { frame, fps } = useSceneClock();
  const drawing = QuoteLayout.for(props.scene, props.aspect);
  const { text } = drawing;
  const lineHeight = text.lineHeight();
  return (
    <LessonFrame props={props}>
      <AbsoluteFill>
        <div style={{ ...placed(drawing.mark), font: `900 ${drawing.markSize}px/0.6 ${TEXT_FONT}`, background: THEME.gradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', opacity: Motion.pop(frame, fps), overflow: 'visible' }}>“</div>
        {drawing.lines.map((line, index) => (
          <div key={index} style={{ position: 'absolute', left: text.rectangle.x, top: text.rectangle.y + index * lineHeight, whiteSpace: 'pre', fontFamily: TEXT_FONT, fontWeight: 900, fontSize: text.fit.size, lineHeight: `${lineHeight}px`, color: line.last ? THEME.brand : THEME.ink, ...fadeUp(Motion.pop(frame - line.delay, fps)) }}>
            {line.text}
          </div>
        ))}
      </AbsoluteFill>
    </LessonFrame>
  );
};
