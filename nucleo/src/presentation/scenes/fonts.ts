import { loadFont } from '@remotion/google-fonts/Nunito';
import { loadFont as loadMono } from '@remotion/google-fonts/JetBrainsMono';

// Nunito and JetBrains Mono (OFL), the same families as the old motor; `TextFit` estimates their widths.
const nunito = loadFont('normal', { weights: ['600', '700', '800', '900'], subsets: ['latin', 'latin-ext'] });
const jetBrainsMono = loadMono('normal', { weights: ['500', '600', '800'], subsets: ['latin', 'latin-ext'] });

export const TEXT_FONT = `${nunito.fontFamily}, sans-serif`;
export const MONO_FONT = `${jetBrainsMono.fontFamily}, monospace`;
