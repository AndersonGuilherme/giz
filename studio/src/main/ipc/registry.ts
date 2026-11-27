import type { z } from 'zod';
import type { ChannelName, RequestOf, ResponseOf, Result } from '../../shared/contract.ts';
import { translate } from '../text.ts';
import { failureOf } from './failures.ts';

export type Handler<Name extends ChannelName> = (request: RequestOf<Name>) => Promise<ResponseOf<Name>>;
/** One handler per channel, as a map: a new channel is one more entry, never one more `case`. */
export type Handlers = { readonly [Name in ChannelName]: Handler<Name> };
export type Schemas = { readonly [Name in ChannelName]: z.ZodType<RequestOf<Name>> };

/** The part of `ipcMain` the registry uses (tests pass a fake). */
export type IpcServer = Readonly<{ handle(channel: string, listener: (event: unknown, payload: unknown) => Promise<unknown>): void }>;

function invalid(error: z.ZodError): Result<never> {
  const details = error.issues.map((issue) => `${issue.path.join('.') || translate('errors.request')}: ${issue.message}`);
  return { ok: false, failure: { code: 'invalid-request', message: translate('errors.invalidRequest'), details } };
}

/** Validates the payload with the channel's schema, runs the handler and wraps the answer (or the error) in a Result. */
export function guarded<Name extends ChannelName>(schema: z.ZodType<RequestOf<Name>>, handler: Handler<Name>) {
  return async (payload: unknown): Promise<Result<ResponseOf<Name>>> => {
    const parsed = schema.safeParse(payload ?? {});
    if (!parsed.success) return invalid(parsed.error);
    try {
      return { ok: true, value: await handler(parsed.data) };
    } catch (error) {
      return { ok: false, failure: failureOf(error) };
    }
  };
}

/** The channels to register: their schemas and handlers, and who may call them (`trusts` sees the IPC event). */
export type Bridge = Readonly<{ schemas: Schemas; handlers: Handlers; trusts: (event: unknown) => boolean }>;

const untrusted = (): Result<never> => ({ ok: false, failure: { code: 'invalid-request', message: translate('errors.untrustedSender'), details: [] } });

/** Registers every channel of the map on the IPC server; a call from an untrusted sender is refused before anything runs. */
export function registerChannels(server: IpcServer, bridge: Bridge): void {
  const { schemas, handlers, trusts } = bridge;
  const names = Object.keys(handlers) as ChannelName[];
  for (const name of names) {
    const run = guarded(schemas[name], handlers[name] as Handler<typeof name>);
    server.handle(name, async (event, payload) => (trusts(event) ? run(payload) : untrusted()));
  }
}
