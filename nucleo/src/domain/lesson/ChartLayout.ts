import { Box, type Rectangle } from '../layout/Box.ts';
import { Boxes } from '../layout/Boxes.ts';
import { Font } from '../layout/Font.ts';
import { fixedTexts } from '../i18n/fixedTexts.ts';
import type { ChartScene, CHART_CURVES } from '../script/LessonScenes.ts';
import type { Point } from '../script/SceneElements.ts';
import type { AspectRatio } from '../values/AspectRatio.ts';
import type { Language } from '../values/Language.ts';
import type { Fps } from '../values/Time.ts';
import { LessonStage } from './LessonStage.ts';
import { Motion } from './Motion.ts';
import { TextBlock } from './TextBlock.ts';

type CurveKind = (typeof CHART_CURVES)[number];
export type ChartCurve = Readonly<{ kind: CurveKind; points: readonly Point[]; label: TextBlock }>;
export type Plot = Readonly<{ left: number; top: number; right: number; base: number }>;
/** `yOrigin` is where the y label starts (bottom left of `yStrip`): the view turns it −90° around that point. */
export type ChartDrawing = Readonly<{
  panel: Rectangle; plot: Plot; xLabel: TextBlock; yLabel: TextBlock; yStrip: Rectangle; yOrigin: Point; curves: readonly ChartCurve[]; boxes: () => Boxes;
}>;

// The motor's cost-of-change curves: healthy grows a little, rotten explodes at the end.
const SHAPES: Readonly<Record<CurveKind, (time: number) => number>> = {
  healthy: (time) => 0.12 + 0.22 * time,
  rotten: (time) => 0.12 + 0.88 * time ** 3.2,
};
const SAMPLES = 60;
const AXIS_FONT = Font.of({ family: 'text', size: 32, lineHeight: 1.2, maximumLines: 1 });
const CURVE_FONT = Font.of({ family: 'text', size: 40, lineHeight: 1.2, maximumLines: 1 });
const PADDING = 48;
// Room for the y label on the left and the x label below the plot, and the headroom above the top of a curve.
const MARGINS = { left: 90, base: 80, top: 20, headroom: 40 };
const DRAW_SECONDS = 1.6;

function plotIn(panel: Rectangle): Plot {
  const left = panel.x + PADDING + MARGINS.left;
  return { left, top: panel.y + PADDING + MARGINS.top, right: panel.x + panel.width - PADDING, base: panel.y + panel.height - PADDING - MARGINS.base };
}

function curveOf(kind: CurveKind, plot: Plot, label: string): ChartCurve {
  const height = plot.base - plot.top - MARGINS.headroom;
  const points = Array.from({ length: SAMPLES + 1 }, (_empty, step) => {
    const time = step / SAMPLES;
    return { x: plot.left + time * (plot.right - plot.left), y: plot.base - SHAPES[kind](time) * height };
  });
  const end = points.at(-1)!;
  const width = (plot.right - plot.left) / 2;
  const block = TextBlock.at(`gráfico (${label})`, { x: plot.right - width, y: Math.max(plot.top, end.y - 80), width }, { text: label, font: CURVE_FONT });
  return { kind, points, label: block };
}

// The y label is drawn turned 90°, left of the axis: it takes a narrow vertical strip as tall as the plot.
const Y_LABEL_GAP = 34;
// A curve's label shows up when the curve is almost drawn.
const LABEL_AT = 0.9;

function yStripOf(label: TextBlock, plot: Plot): Rectangle {
  return { x: plot.left - Y_LABEL_GAP - label.lineHeight(), y: plot.top, width: label.lineHeight(), height: plot.base - plot.top };
}

/** The chart of the cost of change: axes, their labels and the curves already shown. */
export class ChartLayout {
  static for(scene: ChartScene, aspect: AspectRatio, language: Language): ChartDrawing {
    const panel = LessonStage.for(aspect).content();
    const plot = plotIn(panel);
    const texts = fixedTexts(language);
    const xLabel = TextBlock.at('gráfico (eixo X)', { x: plot.left, y: plot.base + 20, width: plot.right - plot.left }, { text: `${scene.xAxisLabel} →`, font: AXIS_FONT });
    const yLabel = TextBlock.at('gráfico (eixo Y)', { x: plot.left, y: plot.top, width: plot.base - plot.top }, { text: `${scene.yAxisLabel} →`, font: AXIS_FONT });
    const curves = scene.curves.map((kind) => curveOf(kind, plot, texts[kind]));
    const yStrip = yStripOf(yLabel, plot);
    // The strip box keeps whether the label fitted along the axis.
    const boxes = () => Boxes.of([xLabel.box(), Box.fitted('gráfico (eixo Y)', yStrip, yLabel.fit), ...curves.map((curve) => curve.label.box())]);
    return { panel, plot, xLabel, yLabel, yStrip, yOrigin: { x: yStrip.x, y: yStrip.y + yStrip.height }, curves, boxes };
  }

  static labelVisible(progress: number): boolean {
    return progress > LABEL_AT;
  }

  /** How much of a curve is drawn: the newest one draws itself in 1.6 s from the last change, the others are complete. */
  static progressOf(curve: Readonly<{ index: number; count: number }>, age: number, fps: Fps): number {
    if (curve.index !== curve.count - 1) return 1;
    return Motion.easeInOutCubic(Motion.ramp(age, [0, DRAW_SECONDS * fps.value()]));
  }
}
