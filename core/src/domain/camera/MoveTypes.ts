import type { Frame } from '../values/Time.ts';
import type { CameraMoveJson } from '../script/SceneElements.ts';
import { Framing } from './Framing.ts';

export interface MoveType {
  /** `progress` goes from 0 (scene start) to 1 (end). */
  framingAt(progress: number, frame: Frame): Framing;
}

export type MoveConstructor = new (json: CameraMoveJson) => MoveType;

const EASING_CURVES: Readonly<Record<string, (fraction: number) => number>> = {
  linear: (fraction) => fraction,
  smooth: (fraction) => fraction * fraction * (3 - 2 * fraction),
};

function ease(json: CameraMoveJson, progress: number): number {
  const fraction = Math.max(0, Math.min(1, progress));
  const curve = EASING_CURVES[json.easing ?? 'smooth'] ?? EASING_CURVES['smooth']!;
  return curve(fraction);
}

function framingOr(given: CameraMoveJson['from'], defaultValue: Framing): Framing {
  return given ? Framing.fromJson(given) : defaultValue;
}

type Defaults = Readonly<{ start: Framing; end: Framing }>;

function betweenEnds(json: CameraMoveJson, defaults: Defaults, progress: number): Framing {
  const from = framingOr(json.from, defaults.start);
  const to = framingOr(json.to, defaults.end);
  return from.towards(to, ease(json, progress));
}

function fixedZoom(zoom: number): Framing {
  return Framing.of({ zoom, x: 0, y: 0, rotation: 0 });
}

export class Still implements MoveType {
  readonly #json: CameraMoveJson;

  constructor(json: CameraMoveJson) {
    this.#json = json;
  }

  framingAt(): Framing {
    return framingOr(this.#json.from ?? this.#json.to, Framing.neutral());
  }
}

export class ZoomIn implements MoveType {
  readonly #json: CameraMoveJson;

  constructor(json: CameraMoveJson) {
    this.#json = json;
  }

  framingAt(progress: number): Framing {
    return betweenEnds(this.#json, { start: Framing.neutral(), end: fixedZoom(1.3) }, progress);
  }
}

export class ZoomOut implements MoveType {
  readonly #json: CameraMoveJson;

  constructor(json: CameraMoveJson) {
    this.#json = json;
  }

  framingAt(progress: number): Framing {
    return betweenEnds(this.#json, { start: fixedZoom(1.3), end: Framing.neutral() }, progress);
  }
}

export class Pan implements MoveType {
  readonly #json: CameraMoveJson;

  constructor(json: CameraMoveJson) {
    this.#json = json;
  }

  framingAt(progress: number): Framing {
    const start = Framing.of({ zoom: 1.1, x: -0.05, y: 0, rotation: 0 });
    const end = Framing.of({ zoom: 1.1, x: 0.05, y: 0, rotation: 0 });
    return betweenEnds(this.#json, { start, end }, progress);
  }
}

/** Heads to the `to` point and slows down on arrival (the camera "catches up" with the target). */
export class Follow implements MoveType {
  readonly #json: CameraMoveJson;

  constructor(json: CameraMoveJson) {
    this.#json = json;
  }

  framingAt(progress: number): Framing {
    const target = framingOr(this.#json.to, fixedZoom(1.15));
    const origin = framingOr(this.#json.from, fixedZoom(target.zoom));
    const remaining = 1 - Math.max(0, Math.min(1, progress));
    return origin.towards(target, 1 - remaining * remaining);
  }
}

const SHAKE_AMPLITUDE = 0.004;
const SHAKE_DEGREES = 0.25;

/** Shakes around the base framing; depends only on the frame (no Math.random). */
export class Shake implements MoveType {
  readonly #json: CameraMoveJson;

  constructor(json: CameraMoveJson) {
    this.#json = json;
  }

  framingAt(_progress: number, frame: Frame): Framing {
    const base = framingOr(this.#json.to ?? this.#json.from, fixedZoom(1.04));
    const intensity = this.#json.intensity ?? 1;
    const number = frame.value();
    return Framing.of({
      zoom: Math.max(base.zoom, 1 + 4 * SHAKE_AMPLITUDE * intensity),
      x: base.x + Math.sin(number * 2.3) * SHAKE_AMPLITUDE * intensity,
      y: base.y + Math.sin(number * 3.1 + 1) * SHAKE_AMPLITUDE * intensity,
      rotation: Math.sin(number * 1.7 + 2) * SHAKE_DEGREES * intensity,
    });
  }
}

export const MOVE_REGISTRY: ReadonlyMap<string, MoveConstructor> = new Map<string, MoveConstructor>([
  ['still', Still],
  ['zoom-in', ZoomIn],
  ['zoom-out', ZoomOut],
  ['pan', Pan],
  ['follow', Follow],
  ['shake', Shake],
]);
