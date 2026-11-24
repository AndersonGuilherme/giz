import { CameraMove } from '../camera/CameraMove.ts';
import { Framing } from '../camera/Framing.ts';
import { DomainError } from '../DomainError.ts';
import type { CameraMoveJson } from '../script/SceneElements.ts';
import type { AspectRatio } from '../values/AspectRatio.ts';
import type { Frame } from '../values/Time.ts';
import type { Spot } from './Placement.ts';

const TARGET_ZOOM = 1.25;
// The camera aims at the chest: a little above the middle of the drawing.
const AIM_ABOVE_FEET = 0.55;

function aimAt(spot: Spot, zoom: number, aspect: AspectRatio): CameraMoveJson['to'] {
  const across = spot.x / aspect.width() - 0.5;
  const down = (spot.y - spot.height * AIM_ABOVE_FEET) / aspect.height() - 0.5;
  return { zoom, x: -zoom * across, y: -zoom * down };
}

function withTarget(json: CameraMoveJson, spots: readonly Spot[], aspect: AspectRatio): CameraMoveJson {
  if (json.target === undefined) return json;
  const spot = spots.find(({ character }) => character === json.target);
  if (!spot) throw new DomainError(`alvo da câmera "${json.target}" não está na cena (use um dos personagens da cena)`);
  return { ...json, to: aimAt(spot, json.to?.zoom ?? TARGET_ZOOM, aspect) };
}

/** The camera of a scenario: the move from the JSON, with `target` resolved to where that character stands. */
export class SceneCamera {
  readonly #move: CameraMove | undefined;

  private constructor(move: CameraMove | undefined) {
    this.#move = move;
  }

  static of(json: CameraMoveJson | undefined, spots: readonly Spot[], aspect: AspectRatio): SceneCamera {
    if (!json) return new SceneCamera(undefined);
    return new SceneCamera(CameraMove.of(withTarget(json, spots, aspect)));
  }

  /** `progress` from 0 to 1 along the scene. */
  framingAt(progress: number, frame: Frame): Framing {
    return this.#move?.framingAt(progress, frame) ?? Framing.neutral();
  }
}
