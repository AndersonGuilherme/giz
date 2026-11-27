import { ServiceHttpError } from '../../http/serviceRequest.ts';

/** What the message may mention: the model asked for, and the key to blank out if the service echoes it. */
export type FailureContext = Readonly<{ label: string; model: string; key: string }>;
type Describe = (detail: string, model: string) => string;

const MAXIMUM_DETAIL = 300;

// One readable pt-BR message per status; 401 leaves the service body out (some services echo part of the key).
const BY_STATUS: Readonly<Record<number, Describe>> = {
  400: (detail) => `pedido recusado (400): ${detail}`,
  401: () => 'a chave foi recusada (401): confira se ela está certa e ativa',
  403: (detail) => `acesso negado (403): ${detail}`,
  404: (detail, model) => `modelo ${model} não encontrado (404): ${detail}`,
  422: (detail) => `pedido recusado (422): ${detail}`,
  429: () => 'limite de uso atingido (429): espere um pouco ou confira o saldo e os limites da conta',
};

type ErrorBody = Readonly<{ error?: { message?: unknown }; detail?: unknown }>;

// `{error: {message}}` (Anthropic, OpenAI, Gemini) or fal.ai's `{detail}`: a text, or a list of `{msg}` (422).
function detailOf(detail: unknown): string | undefined {
  if (typeof detail === 'string') return detail;
  const first = Array.isArray(detail) ? (detail[0] as { msg?: unknown } | undefined) : undefined;
  return typeof first?.msg === 'string' ? first.msg : undefined;
}

const ERROR_BODY = (body: string): string | undefined => {
  try {
    const parsed = JSON.parse(body) as ErrorBody;
    const message = parsed.error?.message;
    return typeof message === 'string' ? message : detailOf(parsed.detail);
  } catch {
    return undefined;
  }
};

const blanked = (text: string, key: string): string => text.split(key).join('***');

// The key is blanked in the whole body before it is cut: a cut inside the key would leave a prefix of it.
function describe(error: ServiceHttpError, { model, key }: FailureContext): string {
  const detail = blanked(ERROR_BODY(error.body) ?? error.body, key).slice(0, MAXIMUM_DETAIL);
  const known = BY_STATUS[error.status];
  if (known) return known(detail, model);
  if (error.status >= 500) return `serviço indisponível (${error.status}): tente de novo mais tarde`;
  return `erro ${error.status}: ${detail}`;
}

/** The error to show: readable, in pt-BR, named after the service, and never with the key in it. */
export function readableFailure(error: unknown, context: FailureContext): Error {
  const { label, key } = context;
  if (error instanceof ServiceHttpError) return new Error(blanked(`${label}: ${describe(error, context)}`, key));
  return new Error(blanked(error instanceof Error ? error.message : String(error), key));
}
