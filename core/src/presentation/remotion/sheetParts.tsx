import type { CSSProperties, FC, ReactNode } from 'react';
import type { Expression, Pose } from '../../domain/cast/PoseAndExpression.ts';
import type { Viseme } from '../../domain/speech/Visemes.ts';
import { CharacterState } from '../../domain/character/CharacterState.ts';

// The Gizzycera board: chalk-colored text on a slate background, the cards a lighter slate.
export const INK = '#f3efe2';
export const BOARD = '#2a3634';
const CARD = '#3a4a47';
const MUTED = '#a9c2b8';
export const FONT = '"DejaVu Sans", "Liberation Sans", Arial, sans-serif';

type StillOptions = Readonly<{ pose?: Pose; expression?: Expression; viseme?: Viseme }>;

/** A still state for the sheet: no blink, no body motion; speaking only when a viseme is given. */
export function stillState({ pose = 'neutral', expression = 'neutral', viseme = 'X' }: StillOptions): CharacterState {
  return CharacterState.of({
    pose, expression: expression, look: 'camera', speaking: viseme !== 'X', viseme: viseme, opening: 0.85, blink: 0,
    body: { y: 0, rotation: 0, scale: 1 },
  });
}

const labelStyle: CSSProperties = { fontFamily: FONT, fontSize: 19, color: INK, textAlign: 'center', marginTop: 6, whiteSpace: 'nowrap' };

/** A card with a fixed window: `offset` moves the drawing inside it, the card clips on purpose (bust, face). */
export const Card: FC<Readonly<{ width: number; height: number; label: string; children: ReactNode; clip?: boolean }>> = (props) => (
  <div style={{ width: props.width, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <div style={{
      width: props.width, height: props.height, position: 'relative', overflow: props.clip ? 'hidden' : 'visible',
      background: props.clip ? CARD : 'transparent', borderRadius: 18, boxShadow: props.clip ? '0 2px 6px rgba(0,0,0,0.25)' : 'none',
    }}>
      {props.children}
    </div>
    <div style={labelStyle}>{props.label}</div>
  </div>
);

/** Places a drawing of size `width` at (`left`, `top`) inside a card. */
export const Placed: FC<Readonly<{ left: number; top: number; children: ReactNode }>> = ({ left, top, children }) => (
  <div style={{ position: 'absolute', left, top }}>{children}</div>
);

type SectionProps = Readonly<{ title: string; children: ReactNode; style?: CSSProperties; wrap?: boolean }>;

/** A titled row of cards; `wrap` packs them from the left in several lines. */
export const Section: FC<SectionProps> = ({ title, children, style, wrap }) => (
  <div style={style}>
    <div style={{ fontFamily: FONT, fontSize: 22, fontWeight: 700, color: MUTED, letterSpacing: 2, marginBottom: 8 }}>{title}</div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: wrap ? '10px 15px' : 10, justifyContent: wrap ? 'flex-start' : 'space-between' }}>{children}</div>
  </div>
);
