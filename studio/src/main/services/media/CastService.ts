import type { CastCatalog, CastDocument, CharacterFile, CharacterProblem, CharacterSaved, CharacterVoice, ProjectVoice, VoiceSample } from '../../../shared/cast.ts';
import type { MediaCore, MediaFiles, SampleVoice } from '../../ports/MediaCore.ts';
import type { ProjectDisk } from '../../ports/ProjectDisk.ts';
import { translate } from '../../text.ts';
import type { FolderGrants } from '../FolderGrants.ts';
import { StudioError } from '../StudioError.ts';
import { characterOf, languageOf, memberOf, presetsOf, projectVoiceOf, savedFile } from './castFiles.ts';
import { castIdsOf, PLAIN_ID, projectOf, scriptOf, type Json } from './projectJson.ts';
import { SampleShelf } from './samples.ts';

/** `keyOf`: a voice service's key, read in main; `samples`: where the samples are kept (a folder the media scheme serves). */
type Dependencies = Readonly<{
  core: MediaCore;
  disk: ProjectDisk;
  files: MediaFiles;
  grants: FolderGrants;
  keyOf: (service: 'elevenlabs' | 'fish') => Promise<string | undefined>;
  samples: string;
}>;

/** The Cast stage: the project's characters, checked by core's rig catalog before each save, and their voice samples. */
export class CastService {
  readonly #dependencies: Dependencies;

  constructor(dependencies: Dependencies) {
    this.#dependencies = dependencies;
  }

  catalog(): Promise<CastCatalog> {
    return this.#dependencies.core.catalog();
  }

  async read(folder: string): Promise<CastDocument> {
    const { disk, core, grants } = this.#dependencies;
    const path = grants.require(folder);
    const [project, script] = await Promise.all([projectOf(disk, path), scriptOf(disk, path)]);
    const members = await Promise.all(castIdsOf(project).map((id) => memberOf({ disk, folder: path }, id, script.lines)));
    const [presets, items] = await Promise.all([presetsOf(core, languageOf(project)), core.items(path)]);
    return { folder: path, language: languageOf(project), voice: projectVoiceOf(project), members, presets, stages: items.stages };
  }

  check(character: CharacterFile): Promise<readonly CharacterProblem[]> {
    return this.#dependencies.core.checkCharacter(savedFile(character));
  }

  /** Nothing is written while core finds a problem; the file is replaced atomically. */
  async save(folder: string, character: CharacterFile): Promise<CharacterSaved> {
    const path = this.#dependencies.grants.require(folder);
    if (!castIdsOf(await projectOf(this.#dependencies.disk, path)).includes(character.id)) throw notInCast(character.id);
    const problems = await this.check(character);
    if (problems.length === 0) await this.#dependencies.disk.writeJson(path, `cast/${character.id}.json`, savedFile(character));
    return { saved: problems.length === 0, problems, document: await this.read(path) };
  }

  async add(folder: string, choice: Readonly<{ preset?: string; id?: string; name?: string }>): Promise<CastDocument> {
    const path = this.#dependencies.grants.require(folder);
    const project = await projectOf(this.#dependencies.disk, path);
    const file = await this.#newFile(project, choice);
    if (castIdsOf(project).includes(file.id)) throw new StudioError('invalid-request', translate('cast.alreadyIn', { id: file.id }));
    const problems = await this.check(file);
    if (problems.length > 0) throw new StudioError('invalid-request', translate('cast.invalidNew'), problems.map(({ path: field, message }) => `${field}: ${message}`));
    await this.#keepOrWrite(path, file);
    await this.#writeProject(path, { ...project, cast: [...castIdsOf(project), file.id] });
    return this.read(path);
  }

  /** The file stays in cast/: only project.json forgets it (refused while a line says it, or for the last one). */
  async remove(folder: string, id: string): Promise<CastDocument> {
    const { disk, grants } = this.#dependencies;
    const path = grants.require(folder);
    const [project, script] = await Promise.all([projectOf(disk, path), scriptOf(disk, path)]);
    const said = script.lines.filter(({ speaker }) => speaker === id).length;
    if (said > 0) throw new StudioError('invalid-request', translate('cast.stillSpeaks', { id, count: said }));
    const rest = castIdsOf(project).filter((member) => member !== id);
    if (rest.length === 0) throw new StudioError('invalid-request', translate('cast.lastOne'));
    await this.#writeProject(path, { ...project, cast: rest });
    return this.read(path);
  }

  async voice(folder: string, voice: ProjectVoice): Promise<CastDocument> {
    const path = this.#dependencies.grants.require(folder);
    const project = await projectOf(this.#dependencies.disk, path);
    const model = voice.provider === 'qwen' && voice.model ? { model: voice.model } : {};
    await this.#writeProject(path, { ...project, voice: { provider: voice.provider, ...model } });
    return this.read(path);
  }

  /** Said once with the project's voice service and kept (the same voice, style and text plays again at once). */
  async sample(folder: string, voice: CharacterVoice, text: string): Promise<VoiceSample> {
    const { disk, grants, samples } = this.#dependencies;
    const project = await projectOf(disk, grants.require(folder));
    const service = await this.#sampleVoice(projectVoiceOf(project));
    const language = languageOf(project);
    return new SampleShelf(samples, this.#dependencies).said({ service, voice, text, language });
  }

  async #sampleVoice({ provider, model }: ProjectVoice): Promise<SampleVoice> {
    if (provider === 'recording') throw new StudioError('unavailable', translate('cast.sampleOfRecording'));
    if (provider === 'qwen') return { provider, model };
    return { provider, key: await this.#dependencies.keyOf(provider) };
  }

  async #newFile(project: Json, choice: Readonly<{ preset?: string; id?: string; name?: string }>): Promise<CharacterFile> {
    const language = languageOf(project);
    if (choice.preset) return presetFile(await presetsOf(this.#dependencies.core, language), choice.preset);
    return this.#blank(language, { id: (choice.id ?? '').trim().toLowerCase(), name: (choice.name ?? '').trim() });
  }

  // A new character: the giz rig with its defaults, the first local voice and the language's style.
  async #blank(language: 'pt-BR' | 'en', { id, name }: Readonly<{ id: string; name: string }>): Promise<CharacterFile> {
    if (!PLAIN_ID.test(id)) throw new StudioError('invalid-request', translate('cast.badId'));
    const { qwenVoices, styles } = await this.#dependencies.core.catalog();
    return { id, name: name || id, rig: 'giz', parameters: {}, voice: { id: qwenVoices[0] ?? 'vivian', style: styles[language] }, defaultExpression: 'neutral' };
  }

  // A character file already in cast/ (taken out of the project before) comes back as it was.
  async #keepOrWrite(folder: string, file: CharacterFile): Promise<void> {
    if (await this.#dependencies.files.exists(folder, `cast/${file.id}.json`)) return;
    await this.#dependencies.disk.writeJson(folder, `cast/${file.id}.json`, savedFile(file));
  }

  #writeProject(folder: string, project: Json): Promise<void> {
    return this.#dependencies.disk.writeJson(folder, 'project.json', project);
  }
}

const notInCast = (id: string) => new StudioError('invalid-request', translate('cast.notInCast', { id }));

function presetFile(presets: readonly Readonly<{ id: string; file: CharacterFile }>[], id: string): CharacterFile {
  const preset = presets.find((each) => each.id === id);
  if (!preset) throw new StudioError('invalid-request', translate('cast.noSuchPreset', { id }));
  return characterOf(preset.id, preset.file);
}
