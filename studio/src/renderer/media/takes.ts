/** One take in progress: the browser's recorder, what it gave so far and the microphone stream. */
export type Take = Readonly<{ recorder: MediaRecorder; chunks: Blob[]; stream: MediaStream }>;

const closed = (stream: MediaStream) => stream.getTracks().forEach((track) => track.stop());

/** Starts recording the stream. */
export function begun(stream: MediaStream): Take {
  const recorder = new MediaRecorder(stream);
  const chunks: Blob[] = [];
  recorder.addEventListener('dataavailable', (event) => chunks.push(event.data));
  recorder.start();
  return { recorder, chunks, stream };
}

/** Stops the take and closes the microphone; resolves with what was recorded. */
export function finished(take: Take): Promise<Blob> {
  return new Promise((done) => {
    take.recorder.addEventListener('stop', () => done(new Blob(take.chunks, { type: take.recorder.mimeType })), { once: true });
    take.recorder.stop();
    closed(take.stream);
  });
}

/** Throws the take away: the recorder stops (when it still runs), the microphone closes, nothing is kept. */
export function dropped(take: Take): void {
  if (take.recorder.state !== 'inactive') take.recorder.stop();
  closed(take.stream);
  take.chunks.length = 0;
}
