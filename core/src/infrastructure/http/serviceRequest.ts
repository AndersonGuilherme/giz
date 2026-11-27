/** Waits the given milliseconds (injected, so tests do not wait). */
export type Wait = (milliseconds: number) => Promise<void>;
type Send = () => Promise<Response>;

const NETWORK_ATTEMPTS = 4;
const HTTP_ATTEMPTS = 3;
const MAXIMUM_BODY = 300;

const retryable = (status: number) => status >= 500 || status === 429;

/** The service answered an error status (after the retries, for 429 and 5xx). */
export class ServiceHttpError extends Error {
  readonly status: number;
  readonly body: string;

  constructor(service: string, status: number, body: string) {
    super(`${service} ${status}: ${body}`);
    this.status = status;
    this.body = body;
  }
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
  if (number >= HTTP_ATTEMPTS || !retryable(response.status)) throw new ServiceHttpError(service, response.status, body);
  return 2000 * number;
}

// The answer of the attempt, or the milliseconds to wait before the next one.
async function outcome(service: string, send: Send, number: number): Promise<Response | number> {
  const response = await attempt(service, send, number);
  if (!response) return 3000 * number;
  return response.ok ? response : failedOrRetry(service, response, number);
}

/** Sends the request until it answers 2xx, with the motor's retry policy (shared by every paid service). */
export async function sendWithRetries(service: string, send: Send, wait: Wait): Promise<Response> {
  let result = await outcome(service, send, 1);
  for (let number = 2; typeof result === 'number'; number++) {
    await wait(result);
    result = await outcome(service, send, number);
  }
  return result;
}
