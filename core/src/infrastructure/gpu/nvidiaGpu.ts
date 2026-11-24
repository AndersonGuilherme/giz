import { execFileSync } from 'node:child_process';

// NVIDIA GPU for the voice (Qwen3-TTS via ONNX Runtime), WITHOUT sudo and without installing the CUDA Toolkit:
//   1. ONNX Runtime downloads its CUDA Execution Provider (libonnxruntime_providers_cuda.so), `onnxRuntimeCuda.ts`
//   2. the CUDA major version it needs (12 or 13; ORT 1.31.1 needs 13) is read from that file, and the official NVIDIA
//      libraries (CUDA runtime, cuBLAS, cuRAND and cuDNN 9) come from the public redistributables into
//      <modelsDir>/cuda/<major>/lib, `cudaLibraries.ts`
//   3. before a model opens, those libraries are preloaded into the process, `preloadCuda.ts`
// Only the NVIDIA driver must be installed (on WSL it comes from the Windows driver). Linux x64 only (WSL included).
export type GpuInfo = Readonly<{ name: string; memoryMiB: number; driver: string }>;

/** The first GPU of `nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader,nounits`. */
export function parseNvidiaSmi(output: string): GpuInfo {
  const [name = '', memory = '', driver = ''] = output.trim().split('\n')[0].split(',').map((field) => field.trim());
  return { name, memoryMiB: Number(memory), driver };
}

/** The NVIDIA GPU of this machine, or `null` when there is none (or no driver, or not Linux x64). */
export function detectNvidia(): GpuInfo | null {
  if (process.platform !== 'linux' || process.arch !== 'x64') return null;
  try {
    const query = ['--query-gpu=name,memory.total,driver_version', '--format=csv,noheader,nounits'];
    return parseNvidiaSmi(execFileSync('nvidia-smi', query, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
  } catch {
    return null;
  }
}
