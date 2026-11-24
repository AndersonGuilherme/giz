import { Motion } from './Motion.ts';

// The motor's terminal: the command starts after 6 frames at about 1.1 characters per frame; the cursor blinks every
// 15 frames; output line i fades in over 5 frames starting 7i frames after the last change.
const TYPING_DELAY = 6;
const FRAMES_PER_CHARACTER = 0.9;
const CURSOR_PERIOD = 15;
const LINE_INTERVAL = 7;
const LINE_FADE = 5;

/** How much of the terminal command is typed, and which output lines show, at a frame. */
export class Typing {
  readonly #command: string;

  private constructor(command: string) {
    this.#command = command;
  }

  static of(command: string): Typing {
    return new Typing(command);
  }

  /** `frame` counted from the start of the scene. */
  typedAt(frame: number): string {
    const length = this.#command.length;
    const progress = Motion.ramp(frame, [TYPING_DELAY, TYPING_DELAY + length * FRAMES_PER_CHARACTER]);
    return this.#command.slice(0, Math.round(progress * length));
  }

  cursorVisible(frame: number): boolean {
    return Math.floor(frame / CURSOR_PERIOD) % 2 === 0;
  }

  /** `age` counts the frames since the last change of the scene. */
  static lineOpacity(index: number, age: number): number {
    const start = index * LINE_INTERVAL;
    return Motion.ramp(age, [start, start + LINE_FADE]);
  }
}
