import { Font, type FontMeasures } from '../layout/Font.ts';
import { TextFit, type Fit } from '../layout/TextFit.ts';

type Area = Readonly<{ width: number; height: number }>;
type Measures = Omit<FontMeasures, 'maximumLines'>;
export type MonospaceFit = Readonly<{ font: Font; fit: Fit; measured: string; rowHeight: number }>;

// Below this size a line of code stops being readable: the block keeps it and reports the lines that do not fit.
const SMALLEST_SIZE = 16;
// Spaces become a visible character so `TextFit` sees each line as one word: it may shrink the letters, but a line
// that would need breaking (or more lines than fit) makes `fits` false. Indentation counts in the width.
const SPACE = '·';
const ROUNDING = 1e-6;

/** Lines drawn as they are (code, terminal): never wrapped; the letters shrink to fit the height and the width. */
export class MonospaceBlock {
  static fit(lines: readonly string[], area: Area, measures: Measures): MonospaceFit {
    const heightSize = area.height / (Math.max(1, lines.length) * measures.lineHeight);
    const size = Math.min(measures.size, Math.max(SMALLEST_SIZE, heightSize));
    const rows = Math.floor(area.height / (size * measures.lineHeight) + ROUNDING);
    const maximumLines = Math.max(1, Math.min(lines.length, rows));
    const font = Font.of({ family: 'mono', size, lineHeight: measures.lineHeight, maximumLines });
    const measured = MonospaceBlock.measuredText(lines);
    return { font, fit: TextFit.measure(measured, font, area.width), measured, rowHeight: size * measures.lineHeight };
  }

  static measuredText(lines: readonly string[]): string {
    return lines.map((line) => line.replace(/\s/g, SPACE) || SPACE).join('\n');
  }
}
