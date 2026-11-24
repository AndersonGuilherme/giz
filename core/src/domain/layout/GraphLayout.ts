import { DomainError } from '../DomainError.ts';
import type { GraphEdge, GraphNode } from '../script/LessonScenes.ts';
import type { Point } from '../script/SceneElements.ts';
import { Box, type Rectangle } from './Box.ts';
import { Boxes } from './Boxes.ts';
import { Font } from './Font.ts';
import { TextFit, type Fit } from './TextFit.ts';

/** A node as drawn: its rectangle in video pixels, its lines at `fit.size` and the padding around them. */
export type PlacedNode = Readonly<{ node: GraphNode; rectangle: Rectangle; lines: readonly string[]; fit: Fit; padding: Point }>;
export type PlacedEdge = Readonly<{ edge: GraphEdge; start: Point; end: Point }>;

// Port of motor/src/graphLayout.ts: measure each box with its text wrapped, then shrink the letters (36 → 22 px) until no
// box touches another. The padding follows the letter size (34 × 22 px at 36 px, as in the motor).
const SIZES = [36, 34, 32, 30, 28, 26, 24, 22];
const PADDING_IN_EM: Point = { x: 0.95, y: 0.6 };
const GAP = 24;
const MAXIMUM_WIDTH = 520;
const MINIMUM_WIDTH = 160;
export const GRAPH_LINE_HEIGHT = 1.22;
const MAXIMUM_LINES = 3;
const CHARACTER_IN_EM = 0.6; // average width at weight 800, a little loose on purpose
const EDGE_MARGIN = 12;
// With `focusOnBad`, the bad edges turn red in 12 frames and then pulse up to 25% thicker.
const FOCUS_FRAMES = 12;
const PULSE = 0.25;
const PULSE_PERIOD = 6;

type Measure = Readonly<{ size: number; area: Rectangle }>;
type Attempt = Readonly<{ size: number; nodes: readonly PlacedNode[]; conflicts: Array<[string, string]> }>;

const center = (rectangle: Rectangle): Point => ({ x: rectangle.x + rectangle.width / 2, y: rectangle.y + rectangle.height / 2 });
const longestWord = (label: string): number => Math.max(...label.split(/\s+/).map((word) => word.length));
const at = (node: GraphNode, area: Rectangle): Point => ({ x: area.x + (node.x / 100) * area.width, y: area.y + (node.y / 100) * area.height });

// Half the distance to the nearest neighbour in the same band of height, but never narrower than the longest word.
function widthLimit(node: GraphNode, nodes: readonly GraphNode[], measure: Measure): number {
  const band = measure.size * GRAPH_LINE_HEIGHT * MAXIMUM_LINES + 2 * PADDING_IN_EM.y * measure.size;
  const neighbours = nodes.filter((other) => other !== node && Math.abs(at(other, measure.area).y - at(node, measure.area).y) <= band);
  const spacing = neighbours.map((other) => Math.abs(at(other, measure.area).x - at(node, measure.area).x) - GAP);
  const word = longestWord(node.label) * measure.size * CHARACTER_IN_EM + 2 * PADDING_IN_EM.x * measure.size;
  return Math.max(MINIMUM_WIDTH, word, Math.min(MAXIMUM_WIDTH, ...spacing));
}

function clamp(value: number, half: number, range: readonly [number, number]): number {
  return Math.min(Math.max(value, range[0] + half), range[1] - half);
}

function placed(node: GraphNode, limit: number, measure: Measure): PlacedNode {
  const padding = { x: PADDING_IN_EM.x * measure.size, y: PADDING_IN_EM.y * measure.size };
  const font = Font.of({ family: 'text', size: measure.size, lineHeight: GRAPH_LINE_HEIGHT, maximumLines: MAXIMUM_LINES });
  const fit = TextFit.measure(node.label, font, limit - 2 * padding.x);
  const width = Math.min(limit, Math.max(...fit.lines.map((line) => line.length)) * fit.size * CHARACTER_IN_EM + 2 * padding.x);
  const height = fit.lines.length * fit.size * GRAPH_LINE_HEIGHT + 2 * padding.y;
  const { area } = measure;
  const middle = { x: clamp(at(node, area).x, width / 2, [area.x, area.x + area.width]), y: clamp(at(node, area).y, height / 2, [area.y, area.y + area.height]) };
  return { node, rectangle: { x: middle.x - width / 2, y: middle.y - height / 2, width, height }, lines: fit.lines, fit, padding };
}

