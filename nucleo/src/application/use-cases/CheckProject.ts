import { DomainError } from '../../domain/DomainError.ts';
import type { CaptionLayout } from '../../domain/caption/captionLayouts.ts';
import { SafeArea } from '../../domain/layout/SafeArea.ts';
import type { Box } from '../../domain/layout/Box.ts';
import { Boxes } from '../../domain/layout/Boxes.ts';
import type { LayoutRegistry } from '../../domain/layout/LayoutRegistry.ts';
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
    const errors = lines.each().flatMap((line) => this.#lineErrors(project, line, safeArea));
    const warnings = project.warnings().map((message) => ({ line: '', message }));
    return { errors, warnings };
  }

  #lineErrors(project: Project, line: Line, safeArea: Box): Problem[] {
    return this.#lineMessages(project, line, safeArea).map((message) => ({ line: line.id(), message }));
  }

  // A scene the layout refuses (too many characters, camera target out of the scene) is an error of that line, not a crash.
  #lineMessages(project: Project, line: Line, safeArea: Box): string[] {
    try {
      return layoutMessages(this.#sceneBoxes(project, line).with(this.#captionBox(project, line)), safeArea);
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
