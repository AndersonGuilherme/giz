import { join } from 'node:path';
import { app, utilityProcess } from 'electron';
import { VOICE_REHEARSAL_VARIABLE, type ToVoiceWorker } from '../../worker/voiceMessages.ts';
import { killDescendantsNow } from '../processTree.ts';
import type { VoiceChannel } from './WorkerVoiceWork.ts';

// Built by Vite next to main.cjs (see forge.config.mts), like the setup worker.
const WORKER = () => join(__dirname, 'voiceWorker.cjs');

// The worker goes when it is closed and when the app quits, with any process it started (espeak is not one: it runs
// inside the worker, as WASM).
function killerOf(child: Electron.UtilityProcess): () => void {
  const kill = () => {
    if (child.pid !== undefined) killDescendantsNow(child.pid);
    child.kill();
  };
  app.once('will-quit', kill);
  child.once('exit', () => app.off('will-quit', kill));
  return kill;
}

// What is sent before the process has started waits for it.
function senderOf(child: Electron.UtilityProcess): (message: ToVoiceWorker) => void {
  const waiting: ToVoiceWorker[] = [];
  let started = false;
  child.once('spawn', () => {
    started = true;
    waiting.splice(0).forEach((message) => child.postMessage(message));
  });
  return (message) => (started ? child.postMessage(message) : void waiting.push(message));
}

/** Opens the voice worker's utility process. */
export const voiceWorkerChannel = (rehearsal: boolean) => (): VoiceChannel => {
  const env = { ...process.env, [VOICE_REHEARSAL_VARIABLE]: rehearsal ? '1' : '' };
  const child = utilityProcess.fork(WORKER(), [], { env, serviceName: 'gizzy voices', stdio: 'inherit' });
  return {
    send: senderOf(child),
    onMessage: (listener) => void child.on('message', listener),
    onExit: (listener) => void child.on('exit', listener),
    kill: killerOf(child),
  };
};
