import { z } from 'zod';
import {
  CHART_CURVES,
  NODE_TONES,
  TERMINAL_TONES,
  CARD_VARIANTS,
  HOUSE_MARKS,
} from '../../domain/script/LessonScenes.ts';
import { nonEmptyText } from './refinements.ts';

const index = z.number().int().min(0);
const side = z.object({ title: z.string(), text: z.string() }).strict();

const title = z
  .object({ type: z.literal('title'), overline: z.string(), title: nonEmptyText, subtitle: z.string().optional() })
  .strict();
const card = z
  .object({
    type: z.literal('card'),
    variant: z.enum(CARD_VARIANTS),
    title: z.string(),
    items: z.array(z.string()),
    shown: index.optional(),
  })
  .strict();
const quote = z.object({ type: z.literal('quote'), text: nonEmptyText }).strict();
const chart = z
  .object({
    type: z.literal('chart'),
    xAxisLabel: z.string(),
    yAxisLabel: z.string(),
    curves: z.array(z.enum(CHART_CURVES)),
  })
  .strict();
const symptoms = z
  .object({
    type: z.literal('symptoms'),
    items: z.array(z.object({ name: z.string(), description: z.string() }).strict()),
    shown: index,
    focus: index.optional(),
  })
  .strict();
const code = z
  .object({
    type: z.literal('code'),
    title: z.string(),
    lines: z.array(z.string()),
    added: z.array(index).optional(),
    highlight: z.array(nonEmptyText).optional(),
  })
  .strict();
const terminal = z
  .object({
    type: z.literal('terminal'),
    command: z.string(),
    lines: z.array(z.object({ text: z.string(), tone: z.enum(TERMINAL_TONES).optional() }).strict()),
  })
  .strict();
const node = z
  .object({ id: nonEmptyText, label: z.string(), x: z.number(), y: z.number(), tone: z.enum(NODE_TONES).optional() })
  .strict();
const edge = z.object({ from: nonEmptyText, to: nonEmptyText, bad: z.boolean().optional() }).strict();
const graph = z
  .object({ type: z.literal('graph'), nodes: z.array(node), edges: z.array(edge), focusOnBad: z.boolean().optional() })
  .strict();
const versus = z.object({ type: z.literal('versus'), wrong: side, right: side }).strict();
const table = z
  .object({
    type: z.literal('table'),
    title: z.string().optional(),
    columns: z.array(z.string()),
    rows: z.array(z.object({ label: z.string(), cells: z.array(z.string()) }).strict()),
    shownRows: index.optional(),
    highlightedColumn: index.optional(),
    highlightedRow: index.optional(),
  })
  .strict();
const talk = z.object({ type: z.literal('talk') }).strict();
const house = z.object({ type: z.literal('house'), marks: z.array(z.enum(HOUSE_MARKS)) }).strict();
const inbox = z
  .object({ type: z.literal('inbox'), count: index, subject: z.string(), note: nonEmptyText.optional() })
  .strict();

export const lessonSceneSchemas = [
  title, card, quote, chart, symptoms, code, terminal, graph, versus, table, talk, house, inbox,
] as const;
