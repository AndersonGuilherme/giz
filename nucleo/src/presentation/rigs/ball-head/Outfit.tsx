import type { FC } from 'react';
import { FEET } from './measures.ts';
import type { Look, Outfit as OutfitName } from './parameters.ts';
import { shade, useSvgId } from './svg.ts';

type Clothes = Readonly<{ hem: number; legs: string; shoes: string; Torso: FC<Readonly<{ look: Look }>> }>;

const SHIRT = 'M126,300 C150,286 250,286 274,300 L284,452 C240,464 160,464 116,452 Z';
const TUNIC = 'M126,300 C150,286 250,286 274,300 L296,506 C240,520 160,520 104,506 Z';
const BODICE = 'M128,300 C150,286 250,286 272,300 L268,402 L132,402 Z';
const SKIRT = 'M134,396 L266,396 L306,546 C250,560 150,560 94,546 Z';

// The side away from the light gets a darker band; the head casts a soft shadow on the chest.
const Shading: FC<Readonly<{ path: string; color: string }>> = ({ path, color }) => {
  const clip = useSvgId('torso');
  return (
    <g>
      <clipPath id={clip}><path d={path} /></clipPath>
      <path d={path} fill={color} />
      <g clipPath={`url(#${clip})`}>
        <path d="M236,280 C262,300 270,340 272,380 L300,560 L250,560 C256,460 254,360 236,280 Z" fill={shade(color, -0.2)} />
        <ellipse cx={200} cy={298} rx={84} ry={24} fill="#000000" opacity={0.25} />
      </g>
    </g>
  );
};

const TShirt: FC<Readonly<{ look: Look }>> = ({ look }) => (
  <g>
    <Shading path={SHIRT} color={look.outfitColor} />
    <path d="M168,296 Q200,318 232,296" fill="none" stroke={shade(look.outfitColor, -0.3)} strokeWidth={5} />
  </g>
);

const Tunic: FC<Readonly<{ look: Look }>> = ({ look }) => (
  <g>
    <Shading path={TUNIC} color={look.outfitColor} />
    <path d="M114,410 Q200,426 286,410" fill="none" stroke={look.accessoryColor} strokeWidth={11} strokeLinecap="round" />
    <path d="M236,416 q6,30 -2,52 M246,414 q10,26 6,46" fill="none" stroke={look.accessoryColor} strokeWidth={7} strokeLinecap="round" />
  </g>
);

const Dress: FC<Readonly<{ look: Look }>> = ({ look }) => (
  <g>
    <Shading path={SKIRT} color={look.outfitColor} />
    <path d={BODICE} fill={look.outfitColor} />
    <path d="M150,404 L250,404 L268,532 C230,542 170,542 132,532 Z" fill={look.accessoryColor} />
    <path d="M128,400 Q200,412 272,400" fill="none" stroke={shade(look.accessoryColor, -0.15)} strokeWidth={10} strokeLinecap="round" />
  </g>
);

const Hoodie: FC<Readonly<{ look: Look }>> = ({ look }) => (
  <g>
    <path d="M90,300 C90,250 310,250 310,300 C300,326 100,326 90,300 Z" fill={shade(look.outfitColor, -0.28)} />
    <Shading path={SHIRT} color={look.outfitColor} />
    <rect x={116} y={436} width={168} height={22} rx={10} fill={shade(look.outfitColor, -0.18)} />
    <path d="M150,410 L156,372 L244,372 L250,410 Z" fill={shade(look.outfitColor, -0.12)} />
    <path d="M182,304 v40 M218,304 v40" stroke={look.accessoryColor} strokeWidth={5} strokeLinecap="round" />
    <circle cx={182} cy={348} r={5} fill={look.accessoryColor} />
    <circle cx={218} cy={348} r={5} fill={look.accessoryColor} />
  </g>
);

const CLOTHES: Readonly<Record<OutfitName, Clothes>> = {
  tshirt: { hem: 446, legs: '#2f3645', shoes: '#f1efe9', Torso: TShirt },
  tunic: { hem: 500, legs: '#3b332b', shoes: '#5a3d26', Torso: Tunic },
  dress: { hem: 540, legs: '#2a2420', shoes: '#5a3d26', Torso: Dress },
  hoodie: { hem: 446, legs: '#3d5a8a', shoes: '#f1efe9', Torso: Hoodie },
};

const Legs: FC<Readonly<{ clothes: Clothes }>> = ({ clothes }) => (
  <g>
    <rect x={160} y={clothes.hem - 12} width={34} height={FEET.y - clothes.hem - 4} rx={14} fill={clothes.legs} />
    <rect x={206} y={clothes.hem - 12} width={34} height={FEET.y - clothes.hem - 4} rx={14} fill={clothes.legs} />
    <path d={`M140,${FEET.y} C140,560 196,556 198,578 L198,${FEET.y} Z`} fill={clothes.shoes} />
    <path d={`M260,${FEET.y} C260,560 204,556 202,578 L202,${FEET.y} Z`} fill={clothes.shoes} />
    <rect x={138} y={FEET.y - 6} width={124} height={8} rx={4} fill={shade(clothes.shoes, -0.35)} />
  </g>
);

/** Legs and torso for the chosen outfit (the arms draw their own sleeves). */
export const Outfit: FC<Readonly<{ look: Look }>> = ({ look }) => {
  const clothes = CLOTHES[look.outfit];
  return (
    <g>
      <Legs clothes={clothes} />
      <clothes.Torso look={look} />
    </g>
  );
};