function touching(first: PlacedNode, second: PlacedNode): boolean {
  const [one, other] = [center(first.rectangle), center(second.rectangle)];
  const apartX = Math.abs(one.x - other.x) >= (first.rectangle.width + second.rectangle.width) / 2 + GAP;
  return !apartX && Math.abs(one.y - other.y) < (first.rectangle.height + second.rectangle.height) / 2 + GAP / 2;
}

function conflictsOf(nodes: readonly PlacedNode[]): Array<[string, string]> {
  const pairs = nodes.flatMap((first, index) => nodes.slice(index + 1).map((second): [PlacedNode, PlacedNode] => [first, second]));
  return pairs.filter(([first, second]) => touching(first, second)).map(([first, second]) => [first.node.id, second.node.id]);
}

// Where the line from the center of a box towards `towards` leaves the box, `EDGE_MARGIN` further out.
function exitPoint(rectangle: Rectangle, towards: Point): Point {
  const middle = center(rectangle);
  const [dx, dy] = [towards.x - middle.x, towards.y - middle.y];
  const length = Math.hypot(dx, dy);
  if (length === 0) return middle;
  const reach = Math.min(rectangle.width / 2 / Math.abs(dx), rectangle.height / 2 / Math.abs(dy));
  return { x: middle.x + dx * reach + (dx / length) * EDGE_MARGIN, y: middle.y + dy * reach + (dy / length) * EDGE_MARGIN };
}

/** The boxes of a dependency graph, laid out so that no box touches another and none leaves the area. */
export class GraphLayout {
  readonly #placed: Attempt;

  private constructor(placed: Attempt) {
    this.#placed = placed;
  }

  /** Node `x`/`y` are percentages of `area`; it tries smaller letters until no box touches another. */
  static place(nodes: readonly GraphNode[], area: Rectangle): GraphLayout {
    const attempts = SIZES.map((size) => {
      const measure = { size, area };
      const boxes = nodes.map((node) => placed(node, widthLimit(node, nodes, measure), measure));
      return { size, nodes: boxes, conflicts: conflictsOf(boxes) };
    });
    return new GraphLayout(attempts.find((attempt) => attempt.conflicts.length === 0) ?? attempts.at(-1)!);
  }

  get font(): number {
    return this.#placed.size;
  }

  get nodes(): readonly PlacedNode[] {
    return this.#placed.nodes;
  }

  get conflicts(): Array<[string, string]> {
    return this.#placed.conflicts;
  }

  /** How red the bad edges are (`focus`, 0 → 1) and how thick they pulse, `age` frames after the focus began. */
  static badFocus(focusOnBad: boolean | undefined, age: number): Readonly<{ focus: number; pulse: number }> {
    if (!focusOnBad) return { focus: 0, pulse: 1 };
    return { focus: Math.min(1, age / FOCUS_FRAMES), pulse: 1 + PULSE * Math.max(0, Math.sin(age / PULSE_PERIOD)) };
  }

  edges(edges: readonly GraphEdge[]): PlacedEdge[] {
    return edges.map((edge) => {
      const [from, to] = [this.#node(edge.from), this.#node(edge.to)];
      return { edge, start: exitPoint(from.rectangle, center(to.rectangle)), end: exitPoint(to.rectangle, center(from.rectangle)) };
    });
  }

  boxes(): Boxes {
    return Boxes.of(this.#placed.nodes.map((placedNode) => Box.fitted(`nó ${placedNode.node.id}`, placedNode.rectangle, placedNode.fit)));
  }

  #node(id: string): PlacedNode {
    const found = this.#placed.nodes.find((placedNode) => placedNode.node.id === id);
    if (!found) throw new DomainError(`aresta do grafo aponta para o nó "${id}", que não existe (nós: ${this.#placed.nodes.map((placedNode) => placedNode.node.id).join(', ')})`);
    return found;
  }
}
