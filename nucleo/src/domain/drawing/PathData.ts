import { DomainError } from '../DomainError.ts';

export type Point = Readonly<{ x: number; y: number }>;
export type Segment = Readonly<{ kind: 'line'; to: Point }> | Readonly<{ kind: 'cubic'; first: Point; second: Point; to: Point }>;
/** A single outline: where it starts, its segments and whether it closes back on the start. */
export type Path = Readonly<{ start: Point; segments: readonly Segment[]; closed: boolean }>;

type Builder = { start?: Point; current: Point; segments: Segment[]; closed: boolean };
type Command = Readonly<{ arity: number; apply: (numbers: readonly number[], builder: Builder) => void }>;

const TOKEN = /-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?|[a-zA-Z]/g;

function line(builder: Builder, to: Point): void {
  builder.segments.push({ kind: 'line', to });
  builder.current = to;
}

function cubic(builder: Builder, controls: Readonly<{ first: Point; second: Point; to: Point }>): void {
  builder.segments.push({ kind: 'cubic', ...controls });
  builder.current = controls.to;
}

// The point made of the numbers at `index` and `index + 1`.
const pointOf = (numbers: readonly number[], index: number): Point => ({ x: numbers[index]!, y: numbers[index + 1]! });

// A quadratic is the cubic whose controls sit 2/3 of the way to its single control point.
const twoThirds = (from: Point, toward: Point): Point => ({ x: from.x + ((toward.x - from.x) * 2) / 3, y: from.y + ((toward.y - from.y) * 2) / 3 });

function close(builder: Builder): void {
  const start = builder.start ?? builder.current;
  const { current } = builder;
  if (current.x !== start.x || current.y !== start.y) line(builder, start);
  builder.closed = true;
}

function move(builder: Builder, to: Point): void {
  if (builder.start) throw new DomainError('o caminho tem mais de um "M" (desenhe cada contorno à parte)');
  builder.start = to;
  builder.current = to;
}

// Absolute commands only: the drawings of the rigs and backgrounds are written that way.
const COMMANDS: Readonly<Record<string, Command>> = {
  'M': { arity: 2, apply: (numbers, builder) => move(builder, pointOf(numbers, 0)) },
  'L': { arity: 2, apply: (numbers, builder) => line(builder, pointOf(numbers, 0)) },
  'H': { arity: 1, apply: ([x], builder) => line(builder, { x: x!, y: builder.current.y }) },
  'V': { arity: 1, apply: ([y], builder) => line(builder, { x: builder.current.x, y: y! }) },
  'C': { arity: 6, apply: (numbers, builder) => cubic(builder, { first: pointOf(numbers, 0), second: pointOf(numbers, 2), to: pointOf(numbers, 4) }) },
  'Q': {
    arity: 4,
    apply: (numbers, builder) => {
      const [control, to] = [pointOf(numbers, 0), pointOf(numbers, 2)];
      cubic(builder, { first: twoThirds(builder.current, control), second: twoThirds(to, control), to });
    },
  },
  'Z': { arity: 0, apply: (_numbers, builder) => close(builder) },
};

// Each command letter with the numbers that follow it.
function groupsOf(data: string): readonly (readonly [string, number[]])[] {
  const tokens = data.match(TOKEN) ?? [];
  const letters = tokens.flatMap((token, index) => (/[a-z]/i.test(token) ? [index] : []));
  return letters.map((start, order) => [tokens[start]!, tokens.slice(start + 1, letters[order + 1] ?? tokens.length).map(Number)] as const);
}

function run(data: string, [letter, numbers]: readonly [string, number[]], builder: Builder): void {
  const command = COMMANDS[letter];
  const valid = command && (command.arity === 0 ? numbers.length === 0 : numbers.length > 0 && numbers.length % command.arity === 0);
  if (!valid) throw new DomainError(`caminho "${data}": "${letter}" não suportado (use M, L, H, V, C, Q e Z absolutos)`);
  const repeats = command.arity === 0 ? 1 : numbers.length / command.arity;
  Array.from({ length: repeats }, (_empty, index) => command.apply(numbers.slice(index * command.arity), builder));
}

/** Reads SVG path data with absolute M, L, H, V, C, Q and Z (one outline); anything else is a DomainError. */
export function parsePath(data: string): Path {
  const builder: Builder = { current: { x: 0, y: 0 }, segments: [], closed: false };
  groupsOf(data).forEach((group) => run(data, group, builder));
  if (!builder.start) throw new DomainError(`caminho "${data}" sem "M" inicial`);
  return { start: builder.start, segments: builder.segments, closed: builder.closed };
}
