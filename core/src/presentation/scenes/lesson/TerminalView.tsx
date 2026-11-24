import type { CSSProperties, FC } from 'react';
import { AbsoluteFill } from 'remotion';
import { Motion } from '../../../domain/lesson/Motion.ts';
import { TerminalLayout, type TerminalRow } from '../../../domain/lesson/TerminalLayout.ts';
import { Typing } from '../../../domain/lesson/Typing.ts';
import type { TerminalScene } from '../../../domain/script/LessonScenes.ts';
import type { SceneProps } from '../SceneRegistry.ts';
import { MONO_FONT } from '../fonts.ts';
import { LessonFrame } from './LessonFrame.tsx';
import { useSceneClock } from './sceneClock.ts';
import { fadeUp, placed, THEME } from './theme.ts';

const TONES: Readonly<Record<TerminalRow['tone'], string>> = { fail: '#FF6B6B', ok: '#28C840', dim: '#9a90b8' };
const PROMPT_COLOR = '#28C840';
const TEXT_COLOR = '#e8e2ff';

const monospace = (size: number): CSSProperties => ({
  fontFamily: MONO_FONT, fontSize: size, fontWeight: 500, fontVariantLigatures: 'none', fontFeatureSettings: '"liga" 0, "calt" 0', whiteSpace: 'pre', display: 'flex', alignItems: 'center',
});

/** The terminal: the command being typed with a blinking cursor, then the output lines fading in one by one. */
export const TerminalView: FC<SceneProps<TerminalScene>> = (props) => {
  const { frame, age, fps } = useSceneClock(props.changedAt);
  const drawing = TerminalLayout.for(props.scene, props.aspect);
  const typing = Typing.of(props.scene.command);
  return (
    <LessonFrame props={props}>
      <AbsoluteFill style={fadeUp(Motion.pop(frame, fps))}>
        <div style={{ ...placed(drawing.panel), background: '#0F0B1A', borderRadius: 32, boxShadow: THEME.shadow }} />
        <div style={{ ...placed(drawing.prompt), ...monospace(drawing.size), color: TEXT_COLOR }}>
          <span style={{ color: PROMPT_COLOR }}>$ </span>{typing.typedAt(frame)}<span style={{ opacity: typing.cursorVisible(frame) ? 1 : 0 }}>▌</span>
        </div>
        {drawing.rows.map((row, index) => (
          <div key={index} style={{ ...placed(row.rectangle), ...monospace(drawing.size), color: TONES[row.tone], fontWeight: row.tone === 'fail' ? 800 : 500, opacity: Typing.lineOpacity(index, age) }}>{row.text}</div>
        ))}
      </AbsoluteFill>
    </LessonFrame>
  );
};
