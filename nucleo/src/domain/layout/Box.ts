import { TextFit } from './TextFit.ts';
import type { Font } from './Font.ts';

/** Rectangle in video pixels (origin at the top left corner). */
export type Rectangle = Readonly<{ x: number; y: number; width: number; height: number }>;
export type BoxText = Readonly<{ text: string; font: Font }>;
type Content = Readonly<{ label: string; text?: BoxText }>;

/** Region an element takes on screen; the label shows up in the `check` messages. */
export class Box {
  readonly #rectangle: Rectangle;
  readonly #content: Content;

  private constructor(rectangle: Rectangle, content: Content) {
    this.#rectangle = rectangle;
    this.#content = content;
  }

  static of(label: string, rectangle: Rectangle): Box {
    return new Box({ ...rectangle }, { label });
  }

  static withText(label: string, rectangle: Rectangle, text: BoxText): Box {
    return new Box({ ...rectangle }, { label, text });
  }

  get x(): number {
    return this.#rectangle.x;
  }

  get y(): number {
    return this.#rectangle.y;
  }

  get width(): number {
    return this.#rectangle.width;
  }

  get height(): number {
    return this.#rectangle.height;
  }

  get label(): string {
    return this.#content.label;
  }

  /** Touching the edge is not overlapping. */
  overlaps(other: Box): boolean {
    const apartHorizontally = this.#right() <= other.x || other.#right() <= this.x;
    const apartVertically = this.#base() <= other.y || other.#base() <= this.y;
    return !apartHorizontally && !apartVertically;
  }

  isInside(other: Box): boolean {
    const horizontally = this.x >= other.x && this.#right() <= other.#right();
    return horizontally && this.y >= other.y && this.#base() <= other.#base();
  }

  /** Without text, there is nothing to fit. */
  textFits(): boolean {
    const content = this.#content.text;
    if (!content) return true;
    const fit = TextFit.measure(content.text, content.font, this.width);
    return fit.fits;
  }

  #right(): number {
    return this.x + this.width;
  }

  #base(): number {
    return this.y + this.height;
  }
}
