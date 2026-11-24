import type { MouthOutline } from '../MouthLayout.ts';

/** A small fang hanging from the top edge of the mouth: its top center (`x`, `y`), width and length, in face units. */
export type Fang = Readonly<{ x: number; y: number; width: number; length: number }>;

type Outline<Kind extends MouthOutline['kind']> = Extract<MouthOutline, { kind: Kind }>;

// A cubic with both controls at y only reaches 3/4 of y (as in the mouth layout).
const CUBIC_REACH = 0.75;
const WIDTH = 4.6;
const LENGTH = 5.4;
const SPREAD = 0.28;
const SPREAD_LIMITS = { least: 2.6, most: 8 } as const;

// The height of the top edge near the middle of the mouth, by outline kind: a closed mouth is a line at 0.
const TOP_EDGES: Readonly<{ [Kind in MouthOutline['kind']]: (outline: Outline<Kind>) => number }> = {
  pressed: () => 0,
  line: ({ bend }) => bend / 2, // a quadratic reaches half its control
  wave: () => 0,
  cubic: ({ upper }) => upper * CUBIC_REACH,
  oval: ({ height, center }) => center - height / 2,
  rounded: ({ height, center }) => center - height / 2,
};

const topEdge = (outline: MouthOutline) => (TOP_EDGES[outline.kind] as (outline: MouthOutline) => number)(outline);

/** Two fangs, one each side of the middle, on the top edge of whatever mouth the viseme or expression made. */
export function fangsOf(outline: MouthOutline): readonly Fang[] {
  const spread = Math.min(SPREAD_LIMITS.most, Math.max(SPREAD_LIMITS.least, outline.width * SPREAD));
  const y = topEdge(outline);
  return [-1, 1].map((side) => ({ x: side * spread, y, width: WIDTH, length: LENGTH }));
}
