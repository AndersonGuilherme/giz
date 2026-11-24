import type { FC } from 'react';
import { FacialHair as FacialHairStyle } from '../../../domain/character/hair/FacialHair.ts';
import { HairStyle } from '../../../domain/character/hair/HairStyle.ts';
import type { HeadLayer } from '../../../domain/character/HeadPart.ts';
import { shade } from '../svg.ts';
import { HeadParts, type Painter } from './HeadParts.tsx';
import { accentOf, type Look } from './parameters.ts';

// Hair behind the head is a little darker; ties take the outfit accent; stubble and shaved sides are a faint shadow.
const hairPainter = (look: Look, layer: HeadLayer): Painter => {
  const paints: Readonly<Record<string, ReturnType<Painter>>> = {
    hair: { fill: layer === 'back' ? shade(look.hairColor, -0.16) : look.hairColor },
    tie: { fill: accentOf(look), width: 4.5 },
    shadow: { fill: look.hairColor, opacity: 0.22, chalk: false },
  };
  return (role) => paints[role] ?? paints.hair!;
};

/** The hair of the look's style, built on its head shape. */
export const Hair: FC<Readonly<{ look: Look; layer: HeadLayer }>> = ({ look, layer }) => (
  <HeadParts parts={HairStyle.parts(look.hair, look.headShape)} layer={layer} look={look} paint={hairPainter(look, layer)} group="hair" />
);

// Beards are small next to the head: a thinner chalk line.
const beardPainter = (look: Look): Painter => {
  const paint = hairPainter(look, 'front');
  return (role) => ({ ...paint(role), width: 4 });
};

/** Beard, mustache, goatee or stubble, drawn on the head and under the mouth (the lips stay on top). */
export const FacialHair: FC<Readonly<{ look: Look }>> = ({ look }) => (
  <HeadParts parts={FacialHairStyle.parts(look.facialHair, look.headShape)} layer="front" look={look} paint={beardPainter(look)} group="beard" />
);
