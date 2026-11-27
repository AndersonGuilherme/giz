/** Runs the calls one after the other, in the order they were made (a failed one does not stop the next). */
export function serially(): <T>(call: () => Promise<T>) => Promise<T> {
  let queue: Promise<unknown> = Promise.resolve();
  return (call) => {
    const run = queue.then(call);
    queue = run.catch(() => undefined);
    return run;
  };
}
