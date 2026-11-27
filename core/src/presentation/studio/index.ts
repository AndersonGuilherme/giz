// What the Studio's window draws with core (a web page: React and Remotion only, nothing of Node). The Studio's
// renderer imports this module and nothing else of core.
export { CharacterPreview } from './CharacterPreview.tsx';
export { previewStateAt, speechFromText, type CharacterPreviewProps, type PreviewSpeech } from './previewState.ts';
export { RigStill } from './RigStill.tsx';
export { BackgroundStill } from './BackgroundStill.tsx';
export { VideoPreview, type VideoPreviewProps } from './VideoPreview.tsx';
export { videoMarks, type ChapterMark, type LineMark, type VideoMarks } from './videoMarks.ts';
