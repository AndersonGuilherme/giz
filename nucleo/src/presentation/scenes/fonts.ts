import { loadFont } from '@remotion/google-fonts/Nunito';

// Nunito (OFL), the same family as the old motor; `TextFit` estimates its width.
const nunito = loadFont('normal', { weights: ['700', '800', '900'], subsets: ['latin', 'latin-ext'] });

export const TEXT_FONT = `${nunito.fontFamily}, sans-serif`;
