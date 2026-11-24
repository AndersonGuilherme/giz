import type { FC } from 'react';
import { AbsoluteFill } from 'remotion';
import { SymptomsLayout, type SymptomCell } from '../../../domain/lesson/SymptomsLayout.ts';
import type { SymptomsScene } from '../../../domain/script/LessonScenes.ts';
import type { SceneProps } from '../SceneRegistry.ts';
import { TEXT_FONT } from '../fonts.ts';
import { FittedText } from './FittedText.tsx';
import { LessonFrame } from './LessonFrame.tsx';
import { useSceneClock } from './sceneClock.ts';
import { placed, THEME } from './theme.ts';

const COLORS = ['#FF7A45', '#E5484D', '#7B2FF2', '#0EA5A4'];
const WAITING = '#c9bfe0';

type CardLook = Readonly<{ cell: SymptomCell; color: string; progress: number; opacity: number; focused: boolean }>;

// A clue not revealed yet: a dashed outline with "?" in place of the name.
const Hidden: FC<Readonly<{ cell: SymptomCell }>> = ({ cell }) => (
  <>
    <div style={{ ...placed(cell.rectangle), borderRadius: 32, background: 'rgba(255,255,255,.5)', border: '4px dashed #d9cff0' }} />
    <FittedText block={cell.clue} weight={900} style={{ color: WAITING }} />
    <div style={{ position: 'absolute', left: cell.name.rectangle.x, top: cell.name.rectangle.y, font: `900 ${cell.name.fit.size}px ${TEXT_FONT}`, color: WAITING }}>?</div>
  </>
);

const Shown: FC<CardLook> = ({ cell, color, progress, opacity, focused }) => (
  <div style={{ position: 'absolute', inset: 0, opacity, transformOrigin: `${cell.rectangle.x + cell.rectangle.width / 2}px ${cell.rectangle.y + cell.rectangle.height / 2}px`, transform: `scale(${(0.9 + 0.1 * progress) * (focused ? 1.03 : 1)})` }}>
    <div style={{ ...placed(cell.rectangle), borderRadius: 32, background: THEME.card, boxShadow: THEME.shadow, border: `4px solid ${color}` }} />
    <FittedText block={cell.clue} weight={900} style={{ color }} />
    <FittedText block={cell.name} weight={900} style={{ color: THEME.ink }} />
    <FittedText block={cell.description} weight={600} style={{ color: THEME.muted, opacity: progress }} />
  </div>
);

/** The clues grid: revealed clues show name and description; the focus dims the others. */
export const SymptomsView: FC<SceneProps<SymptomsScene>> = (props) => {
  const { scene } = props;
  const { age, fps } = useSceneClock(props.changedAt);
  const { cells } = SymptomsLayout.for(scene, props.aspect, props.language);
  const reveal = SymptomsLayout.reveal(scene);
  return (
    <LessonFrame props={props}>
      <AbsoluteFill>
        {cells.map((cell, index) => (reveal.isVisible(index)
          ? <Shown key={index} cell={cell} color={COLORS[index % COLORS.length]!} progress={reveal.progressAt(index, age, fps)} opacity={SymptomsLayout.focusOpacity(scene, index, age)} focused={scene.focus === index} />
          : <Hidden key={index} cell={cell} />))}
      </AbsoluteFill>
    </LessonFrame>
  );
};
