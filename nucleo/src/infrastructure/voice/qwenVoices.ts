// Mirrors QWEN_SPEAKERS in motor/scripts/qwen3-tts.ts until the Migration phase: importing that module loads
// onnxruntime, so the list is copied here for code (and tests) that only need the names. Keep both in sync.

/** The built-in voices of the Qwen3-TTS CustomVoice models, by speaker id. */
export const QWEN_VOICES = ['serena', 'vivian', 'uncle_fu', 'ryan', 'aiden', 'ono_anna', 'sohee', 'eric', 'dylan'] as const;
export type QwenVoiceId = (typeof QWEN_VOICES)[number];

/** Whether a cast file's `voice.id` is one of the Qwen voices. */
export const isQwenVoice = (id: string): id is QwenVoiceId => (QWEN_VOICES as readonly string[]).includes(id);
