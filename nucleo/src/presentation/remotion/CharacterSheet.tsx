import type { FC } from 'react';
import { AbsoluteFill } from 'remotion';
import { EXPRESSIONS, POSES } from '../../domain/cast/PoseAndExpression.ts';
import type { Viseme } from '../../domain/speech/Visemes.ts';
import type { RigModel, ValidatedParameters } from '../rigs/RigModel.ts';
import { rigModels } from '../rigs/rigModels.ts';
import { Card, FONT, INK, Placed, Section, stillState } from './sheetParts.tsx';
import { VARIATIONS } from './sheetVariations.ts';

export type CharacterSheetProps = Readonly<{ rig: string; character?: string; parameters?: ValidatedParameters }>;

const EXPRESSION_LABELS = ['neutra', 'feliz', 'animada', 'surpresa', 'confusa', 'pensativa', 'cética', 'preocupada', 'brava', 'assustada'];
const POSE_LABELS = ['neutra', 'explicar', 'apontar', 'acenar', 'levantar', 'pensar', 'ombros', 'comemorar', 'mão na cabeça', 'mãos na boca'];
const VISEMES: readonly (readonly [Viseme, string])[] = [
  ['X', 'X repouso'], ['M', 'M  m b p'], ['A', 'A  a'], ['E', 'E  e é'], ['I', 'I  i'],
  ['O', 'O  o ó'], ['U', 'U  u'], ['F', 'F  f v'], ['C', 'C  consoante'],
];

// Drawing origin: the rig's view box starts at (-60, -30) units, so the head center (200, 165) sits at (260, 195) × scale.
const scaleOf = (height: number) => height / 630;

type Sheet = Readonly<{ model: RigModel; parameters: ValidatedParameters }>;

const Expressions: FC<Sheet> = ({ model, parameters }) => {
  const [height, card] = [340, { width: 176, height: 196 }];
  const scale = scaleOf(height);
  return (
    <Section title="EXPRESSÕES">
      {EXPRESSIONS.map((expression, index) => (
        <Card key={expression} {...card} label={EXPRESSION_LABELS[index] ?? expression} clip>
          <Placed left={card.width / 2 - 260 * scale} top={card.height * 0.56 - 195 * scale}>
            <model.Component state={stillState({ expression })} parameters={parameters} height={height} side={1} />
          </Placed>
        </Card>
      ))}
    </Section>
  );
};

const Poses: FC<Sheet> = ({ model, parameters }) => {
  const [height, card] = [258, { width: 176, height: 270 }];
  const scale = scaleOf(height);
  return (
    <Section title="POSES">
      {POSES.map((pose, index) => (
        <Card key={pose} {...card} label={POSE_LABELS[index] ?? pose}>
          <Placed left={card.width / 2 - 260 * scale} top={card.height - 620 * scale - 4}>
            <model.Component state={stillState({ pose })} parameters={parameters} height={height} side={1} />
          </Placed>
        </Card>
      ))}
    </Section>
  );
};

const Visemes: FC<Sheet> = ({ model, parameters }) => {
  const [height, card] = [400, { width: 170, height: 124 }];
  const scale = scaleOf(height);
  return (
    <Section title="VISEMAS (BOCA NA FALA)" style={{ width: 910 }} wrap>
      {VISEMES.map(([viseme, label]) => (
        <Card key={viseme} {...card} label={label} clip>
          <Placed left={card.width / 2 - 260 * scale} top={card.height / 2 - 250 * scale}>
            <model.Component state={stillState({ viseme })} parameters={parameters} height={height} side={1} />
          </Placed>
        </Card>
      ))}
    </Section>
  );
};

const Variations: FC<Sheet> = ({ model, parameters }) => {
  const [height, card] = [282, { width: 214, height: 300 }];
  const scale = scaleOf(height);
  return (
    <Section title="VARIAÇÕES (PARÂMETROS)" style={{ width: 920 }}>
      {(VARIATIONS[model.id] ?? []).map((variation) => (
        <Card key={variation.label} {...card} label={variation.label}>
          <Placed left={card.width / 2 - 260 * scale} top={card.height - 620 * scale - 4}>
            <model.Component state={stillState(variation)} parameters={{ ...parameters, ...variation.parameters }} height={height} side={variation.side} />
          </Placed>
        </Card>
      ))}
    </Section>
  );
};

/** The character sheet: every expression, pose and viseme, plus outfit and hair variations, on one 1920×1080 frame. */
export const CharacterSheet: FC<CharacterSheetProps> = ({ rig, parameters = {} }) => {
  const sheet = { model: rigModels.get(rig), parameters };
  return (
    <AbsoluteFill style={{ background: '#f4efe4', padding: '18px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontFamily: FONT, fontSize: 32, fontWeight: 700, color: INK }}>
        {sheet.model.name['pt-BR']} <span style={{ fontWeight: 400, color: '#7a6a52' }}>· ficha do personagem</span>
      </div>
      <Expressions {...sheet} />
      <Poses {...sheet} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Visemes {...sheet} />
        <Variations {...sheet} />
      </div>
    </AbsoluteFill>
  );
};
