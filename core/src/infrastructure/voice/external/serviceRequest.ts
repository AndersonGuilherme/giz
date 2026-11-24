import { Audio } from '../../../domain/speech/Audio.ts';
import { QWEN_RATE } from '../qwen/qwenModels.ts';

/** The services answer raw PCM at the Qwen rate, so the rest of the pipeline is the same for every voice. */
export const SERVICE_RATE = QWEN_RATE;

/** What an external voice needs from outside: the HTTP client, the key (read when a line is generated) and a timer. */
export type ServiceDependencies = Readonly<{ fetch: typeof fetch; key: () => string; wait: (milliseconds: number) => Promise<void> }>;
type Send = () => Promise<Response>;

const NETWORK_ATTEMPTS = 4;
const HTTP_ATTEMPTS = 3;
const MAXIMUM_BODY = 300;

const retryable = (status: number) => status >= 500 || status === 429;

function pcm16(bytes: Buffer): Audio {
  const samples = new Float32Array(bytes.length >> 1);
  for (let index = 0; index < samples.length; index++) samples[index] = bytes.readInt16LE(index * 2) / 32768;
  return Audio.of(samples, SERVICE_RATE);
}

type Cause = Readonly<{ code?: string; message?: string }>;

// fetch says only "fetch failed"; the real reason (ENOTFOUND, ECONNRESET...) is in its cause.
function reasonOf(error: unknown): string {
  const { message } = error as Error;
  const cause = (error as { cause?: Cause }).cause;
  const detail = cause?.code ?? cause?.message;
  return detail ? `${message}: ${detail}` : message;
}

// A dropped connection (network, server closed the socket): `undefined`, so the caller tries again.
function networkFailure(service: string, error: unknown, number: number): undefined {
  if (number >= NETWORK_ATTEMPTS) throw new Error(`${service}: falha de rede (${reasonOf(error)})`);
  return undefined;
}

async function attempt(service: string, send: Send, number: number): Promise<Response | undefined> {
  try {
    return await send();
  } catch (error) {
    return networkFailure(service, error, number);
  }
}

// Network failures wait 3 s, 6 s, 9 s (4 attempts); 429 and 5xx wait 2 s, 4 s (3 attempts); other errors fail now.
async function failedOrRetry(service: string, response: Response, number: number): Promise<number> {
  const body = (await response.text()).slice(0, MAXIMUM_BODY);
  if (number >= HTTP_ATTEMPTS || !retryable(response.status)) throw new Error(`${service} ${response.status}: ${body}`);
  return 2000 * number;
}

// The answer of the attempt, or the milliseconds to wait before the next one.
async function outcome(service: string, send: Send, number: number): Promise<Response | number> {
  const response = await attempt(service, send, number);
  if (!response) return 3000 * number;
  return response.ok ? response : failedOrRetry(service, response, number);
}

/** Sends the request until it answers 2xx (with the motor's retries) and reads the PCM audio. */
export async function serviceAudio(service: string, send: Send, wait: ServiceDependencies['wait']): Promise<Audio> {
  let result = await outcome(service, send, 1);
  for (let number = 2; typeof result === 'number'; number++) {
    await wait(result);
    result = await outcome(service, send, number);
  }
  return pcm16(Buffer.from(await result.arrayBuffer()));
}
