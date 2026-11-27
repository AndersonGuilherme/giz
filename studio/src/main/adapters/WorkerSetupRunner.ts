import { join } from 'node:path';
import { utilityProcess } from 'electron';
import type { SetupTask } from '../../shared/setup.ts';
import type { SetupJob } from '../ports/SetupTools.ts';
import { JOB_VARIABLE, type WorkerMessage } from '../worker/messages.ts';

// Built by Vite next to main.cjs (see forge.config.mts).
const WORKER = () => join(__dirname, 'setupWorker.cjs');

type Settle = Readonly<{ resolve: () => void; reject: (error: Error) => void }>;

function listen(child: Electron.UtilityProcess, job: SetupJob, settle: Settle): void {
  child.on('message', (message: WorkerMessage) => {
    if (message.type === 'progress') return job.onProgress(message.progress);
    child.kill();
    if (message.type === 'done') return settle.resolve();
    settle.reject(new Error(message.message));
  });
  child.on('exit', (code) => settle.reject(new Error(`setup worker exited (${code})`)));
}

/** Runs a setup task in its own utility process; aborting the job kills it (the downloads resume next time). */
export function runInWorker(task: SetupTask, job: SetupJob): Promise<void> {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, [JOB_VARIABLE]: JSON.stringify({ task, modelsDir: job.modelsDir }) };
    const child = utilityProcess.fork(WORKER(), [], { env, serviceName: `giz setup: ${task}`, stdio: 'inherit' });
    listen(child, job, { resolve, reject });
    job.signal.addEventListener('abort', () => child.kill(), { once: true });
  });
}
