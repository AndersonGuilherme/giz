import type { MessageKey } from '../../shared/i18n/translate.ts';
import type { TourId } from '../../shared/settings.ts';

/**
 * One step: the element it points at (`data-tour="<target>"`; the card is centred and explains when there is none on
 * screen), the keys of its title and text, and `absent`: what is said instead of pointing when the target is not on
 * screen.
 */
export type TourStep = Readonly<{ id: string; target?: string; title: MessageKey; text: MessageKey; absent?: MessageKey }>;
export type Tour = Readonly<{ id: TourId; steps: readonly TourStep[] }>;
