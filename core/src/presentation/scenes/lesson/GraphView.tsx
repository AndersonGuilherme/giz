import type { FC } from 'react';
import { AbsoluteFill } from 'remotion';
import { GRAPH_LINE_HEIGHT, GraphLayout, type PlacedEdge, type PlacedNode } from '../../../domain/layout/GraphLayout.ts';
import { LessonStage } from '../../../domain/lesson/LessonStage.ts';
import { Motion } from '../../../domain/lesson/Motion.ts';
import type { GraphScene } from '../../../domain/script/LessonScenes.ts';
import type { SceneProps } from '../SceneRegistry.ts';
import { TEXT_FONT } from '../fonts.ts';
import { LessonFrame } from './LessonFrame.tsx';
import { useSceneClock } from './sceneClock.ts';
import { fadeUp, placed, THEME } from './theme.ts';

type Tone = NonNullable<GraphScene['nodes'][number]['tone']>;
const TONES: Readonly<Record<Tone, string>> = { core: THEME.brand, infrastructure: '#3D5A99', interface: THEME.magenta, soft: THEME.teal };


const Arrows: FC = () => (
  <defs>
    {['ok', 'bad'].map((kind) => (
      <marker key={kind} id={`arrow-${kind}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 Z" fill={kind === 'bad' ? THEME.danger : THEME.ink} />
      </marker>
    ))}
  </defs>
);

const Edge: FC<Readonly<{ placed: PlacedEdge; focus: number; pulse: number }>> = ({ placed: { edge, start, end }, focus, pulse }) => {
  const bad = edge.bad === true && focus > 0;
  return <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={bad ? THEME.danger : THEME.ink} strokeWidth={bad ? 10 * pulse : 7} markerEnd={`url(#arrow-${bad ? 'bad' : 'ok'})`} opacity={edge.bad ? 0.55 + 0.45 * Math.max(focus, 0.6) : 0.85} />;
};

const Node: FC<Readonly<{ node: PlacedNode }>> = ({ node }) => (
  <div style={{ ...placed(node.rectangle), padding: `${node.padding.y}px ${node.padding.x}px`, borderRadius: 28, background: TONES[node.node.tone ?? 'core'], color: '#fff', textAlign: 'center', fontFamily: TEXT_FONT, fontWeight: 800, fontSize: node.fit.size, lineHeight: GRAPH_LINE_HEIGHT, whiteSpace: 'pre', boxShadow: THEME.shadow }}>
    {node.lines.join('\n')}
  </div>
);

/** The dependency graph: boxes laid out without touching, arrows from border to border, the bad ones in red. */
export const GraphView: FC<SceneProps<GraphScene>> = (props) => {
  const { scene } = props;
  const { frame, age, fps } = useSceneClock(props.changedAt);
  const layout = GraphLayout.place(scene.nodes, LessonStage.for(props.aspect).content());
  const { focus, pulse } = GraphLayout.badFocus(scene.focusOnBad, age);
  return (
    <LessonFrame props={props}>
      <AbsoluteFill style={fadeUp(Motion.pop(frame, fps))}>
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
          <Arrows />
          {layout.edges(scene.edges).map((edge, index) => <Edge key={index} placed={edge} focus={focus} pulse={pulse} />)}
        </svg>
        {layout.nodes.map((node) => <Node key={node.node.id} node={node} />)}
      </AbsoluteFill>
    </LessonFrame>
  );
};
