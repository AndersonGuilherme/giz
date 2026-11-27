// What must happen before the Studio leaves a screen: each editor registers its pending save here.
const flushers = new Set<() => Promise<void>>();

/** Registers a flush to run before leaving; the returned function takes it back. */
export function onLeaving(flush: () => Promise<void>): () => void {
  flushers.add(flush);
  return () => void flushers.delete(flush);
}

/** Runs every registered flush and waits for them (a failed save does not keep the person on the screen). */
export async function beforeLeaving(): Promise<void> {
  await Promise.all([...flushers].map((flush) => flush().catch(() => undefined)));
}
