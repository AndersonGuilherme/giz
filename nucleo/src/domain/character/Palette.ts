/** A color parameter set to `auto` keeps the color the piece was designed with. */
export const AUTO = 'auto';

/** The chosen color, or the piece's own when the choice is `auto`. */
export const chosen = (choice: string, own: string): string => (choice === AUTO ? own : choice);
