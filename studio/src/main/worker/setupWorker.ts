// The setup worker: an Electron utility process (plain Node) that runs one long setup task of core — installing the
// GPU support (which downloads the CUDA provider and unpacks big archives synchronously) or downloading a model — so
// the main process stays free. Stopping the task is killing this process; the downloads resume from their .part files.
import { JOB_VARIABLE, type WorkerJob, type WorkerMessage } from './messages.ts';
import { SETUP_TASK_RUNS } from './setupTasks.ts';

const port = (process as NodeJS.Process & { parentPort: { postMessage(message: WorkerMessage): void } }).parentPort;
const tell = (message: WorkerMessage) => port.postMessage(message);

async function work(): Promise<void> {
  const job = JSON.parse(process.env[JOB_VARIABLE] ?? '{}') as WorkerJob;
  const tools = await import('giz-core/src/presentation/cli/composition/tools.ts');
  await SETUP_TASK_RUNS[job.task](tools, job.modelsDir, (progress) => tell({ type: 'progress', progress }));
  tell({ type: 'done' });
}

// The main process ends this worker once it hears done or failed (exiting here could drop the last message).
work().catch((error: unknown) => tell({ type: 'failed', message: error instanceof Error ? error.message : String(error) }));
