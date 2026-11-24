import type { VoiceStore, RecordedVoice } from '../../src/application/ports/VoiceStore.ts';
import type { Audio } from '../../src/domain/speech/Audio.ts';

export class InMemoryVoiceStore implements VoiceStore {
  readonly records = new Map<string, RecordedVoice>();
  readonly audios = new Map<string, Audio>();

  savedHash(lineId: string): string | undefined {
    return this.records.get(lineId)?.hash;
  }

  async save(lineId: string, record: RecordedVoice, audio: Audio): Promise<void> {
    this.records.set(lineId, record);
    this.audios.set(lineId, audio);
  }

  async read(lineId: string): Promise<RecordedVoice> {
    const record = this.records.get(lineId);
    if (!record) throw new Error(`no voice saved for line ${lineId}`);
    return record;
  }
}
