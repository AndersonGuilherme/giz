/** A font file of the package public folder (`fonts/`, each with its OFL license beside it) and the weights it holds. */
export type BundledFont = Readonly<{ family: string; file: string; weight: string }>;

// Nunito and JetBrains Mono (OFL), the same families as the old motor; `TextFit` estimates their widths. Variable
// fonts: one file holds every weight. They are bundled, never fetched, so the render and the preview work offline.
export const BUNDLED_FONTS: readonly BundledFont[] = [
  { family: 'Nunito', file: 'fonts/Nunito.ttf', weight: '200 1000' },
  { family: 'JetBrains Mono', file: 'fonts/JetBrainsMono.ttf', weight: '100 800' },
];

export const TEXT_FONT = '"Nunito", sans-serif';
export const MONO_FONT = '"JetBrains Mono", monospace';
