import type { AspectRatio } from '../values/AspectRatio.ts';
import { HudLayout } from './HudLayout.ts';
import { Placement } from './Placement.ts';

export type Disc = Readonly<{ x: number; y: number; radius: number }>;

// The tallest HUD a scene can have (one line of fields and the bar): the moon keeps clear of its panel.
const TALLEST_HUD = { fields: [{ label: 'HUD', value: '1' }], bar: { label: 'HUD', value: 1 } };
const MOON = { x: 0.75, groundShare: 0.3, radius: 80 } as const;
// Room between the panel and the moon, in units (1/1000 of the shorter side).
const CLEARANCE = 40;

/** Where the sky bodies of a vector background go, in video pixels. */
export class SkyLayout {
  /** The moon: right third, high in the sky, pushed below the HUD panel when the panel would cover it (9:16). */
  static moon(aspect: AspectRatio): Disc {
    const unit = Math.min(aspect.width(), aspect.height()) / 1000;
    const [x, radius] = [aspect.width() * MOON.x, MOON.radius * unit];
    const { panel } = HudLayout.for(TALLEST_HUD, aspect);
    const covered = x - radius < panel.x + panel.width;
    const below = panel.y + panel.height + (CLEARANCE * unit) + radius;
    const preferred = Placement.groundOf(aspect) * MOON.groundShare;
    return { x, y: covered ? Math.max(preferred, below) : preferred, radius };
  }
}
