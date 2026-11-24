import { DomainError } from '../../domain/DomainError.ts';
import type { CaptionLayout } from '../../domain/caption/captionLayouts.ts';
import { SafeArea } from '../../domain/layout/SafeArea.ts';
import type { Box } from '../../domain/layout/Box.ts';
import { Boxes } from '../../domain/layout/Boxes.ts';
import type { LayoutRegistry } from '../../domain/layout/LayoutRegistry.ts';
import { LessonPresenters } from '../../domain/lesson/LessonPresenters.ts';
import type { Cast } from '../../domain/cast/Cast.ts';
import type { Character } from '../../domain/cast/Character.ts';
import { beatCountMismatch } from '../../domain/timeline/Beats.ts';
import { OverlayLayout } from '../../domain/video/OverlayLayout.ts';
import type { CaptionStyle, Project } from '../../domain/project/Project.ts';
import type { Line } from '../../domain/script/Line.ts';

/** Empty `line`: the problem belongs to the project (for example, a load warning). */
export type Problem = Readonly<{ line: string; message: string }>;
export type CheckReport = { errors: Problem[]; warnings: Problem[] };
/** `captions`: the caption layout of each style, the same one the renderer draws with. */
type Dependencies = Readonly<{ layouts: LayoutRegistry; captions: Readonly<Record<CaptionStyle, CaptionLayout>> }>;

function layoutMessages(boxes: Boxes, safeArea: Box): string[] {
  const overflowing = boxes.overflowingTexts().map((box) => `${box.label} não cabe na caixa nem com a letra a 60%`);
  const overlapping = boxes.overlappingPairs().map(([first, second]) => `${first.label} sobrepõe ${second.label}`);
  const outside = boxes.outsideOf(safeArea).map((box) => `${box.label} sai da área segura`);
  return [...overflowing, ...overlapping, ...outside];
}

function refusalMessage(error: unknown): string {
  if (error instanceof DomainError) return error.message;
  throw error;
}

function idText(character: Character): string {
  const id = character.id();
  return id.text();
}

function bodyIds(cast: Cast): string[] {
  const characters = cast.each();
  return characters.filter((character) => character.rig() !== undefined).map(idText);
}

// The presenters of a lesson scene stand beside its content: more than two with a body do not fit (a scenario has its own limit).
function presenterMessages(project: Project, line: Line): string[] {
  const scene = line.scene();
  if (!scene || scene.type === 'scenario') return [];
  try {
    LessonPresenters.beside(bodyIds(project.cast()), project.aspect());
    return [];
  } catch (error) {
    return [refusalMessage(error)];
  }
}

function beatMessages(line: Line): string[] {
  const mismatch = beatCountMismatch(line);
  return mismatch === undefined ? [] : [mismatch];
}

function chapterName(project: Project, line: Line): string | undefined {
  const script = project.script();
  return script.chapters()[chapterNumber(line) - 1];
}

/** A line and whether it is the first of its chapter (the frame shows a new chapter name there). */
type PlacedLine = Readonly<{ line: Line; opensChapter: boolean }>;

function chapterNumber(line: Line): number {
  const chapter = line.chapter();
  return chapter.number();
}

function sameChapter(previous: Line | undefined, line: Line): boolean {
  return previous !== undefined && chapterNumber(previous) === chapterNumber(line);
}

// The brand and chapter frame, checked where it can change: on the lines that open a scene or a chapter. Without a scene
// type it is checked as beside the content (the talk stage only hides the chapter, so it takes less room).
function overlayBoxes(project: Project, { line, opensChapter }: PlacedLine): Boxes {
  if (!line.scene() && !opensChapter) return Boxes.empty();
  const content = { brand: project.brand(), chapter: chapterName(project, line) };
  const overlay = OverlayLayout.for(project.aspect(), project.format(), content);
  return overlay.boxes();
}

/** Reports text that does not fit, overlapping boxes and whatever leaves the safe area, line by line. */
export class CheckProject {
  readonly #dependencies: Dependencies;

  constructor(dependencies: Dependencies) {
    this.#dependencies = dependencies;
  }

  run(project: Project): CheckReport {
    const script = project.script();
    const lines = script.lines();
    const safeArea = SafeArea.for(project.aspect());
    const errors = lines.each().flatMap((line, index, all) => this.#lineErrors(project, { line, opensChapter: !sameChapter(all[index - 1], line) }, safeArea));
    const warnings = project.warnings().map((message) => ({ line: '', message }));
    return { errors, warnings };
  }

  #lineErrors(project: Project, placed: PlacedLine, safeArea: Box): Problem[] {
    const { line } = placed;
    const messages = [...this.#layoutMessages(project, placed, safeArea), ...beatMessages(line), ...presenterMessages(project, line)];
    return messages.map((message) => ({ line: line.id(), message }));
  }

  // A scene the layout refuses (too many characters, camera target out of the scene) is an error of that line, not a crash.
  #layoutMessages(project: Project, placed: PlacedLine, safeArea: Box): string[] {
    const { line } = placed;
    try {
      const boxes = this.#sceneBoxes(project, line).plus(overlayBoxes(project, placed));
      return layoutMessages(boxes.with(this.#captionBox(project, line)), safeArea);
    } catch (error) {
      return [refusalMessage(error)];
    }
  }

  // The caption layout of the project style (declared, or the default of the format), placed for the format.
  #captionBox(project: Project, line: Line): Box {
    const { captions } = this.#dependencies;
    const layout = captions[project.captionStyle()];
    return layout.box(line.text(), project.aspect(), project.format());
  }

  // Only the line that declares the scene checks it: lines that inherit the scene do not repeat the same errors.
  // A scene type without a registered layout has no boxes to check (every known type has one since Task 13).
  #sceneBoxes(project: Project, line: Line): Boxes {
    const scene = line.scene();
    if (!scene) return Boxes.empty();
    const { layouts } = this.#dependencies;
    return layouts.boxesOf(scene, project.aspect(), project.language()) ?? Boxes.empty();
  }
}
