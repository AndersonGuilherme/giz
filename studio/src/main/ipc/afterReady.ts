import type { ChannelName } from '../../shared/contract.ts';
import type { Handler, Handlers } from './registry.ts';

/**
 * Every handler waits for `ready` first (the saved settings restored: the projects folder granted, the language set),
 * so no window call runs against a half-started main process. A failed start does not block the calls: they run and
 * meet the state as it is (the settings screen can still fix it).
 */
export function afterReady(handlers: Handlers, ready: Promise<unknown>): Handlers {
  const started = ready.catch(() => undefined);
  const wrap = <Name extends ChannelName>(handler: Handler<Name>): Handler<Name> => async (request) => {
    await started;
    return handler(request);
  };
  return Object.fromEntries(Object.entries(handlers).map(([name, handler]) => [name, wrap(handler as Handler<ChannelName>)])) as unknown as Handlers;
}
