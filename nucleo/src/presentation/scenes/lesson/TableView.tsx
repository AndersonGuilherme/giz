import type { FC } from 'react';
import { AbsoluteFill } from 'remotion';
import { Motion } from '../../../domain/lesson/Motion.ts';
import { Reveal } from '../../../domain/lesson/Reveal.ts';
import { TableLayout, type CellTone, type TableCell, type TableRow } from '../../../domain/lesson/TableLayout.ts';
import type { TableScene } from '../../../domain/script/LessonScenes.ts';
import type { SceneProps } from '../SceneRegistry.ts';
import { FittedText } from './FittedText.tsx';
import { LessonFrame } from './LessonFrame.tsx';
import { Panel } from './Panel.tsx';
import { useSceneClock } from './sceneClock.ts';
import { fadeUp, placed, THEME } from './theme.ts';

const TONE_COLORS: Readonly<Record<CellTone, string>> = { dot: THEME.brand, bad: THEME.danger, good: THEME.ok, plain: THEME.ink };
type Highlight = Readonly<{ column?: number; row?: number; strength: number }>;

const Cell: FC<Readonly<{ cell: TableCell; lit: boolean; strength: number }>> = ({ cell, lit, strength }) => {
  const dot = cell.text.fit.size * 1.1;
  return (
    <>
      <div style={{ ...placed(cell.band), background: lit ? `rgba(232,23,223,${0.16 * strength})` : 'transparent' }} />
      {cell.tone === 'dot'
        ? <div style={{ position: 'absolute', left: cell.band.x + cell.band.width / 2 - dot / 2, top: cell.band.y + cell.band.height / 2 - dot / 2, width: dot, height: dot, borderRadius: dot / 2, background: lit ? THEME.magenta : THEME.brand, transform: `scale(${lit ? 1 + 0.25 * strength : 1})` }} />
        : <FittedText block={cell.text} style={{ color: TONE_COLORS[cell.tone], textAlign: 'center' }} />}
    </>
  );
};

const Row: FC<Readonly<{ row: TableRow; index: number; progress: number; highlight: Highlight }>> = ({ row, index, progress, highlight }) => (
  <div style={{ position: 'absolute', inset: 0, opacity: progress, transform: `translateX(${(1 - progress) * -30}px)` }}>
    <div style={{ ...placed(row.rectangle), borderBottom: `2px solid ${THEME.line}`, background: highlight.row === index ? `rgba(232,23,223,${0.12 * highlight.strength})` : 'transparent' }} />
    <FittedText block={row.label} style={{ color: THEME.ink }} />
    {row.cells.map((cell, column) => <Cell key={column} cell={cell} lit={highlight.column === column} strength={highlight.strength} />)}
  </div>
);

/** The table: column names, then the rows revealed so far; a highlighted column or row lights up in 10 frames. */
export const TableView: FC<SceneProps<TableScene>> = (props) => {
  const { scene } = props;
  const { frame, age, fps } = useSceneClock(props.changedAt);
  const drawing = TableLayout.for(scene, props.aspect);
  const reveal = Reveal.of({ shown: scene.shownRows ?? scene.rows.length, animatesNewest: scene.highlightedColumn === undefined });
  const highlight = { column: scene.highlightedColumn, row: scene.highlightedRow, strength: TableLayout.highlightProgress(scene, age) };
  return (
    <LessonFrame props={props}>
      <AbsoluteFill style={fadeUp(Motion.pop(frame, fps))}>
        <Panel rectangle={drawing.panel} />
        {drawing.title && <FittedText block={drawing.title} weight={900} style={{ color: THEME.ink }} />}
        {drawing.rows[0] && <div style={{ ...placed({ ...drawing.rows[0].rectangle, y: drawing.headerBase - 3, height: 3 }), background: THEME.line }} />}
        {drawing.header.map((cell, column) => <FittedText key={column} block={cell.text} style={{ color: scene.highlightedColumn === column ? THEME.magenta : THEME.muted, textAlign: 'center' }} />)}
        {drawing.rows.map((row, index) => <Row key={index} row={row} index={index} progress={reveal.progressAt(index, age, fps)} highlight={highlight} />)}
      </AbsoluteFill>
    </LessonFrame>
  );
};
