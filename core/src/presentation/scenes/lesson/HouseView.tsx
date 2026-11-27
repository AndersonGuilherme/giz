import type { FC } from 'react';
import { AbsoluteFill } from 'remotion';
import { HouseLayout } from '../../../domain/lesson/HouseLayout.ts';
import { Motion } from '../../../domain/lesson/Motion.ts';
import type { HouseScene } from '../../../domain/script/LessonScenes.ts';
import type { Fps } from '../../../domain/values/Time.ts';
import type { SceneProps } from '../SceneRegistry.ts';
import { FittedText } from './FittedText.tsx';
import { LessonFrame } from './LessonFrame.tsx';
import { Panel } from './Panel.tsx';
import { useSceneClock } from './sceneClock.ts';
import { fadeUp, placed, THEME } from './theme.ts';

type Marks = Readonly<{ wall: number; tv: number; screenOff: boolean; tvBroken: boolean; bulbOut: boolean }>;

// The motor's drawing (canvas 1000 × 680): roof, walls, the bulb, the TV and the shower; the cracks pop in with their mark.
const Walls: FC<Readonly<{ bulbOut: boolean }>> = ({ bulbOut }) => (
  <>
    <path d="M100,300 L500,60 L900,300" fill="none" stroke={THEME.brand} strokeWidth="22" strokeLinejoin="round" strokeLinecap="round" />
    <rect x="150" y="290" width="700" height="360" rx="18" fill="#F4EEFF" stroke={THEME.brand} strokeWidth="10" />
    <line x1="500" y1="290" x2="500" y2="650" stroke={THEME.brand} strokeWidth="8" />
    <line x1="320" y1="290" x2="320" y2="350" stroke={THEME.ink} strokeWidth="5" />
    <circle cx="320" cy="372" r="24" fill={bulbOut ? '#d9d2e6' : '#FFD54A'} stroke={THEME.ink} strokeWidth="5" />
  </>
);

const House: FC<Readonly<{ marks: Marks }>> = ({ marks }) => (
  <>
    <Walls bulbOut={marks.bulbOut} />
    <g opacity={marks.wall} transform={`translate(0 ${(1 - marks.wall) * 20})`}>
      <path d="M210,420 l40,30 -20,30 50,25 -15,40 45,20" fill="none" stroke={THEME.danger} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M270,560 l70,-20 30,40" fill="none" stroke={THEME.danger} strokeWidth="9" strokeLinecap="round" />
    </g>
    <rect x="560" y="470" width="180" height="120" rx="12" fill={marks.screenOff ? '#111' : '#7FD3FF'} stroke={THEME.ink} strokeWidth="6" />
    <line x1="620" y1="590" x2="600" y2="630" stroke={THEME.ink} strokeWidth="6" />
    <line x1="680" y1="590" x2="700" y2="630" stroke={THEME.ink} strokeWidth="6" />
    <path d="M790,330 h40 v40" fill="none" stroke={THEME.ink} strokeWidth="8" strokeLinecap="round" />
    <path d="M790,385 l-8,24 M808,385 l0,26 M826,385 l8,24" stroke="#4FB3FF" strokeWidth="6" strokeLinecap="round" opacity={marks.tvBroken ? 1 : 0.4} />
    <g opacity={marks.tv}>
      <path d="M790,420 L740,460 L770,465 L730,520" fill="none" stroke={THEME.danger} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </>
);

function marksOf(scene: HouseScene, clock: Readonly<{ age: number; fps: Fps }>): Marks {
  const { age } = clock;
  return {
    wall: HouseLayout.markProgress(scene, 'wall', clock), tv: HouseLayout.markProgress(scene, 'tv', clock),
    screenOff: HouseLayout.screenOff(scene, age), tvBroken: HouseLayout.has(scene, 'tv'), bulbOut: HouseLayout.has(scene, 'wall'),
  };
}

/** The house analogy: changing the bulb breaks the wall, turning on the shower turns off the TV. */
export const HouseView: FC<SceneProps<HouseScene>> = (props) => {
  const { scene } = props;
  const { frame, age, fps } = useSceneClock(props.changedAt);
  const drawing = HouseLayout.for(scene, props.aspect, props.language);
  const marks = marksOf(scene, { age, fps });
  const label = { color: THEME.danger, textAlign: 'center' } as const;
  return (
    <LessonFrame props={props}>
      <AbsoluteFill style={fadeUp(Motion.pop(frame, fps))}>
        <Panel rectangle={drawing.panel} />
        <svg viewBox="0 0 1000 680" style={{ ...placed(drawing.art), overflow: 'visible' }}>
          <House marks={marks} />
        </svg>
        <FittedText block={drawing.wall} weight={900} style={{ ...label, opacity: marks.wall, transform: `translateY(${(1 - marks.wall) * 20 * drawing.scale}px)` }} />
        <FittedText block={drawing.tv} weight={900} style={{ ...label, opacity: marks.tv }} />
      </AbsoluteFill>
    </LessonFrame>
  );
};
