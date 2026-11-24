import { DomainError } from '../DomainError.ts';
import type { CharacterId } from '../values/CharacterId.ts';
import type { Expression } from './PoseAndExpression.ts';

export type ParameterValue = string | number | boolean;

export type CharacterVoice = Readonly<{ id: string; style?: string }>;

/** `parameters` already validated by the rig, with defaults applied. Without `rig`, only the narrator (a voice without a body). */
export type CharacterProfile = Readonly<{
  name: string;
  rig?: string;
  parameters: Readonly<Record<string, ParameterValue>>;
  voice: CharacterVoice;
  personality?: string;
  defaultExpression: Expression;
}>;

export class Character {
  readonly #id: CharacterId;
  readonly #profile: CharacterProfile;

  private constructor(id: CharacterId, profile: CharacterProfile) {
    this.#id = id;
    this.#profile = profile;
  }

  static of(id: CharacterId, profile: CharacterProfile): Character {
    if (profile.rig === undefined && !id.isNarrator()) {
      throw new DomainError(`"${id.text()}" precisa de um rig (só o narrador pode não ter corpo)`);
    }
    return new Character(id, { ...profile, parameters: Object.freeze({ ...profile.parameters }) });
  }

  hasId(id: CharacterId): boolean {
    return this.#id.equals(id);
  }

  /** The narrator without a rig is only a voice. */
  hasBody(): boolean {
    return this.#profile.rig !== undefined;
  }

  id(): CharacterId {
    return this.#id;
  }

  name(): string {
    return this.#profile.name;
  }

  rig(): string | undefined {
    return this.#profile.rig;
  }

  parameters(): Readonly<Record<string, ParameterValue>> {
    return this.#profile.parameters;
  }

  voice(): CharacterVoice {
    return this.#profile.voice;
  }

  personality(): string | undefined {
    return this.#profile.personality;
  }

  defaultExpression(): Expression {
    return this.#profile.defaultExpression;
  }
}
