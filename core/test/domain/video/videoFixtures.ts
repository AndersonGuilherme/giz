import type { SegmentJson, VideoProps } from '../../../src/domain/timeline/VideoProps.ts';

export function segment(data: Partial<SegmentJson>): SegmentJson {
  return {
    lineId: '1', speaker: 'ana', chapter: 1, start: 0, lineDuration: 40, totalDuration: 50, scene: { type: 'talk' }, sceneKey: 0, words: [], beats: [],
    states: {}, audio: 'voice/1.wav', envelope: [], visemes: '',
    ...data,
  };
}

export function props(segments: SegmentJson[], data: Partial<VideoProps> = {}): VideoProps {
  const last = segments.at(-1);
  return {
    fps: 30, width: 1920, height: 1080, language: 'pt-BR', format: 'lesson', captionStyle: 'blocks', title: 'T', chapters: ['Abertura', 'Meio'],
    totalFrames: last ? last.start + last.totalDuration : 0, segments, cast: [], soundEffects: [],
    ...data,
  };
}
