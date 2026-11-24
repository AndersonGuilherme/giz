import type { Cast } from '../cast/Cast.ts';
import type { Script } from '../script/Script.ts';
import type { Language } from '../values/Language.ts';
import type { AspectRatio } from '../values/AspectRatio.ts';

export const FORMATS = ['story', 'lesson'] as const;
export type Format = (typeof FORMATS)[number];

export const CAPTION_STYLES = ['words', 'blocks'] as const;
export type CaptionStyle = (typeof CAPTION_STYLES)[number];

export const VOICE_PROVIDERS = ['qwen', 'recording'] as const;
export const VOICE_MODELS = ['0.6b', '1.7b'] as const;
export type ProjectVoice = Readonly<{
  provider: (typeof VOICE_PROVIDERS)[number];
  model?: (typeof VOICE_MODELS)[number];
}>;

export type ProjectProfile = Readonly<{
  title: string;
  format: Format;
  language: Language;
  aspect: AspectRatio;
  brand?: string;
  captionStyle: CaptionStyle;
  voice: ProjectVoice;
}>;

/** `warnings` are problems that do not prevent loading (for example, a missing scenario image). */
export type ProjectContent = Readonly<{ cast: Cast; script: Script; warnings: readonly string[] }>;

export class Project {
  readonly #profile: ProjectProfile;
  readonly #content: ProjectContent;

  private constructor(profile: ProjectProfile, content: ProjectContent) {
    this.#profile = profile;
    this.#content = content;
  }

  static of(profile: ProjectProfile, content: ProjectContent): Project {
    return new Project(profile, { ...content, warnings: [...content.warnings] });
  }

  title(): string {
    return this.#profile.title;
  }

  language(): Language {
    return this.#profile.language;
  }

  aspect(): AspectRatio {
    return this.#profile.aspect;
  }

  format(): Format {
    return this.#profile.format;
  }

  brand(): string | undefined {
    return this.#profile.brand;
  }

  captionStyle(): CaptionStyle {
    return this.#profile.captionStyle;
  }

  voice(): ProjectVoice {
    return this.#profile.voice;
  }

  cast(): Cast {
    return this.#content.cast;
  }

  script(): Script {
    return this.#content.script;
  }

  warnings(): readonly string[] {
    return this.#content.warnings;
  }
}
