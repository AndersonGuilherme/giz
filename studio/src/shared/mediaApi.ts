// The part of `window.giz` for the Cast, Scenarios and Voices stages (see GizApi.ts).
import type { CastCatalog, CastDocument, CharacterFile, CharacterProblem, CharacterSaved, CharacterVoice, ProjectVoice, VoiceSample } from './cast.ts';
import type { Result } from './contract.ts';
import type { ImageCrop, ImageEstimate, ImageProgress, ImageStyle, ScenariosDocument, SceneImageProvider } from './scenarios.ts';
import type { VoiceProgress, VoicesDocument } from './voices.ts';

type Reply<T> = Promise<Result<T>>;
type Unsubscribe = () => void;

export type MediaApi = Readonly<{
  cast: Readonly<{
    catalog(): Reply<CastCatalog>;
    read(folder: string): Reply<CastDocument>;
    check(character: CharacterFile): Reply<readonly CharacterProblem[]>;
    save(folder: string, character: CharacterFile): Reply<CharacterSaved>;
    add(folder: string, choice: Readonly<{ preset?: string; id?: string; name?: string }>): Reply<CastDocument>;
    remove(folder: string, id: string): Reply<CastDocument>;
    voice(folder: string, voice: ProjectVoice): Reply<CastDocument>;
    sample(folder: string, voice: CharacterVoice, text: string): Reply<VoiceSample>;
  }>;
  scenarios: Readonly<{
    read(folder: string): Reply<ScenariosDocument>;
    vector(folder: string, lineId: string, vector: string): Reply<ScenariosDocument>;
    upload(folder: string, lineId: string, bytes: Uint8Array): Reply<ScenariosDocument>;
    prompt(folder: string, lineId: string, generate: Readonly<{ prompt: string; style?: ImageStyle }>): Reply<ScenariosDocument>;
    estimate(folder: string, lineId: string, force: boolean): Reply<ImageEstimate>;
    generate(folder: string, lineId: string, force: boolean): Reply<ScenariosDocument>;
    cancel(): Reply<boolean>;
    useGenerated(folder: string, lineId: string): Reply<ScenariosDocument>;
    crop(folder: string, lineId: string, crop: ImageCrop | null): Reply<ScenariosDocument>;
    settings(folder: string, settings: Readonly<{ style?: ImageStyle; provider?: SceneImageProvider }>): Reply<ScenariosDocument>;
    onProgress(listener: (progress: ImageProgress) => void): Unsubscribe;
  }>;
  voices: Readonly<{
    read(folder: string): Reply<VoicesDocument>;
    generate(folder: string, lineId?: string): Reply<VoicesDocument>;
    cancel(): Reply<boolean>;
    record(folder: string, lineId: string, wav: Uint8Array): Reply<VoicesDocument>;
    unrecord(folder: string, lineId: string): Reply<VoicesDocument>;
    onProgress(listener: (progress: VoiceProgress) => void): Unsubscribe;
  }>;
}>;
