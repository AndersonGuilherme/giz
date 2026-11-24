import type { FC } from 'react';
import { Silhouette } from '../../../domain/drawing/Silhouette.ts';
import { Chalked } from './Chalked.tsx';
import { FEET } from './measures.ts';
import type { Look, Outfit as OutfitName } from './parameters.ts';
import { shade, useSvgId } from '../svg.ts';

type Clothes = Readonly<{ hem: number; legs: string; shoes: string; Torso: FC<Readonly<{ look: Look }>> }>;

const SHIRT = 'M126,300 C150,286 250,286 274,300 L284,452 C240,464 160,464 116,452 Z';
const TUNIC = 'M126,300 C150,286 250,286 274,300 L296,506 C240,520 160,520 104,506 Z';
const BODICE = 'M128,300 C150,286 250,286 272,300 L268,402 L132,402 Z';
const SKIRT = 'M134,396 L266,396 L306,546 C250,560 150,560 94,546 Z';
const HOOD = 'M90,300 C90,250 310,250 310,300 C300,326 100,326 90,300 Z';
const LEFT_SHOE = `M140,${FEET.y} C140,560 196,556 198,578 L198,${FEET.y} Z`;
const RIGHT_SHOE = `M260,${FEET.y} C260,560 204,556 202,578 L202,${FEET.y} Z`;

// The side away from the light gets a darker band; the head casts a soft shadow on the chest; chalk around it all.
const Shading: FC<Readonly<{ path: string; color: string; look: Look; seed: string }>> = ({ path, color, look, seed }) => {
  const clip = useSvgId('torso');
  return (
    <g>
      <clipPath id={clip}><path d={path} /></clipPath>
      <path d={path} fill={color} />
      <g clipPath={`url(#${clip})`}>
        <path d="M236,280 C262,300 270,340 272,380 L300,560 L250,560 C256,460 254,360 236,280 Z" fill={shade(color, -0.18)} />
        <ellipse cx={200} cy={298} rx={84} ry={24} fill="#000000" opacity={0.2} />
      </g>
      <Chalked look={look} outline={Silhouette.parse(path)} seed={seed} />
    </g>
  );
};

const TShirt: FC<Readonly<{ look: Look }>> = ({ look }) => (
  <g>
    <Shading path={SHIRT} color={look.outfitColor} look={look} seed="shirt" />
    <path d="M168,296 Q200,318 232,296" fill="none" stroke={shade(look.outfitColor, -0.3)} strokeWidth={5} />
  </g>
);

// A long tunic with a flat belt and a square buckle.
const Tunic: FC<Readonly<{ look: Look }>> = ({ look }) => (
  <g>
    <Shading path={TUNIC} color={look.outfitColor} look={look} seed="tunic" />
    <path d="M114,404 Q200,418 286,404 L288,422 Q200,436 112,422 Z" fill={shade(look.accessoryColor, -0.2)} />
    <rect x={186} y={406} width={28} height={24} rx={4} fill="none" stroke={look.accessoryColor} strokeWidth={5} />
  </g>
);

const Dress: FC<Readonly<{ look: Look }>> = ({ look }) => (
  <g>
    <Shading path={SKIRT} color={look.outfitColor} look={look} seed="skirt" />
    <Shading path={BODICE} color={look.outfitColor} look={look} seed="bodice" />
    <path d="M128,400 Q200,412 272,400" fill="none" stroke={look.accessoryColor} strokeWidth={10} strokeLinecap="round" />
    {[160, 200, 240].map((x) => <circle key={x} cx={x} cy={470 + (x === 200 ? 18 : 0)} r={9} fill={look.accessoryColor} />)}
  </g>
);

const Hoodie: FC<Readonly<{ look: Look }>> = ({ look }) => (
  <g>
    <path d={HOOD} fill={shade(look.outfitColor, -0.28)} />
    <Chalked look={look} outline={Silhouette.parse(HOOD)} seed="hood" />
    <Shading path={SHIRT} color={look.outfitColor} look={look} seed="hoodie" />
    <rect x={116} y={436} width={168} height={22} rx={10} fill={shade(look.outfitColor, -0.18)} />
    <path d="M150,410 L156,372 L244,372 L250,410 Z" fill={shade(look.outfitColor, -0.12)} />
    <path d="M182,304 v40 M218,304 v40" stroke={look.accessoryColor} strokeWidth={5} strokeLinecap="round" />
    <circle cx={182} cy={348} r={5} fill={look.accessoryColor} />
    <circle cx={218} cy={348} r={5} fill={look.accessoryColor} />
  </g>
);

const CLOTHES: Readonly<Record<OutfitName, Clothes>> = {
  tshirt: { hem: 446, legs: '#34405a', shoes: '#f1efe9', Torso: TShirt },
  tunic: { hem: 500, legs: '#4a3f36', shoes: '#6b4a2e', Torso: Tunic },
  dress: { hem: 540, legs: '#3a3038', shoes: '#7a3b4a', Torso: Dress },
  hoodie: { hem: 446, legs: '#3d5a8a', shoes: '#f1efe9', Torso: Hoodie },
};

const Leg: FC<Readonly<{ x: number; clothes: Clothes; look: Look }>> = ({ x, clothes, look }) => {
  const rectangle = { x, y: clothes.hem - 12, width: 34, height: FEET.y - clothes.hem - 4 };
  return (
    <g>
      <rect {...rectangle} rx={14} fill={clothes.legs} />
      <Chalked look={look} outline={Silhouette.roundedRect(rectangle, 14)} seed={`leg${x}`} />
    </g>
  );
};

const Legs: FC<Readonly<{ clothes: Clothes; look: Look }>> = ({ clothes, look }) => (
  <g>
    <Leg x={160} clothes={clothes} look={look} />
    <Leg x={206} clothes={clothes} look={look} />
    {[LEFT_SHOE, RIGHT_SHOE].map((shoe) => (
      <g key={shoe}>
        <path d={shoe} fill={clothes.shoes} />
        <Chalked look={look} outline={Silhouette.parse(shoe)} seed={shoe.slice(0, 5)} />
      </g>
    ))}
    <rect x={138} y={FEET.y - 6} width={124} height={8} rx={4} fill={shade(clothes.shoes, -0.35)} />
  </g>
);

/** Legs and torso for the chosen outfit (the arms draw their own sleeves). */
export const Outfit: FC<Readonly<{ look: Look }>> = ({ look }) => {
  const clothes = CLOTHES[look.outfit];
  return (
    <g>
      <Legs clothes={clothes} look={look} />
      <clothes.Torso look={look} />
    </g>
  );
};
