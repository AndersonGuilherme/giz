import { join } from 'node:path';
import { utilityProcess } from 'electron';
import type { SetupTask } from '../../shared/setup.ts';
import type { SetupJob } from '../ports/SetupTools.ts';
import { JOB_VARIABLE, type WorkerMessage } from '../worker/messages.ts';
import { killDescendants } from './processTree.ts';

// Built by Vite next to main.cjs (see forge.config.mts).
const WORKER = () => join(__dirname, 'setupWorker.cjs');

type Settle = Readonly<{ resolve: () => void; reject: (error: Error) => void }>;

// The worker and everything it started (the GPU install runs the ONNX Runtime installer and tar as child processes).
async function stop(child: Electron.UtilityProcess): Promise<void> {
  if (child.pid !== undefined) await killDescendants(child.pid);
  child.kill();
}

function listen(child: Electron.UtilityProcess, job: SetupJob, settle: Settle): void {
  child.on('message', (message: WorkerMessage) => {
    if (message.type === 'progress') return job.onProgress(message.progress);
    void stop(child);
    if (message.type === 'done') return settle.resolve();
    settle.reject(new Error(message.message));
  });
  child.on('exit', (code) => settle.reject(new Error(`setup worker exited (${code})`)));
}

function fork(task: SetupTask, job: SetupJob, settle: Settle): void {
  const env = { ...process.env, [JOB_VARIABLE]: JSON.stringify({ task, modelsDir: job.modelsDir }) };
  const child = utilityProcess.fork(WORKER(), [], { env, serviceName: `giz setup: ${task}`, stdio: 'inherit' });
  const onAbort = () => void stop(child);
  job.signal.addEventListener('abort', onAbort, { once: true });
  child.once('exit', () => job.signal.removeEventListener('abort', onAbort));
  listen(child, job, settle);
}

/** Runs a setup task in its own utility process; aborting the job stops it (the downloads resume next time). */
export function runInWorker(task: SetupTask, job: SetupJob): Promise<void> {
  return new Promise((resolve, reject) => {
    // A stop that arrived before the worker started: nothing is started at all.
    if (job.signal.aborted) return reject(job.signal.reason);
    fork(task, job, { resolve, reject });
  });
}
