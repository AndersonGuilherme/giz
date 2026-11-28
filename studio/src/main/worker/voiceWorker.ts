// The voice worker: an Electron utility process (plain Node) that keeps the local voice (Qwen3-TTS, its dense loops in
// plain JavaScript) and Whisper loaded for the app's whole life and makes the lines and the cast samples, so the main
// process (and the window it serves) stays free. It is this process's own composition point.
import { useWritableOrt } from 'giz-core/src/presentation/cli/composition/runtime.ts';
import { CoreVoiceWork } from '../adapters/media/CoreVoiceWork.ts';
import { RehearsalVoice } from '../adapters/media/rehearsal/RehearsalVoice.ts';
import { VOICE_REHEARSAL_VARIABLE } from './voiceMessages.ts';
import { VoiceJobs } from './voiceJobs.ts';

type ParentPort = Readonly<{ postMessage(message: unknown): void; on(event: 'message', listener: (event: Readonly<{ data: unknown }>) => void): void }>;
const port = (process as NodeJS.Process & { parentPort: ParentPort }).parentPort;

// First, before core loads ONNX Runtime: in the installed app, the GPU provider lives in a writable copy of ONNX
// Runtime (userData), and this process loads the binding from there (see core's gpu/ortRuntime.ts).
if (useWritableOrt()) console.log('giz voices: ONNX Runtime from the writable copy (GPU)');

const work = new CoreVoiceWork(process.env[VOICE_REHEARSAL_VARIABLE] === '1' ? new RehearsalVoice() : undefined);
const jobs = new VoiceJobs(work, (message) => port.postMessage(message));
port.on('message', ({ data }) => jobs.receive(data));
// One line on start (the smoke counts them: one worker serves the samples and every voice job).
console.log(`giz voices: worker ready (pid ${process.pid})`);
