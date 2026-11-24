import type { FC } from 'react';
import type { CharacterState } from '../../domain/character/CharacterState.ts';
import type { SceneLayout, SceneOfType, SceneType } from '../../domain/layout/LayoutRegistry.ts';
import type { Scene } from '../../domain/script/Scene.ts';
import type { CharacterJson } from '../../domain/timeline/VideoProps.ts';
import type { AspectRatio } from '../../domain/values/AspectRatio.ts';
import type { Language } from '../../domain/values/Language.ts';

/** The cast as the video receives it: who uses which rig with which parameters. */
export type CastMember = Pick<CharacterJson, 'id' | 'rig' | 'parameters'>;

/** What every scene component receives; the frame comes from Remotion (counted from the start of the scene). */
export type SceneProps<S extends Scene = Scene> = Readonly<{
  scene: S;
  aspect: AspectRatio;
  language: Language; // the fixed labels drawn in the scene follow it
  progress: number; // 0 at the start of the scene, 1 at its end
  changedAt?: number; // frame (from the start of the scene) of the last beat that changed its fields; 0 when none did
  cast: readonly CastMember[];
  stateOf: (characterId: string) => CharacterState;
}>;

/** A scene type: the component that draws it and the boxes the `check` verifies (the same domain layout). */
export type SceneEntry<T extends SceneType = SceneType> = Readonly<{ Component: FC<SceneProps<SceneOfType<T>>>; boxes: SceneLayout<T> }>;

/** Map from scene type to its entry; each scene registers itself, without a `switch`. */
export class SceneRegistry {
  readonly #entries = new Map<SceneType, SceneEntry>();

  private constructor() {}

  static empty(): SceneRegistry {
    return new SceneRegistry();
  }

  register<T extends SceneType>(type: T, entry: SceneEntry<T>): SceneRegistry {
    // The map only hands the entry to scenes of the type it was registered with; that is why the cast is safe.
    this.#entries.set(type, entry as unknown as SceneEntry);
    return this;
  }

  get(type: SceneType): SceneEntry {
    const entry = this.#entries.get(type);
    if (!entry) throw new Error(`cena "${type}" ainda não tem componente (registradas: ${[...this.#entries.keys()].join(', ')})`);
    return entry;
  }
}
