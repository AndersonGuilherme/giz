import { DomainError } from '../DomainError.ts';
import type { Line } from '../script/Line.ts';
import type { ResolvedScene } from './VideoProps.ts';

/** The scene of a line: its own or the inherited one; `key` changes only when a line opens a new scene. */
export type LineScene = Readonly<{ scene: ResolvedScene; key: number; opened: boolean }>;

const NONE = -1;

/** The scene on screen along the lines: a line without a scene inherits the previous one, with the beat changes. */
export class SceneSequence {
  #current: ResolvedScene | undefined;
  #key = NONE;

  sceneOf(line: Line): LineScene {
    const own = line.scene();
    if (own) return this.#open(own);
    if (!this.#current) throw new DomainError(`fala ${line.id()}: a primeira fala precisa de cena`);
    return { scene: this.#current, key: this.#key, opened: false };
  }

  /** The scene after the line beats: the one the next line inherits, if it does not open another. */
  continueWith(scene: ResolvedScene): void {
    this.#current = scene;
  }

  #open(scene: ResolvedScene): LineScene {
    this.#current = { ...scene };
    this.#key += 1;
    return { scene: this.#current, key: this.#key, opened: true };
  }
}
