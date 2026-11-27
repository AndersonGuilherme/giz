import { createHash } from 'node:crypto';
import { access, mkdir, readFile, rename } from 'node:fs/promises';
import { join } from 'node:path';
import type { Portraits } from '../../shared/projects.ts';
import type { CoreComposition } from './coreModules.ts';

type Preset = Readonly<{ id: string; rig?: string; json: Readonly<Record<string, unknown>> }>;
type Painter = ReturnType<CoreComposition['castPortraits']>;

// Squares of 160 px, 8 per row: the picker shows them at 80 px, sharp on a doubled screen.
const GRID = { cell: 160, columns: 8 } as const;
const exists = (path: string) => access(path).then(() => true, () => false);

function cardsOf(presets: readonly Preset[]) {
  return presets.flatMap(({ id, rig, json }) => (rig ? [{ id, rig, parameters: (json.parameters ?? {}) as Record<string, unknown>, expression: String(json.defaultExpression ?? 'neutral') }] : []));
}

/**
 * The portraits of the ready characters with a body, in one PNG kept in `folder`: named by the hash of what they
 * draw, so a changed preset draws them again and an unchanged one is read back at once.
 */
export async function drawnPortraits(folder: string, presets: readonly Preset[], painter: Painter): Promise<Portraits> {
  const cards = cardsOf(presets);
  const hash = createHash('sha256').update(JSON.stringify({ cards, GRID })).digest('hex').slice(0, 16);
  const file = join(folder, `portraits-${hash}.png`);
  if (!(await exists(file))) await paint(painter, { cards, file });
  const image = `data:image/png;base64,${(await readFile(file)).toString('base64')}`;
  return { image, ...GRID, ids: cards.map(({ id }) => id) };
}

// Drawn under another name first: a stopped app never leaves half a picture under the real one.
async function paint(painter: Painter, { cards, file }: Readonly<{ cards: ReturnType<typeof cardsOf>; file: string }>): Promise<void> {
  await mkdir(join(file, '..'), { recursive: true });
  const draft = `${file}.draft.png`;
  await painter.render(cards, GRID, draft);
  await rename(draft, file);
}
