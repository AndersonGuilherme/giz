import { Audio } from '../../../domain/speech/Audio.ts';
import { sendWithRetries, type Wait } from '../../http/serviceRequest.ts';
import { QWEN_RATE } from '../qwen/qwenModels.ts';

/** The services answer raw PCM at the Qwen rate, so the rest of the pipeline is the same for every voice. */
export const SERVICE_RATE = QWEN_RATE;

/** What an external voice needs from outside: the HTTP client, the key (read when a line is generated) and a timer. */
export type ServiceDependencies = Readonly<{ fetch: typeof fetch; key: () => string; wait: Wait }>;

function pcm16(bytes: Buffer): Audio {
  const samples = new Float32Array(bytes.length >> 1);
  for (let index = 0; index < samples.length; index++) samples[index] = bytes.readInt16LE(index * 2) / 32768;
  return Audio.of(samples, SERVICE_RATE);
}

/** Sends the request until it answers 2xx (with the motor's retries) and reads the PCM audio. */
export async function serviceAudio(service: string, send: () => Promise<Response>, wait: Wait): Promise<Audio> {
  const response = await sendWithRetries(service, send, wait);
  return pcm16(Buffer.from(await response.arrayBuffer()));
}
