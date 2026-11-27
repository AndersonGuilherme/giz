import type { VideoProps } from '../../domain/timeline/VideoProps.ts';
import { VideoClock } from '../../domain/video/VideoClock.ts';

/** Where a line starts in the video (video frames: after the lead-in), for the Studio's "ir para a fala". */
export type LineMark = Readonly<{ lineId: string; chapter: number; frame: number }>;
/** Where a chapter starts: the frame of its first line. */
export type ChapterMark = Readonly<{ number: number; title: string; frame: number }>;
export type VideoMarks = Readonly<{ durationInFrames: number; lines: readonly LineMark[]; chapters: readonly ChapterMark[] }>;

/** The length of the whole video and where each line and chapter starts in it. */
export function videoMarks(props: VideoProps): VideoMarks {
  const clock = VideoClock.of(props.totalFrames);
  const lines = props.segments.map(({ lineId, chapter, start }) => ({ lineId, chapter, frame: clock.toVideo(start) }));
  const chapters = props.chapters.flatMap((title, index) => {
    const first = lines.find(({ chapter }) => chapter === index + 1);
    return first ? [{ number: index + 1, title, frame: first.frame }] : [];
  });
  return { durationInFrames: clock.durationInFrames(), lines, chapters };
}

/** The window's source of the video files: the URL the Studio serves each one at, by its path in the project. */
export function mediaSourceOf(files: Readonly<Record<string, string>>): (path: string) => string {
  return (path) => files[path] ?? '';
}
