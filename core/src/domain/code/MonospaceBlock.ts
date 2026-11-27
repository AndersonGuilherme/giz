import { Font, type FontMeasures } from '../layout/Font.ts';
import { TextFit, characterUnits, type Fit } from '../layout/TextFit.ts';

type Area = Readonly<{ width: number; height: number }>;
type Measures = Omit<FontMeasures, 'maximumLines'>;
/** `rowHeight` follows the size the letters were fitted to (tight rows); lines that do not fit keep the rows of the unshrunk size. */
export type MonospaceFit = Readonly<{ font: Font; fit: Fit; measured: string; rowHeight: number }>;

// Below this size a line of code stops being readable: the block keeps it and reports the lines that do not fit. The
// motor drew the SOLID course code down to about 15.5 px (113-character lines, 27-line files) in the 16:9 window.
const SMALLEST_SIZE = 15;
// Spaces become a visible character so `TextFit` sees each line as one word: it may shrink the letters, but a line
// that would need breaking (or more lines than fit) makes `fits` false. Indentation counts in the width.
const SPACE = '·';
const ROUNDING = 1e-6;
const MONOSPACE_EM = 0.6;
const HUNDREDTHS = 100;

// As the motor: the largest size (up to the base) at which every line fits the width and every row the height.
function sizeFor(lines: readonly string[], area: Area, measures: Measures): number {
  const heightSize = area.height / (Math.max(1, lines.length) * measures.lineHeight);
  const longest = Math.max(1, ...lines.map((line) => characterUnits(line.replace(/\s/g, SPACE), 'mono')));
  // Rounded down to the hundredth `TextFit` rounds sizes to, so the chosen size never ends up a hair too wide.
  const widthSize = Math.floor((area.width / (longest * MONOSPACE_EM)) * HUNDREDTHS) / HUNDREDTHS;
  return Math.min(measures.size, Math.max(SMALLEST_SIZE, Math.min(heightSize, widthSize)));
}

/** Lines drawn as they are (code, terminal): never wrapped; the letters shrink to fit the height and the width. */
export class MonospaceBlock {
  static fit(lines: readonly string[], area: Area, measures: Measures): MonospaceFit {
    const size = sizeFor(lines, area, measures);
    const rows = Math.floor(area.height / (size * measures.lineHeight) + ROUNDING);
    const maximumLines = Math.max(1, Math.min(lines.length, rows));
    const font = Font.of({ family: 'mono', size, lineHeight: measures.lineHeight, maximumLines });
    const measured = MonospaceBlock.measuredText(lines);
    const fitted = TextFit.measure(measured, font, area.width);
    // Letters that would have to shrink below the readable size are not a fit.
    const fit = fitted.size >= SMALLEST_SIZE - ROUNDING ? fitted : { ...fitted, fits: false };
    return { font, fit, measured, rowHeight: (fit.fits ? fit.size : size) * measures.lineHeight };
  }

  static measuredText(lines: readonly string[]): string {
    return lines.map((line) => line.replace(/\s/g, SPACE) || SPACE).join('\n');
  }
}
