import type { Scene } from '../script/Scene.ts';
import type { Language } from '../values/Language.ts';
import type { AspectRatio } from '../values/AspectRatio.ts';
import type { Boxes } from './Boxes.ts';

export type SceneType = Scene['type'];
export type SceneOfType<T extends SceneType> = Extract<Scene, Readonly<{ type: T }>>;

/** Contract of every scene: the boxes it takes in an aspect ratio and a language. */
export type SceneLayout<T extends SceneType = SceneType> = (scene: SceneOfType<T>, aspect: AspectRatio, language: Language) => Boxes;

/** Map from scene type to its layout; each scene registers itself, without a `switch`. */
export class LayoutRegistry {
  readonly #layouts: Map<SceneType, SceneLayout>;

  private constructor(layouts: Map<SceneType, SceneLayout>) {
    this.#layouts = layouts;
  }

  static empty(): LayoutRegistry {
    return new LayoutRegistry(new Map());
  }

  register<T extends SceneType>(type: T, layout: SceneLayout<T>): LayoutRegistry {
    // The map only hands the function to scenes of the type it was registered with; that is why the cast is safe.
    this.#layouts.set(type, (scene, aspect, language) => layout(scene as SceneOfType<T>, aspect, language));
    return this;
  }

  /** `undefined` when the scene type has no registered layout yet. */
  boxesOf(scene: Scene, aspect: AspectRatio, language: Language): Boxes | undefined {
    const layout = this.#layouts.get(scene.type);
    return layout?.(scene, aspect, language);
  }
}
