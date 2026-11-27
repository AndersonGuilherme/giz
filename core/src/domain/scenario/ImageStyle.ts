/** The look of the AI-generated scenarios of a project, kept the same in every scene so they match. */
export const IMAGE_STYLES = ['painted-2d', 'flat-vector', 'watercolor', 'chalk'] as const;
export type ImageStyle = (typeof IMAGE_STYLES)[number];

/** Without `project.style` (or a scene's own `style`), scenarios are painted 2D illustrations. */
export const DEFAULT_IMAGE_STYLE: ImageStyle = 'painted-2d';

// Sent to the image model, not shown to the person: so it is English, like the code.
const PRESETS: Readonly<Record<ImageStyle, string>> = {
  'painted-2d': 'Style: a painted 2D illustration for an animated video, soft brush textures, warm light, rich but calm colors, gentle depth.',
  'flat-vector': 'Style: a flat vector illustration, clean simple shapes, solid colors with subtle gradients, crisp edges, no outlines.',
  watercolor: 'Style: a watercolor painting, soft washes of color, visible paper texture, light pastel palette, loose edges.',
  chalk: 'Style: a colored chalk drawing on a dark green chalkboard, soft hand-drawn strokes, slightly dusty texture.',
};

/** The style text that opens every image prompt of that style. */
export function stylePresetOf(style: ImageStyle): string {
  return PRESETS[style];
}
