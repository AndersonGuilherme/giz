import type { Scene } from '../script/Scene.ts';
import type { Line, HoldAfter } from '../script/Line.ts';

// readingSeconds from the motor: ~0.35 s per line with text, between 4 and 9 s, +1 s if there are added lines.
const SECONDS_PER_LINE = 0.35;
const MINIMUM_IN_SECONDS = 4;
const MAXIMUM_IN_SECONDS = 9;
const READING_LABEL = 'Leia o código';

function readingSeconds(scene: Scene): number {
  if (scene.type !== 'code') return 0;
  const withText = scene.lines.filter((line) => line.trim()).length;
  const byLines = Math.round(withText * SECONDS_PER_LINE);
  const hasAdded = (scene.added?.length ?? 0) > 0;
  return Math.min(MAXIMUM_IN_SECONDS, Math.max(MINIMUM_IN_SECONDS, byLines)) + (hasAdded ? 1 : 0);
}

/**
 * The hold after the line: the explicit one (`holdAfter`) and/or the reading hold of code the line opens on screen;
 * the larger one wins. `openedScene` is the scene the line opens (absent when it inherits the previous one).
 */
export function lineHold(line: Line, openedScene: Scene | undefined): HoldAfter | undefined {
  const reading = openedScene ? readingSeconds(openedScene) : 0;
  const explicit = line.holdAfter();
  if (explicit) return { ...explicit, seconds: Math.max(explicit.seconds, reading) };
  if (reading > 0) return { seconds: reading, label: READING_LABEL };
  return undefined;
}
