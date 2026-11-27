import type { ChannelName, RequestOf, ResponseOf, Result } from '../shared/contract.ts';
import type { MediaApi } from '../shared/mediaApi.ts';
import { SCENARIOS_PROGRESS_EVENT } from '../shared/scenarios.ts';
import { VOICES_PROGRESS_EVENT } from '../shared/voices.ts';

type Call = <Name extends ChannelName>(name: Name, request: RequestOf<Name>) => Promise<Result<ResponseOf<Name>>>;
type Listen = <Payload>(event: string) => (listener: (payload: Payload) => void) => () => void;

/** The Cast, Scenarios and Voices part of `window.giz`: each call invokes one channel (main validates it). */
export function mediaBridge(call: Call, listen: Listen): MediaApi {
  return { cast: castBridge(call), scenarios: scenarioBridge(call, listen), voices: voiceBridge(call, listen) };
}

function castBridge(call: Call): MediaApi['cast'] {
  return {
    catalog: () => call('cast.catalog', {}),
    read: (folder) => call('cast.read', { folder }),
    check: (character) => call('cast.check', { character }),
    save: (folder, character) => call('cast.save', { folder, character }),
    add: (folder, choice) => call('cast.add', { folder, ...choice }),
    remove: (folder, id) => call('cast.remove', { folder, id }),
    voice: (folder, voice) => call('cast.voice', { folder, voice }),
    sample: (folder, voice, text) => call('cast.sample', { folder, voice, text }),
  };
}

function scenarioBridge(call: Call, listen: Listen): MediaApi['scenarios'] {
  return {
    read: (folder) => call('scenarios.read', { folder }),
    vector: (folder, lineId, vector) => call('scenarios.vector', { folder, lineId, vector }),
    upload: (folder, lineId, bytes) => call('scenarios.upload', { folder, lineId, bytes }),
    prompt: (folder, lineId, generate) => call('scenarios.prompt', { folder, lineId, ...generate }),
    estimate: (folder, lineId, force) => call('scenarios.estimate', { folder, lineId, force }),
    generate: (folder, lineId, force) => call('scenarios.generate', { folder, lineId, force }),
    cancel: () => call('scenarios.cancel', {}),
    useGenerated: (folder, lineId) => call('scenarios.useGenerated', { folder, lineId }),
    settings: (folder, settings) => call('scenarios.settings', { folder, ...settings }),
    onProgress: listen(SCENARIOS_PROGRESS_EVENT),
  };
}

function voiceBridge(call: Call, listen: Listen): MediaApi['voices'] {
  return {
    read: (folder) => call('voices.read', { folder }),
    generate: (folder, lineId) => call('voices.generate', { folder, ...(lineId ? { lineId } : {}) }),
    cancel: () => call('voices.cancel', {}),
    record: (folder, lineId, wav) => call('voices.record', { folder, lineId, wav }),
    unrecord: (folder, lineId) => call('voices.unrecord', { folder, lineId }),
    onProgress: listen(VOICES_PROGRESS_EVENT),
  };
}
