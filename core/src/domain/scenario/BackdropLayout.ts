import type { Rectangle } from '../layout/Box.ts';
import { NAMED_POSITIONS, type CharacterInScene } from '../script/Scene.ts';
import type { Point } from '../drawing/PathData.ts';
import type { AspectRatio } from '../values/AspectRatio.ts';
import { HudLayout, TALLEST_HUD } from './HudLayout.ts';
import { Placement, type Spot } from './Placement.ts';

/** Where a front prop stands (`x`, `y` in video pixels) and its `scale` (video pixels per prop unit). */
export type Corner = Readonly<{ x: number; y: number; scale: number }>;

/**
 * The plan of a vector background, in video pixels: `ground` (the characters' feet), `horizon` (where the far
 * scenery or the back wall meets the floor), `stage` (where the characters stand, kept clear by the front layer), the
 * two `corners` where the front layer puts its props and the `focus`, the center of the background's main feature (a
 * window, a monument, a cave mouth), which fits in `FOCUS_RADIUS` units around it; a wide feature (a window band, a
 * yard) may span `focusWidth` pixels centered on it: between the two characters in 16:9, nearly the frame in 9:16.
 */
export type Backdrop = Readonly<{
  unit: number;
  ground: number;
  horizon: number;
  stage: Rectangle;
  corners: Readonly<{ left: Corner; right: Corner }>;
  focus: Point;
  focusWidth: number;
}>;

/** The main feature of a background fits in this radius, in units, around the backdrop's `focus`. */
export const FOCUS_RADIUS = 150;

/** A front prop is drawn in this box of prop units, centered on its corner's `x` and standing on its `y`. */
export const FRONT_PROP = { width: 400, height: 480 } as const;

// The horizon sits 150 units above the ground (units are 1/1000 of the shorter side).
const HORIZON = 150;
// Half the width of a standing character's body and arms, as a share of its height.
const HALF_FIGURE = 0.32;
// 16:9: the focus is 330 units above the horizon, between the characters. 9:16: above their heads, 40 units under the HUD.
const FOCUS_OVER_HORIZON = 330;
const HUD_CLEARANCE = 40;
// A wide focus feature keeps 20 units from the characters in 16:9 and 150 units from the frame's sides in 9:16 (room for
// the side props hung there, such as lamps).
const FIGURE_CLEARANCE = 20;
const SIDE_MARGIN = 150;
// A prop is never drawn larger than one video pixel per unit of the frame.
const LARGEST_SCALE = 1;

// Every crowd the frame allows, at the named positions: one alone in each spot, then the pairs and the trio.
function crowds(aspect: AspectRatio): CharacterInScene[][] {
  const single = NAMED_POSITIONS.map((position) => [{ character: 'one', position }]);
  const pair: CharacterInScene[] = [{ character: 'one', position: 'left' }, { character: 'two', position: 'right' }];
  const trio: CharacterInScene[] = [...pair, { character: 'three', position: 'center' }];
  return aspect.vertical() ? [...single, pair] : [...single, pair, trio];
}

const figureOf = (spot: Spot): Rectangle => ({
  x: spot.x - spot.height * HALF_FIGURE, y: spot.y - spot.height, width: 2 * spot.height * HALF_FIGURE, height: spot.height,
});

function stageOf(aspect: AspectRatio): Rectangle {
  const figures = crowds(aspect).flatMap((crowd) => Placement.for(crowd, aspect)).map(figureOf);
  const left = Math.min(...figures.map((figure) => figure.x));
  const right = Math.max(...figures.map((figure) => figure.x + figure.width));
  const top = Math.min(...figures.map((figure) => figure.y));
  return { x: left, y: top, width: right - left, height: Placement.groundOf(aspect) - top };
}

// The largest scale that keeps a prop on the frame's edge clear of the stage: beside it, or under the feet.
function cornerScale(stage: Rectangle, aspect: AspectRatio): number {
  const unit = Math.min(aspect.width(), aspect.height()) / 1000;
  const beside = Math.min(stage.x, aspect.width() - stage.x - stage.width) / (FRONT_PROP.width / 2);
  const under = (aspect.height() - stage.y - stage.height) / FRONT_PROP.height;
  return Math.min(unit * LARGEST_SCALE, Math.max(beside, under));
}

function focusOf(stage: Rectangle, aspect: AspectRatio): Point {
  const unit = Math.min(aspect.width(), aspect.height()) / 1000;
  const x = aspect.width() / 2;
  if (!aspect.vertical()) return { x, y: Placement.groundOf(aspect) - (HORIZON + FOCUS_OVER_HORIZON) * unit };
  const { panel } = HudLayout.for(TALLEST_HUD, aspect);
  const belowHud = panel.y + panel.height + (HUD_CLEARANCE + FOCUS_RADIUS) * unit;
  return { x, y: Math.min(belowHud, stage.y - unit) };
}

// 16:9: the gap between the pair of characters (the focus is at their height); 9:16: the frame (it is above the heads).
function focusWidthOf(aspect: AspectRatio): number {
  const unit = Math.min(aspect.width(), aspect.height()) / 1000;
  if (aspect.vertical()) return aspect.width() - 2 * SIDE_MARGIN * unit;
  const [left, right] = Placement.for([{ character: 'one', position: 'left' }, { character: 'two', position: 'right' }], aspect).map(figureOf);
  return right!.x - (left!.x + left!.width) - 2 * FIGURE_CLEARANCE * unit;
}

/** The plan every vector background draws on, so the characters keep a clear stage in 9:16 and in 16:9. */
export class BackdropLayout {
  static for(aspect: AspectRatio): Backdrop {
    const unit = Math.min(aspect.width(), aspect.height()) / 1000;
    const ground = Placement.groundOf(aspect);
    const stage = stageOf(aspect);
    const scale = cornerScale(stage, aspect);
    const bottom = aspect.height();
    const corners = { left: { x: 0, y: bottom, scale }, right: { x: aspect.width(), y: bottom, scale } };
    return { unit, ground, horizon: ground - HORIZON * unit, stage, corners, focus: focusOf(stage, aspect), focusWidth: focusWidthOf(aspect) };
  }
}
