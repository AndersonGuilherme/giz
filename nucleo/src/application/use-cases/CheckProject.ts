import { SafeArea } from '../../domain/layout/SafeArea.ts';
import type { Box } from '../../domain/layout/Box.ts';
import { Boxes } from '../../domain/layout/Boxes.ts';
import { captionBox } from '../../domain/layout/lessonLayouts.ts';
import type { LayoutRegistry } from '../../domain/layout/LayoutRegistry.ts';
import type { Project } from '../../domain/project/Project.ts';
import type { Line } from '../../domain/script/Line.ts';

/** Empty `line`: the problem belongs to the project (for example, a load warning). */
export type Problem = Readonly<{ line: string; message: string }>;
export type CheckReport = { errors: Problem[]; warnings: Problem[] };
type Dependencies = Readonly<{ layouts: LayoutRegistry }>;

function layoutMessages(boxes: Boxes, safeArea: Box): string[] {
  const overflowing = boxes.overflowingTexts().map((box) => `${box.label} não cabe na caixa nem com a letra a 60%`);
  const overlapping = boxes.overlappingPairs().map(([first, second]) => `${first.label} sobrepõe ${second.label}`);
  const outside = boxes.outsideOf(safeArea).map((box) => `${box.label} sai da área segura`);
  return [...overflowing, ...overlapping, ...outside];
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
    const caption = captionBox(line.text(), project.aspect());
    const boxes = this.#sceneBoxes(project, line).with(caption);
    return layoutMessages(boxes, safeArea).map((message) => ({ line: line.id(), message }));
  }

  // Only the line that declares the scene checks it: lines that inherit the scene do not repeat the same errors.
  // Provisional: scenes without a registered layout yet (Tasks 12 and 13) are skipped, without an error.
  #sceneBoxes(project: Project, line: Line): Boxes {
    const scene = line.scene();
    if (!scene) return Boxes.empty();
    const { layouts } = this.#dependencies;
    return layouts.boxesOf(scene, project.aspect(), project.language()) ?? Boxes.empty();
  }
}
