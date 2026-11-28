import { join } from 'node:path';
import * as ort from 'onnxruntime-node';

/** Where the voice runs (gizzycera.config.json): `threads` 0 lets ONNX Runtime choose. */
export type DeviceSettings = Readonly<{ device: 'cpu' | 'cuda'; threads: number }>;

function sessionOptions({ device, threads }: DeviceSettings): ort.InferenceSession.SessionOptions {
  const providers: ort.InferenceSession.ExecutionProviderConfig[] = device === 'cuda' ? [{ name: 'cuda', deviceId: 0 }, 'cpu'] : ['cpu'];
  return {
    graphOptimizationLevel: 'all', executionMode: 'sequential', logSeverityLevel: 3,
    intraOpNumThreads: threads, interOpNumThreads: 1, executionProviders: providers,
  };
}

// The Pad node of the exported vocoder fails with some shapes on the GPU (a known problem of the export).
const isPadFailure = (error: unknown) => /Pad|shape/i.test(String((error as Error).message));

async function outputOf(session: ort.InferenceSession, codes: ort.Tensor): Promise<Float32Array> {
  const outputs = await session.run({ [session.inputNames[0]]: codes });
  return outputs[session.outputNames[0]].data as Float32Array;
}

type Sessions = Readonly<{ decode: ort.InferenceSession; predictor: ort.InferenceSession; vocoder: ort.InferenceSession }>;

/**
 * The three ONNX graphs: talker decode (also used for the prefill, one position at a time, so the talker weights are
 * loaded once), code predictor and vocoder. The vocoder tries the GPU; on the Pad failure it is opened again on the
 * CPU and stays there.
 */
export class QwenSessions {
  readonly #sessions: Sessions;
  readonly #vocoderOnCpu: () => Promise<ort.InferenceSession>;
  #cpuVocoder: ort.InferenceSession | undefined;

  private constructor(sessions: Sessions, vocoderOnCpu: () => Promise<ort.InferenceSession>) {
    this.#sessions = sessions;
    this.#vocoderOnCpu = vocoderOnCpu;
  }

  static async load(folder: string, settings: DeviceSettings): Promise<QwenSessions> {
    const options = sessionOptions(settings);
    const open = (file: string, extra: ort.InferenceSession.SessionOptions = {}) => ort.InferenceSession.create(join(folder, file), { ...options, ...extra });
    // Severity 4 on the vocoder: the expected Pad failure does not clutter the terminal.
    const [decode, predictor, vocoder] = await Promise.all([open('talker_decode.onnx'), open('code_predictor.onnx'), open('vocoder.onnx', { logSeverityLevel: 4 })]);
    return new QwenSessions({ decode, predictor, vocoder }, () => open('vocoder.onnx', { executionProviders: ['cpu'] }));
  }

  decode(): ort.InferenceSession {
    return this.#sessions.decode;
  }

  predictor(): ort.InferenceSession {
    return this.#sessions.predictor;
  }

  /** 16 codes per frame ([1, 16, frames]) → 24 kHz samples. */
  async vocode(codes: ort.Tensor): Promise<Float32Array> {
    if (this.#cpuVocoder) return outputOf(this.#cpuVocoder, codes);
    try {
      return await outputOf(this.#sessions.vocoder, codes);
    } catch (error) {
      return this.#onCpu(error, codes);
    }
  }

  async #onCpu(error: unknown, codes: ort.Tensor): Promise<Float32Array> {
    if (!isPadFailure(error)) throw error;
    this.#cpuVocoder = await this.#vocoderOnCpu();
    return outputOf(this.#cpuVocoder, codes);
  }
}
