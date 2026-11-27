import type { Rectangle } from '../../domain/layout/Box.ts';
import type { StanceData } from '../../domain/scenario/Stance.ts';

// How far down from the view box top a portrait shows (head and shoulders), and the room left above the highest point.
const SHOULDERS = 290;
const ROOM = 8;

/**
 * The square a head-and-shoulders thumbnail shows, in rig units: from above the character's top reach (a tall hat, a
 * plume, antennae; the view box top when it stays inside) down to the shoulders, centered on the body.
 */
export function portraitFrame({ viewBox, top }: StanceData): Rectangle {
  const bottom = viewBox.y + SHOULDERS;
  const y = top === undefined ? viewBox.y : Math.min(viewBox.y, top - ROOM);
  const side = bottom - y;
  return { x: viewBox.x + viewBox.width / 2 - side / 2, y, width: side, height: side };
}
