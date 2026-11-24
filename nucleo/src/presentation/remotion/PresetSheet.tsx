import type { CSSProperties, FC } from 'react';
import { AbsoluteFill, staticFile, type CalculateMetadataFunction } from 'remotion';
import type { Expression, Pose } from '../../domain/cast/PoseAndExpression.ts';
import { GalleryGrid } from '../../domain/layout/GalleryGrid.ts';
import type { ValidatedParameters } from '../rigs/RigModel.ts';
import { rigModels } from '../rigs/rigModels.ts';
import { BOARD, FONT, INK, stillState } from './sheetParts.tsx';

/** One cast file as the gallery shows it. */
export type PresetCard = Readonly<{
  id: string; name: string; rig: string; parameters: ValidatedParameters; voice: string; personality: string; expression: Expression;
}>;

/** `characters`: cast JSON paths relative to the public folder; the metadata step reads them into `cards`. */
export type PresetSheetProps = Readonly<{ title: string; characters: readonly string[]; cards?: readonly PresetCard[] }>;

const SIZE = { width: 1920, height: 1080 };
const MARGIN = { side: 32, top: 92, bottom: 24 };
const GAP = 16;
const TEXT_HEIGHT = 118;
// Room above the rig's view box for tall hats (the witch hat's tip, the top hat's crown), in rig units.
const HEADROOM = 110;
const RIG = { width: 520, height: 630 };
// A few lively poses, one after another, so the gallery does not look like a line-up.
const POSES: readonly Pose[] = ['wave', 'explain', 'neutral', 'point', 'celebrate', 'shrug', 'think', 'neutral'];

const MUTED = '#a9c2b8';
const CARD = '#33423f';
const text = (size: number, color: string): CSSProperties => ({ fontFamily: FONT, fontSize: size, color, textAlign: 'center', lineHeight: 1.2 });

type CardJson = Readonly<{ id: string; name: string; rig?: string; parameters?: ValidatedParameters; voice: { id: string }; personality?: string; defaultExpression: Expression }>;

const toCard = (json: CardJson): PresetCard => ({
  id: json.id, name: json.name, rig: json.rig ?? 'giz', parameters: json.parameters ?? {}, voice: json.voice.id, personality: json.personality ?? '', expression: json.defaultExpression,
});

export const presetSheetMetadata: CalculateMetadataFunction<PresetSheetProps> = async ({ props }) => {
  const cards = await Promise.all(props.characters.map(async (path) => toCard(await (await fetch(staticFile(path))).json())));
  return { props: { ...props, cards } };
};

const details = (parameters: ValidatedParameters) =>
  [parameters.outfit, parameters.headwear, parameters.hair, parameters.facialHair].filter((value) => value && value !== 'none').join(' · ');

const Card: FC<Readonly<{ card: PresetCard; index: number; size: Readonly<{ width: number; height: number }> }>> = ({ card, index, size }) => {
  const model = rigModels.get(card.rig);
  const height = ((size.height - TEXT_HEIGHT) * RIG.height) / (RIG.height + HEADROOM);
  const state = stillState({ pose: POSES[index % POSES.length], expression: card.expression });
  return (
    <div style={{ ...size, background: CARD, borderRadius: 22, position: 'relative', overflow: 'hidden', boxShadow: '0 3px 8px rgba(0,0,0,0.3)' }}>
      <div style={{ position: 'absolute', left: (size.width - (height * RIG.width) / RIG.height) / 2, top: size.height - TEXT_HEIGHT - height }}>
        <model.Component state={state} parameters={card.parameters} height={height} side={index % 2 === 0 ? 1 : -1} id={card.id} />
      </div>
      <div style={{ position: 'absolute', left: 14, right: 14, bottom: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ ...text(30, INK), fontWeight: 700 }}>{card.name}</div>
        <div style={{ ...text(17, INK), opacity: 0.9, height: 42, overflow: 'hidden' }}>{card.personality}</div>
        <div style={{ ...text(14, MUTED), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>voz {card.voice} · {details(card.parameters)}</div>
      </div>
    </div>
  );
};

/** A gallery of ready cast files (an era, the creatures…): each character whole, with its name, personality and voice. */
export const PresetSheet: FC<PresetSheetProps> = ({ title, cards = [] }) => {
  const area = { width: SIZE.width - 2 * MARGIN.side, height: SIZE.height - MARGIN.top - MARGIN.bottom };
  const { columns, card } = GalleryGrid.for(Math.max(1, cards.length), area, GAP);
  return (
    <AbsoluteFill style={{ background: BOARD, padding: `24px ${MARGIN.side}px ${MARGIN.bottom}px` }}>
      <div style={{ fontFamily: FONT, fontSize: 36, fontWeight: 700, color: INK, height: MARGIN.top - 24 }}>
        Giz <span style={{ fontWeight: 400, color: MUTED }}>· elenco pronto · {title}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, ${card.width}px)`, gap: GAP }}>
        {cards.map((preset, index) => <Card key={preset.id} card={preset} index={index} size={card} />)}
      </div>
    </AbsoluteFill>
  );
};
