import { join } from 'node:path';
import { utilityProcess } from 'electron';
import { VOICE_REHEARSAL_VARIABLE, type ToVoiceWorker } from '../../worker/voiceMessages.ts';
import type { VoiceChannel } from './WorkerVoiceWork.ts';

// Built by Vite next to main.cjs (see forge.config.mts), like the setup worker.
const WORKER = () => join(__dirname, 'voiceWorker.cjs');

/** Opens the voice worker's utility process; what is sent before it has started waits for it. */
export const voiceWorkerChannel = (rehearsal: boolean) => (): VoiceChannel => {
  const env = { ...process.env, [VOICE_REHEARSAL_VARIABLE]: rehearsal ? '1' : '' };
  const child = utilityProcess.fork(WORKER(), [], { env, serviceName: 'giz voices', stdio: 'inherit' });
  const waiting: ToVoiceWorker[] = [];
  let started = false;
  child.once('spawn', () => {
    started = true;
    waiting.splice(0).forEach((message) => child.postMessage(message));
  });
  return {
    send: (message) => (started ? child.postMessage(message) : void waiting.push(message)),
    onMessage: (listener) => void child.on('message', listener),
    onExit: (listener) => void child.on('exit', listener),
    kill: () => void child.kill(),
  };
};
