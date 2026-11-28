// Part of the composition point (see composition.ts): the v1 lesson converter with the install voices.
import { fileURLToPath } from 'node:url';
import { convertLessonFolder, type ConversionReport, type ConversionTarget } from '../../../infrastructure/v1/lessonFolder.ts';
import { installConfig } from './install.ts';

// Lia and Téo as the package ships them; the voices, styles and model come from gizzycera.config.json, as in the motor.
const CAST_FOLDER = fileURLToPath(new URL('../../../../casts/example', import.meta.url));

export function convertV1Lesson(target: ConversionTarget): Promise<ConversionReport> {
  const { voices, styles, model } = installConfig();
  return convertLessonFolder(target, { castFolder: CAST_FOLDER, voice: { voices, styles, model } });
}
