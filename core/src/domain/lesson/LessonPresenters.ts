import { DomainError } from '../DomainError.ts';
import type { Spot } from '../scenario/Placement.ts';
import type { AspectRatio } from '../values/AspectRatio.ts';

type Side = -1 | 1;
// `feet` and `height` in video pixels; `x` in fractions of the frame width, for one or two presenters.
type Arrangement = Readonly<{ feet: number; height: number; x: readonly (readonly number[])[]; sides: readonly Side[] }>;

const MAXIMUM = 2;
const FACING_EACH_OTHER: readonly Side[] = [1, -1];

// 16:9 beside the content: the motor's left column (x 20–580), both facing the content on the right.
const HORIZONTAL_BESIDE: Arrangement = { feet: 935, height: 430, x: [[0.154], [0.083, 0.224]], sides: [1, 1] };
// 9:16 beside the content: below it, side by side, facing each other; the caption may cover their legs.
const VERTICAL_BESIDE: Arrangement = { feet: 1700, height: 600, x: [[0.5], [0.3, 0.7]], sides: FACING_EACH_OTHER };
// The `talk` scene has no content: the presenters take the stage, larger and centered. In 16:9 their feet rest just
// above the lesson block caption (y 826), so the caption never covers them.
const HORIZONTAL_STAGE: Arrangement = { feet: 816, height: 660, x: [[0.5], [0.34, 0.66]], sides: FACING_EACH_OTHER };
const VERTICAL_STAGE: Arrangement = { feet: 1580, height: 740, x: [[0.5], [0.27, 0.73]], sides: FACING_EACH_OTHER };

function rejectCrowd(ids: readonly string[]): void {
  if (ids.length <= MAXIMUM) return;
  throw new DomainError(`no máximo ${MAXIMUM} apresentadores numa aula (o elenco tem ${ids.length} com corpo: ${ids.join(', ')})`);
}

function spotsOf(ids: readonly string[], arrangement: Arrangement, aspect: AspectRatio): Spot[] {
  rejectCrowd(ids);
  const places = arrangement.x[ids.length - 1] ?? [];
  return ids.map((character, index) => ({
    character,
    x: places[index]! * aspect.width(),
    y: arrangement.feet,
    height: arrangement.height,
    side: ids.length === 1 ? 1 : arrangement.sides[index]!,
  }));
}

/** Where the presenters of a lesson stand: beside the content (16:9 left column, 9:16 below) or on the talk stage. */
export class LessonPresenters {
  static beside(ids: readonly string[], aspect: AspectRatio): Spot[] {
    return spotsOf(ids, aspect.vertical() ? VERTICAL_BESIDE : HORIZONTAL_BESIDE, aspect);
  }

  static onStage(ids: readonly string[], aspect: AspectRatio): Spot[] {
    return spotsOf(ids, aspect.vertical() ? VERTICAL_STAGE : HORIZONTAL_STAGE, aspect);
  }
}
