import { DomainError } from '../DomainError.ts';
import type { CameraMoveJson } from '../script/SceneElements.ts';
import type { Frame } from '../values/Time.ts';
import type { Framing } from './Framing.ts';
import { MOVE_REGISTRY, type MoveType } from './MoveTypes.ts';

export class CameraMove {
  readonly #type: MoveType;

  private constructor(type: MoveType) {
    this.#type = type;
  }

  static of(json: CameraMoveJson): CameraMove {
    const moveClass = MOVE_REGISTRY.get(json.type);
    if (!moveClass) {
      const valid = [...MOVE_REGISTRY.keys()].join(', ');
      throw new DomainError(`tipo de câmera "${json.type}" desconhecido (tipos válidos: ${valid})`);
    }
    return new CameraMove(new moveClass(json));
  }

  /** `progress` from 0 to 1 along the scene. */
  framingAt(progress: number, frame: Frame): Framing {
    return this.#type.framingAt(progress, frame);
  }
}
