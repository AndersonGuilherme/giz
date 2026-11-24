import type { FC } from 'react';
import { AbsoluteFill } from 'remotion';
import { CardLayout, PILL_PADDING, type CardItem } from '../../../domain/lesson/CardLayout.ts';
import { Motion } from '../../../domain/lesson/Motion.ts';
import { Reveal } from '../../../domain/lesson/Reveal.ts';
import type { CardScene } from '../../../domain/script/LessonScenes.ts';
import type { SceneProps } from '../SceneRegistry.ts';
import { TEXT_FONT } from '../fonts.ts';
import { FittedText } from './FittedText.tsx';
import { LessonFrame } from './LessonFrame.tsx';
import { Panel } from './Panel.tsx';
import { useSceneClock } from './sceneClock.ts';
import { fadeUp, placed, THEME } from './theme.ts';

const COLORS: Readonly<Record<CardScene['variant'], string>> = {
  objective: THEME.brand, summary: THEME.ok, challenge: THEME.magenta, next: THEME.brand, ticket: THEME.teal, rule: THEME.amber,
};

const Item: FC<Readonly<{ item: CardItem; color: string; progress: number }>> = ({ item, color, progress }) => (
  <div style={{ ...fadeUp(progress), position: 'absolute', inset: 0 }}>
    <div style={{ ...placed(item.bullet), borderRadius: item.bullet.width * 0.3, background: color, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: TEXT_FONT, fontWeight: 900, fontSize: item.bullet.width / 2 }}>{item.mark}</div>
    <FittedText block={item.text} weight={700} style={{ color: THEME.ink }} />
  </div>
);

/** Label pill, title and the items revealed so far (the newest pops in). */
export const CardView: FC<SceneProps<CardScene>> = (props) => {
  const { scene } = props;
  const { frame, age, fps } = useSceneClock(props.changedAt);
  const drawing = CardLayout.for(scene, props.aspect, props.language);
  const reveal = Reveal.of({ shown: scene.shown ?? scene.items.length, animatesNewest: true });
  const color = COLORS[scene.variant];
  const pill = drawing.label.rectangle;
  return (
    <LessonFrame props={props}>
      <AbsoluteFill style={fadeUp(Motion.pop(frame, fps))}>
        <Panel rectangle={drawing.panel} />
        <div style={{ position: 'absolute', left: pill.x - PILL_PADDING.x, top: pill.y - PILL_PADDING.y, padding: `${PILL_PADDING.y}px ${PILL_PADDING.x}px`, borderRadius: 999, background: color, color: '#fff', fontFamily: TEXT_FONT, fontWeight: 800, fontSize: drawing.label.fit.size, lineHeight: drawing.label.content.font.lineHeight(), letterSpacing: 1, whiteSpace: 'pre' }}>
          {drawing.label.fit.lines.join(' ')}
        </div>
        <FittedText block={drawing.title} weight={900} style={{ color: THEME.ink }} />
        {drawing.items.map((item, index) => <Item key={index} item={item} color={color} progress={reveal.progressAt(index, age, fps)} />)}
      </AbsoluteFill>
    </LessonFrame>
  );
};
