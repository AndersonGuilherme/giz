import type { SetupTask } from '../../shared/setup.ts';
import type { ByteProgress } from '../ports/SetupTools.ts';

type CoreTools = typeof import('giz-core/src/presentation/cli/composition/tools.ts');
/** The part of core's setup tools the worker calls (tests pass a fake). */
export type WorkerTools = Pick<CoreTools, 'gpu' | 'downloadVoiceModelWithProgress' | 'downloadWhisper'>;
type Report = (progress: ByteProgress) => void;
type Run = (tools: WorkerTools, modelsDir: string, report: Report) => Promise<unknown>;

const quiet = () => undefined;

function voiceModel(model: '0.6b' | '1.7b'): Run {
  const label = `Qwen3-TTS ${model.toUpperCase()}`;
  return (tools, modelsDir, report) => tools.downloadVoiceModelWithProgress({ model, modelsDir }, (receivedBytes, totalBytes) => report({ label, receivedBytes, totalBytes }));
}

// The GPU install starts with the ONNX Runtime CUDA provider, which reports no bytes; then each NVIDIA library does.
const gpu: Run = (tools, modelsDir, report) => {
  report({ label: 'ONNX Runtime CUDA', receivedBytes: 0, totalBytes: 0 });
  return tools.gpu.install(modelsDir, quiet, report);
};

/** Each setup task, as one call of core's tools (`giz gpu install`, `giz models`, `giz models --whisper`). */
export const SETUP_TASK_RUNS: Readonly<Record<SetupTask, Run>> = {
  gpu,
  'voice-0.6b': voiceModel('0.6b'),
  'voice-1.7b': voiceModel('1.7b'),
  whisper: (tools, _modelsDir, report) => tools.downloadWhisper(report),
};
