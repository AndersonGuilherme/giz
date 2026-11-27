import { useEffect, useRef, useState } from 'react';
import { begun, dropped, finished, type Take } from './takes.ts';
import { mixedDown, wavOf } from './wavEncoding.ts';

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

// The take out of its slot (the slot is empty after).
function released(slot: { current: Take | null }): Take | null {
  const current = slot.current;
  slot.current = null;
  return current;
}

// The take in progress, dropped when the screen goes away; `mounted` tells a microphone that opens too late to close.
function useTakeSlot() {
  const take = useRef<Take | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      const current = released(take);
      if (current) dropped(current);
    };
  }, []);
  return { take, mounted };
}

/**
 * "Gravar minha voz": the microphone (the main process allows it for this window only), one take at a time. Leaving
 * the screen mid-take throws the take away and closes the microphone.
 */
export function useRecorder() {
  const { take, mounted } = useTakeSlot();
  const [recording, setRecording] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const taken = (): Take | null => (setRecording(null), released(take));
  const start = async (lineId: string) => {
    setFailure(null);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false }).catch((error: Error) => void setFailure(error.message));
    if (!stream || !mounted.current) return stream?.getTracks().forEach((track) => track.stop());
    take.current = begun(stream);
    setRecording(lineId);
  };
  const stop = async (): Promise<Uint8Array | null> => {
    const current = taken();
    return current ? wavOfBlob(await finished(current)) : null;
  };
  return { recording, failure, start: (lineId: string) => void start(lineId), stop, discard: () => void ((current) => current && dropped(current))(taken()) };
}
