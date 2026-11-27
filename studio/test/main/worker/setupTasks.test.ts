import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SETUP_TASKS } from '../../../src/shared/setup.ts';
import { SETUP_TASK_RUNS, type WorkerTools } from '../../../src/main/worker/setupTasks.ts';
import type { ByteProgress } from '../../../src/main/ports/SetupTools.ts';

function fakeTools() {
  const calls: string[] = [];
  const tools = {
    gpu: {
      install: async (modelsDir: string, _log: unknown, onProgress?: (progress: ByteProgress) => void) => {
        calls.push(`gpu ${modelsDir}`);
        onProgress?.({ label: 'cudnn', receivedBytes: 5, totalBytes: 10 });
      },
    },
    downloadVoiceModelWithProgress: async ({ model, modelsDir }: { model: string; modelsDir: string }, onProgress: (received: number, total: number) => void) => {
      calls.push(`voice ${model} ${modelsDir}`);
      onProgress(3, 6);
      return '';
    },
    downloadWhisper: async (onProgress?: (progress: ByteProgress) => void) => {
      calls.push('whisper');
      onProgress?.({ label: 'onnx/encoder_model_quantized.onnx', receivedBytes: 1, totalBytes: 2 });
    },
  } as unknown as WorkerTools;
  return { tools, calls };
}

test("every setup task is one call of core's tools, and their bytes come out as labelled progress", async () => {
  assert.deepEqual(Object.keys(SETUP_TASK_RUNS).sort(), [...SETUP_TASKS].sort());
  const { tools, calls } = fakeTools();
  const seen: ByteProgress[] = [];
  for (const task of SETUP_TASKS) await SETUP_TASK_RUNS[task](tools, '/m', (progress) => void seen.push(progress));
  assert.deepEqual(calls, ['gpu /m', 'voice 0.6b /m', 'voice 1.7b /m', 'whisper']);
  assert.deepEqual(seen.map(({ label }) => label), ['ONNX Runtime CUDA', 'cudnn', 'Qwen3-TTS 0.6B', 'Qwen3-TTS 1.7B', 'onnx/encoder_model_quantized.onnx']);
  assert.deepEqual(seen[2], { label: 'Qwen3-TTS 0.6B', receivedBytes: 3, totalBytes: 6 });
});
