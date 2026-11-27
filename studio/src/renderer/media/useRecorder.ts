import { useRef, useState } from 'react';
import { mixedDown, wavOf } from './wavEncoding.ts';

type Take = Readonly<{ recorder: MediaRecorder; chunks: Blob[]; stream: MediaStream }>;

// The browser records in its own format (WebM/Opus); it is decoded here and written as a 16-bit mono WAV.
async function wavOfBlob(blob: Blob): Promise<Uint8Array> {
  const context = new AudioContext();
  try {
    const audio = await context.decodeAudioData(await blob.arrayBuffer());
    const channels = Array.from({ length: audio.numberOfChannels }, (_unused, index) => audio.getChannelData(index));
    return wavOf(mixedDown(channels), audio.sampleRate);
  } finally {
    void context.close();
  }
}

function finished(take: Take): Promise<Blob> {
  return new Promise((done) => {
    take.recorder.addEventListener('stop', () => done(new Blob(take.chunks, { type: take.recorder.mimeType })), { once: true });
    take.recorder.stop();
    take.stream.getTracks().forEach((track) => track.stop());
  });
}

function begun(stream: MediaStream): Take {
  const recorder = new MediaRecorder(stream);
  const chunks: Blob[] = [];
  recorder.addEventListener('dataavailable', (event) => chunks.push(event.data));
  recorder.start();
  return { recorder, chunks, stream };
}

/** "Gravar minha voz": the microphone (the main process allows it for this window only), one take at a time. */
export function useRecorder() {
  const take = useRef<Take | null>(null);
  const [recording, setRecording] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const start = async (lineId: string) => {
    setFailure(null);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false }).catch((error: Error) => void setFailure(error.message));
    if (!stream) return;
    take.current = begun(stream);
    setRecording(lineId);
  };
  const stop = async (): Promise<Uint8Array | null> => {
    const current = take.current;
    [take.current] = [null];
    setRecording(null);
    return current ? wavOfBlob(await finished(current)) : null;
  };
  return { recording, failure, start: (lineId: string) => void start(lineId), stop, discard: () => void stop() };
}
