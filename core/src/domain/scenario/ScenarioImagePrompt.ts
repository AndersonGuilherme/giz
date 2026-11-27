import type { AspectRatio } from '../values/AspectRatio.ts';
import { BackdropLayout } from './BackdropLayout.ts';
import { stylePresetOf, type ImageStyle } from './ImageStyle.ts';
import { ScenarioImageFrame } from './ScenarioImageFrame.ts';

/** What the person asked for one scene, the style it is drawn in and the aspect of the video. */
export type ScenarioImageBrief = Readonly<{ prompt: string; style: ImageStyle; aspect: AspectRatio }>;

// Sent to the image model, not shown to the person: so it is English, like the code.
const CLEAN = 'No text, letters, numbers, signs, logos, watermarks or brand names anywhere in the image. '
  + 'No real, recognizable landmarks, buildings or places.';
const ORIGINAL = 'Make it an original scene with its own design: do not copy or imitate an existing artwork, film, game, '
  + 'character or artist.';

// A fraction of the frame, as a whole percentage of the image (the image has a bleed around the frame).
const percent = (fraction: number): number => Math.round(ScenarioImageFrame.inImage(fraction) * 100);

// Where the characters stand (BackdropLayout's stage), so the image leaves them room; and where its horizon and main
// feature go, as on the vector backgrounds.
function compositionHint(aspect: AspectRatio): string {
  const { stage, ground, horizon, focus } = BackdropLayout.for(aspect);
  const [width, height] = [aspect.width(), aspect.height()];
  const across = `${percent(stage.x / width)}% to ${percent((stage.x + stage.width) / width)}% of the width`;
  const down = `feet at ${percent(ground / height)}% and heads at ${percent(stage.y / height)}% of the height`;
  return [
    `Composition: an empty setting; animated characters are added later, standing on the floor between ${across}, with their ${down}.`,
    'Keep that area free of furniture, props and anything standing in front of them; the back wall or the far scenery may show behind them.',
    `Put the horizon line (where the floor meets the back wall or the far scenery) at about ${percent(horizon / height)}% from the top.`,
    `Put the main feature of the place (a window, a door, a monument) around ${percent(focus.x / width)}% across and ${percent(focus.y / height)}% down.`,
    'Show the place only: no people, characters or animals. The outer edges may be cropped by the camera.',
  ].join(' ');
}

/** The full prompt of a scenario image: the style preset, the person's prompt, the composition and the clauses. */
export function scenarioImagePrompt(brief: ScenarioImageBrief): string {
  const { prompt, style, aspect } = brief;
  return [stylePresetOf(style), `Scene: ${prompt.trim()}`, compositionHint(aspect), CLEAN, ORIGINAL].join('\n\n');
}
