import type { FC } from 'react';
import { AbsoluteFill, type CalculateMetadataFunction } from 'remotion';
import type { Expression } from '../../domain/cast/PoseAndExpression.ts';
import type { ValidatedParameters } from '../rigs/RigModel.ts';
import { rigModels } from '../rigs/rigModels.ts';
import { portraitCorner, portraitSheetSize } from './portraitGrid.ts';
import { stillState } from './sheetParts.tsx';

/** One character to draw as a square portrait (head and shoulders). */
export type PortraitCard = Readonly<{ id: string; rig: string; parameters: ValidatedParameters; expression: Expression }>;
/** `cell`: the side of each square, in pixels; the portraits go left to right, `columns` per row. */
export type CastPortraitsProps = Readonly<{ cards: readonly PortraitCard[]; cell: number; columns: number }>;

const BACKDROP = '#33423f';
// The rig drawn this many cells tall, its top this far above the cell (in cells): the head and shoulders fill the square.
const RIG_HEIGHT = 1.45;
const RIG_TOP = 0.1;
const RIG_ASPECT = 520 / 630;

/** One row per `columns` portraits: the sheet is exactly as big as its cells. */
export const castPortraitsMetadata: CalculateMetadataFunction<CastPortraitsProps> = async ({ props }) => portraitSheetSize(props.cards.length, props);

const Portrait: FC<Readonly<{ card: PortraitCard; cell: number; index: number; columns: number }>> = ({ card, cell, index, columns }) => {
  const model = rigModels.get(card.rig);
  const height = cell * RIG_HEIGHT;
  const left = (cell - height * RIG_ASPECT) / 2;
  const cellStyle = { position: 'absolute', ...portraitCorner(index, { cell, columns }), width: cell, height: cell, overflow: 'hidden', background: BACKDROP } as const;
  return (
    <div style={cellStyle}>
      <div style={{ position: 'absolute', left, top: cell * RIG_TOP }}>
        <model.Component state={stillState({ expression: card.expression })} parameters={card.parameters} height={height} side={1} id={`portrait-${card.id}`} />
      </div>
    </div>
  );
};

/** The ready characters as square portraits in one picture: the Studio's cast picker cuts each one out of it. */
export const CastPortraits: FC<CastPortraitsProps> = ({ cards, cell, columns }) => (
  <AbsoluteFill style={{ background: BACKDROP }}>
    {cards.map((card, index) => <Portrait key={card.id} card={card} cell={cell} index={index} columns={columns} />)}
  </AbsoluteFill>
);
