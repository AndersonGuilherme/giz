import type { LineJson, ScriptJson } from '../../shared/script.ts';

type Scene = Readonly<{ type?: unknown; background?: Readonly<Record<string, unknown>> }>;
const sceneOf = (line: LineJson | undefined): Scene | undefined => (line?.scene && typeof line.scene === 'object' ? (line.scene as Scene) : undefined);
const imageOf = (line: LineJson | undefined) => sceneOf(line)?.background?.image;

function linked(line: LineJson, image: unknown): LineJson {
  const scene = sceneOf(line)!;
  return { ...line, scene: { ...scene, background: { ...scene.background, image } } };
}

/**
 * The edited script with the image a scenario job linked on disk (core points the scene's `background.image` to it):
 * only that line's image changes, so the person's unsaved changes stay and the next save keeps the link.
 */
export function withImageOnDisk(edited: ScriptJson, disk: ScriptJson, lineId: string): ScriptJson {
  const image = imageOf(disk.lines.find(({ id }) => id === lineId));
  const index = edited.lines.findIndex(({ id }) => id === lineId);
  const line = edited.lines[index];
  if (!line || sceneOf(line)?.type !== 'scenario' || image === undefined || imageOf(line) === image) return edited;
  return { ...edited, lines: edited.lines.map((each, at) => (at === index ? linked(each, image) : each)) };
}
