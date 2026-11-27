import type { Tour, TourStep } from './tours.ts';

// A step about a line points at the first open line; with none open, the card is centred and says how to get one.
const step = (id: string, target?: string, inLine = false): TourStep => ({
  id,
  ...(target ? { target } : {}),
  title: `tour.script.${id}.title` as TourStep['title'],
  text: `tour.script.${id}.text` as TourStep['text'],
  ...(inLine ? { absent: 'tour.script.noLine' } : {}),
});

/** The Script tab's tour: what the script is, how a line is written, the folded rows, the check, the AI and what comes next. */
export const SCRIPT_TOUR: Tour = {
  id: 'script',
  steps: [
    step('intro'),
    step('add', 'add-line'),
    step('speaker', 'speaker', true),
    step('text', 'text', true),
    step('scene', 'scene', true),
    step('fold', 'line-row', true),
    step('check', 'check'),
    step('generate', 'generate'),
    step('next'),
  ],
};
