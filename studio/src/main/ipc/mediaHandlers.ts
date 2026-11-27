import type { CastService } from '../services/media/CastService.ts';
import type { ScenarioService } from '../services/media/ScenarioService.ts';
import type { VoiceService } from '../services/media/VoiceService.ts';
import type { Handlers } from './registry.ts';

type MediaServices = Readonly<{ cast: CastService; scenarios: ScenarioService; voices: VoiceService }>;
type MediaChannel = Extract<keyof Handlers, `cast.${string}` | `scenarios.${string}` | `voices.${string}`>;

type CastChannel = Extract<MediaChannel, `cast.${string}`>;
type ScenarioChannel = Extract<MediaChannel, `scenarios.${string}`>;
type VoiceChannel = Extract<MediaChannel, `voices.${string}`>;

/** The Cast, Scenarios and Voices stages' channels, each to its service call. */
export function mediaHandlers({ cast, scenarios, voices }: MediaServices): Pick<Handlers, MediaChannel> {
  return { ...castHandlers(cast), ...scenarioHandlers(scenarios), ...voiceHandlers(voices) };
}

function castHandlers(cast: CastService): Pick<Handlers, CastChannel> {
  return {
    'cast.catalog': () => cast.catalog(),
    'cast.read': ({ folder }) => cast.read(folder),
    'cast.check': ({ character }) => cast.check(character),
    'cast.save': ({ folder, character }) => cast.save(folder, character),
    'cast.add': ({ folder, ...choice }) => cast.add(folder, choice),
    'cast.remove': ({ folder, id }) => cast.remove(folder, id),
    'cast.voice': ({ folder, voice }) => cast.voice(folder, voice),
    'cast.sample': ({ folder, voice, text }) => cast.sample(folder, voice, text),
  };
}

function scenarioHandlers(scenarios: ScenarioService): Pick<Handlers, ScenarioChannel> {
  return {
    'scenarios.read': ({ folder }) => scenarios.read(folder),
    'scenarios.vector': ({ folder, lineId, vector }) => scenarios.vector(folder, lineId, vector),
    'scenarios.upload': ({ folder, lineId, bytes }) => scenarios.upload(folder, lineId, bytes),
    'scenarios.prompt': ({ folder, lineId, ...generate }) => scenarios.prompt(folder, lineId, generate),
    'scenarios.estimate': ({ folder, lineId, force }) => scenarios.estimate(folder, lineId, force),
    'scenarios.generate': ({ folder, lineId, force }) => scenarios.generate(folder, lineId, force),
    'scenarios.cancel': async () => scenarios.cancel(),
    'scenarios.useGenerated': ({ folder, lineId }) => scenarios.useGenerated(folder, lineId),
    'scenarios.crop': ({ folder, lineId, crop }) => scenarios.crop(folder, lineId, crop),
    'scenarios.settings': ({ folder, ...settings }) => scenarios.settings(folder, settings),
  };
}

function voiceHandlers(voices: VoiceService): Pick<Handlers, VoiceChannel> {
  return {
    'voices.read': ({ folder }) => voices.read(folder),
    'voices.generate': ({ folder, lineId }) => voices.generate(folder, lineId),
    'voices.cancel': async () => voices.cancel(),
    'voices.record': ({ folder, lineId, wav }) => voices.record(folder, lineId, wav),
    'voices.unrecord': ({ folder, lineId }) => voices.unrecord(folder, lineId),
  };
}
