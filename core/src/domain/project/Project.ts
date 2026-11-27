import type { Cast } from '../cast/Cast.ts';
import type { Script } from '../script/Script.ts';
import type { Language } from '../values/Language.ts';
import type { AspectRatio } from '../values/AspectRatio.ts';
import { Lexicon } from '../speech/Lexicon.ts';
import type { ImageProviderName } from '../ai/ImageProviderName.ts';
import { DEFAULT_IMAGE_STYLE, type ImageStyle } from '../scenario/ImageStyle.ts';

export const FORMATS = ['story', 'lesson'] as const;
export type Format = (typeof FORMATS)[number];

export const CAPTION_STYLES = ['words', 'blocks'] as const;
export type CaptionStyle = (typeof CAPTION_STYLES)[number];

// Without a declared style: a story speaks word by word (as short story videos do), a lesson in blocks (as the motor).
const DEFAULT_CAPTION_STYLE: Readonly<Record<Format, CaptionStyle>> = { story: 'words', lesson: 'blocks' };

/** The caption style of a video: the declared one, or the default of its format. The `check` and the renderer both use it. */
export function captionStyleOf(format: Format, declared?: CaptionStyle): CaptionStyle {
  return declared ?? DEFAULT_CAPTION_STYLE[format];
}

// qwen: the local voice; recording: own recordings; elevenlabs and fish: the paid voice services.
export const VOICE_PROVIDERS = ['qwen', 'recording', 'elevenlabs', 'fish'] as const;
export type VoiceProviderName = (typeof VOICE_PROVIDERS)[number];
export const VOICE_MODELS = ['0.6b', '1.7b'] as const;
export type ProjectVoice = Readonly<{
  provider: VoiceProviderName;
  model?: (typeof VOICE_MODELS)[number];
}>;

export type ProjectProfile = Readonly<{
  title: string;
  format: Format;
  language: Language;
  aspect: AspectRatio;
  brand?: string;
  /** Optional: without it, `captionStyleOf` picks the default of the format. */
  captionStyle?: CaptionStyle;
  voice: ProjectVoice;
  /** Optional: the style of the AI-generated scenarios (without it, `DEFAULT_IMAGE_STYLE`). */
  style?: ImageStyle;
  /** Optional: the image AI of the project (without it, the CLI picks one). */
  imageProvider?: ImageProviderName;
}>;

/**
 * `warnings` are problems that do not prevent loading (for example, a missing scenario image); `lexicon` is the
 * pronunciation dictionary of the project voice service (none: the voice reads the text as it is).
 */
export type ProjectContent = Readonly<{ cast: Cast; script: Script; warnings: readonly string[]; lexicon?: Lexicon }>;

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

  /** The resolved style (declared, or the default of the format). */
  captionStyle(): CaptionStyle {
    return captionStyleOf(this.#profile.format, this.#profile.captionStyle);
  }

  voice(): ProjectVoice {
    return this.#profile.voice;
  }

  /** The style of the generated scenarios: the declared one, or the default. */
  imageStyle(): ImageStyle {
    return this.#profile.style ?? DEFAULT_IMAGE_STYLE;
  }

  imageProvider(): ImageProviderName | undefined {
    return this.#profile.imageProvider;
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

  lexicon(): Lexicon {
    return this.#content.lexicon ?? Lexicon.EMPTY;
  }
}
