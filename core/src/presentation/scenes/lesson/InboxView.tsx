import type { FC } from 'react';
import { AbsoluteFill } from 'remotion';
import { InboxLayout, NOTE_PILL, type InboxRow } from '../../../domain/lesson/InboxLayout.ts';
import { Motion } from '../../../domain/lesson/Motion.ts';
import type { TextBlock } from '../../../domain/lesson/TextBlock.ts';
import type { Rectangle } from '../../../domain/layout/Box.ts';
import type { InboxScene } from '../../../domain/script/LessonScenes.ts';
import type { Language } from '../../../domain/values/Language.ts';
import type { SceneProps } from '../SceneRegistry.ts';
import { TEXT_FONT } from '../fonts.ts';
import { FittedText } from './FittedText.tsx';
import { LessonFrame } from './LessonFrame.tsx';
import { useSceneClock } from './sceneClock.ts';
import { fadeUp, placed, THEME } from './theme.ts';

const Row: FC<Readonly<{ row: InboxRow; filled: boolean }>> = ({ row, filled }) => (
  <div style={{ opacity: filled ? 1 : 0.18 }}>
    <div style={{ ...placed(row.rectangle), height: 0, borderTop: `2px solid ${THEME.line}` }} />
    <div style={{ ...placed(row.avatar), borderRadius: row.avatar.width / 2, background: filled ? THEME.gradient : THEME.line }} />
    {filled && <FittedText block={row.subject} weight={800} style={{ color: THEME.ink }} />}
    {filled && <FittedText block={row.sender} weight={500} style={{ color: THEME.muted }} />}
  </div>
);

const Note: FC<Readonly<{ note: TextBlock }>> = ({ note }) => {
  const { x, y, width } = note.rectangle;
  const { padding } = NOTE_PILL;
  return (
    <div style={{ position: 'absolute', left: x - padding.x, top: y - padding.y, maxWidth: width + 2 * padding.x, padding: `${padding.y}px ${padding.x}px`, borderRadius: 999, background: '#FFF4D6', color: '#8A5A00', boxShadow: THEME.shadow, fontFamily: TEXT_FONT, fontWeight: 800, fontSize: note.fit.size, lineHeight: note.content.font.lineHeight(), letterSpacing: 0.5, whiteSpace: 'pre' }}>
      {note.fit.lines.join(' ')}
    </div>
  );
};

type BadgeProps = Readonly<{ rectangle: Rectangle; size: number; shown: number; scale: number; language: Language }>;

const Badge: FC<BadgeProps> = ({ rectangle, size, shown, scale, language }) => (
  <div style={{ ...placed(rectangle), borderRadius: 999, background: shown ? THEME.danger : THEME.line, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: TEXT_FONT, fontWeight: 900, fontSize: size, transform: `scale(${scale})` }}>
    {InboxLayout.countText(shown, language)}
  </div>
);

/** The inbox: the counter climbs to the scene count and the message rows fill up as it does. */
export const InboxView: FC<SceneProps<InboxScene>> = (props) => {
  const { scene, language } = props;
  const { frame, age, fps } = useSceneClock(props.changedAt);
  const drawing = InboxLayout.for(scene, props.aspect, language);
  const shown = InboxLayout.countAt(scene, age, fps);
  const filled = InboxLayout.filledRows(shown);
  const { badge, count } = drawing;
  return (
    <LessonFrame props={props}>
      <AbsoluteFill style={fadeUp(Motion.pop(frame, fps))}>
        <div style={{ ...placed(drawing.card), background: THEME.card, borderRadius: 48, boxShadow: THEME.shadow }} />
        {drawing.note && <Note note={drawing.note} />}
        <FittedText block={drawing.title} weight={800} style={{ color: THEME.ink }} />
        <Badge rectangle={badge} size={count.fit.size} shown={shown} scale={InboxLayout.badgeScale(scene, shown, age)} language={language} />
        {drawing.rows.map((row, index) => <Row key={index} row={row} filled={index < filled} />)}
      </AbsoluteFill>
    </LessonFrame>
  );
};
