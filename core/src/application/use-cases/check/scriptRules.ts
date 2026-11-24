import type { Cast } from '../../../domain/cast/Cast.ts';
import type { Character } from '../../../domain/cast/Character.ts';
import { LessonPresenters } from '../../../domain/lesson/LessonPresenters.ts';
import type { Project } from '../../../domain/project/Project.ts';
import type { Line } from '../../../domain/script/Line.ts';
import { beatCountMismatch } from '../../../domain/timeline/Beats.ts';
import { refusalMessage, type LineRule, type Problem, type ProjectRule } from './CheckRule.ts';

function linesOf(project: Project): readonly Line[] {
  const script = project.script();
  const lines = script.lines();
  return lines.each();
}

/** The `[span]` count of the text and the beat count must match. */
export const beatRule: LineRule = ({ line }) => {
  const mismatch = beatCountMismatch(line);
  return mismatch === undefined ? [] : [mismatch];
};

/** Lines without a scene inherit the previous one, so the first line must open one. */
export const firstSceneRule: ProjectRule = (project) => {
  const first = linesOf(project)[0];
  if (!first || first.scene()) return [];
  return [{ line: first.id(), message: 'a primeira fala precisa de cena (as falas sem cena herdam a anterior)' }];
};

function idText(character: Character): string {
  const id = character.id();
  return id.text();
}

function bodyIds(cast: Cast): string[] {
  const characters = cast.each();
  return characters.filter((character) => character.rig() !== undefined).map(idText);
}

const opensLessonScene = (line: Line): boolean => {
  const scene = line.scene();
  return scene !== undefined && scene.type !== 'scenario';
};

// The presenters of a lesson scene stand beside its content: more than two with a body do not fit (a scenario has its
// own limit). The cast is the same on every line, so the error is reported once, on the first lesson scene.
export const presenterRule: ProjectRule = (project) => {
  const first = linesOf(project).find(opensLessonScene);
  if (!first) return [];
  try {
    LessonPresenters.beside(bodyIds(project.cast()), project.aspect());
    return [];
  } catch (error) {
    return [{ line: first.id(), message: refusalMessage(error) } satisfies Problem];
  }
};
