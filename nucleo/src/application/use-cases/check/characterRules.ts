import { DomainError } from '../../../domain/DomainError.ts';
import type { Character } from '../../../domain/cast/Character.ts';
import type { Box } from '../../../domain/layout/Box.ts';
import { LessonPresenters } from '../../../domain/lesson/LessonPresenters.ts';
import type { Project } from '../../../domain/project/Project.ts';
import { Placement, type Spot } from '../../../domain/scenario/Placement.ts';
import { Stance } from '../../../domain/scenario/Stance.ts';
import type { Line } from '../../../domain/script/Line.ts';
import { CharacterId } from '../../../domain/values/CharacterId.ts';
import type { RigCatalog } from '../../ports/RigCatalog.ts';
import type { LineRule, Problem, ProjectRule } from './CheckRule.ts';

// The spots a layout refuses (too many characters) are already a layout error of the line: here they are just none.
function noSpots(error: unknown): Spot[] {
  if (error instanceof DomainError) return [];
  throw error;
}

function spotsOr(place: () => Spot[]): Spot[] {
  try {
    return place();
  } catch (error) {
    return noSpots(error);
  }
}

function characterOf(project: Project, spot: Spot): Character | undefined {
  const cast = project.cast();
  const id = CharacterId.of(spot.character);
  return cast.contains(id) ? cast.character(id) : undefined;
}

function boxOf(project: Project, spot: Spot, rigs: RigCatalog): Box | undefined {
  const character = characterOf(project, spot);
  const rig = character?.rig();
  const stance = rig === undefined ? undefined : rigs.stance(rig, character!.parameters());
  return stance && Stance.of(stance).boxFor(spot);
}

// A character may stand partly under the caption (as in short story videos), but its drawing (hat, antenna, a floating
// ghost included) must not leave the frame at the top or the bottom: a warning, since the video still renders. The
// sides are not judged: a rig's view box is wider than the body it draws (room for the arms), so it would warn falsely.
function outOfFrame(project: Project, spots: readonly Spot[], rigs: RigCatalog): string[] {
  const aspect = project.aspect();
  return spots.flatMap((spot) => {
    const box = boxOf(project, spot, rigs);
    const leaves = box !== undefined && (box.y < 0 || box.y + box.height > aspect.height());
    return leaves ? [`${box.label} sai do quadro (chapéu, antena e flutuação incluídos)`] : [];
  });
}

/** The characters of a scenario the line opens, on their spots, must stay in the frame. */
export function scenarioFrameRule(rigs: RigCatalog): LineRule {
  return ({ project, line }) => {
    const scene = line.scene();
    if (scene?.type !== 'scenario') return [];
    return outOfFrame(project, spotsOr(() => Placement.for(scene.characters, project.aspect())), rigs);
  };
}

function idText(character: Character): string {
  const id = character.id();
  return id.text();
}

function bodyIds(project: Project): string[] {
  const cast = project.cast();
  return cast.each().filter((character) => character.rig() !== undefined).map(idText);
}

const typeOf = (line: Line): string | undefined => line.scene()?.type;
const isBeside = (line: Line): boolean => ![undefined, 'scenario', 'talk'].includes(typeOf(line));
const isStage = (line: Line): boolean => typeOf(line) === 'talk';

type Arrangement = Readonly<{ opens: (line: Line) => boolean; place: typeof LessonPresenters.beside }>;
const ARRANGEMENTS: readonly Arrangement[] = [{ opens: isBeside, place: LessonPresenters.beside }, { opens: isStage, place: LessonPresenters.onStage }];

// The presenters stand in the same places on every lesson scene: checked once beside the content (on the first scene
// that has content) and once on the talk stage (on the first talk scene).
export function presenterFrameRule(rigs: RigCatalog): ProjectRule {
  return (project) => {
    const script = project.script();
    const lines = script.lines().each();
    return ARRANGEMENTS.flatMap(({ opens, place }): Problem[] => {
      const first = lines.find(opens);
      if (!first) return [];
      const spots = spotsOr(() => place(bodyIds(project), project.aspect()));
      return outOfFrame(project, spots, rigs).map((message) => ({ line: first.id(), message }));
    });
  };
}
