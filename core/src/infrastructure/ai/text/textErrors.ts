import { ServiceHttpError } from '../../http/serviceRequest.ts';

/** What the message may mention: the model asked for, and the key to blank out if the service echoes it. */
export type FailureContext = Readonly<{ label: string; model: string; key: string }>;
type Describe = (detail: string, model: string) => string;

// One readable pt-BR message per status; 401 leaves the service body out (some services echo part of the key).
const BY_STATUS: Readonly<Record<number, Describe>> = {
  400: (detail) => `pedido recusado (400): ${detail}`,
  401: () => 'a chave foi recusada (401): confira se ela está certa e ativa',
  403: (detail) => `acesso negado (403): ${detail}`,
  404: (detail, model) => `modelo ${model} não encontrado (404): ${detail}`,
  429: () => 'limite de uso atingido (429): espere um pouco ou confira o saldo e os limites da conta',
};

const ERROR_BODY = (body: string): string | undefined => {
  try {
    const message = (JSON.parse(body) as { error?: { message?: unknown } }).error?.message;
    return typeof message === 'string' ? message : undefined;
  } catch {
    return undefined;
  }
};

function describe(error: ServiceHttpError, model: string): string {
  const detail = ERROR_BODY(error.body) ?? error.body;
  const known = BY_STATUS[error.status];
  if (known) return known(detail, model);
  if (error.status >= 500) return `serviço indisponível (${error.status}): tente de novo mais tarde`;
  return `erro ${error.status}: ${detail}`;
}

const blanked = (text: string, key: string): string => text.split(key).join('***');

/** The error to show: readable, in pt-BR, named after the service, and never with the key in it. */
export function readableFailure(error: unknown, { label, model, key }: FailureContext): Error {
  if (error instanceof ServiceHttpError) return new Error(blanked(`${label}: ${describe(error, model)}`, key));
  return new Error(blanked(error instanceof Error ? error.message : String(error), key));
}
