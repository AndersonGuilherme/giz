import type { DeviceSettings } from '../voice/qwen/QwenSessions.ts';

type Device = DeviceSettings['device'];

/**
 * The device the voice really runs on: `cuda` needs the ONNX Runtime CUDA provider (installed by `gizzy gpu install`);
 * without it the voice runs on the CPU and says so, instead of failing on the missing provider library.
 */
export function usableDevice(device: Device, providerInstalled: () => boolean, warn: (message: string) => void): Device {
  if (device !== 'cuda' || providerInstalled()) return device;
  warn('GPU não configurada: rodando na CPU (rode `gizzy gpu install`)');
  return 'cpu';
}
