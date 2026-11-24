import type { AspectRatio } from '../values/AspectRatio.ts';
import { BackdropLayout } from './BackdropLayout.ts';
import { HudLayout, TALLEST_HUD } from './HudLayout.ts';
import { Placement } from './Placement.ts';

export type Disc = Readonly<{ x: number; y: number; radius: number }>;

const MOON = { x: 0.75, groundShare: 0.3, radius: 80 } as const;
// Room between the panel (or the characters' heads) and the moon, in units (1/1000 of the shorter side).
const CLEARANCE = 40;
const HEAD_CLEARANCE = 20;

/** Where the sky bodies of a vector background go, in video pixels. */
export class SkyLayout {
  /**
   * The moon: right third, high in the sky; pushed below the HUD panel when the panel would cover it (9:16) and raised
   * above the characters' stage when it would sit behind a head (16:9 night scenes: graveyard, night-sky, city-night).
   */
  static moon(aspect: AspectRatio): Disc {
    const unit = Math.min(aspect.width(), aspect.height()) / 1000;
    const [x, radius] = [aspect.width() * MOON.x, MOON.radius * unit];
    const { panel } = HudLayout.for(TALLEST_HUD, aspect);
    const covered = x - radius < panel.x + panel.width;
    const below = panel.y + panel.height + (CLEARANCE * unit) + radius;
    const preferred = Placement.groundOf(aspect) * MOON.groundShare;
    const { stage } = BackdropLayout.for(aspect);
    const overHeads = stage.y - HEAD_CLEARANCE * unit - radius;
    return { x, y: Math.min(covered ? Math.max(preferred, below) : preferred, overHeads), radius };
  }
}
