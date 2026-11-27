import { createHash } from 'node:crypto';
import { join } from 'node:path';
import type { CharacterVoice, VoiceSample } from '../../../shared/cast.ts';
import type { MediaCore, MediaFiles, SampleVoice } from '../../ports/MediaCore.ts';
import { mediaUrlOf } from './mediaUrls.ts';

type Said = Readonly<{ service: SampleVoice; voice: CharacterVoice; text: string; language: 'pt-BR' | 'en' }>;
type Mouth = Readonly<{ seconds: number; envelope: readonly number[]; visemes: string }>;

// The name of a sample: everything that decides its audio (never the key).
function nameOf({ service, voice, text, language }: Said): string {
  const fields = [service.provider, service.model ?? '', voice.id, voice.style ?? '', language, text];
  return createHash('sha1').update(JSON.stringify(fields)).digest('hex');
}

/** The voice samples, kept in one folder as `<name>.wav` plus `<name>.json` (its mouth): the same request plays at once. */
export class SampleShelf {
  readonly #folder: string;
  readonly #parts: Readonly<{ core: MediaCore; files: MediaFiles }>;

  constructor(folder: string, parts: Readonly<{ core: MediaCore; files: MediaFiles }>) {
    this.#folder = folder;
    this.#parts = parts;
  }

  async said(request: Said): Promise<VoiceSample> {
    const name = nameOf(request);
    const known = await this.#kept(name);
    if (known) return this.#answer(name, known);
    const { core, files } = this.#parts;
    const { wav, seconds, envelope, visemes } = await core.sample(request.service, { ...request.voice, text: request.text, language: request.language });
    await files.write(this.#folder, `${name}.wav`, wav);
    await files.write(this.#folder, `${name}.json`, Buffer.from(JSON.stringify({ seconds, envelope, visemes })));
    return this.#answer(name, { seconds, envelope, visemes });
  }

  async #kept(name: string): Promise<Mouth | undefined> {
    const { files } = this.#parts;
    const [json, hasAudio] = await Promise.all([files.read(this.#folder, `${name}.json`), files.exists(this.#folder, `${name}.wav`)]);
    return json && hasAudio ? (JSON.parse(Buffer.from(json).toString('utf8')) as Mouth) : undefined;
  }

  async #answer(name: string, mouth: Mouth): Promise<VoiceSample> {
    const version = (await this.#parts.files.modified(this.#folder, `${name}.wav`)) ?? Date.now();
    return { audio: mediaUrlOf(join(this.#folder, `${name}.wav`), version), ...mouth };
  }
}
