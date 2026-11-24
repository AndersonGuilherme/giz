import { Box, type Rectangle } from '../layout/Box.ts';
import type { Font } from '../layout/Font.ts';
import { TextFit, type Fit } from '../layout/TextFit.ts';

type Place = Readonly<{ x: number; y: number; width: number }>;
type Content = Readonly<{ text: string; font: Font; fit: Fit; rectangle: Rectangle }>;

/**
 * A text placed in a lesson scene: `fit` holds the lines and the letter size the video draws (the same `TextFit` the
 * check uses) and the rectangle is as tall as those lines. A text that does not fit keeps every line (it is never cut)
 * and its box reports it in the check.
 */
export class TextBlock {
  readonly #label: string;
  readonly #content: Content;

  private constructor(label: string, content: Content) {
    this.#label = label;
    this.#content = content;
  }

  static at(label: string, place: Place, text: Readonly<{ text: string; font: Font }>): TextBlock {
    const fit = TextFit.measure(text.text, text.font, place.width);
    const lines = Math.min(fit.lines.length, text.font.maximumLines());
    const height = Math.ceil(lines * fit.size * text.font.lineHeight());
    return new TextBlock(label, { ...text, fit, rectangle: { ...place, height } });
  }

  get content(): Content {
    return this.#content;
  }

  get rectangle(): Rectangle {
    return this.#content.rectangle;
  }

  get fit(): Fit {
    return this.#content.fit;
  }

  /** Line height in pixels, at the size the text was fitted to. */
  lineHeight(): number {
    return this.#content.fit.size * this.#content.font.lineHeight();
  }

  bottom(): number {
    return this.rectangle.y + this.rectangle.height;
  }

  /** The same text placed `offset` pixels lower (to center a column after measuring it). */
  movedDown(offset: number): TextBlock {
    const { rectangle } = this.#content;
    return new TextBlock(this.#label, { ...this.#content, rectangle: { ...rectangle, y: rectangle.y + offset } });
  }

  box(): Box {
    const { text, font, rectangle } = this.#content;
    return Box.withText(this.#label, rectangle, { text, font });
  }
}
