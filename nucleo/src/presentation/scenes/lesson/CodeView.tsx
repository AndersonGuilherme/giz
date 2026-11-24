import type { CSSProperties, FC } from 'react';
import { AbsoluteFill } from 'remotion';
import { CodeLayout, type CodeDrawing, type CodeRow } from '../../../domain/lesson/CodeLayout.ts';
import { Motion } from '../../../domain/lesson/Motion.ts';
import type { CodeScene } from '../../../domain/script/LessonScenes.ts';
import type { SceneProps } from '../SceneRegistry.ts';
import { MONO_FONT } from '../fonts.ts';
import { CODE_COLORS, dimmedOpacity, TOKEN_COLORS, WINDOW_DOTS } from './codeHighlight.ts';
import { LessonFrame } from './LessonFrame.tsx';
import { useSceneClock } from './sceneClock.ts';
import { fadeUp, placed, THEME } from './theme.ts';

const MONOSPACE: CSSProperties = { fontFamily: MONO_FONT, fontVariantLigatures: 'none', fontFeatureSettings: '"liga" 0, "calt" 0', whiteSpace: 'pre' };

const rowBackground = (row: CodeRow, strength: number): string => {
  if (row.highlighted) return CODE_COLORS.highlightRow(strength);
  return row.added ? CODE_COLORS.addedRow : 'transparent';
};

const Bar: FC<Readonly<{ drawing: CodeDrawing }>> = ({ drawing }) => {
  const { bar, title } = drawing;
  const dot = bar.height * 0.26;
  return (
    <div style={{ ...placed(bar), background: CODE_COLORS.bar, borderRadius: '32px 32px 0 0', display: 'flex', alignItems: 'center', gap: dot * 0.7, paddingLeft: 30 }}>
      {WINDOW_DOTS.map((color) => <div key={color} style={{ width: dot, height: dot, borderRadius: dot / 2, background: color }} />)}
      <div style={{ position: 'absolute', left: title.rectangle.x - bar.x - 24, top: '50%', transform: 'translateY(-50%)', padding: '8px 24px', borderRadius: 12, background: CODE_COLORS.background, color: CODE_COLORS.chip, ...MONOSPACE, fontWeight: 600, fontSize: title.fit.size }}>{title.fit.lines.join(' ')}</div>
    </div>
  );
};

const Row: FC<Readonly<{ row: CodeRow; drawing: CodeDrawing; strength: number }>> = ({ row, drawing, strength }) => (
  <div style={{ ...placed(row.rectangle), display: 'flex', alignItems: 'center', ...MONOSPACE, fontWeight: 500, fontSize: drawing.size, background: rowBackground(row, strength), opacity: drawing.hasHighlight ? dimmedOpacity(row.highlighted, strength) : 1 }}>
    <div style={{ width: drawing.gutter.plus, flex: 'none', textAlign: 'center', color: row.added ? CODE_COLORS.added : 'transparent', fontWeight: 800 }}>+</div>
    <div style={{ width: drawing.gutter.number + drawing.gutter.numberPadding, flex: 'none', textAlign: 'right', paddingRight: drawing.gutter.numberPadding, boxSizing: 'border-box', color: CODE_COLORS.lineNumber }}>{row.number}</div>
    <div>{row.tokens.map((token, index) => <span key={index} style={{ color: TOKEN_COLORS[token.kind] }}>{token.text}</span>)}</div>
  </div>
);

/** The code window: the file name in the bar, added lines marked in green, highlighted lines lit and the rest dimmed. */
export const CodeView: FC<SceneProps<CodeScene>> = (props) => {
  const { frame, age, fps } = useSceneClock(props.changedAt);
  const drawing = CodeLayout.for(props.scene, props.aspect);
  const strength = drawing.hasHighlight ? CodeLayout.highlightProgress(age) : 0;
  return (
    <LessonFrame props={props}>
      <AbsoluteFill style={fadeUp(Motion.pop(frame, fps))}>
        <div style={{ ...placed(drawing.panel), background: CODE_COLORS.background, borderRadius: 32, boxShadow: THEME.shadow }} />
        <Bar drawing={drawing} />
        {drawing.rows.map((row) => <Row key={row.number} row={row} drawing={drawing} strength={strength} />)}
      </AbsoluteFill>
    </LessonFrame>
  );
};
