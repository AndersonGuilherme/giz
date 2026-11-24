import type { CaptionLayout } from '../../../domain/caption/captionLayouts.ts';
import type { Box } from '../../../domain/layout/Box.ts';
import { Boxes } from '../../../domain/layout/Boxes.ts';
import type { LayoutRegistry } from '../../../domain/layout/LayoutRegistry.ts';
import { SafeArea } from '../../../domain/layout/SafeArea.ts';
import type { CaptionStyle, Project } from '../../../domain/project/Project.ts';
import type { Line } from '../../../domain/script/Line.ts';
import { lineHold } from '../../../domain/timeline/ReadingHold.ts';
import { HoldLabel } from '../../../domain/video/HoldLabel.ts';
import { OverlayLayout } from '../../../domain/video/OverlayLayout.ts';
import { refusalMessage, type LineRule, type PlacedLine } from './CheckRule.ts';

/** `captions`: the caption layout of each style, the same one the renderer draws with. */
export type LayoutDependencies = Readonly<{ layouts: LayoutRegistry; captions: Readonly<Record<CaptionStyle, CaptionLayout>> }>;

function layoutMessages(boxes: Boxes, safeArea: Box): string[] {
  const overflowing = boxes.overflowingTexts().map((box) => `${box.label} não cabe na caixa nem com a letra a 60%`);
  const overlapping = boxes.overlappingPairs().map(([first, second]) => `${first.label} sobrepõe ${second.label}`);
  const outside = boxes.outsideOf(safeArea).map((box) => `${box.label} sai da área segura`);
  return [...overflowing, ...overlapping, ...outside];
}

function chapterName(project: Project, line: Line): string | undefined {
  const chapter = line.chapter();
  const script = project.script();
  return script.chapters()[chapter.number() - 1];
}

// The brand and chapter frame, checked where it can change: on the lines that open a scene or a chapter. Without a scene
// type it is checked as beside the content (the talk stage only hides the chapter, so it takes less room).
function overlayBoxes({ project, line, opensChapter }: PlacedLine): Boxes {
  if (!line.scene() && !opensChapter) return Boxes.empty();
  const content = { brand: project.brand(), chapter: chapterName(project, line) };
  const overlay = OverlayLayout.for(project.aspect(), project.format(), content);
  return overlay.boxes();
}

// Only the line that declares the scene checks it: lines that inherit the scene do not repeat the same errors.
function sceneBoxes(layouts: LayoutRegistry, { project, line }: PlacedLine): Boxes {
  const scene = line.scene();
  if (!scene) return Boxes.empty();
  return layouts.boxesOf(scene, project.aspect(), project.language()) ?? Boxes.empty();
}

// The caption layout of the project style (declared, or the default of the format), placed for the format.
function captionBox(dependencies: LayoutDependencies, { project, line }: PlacedLine): Box {
  const layout = dependencies.captions[project.captionStyle()];
  return layout.box(line.text(), project.aspect(), project.format());
}

// During the hold the label takes the caption place, so it is checked against the scene and the frame, not the caption.
function holdMessages({ project, line }: PlacedLine, others: Boxes, safeArea: Box): string[] {
  const hold = lineHold(line, line.scene(), project.language());
  if (!hold) return [];
  const drawing = HoldLabel.for(hold.label, project.aspect(), project.format());
  const label = drawing.box();
  const overlapping = others.overlapping(label).map((other) => `${label.label} sobrepõe ${other.label}`);
  return [...layoutMessages(Boxes.of([label]), safeArea), ...overlapping];
}

/** Text that does not fit, overlapping boxes and whatever leaves the safe area: scene, frame, caption and hold label. */
export function layoutRule(dependencies: LayoutDependencies): LineRule {
  return (placed) => {
    const { project } = placed;
    const safeArea = SafeArea.for(project.aspect());
    // A scene the layout refuses (too many characters, camera target out of the scene) is an error of that line, not a crash.
    try {
      const scene = sceneBoxes(dependencies.layouts, placed);
      const others = scene.plus(overlayBoxes(placed));
      return [...layoutMessages(others.with(captionBox(dependencies, placed)), safeArea), ...holdMessages(placed, others, safeArea)];
    } catch (error) {
      return [refusalMessage(error)];
    }
  };
}
