/** Where the text stopped being JSON: line and column, counted from 1 (unknown when the parser does not say). */
export type JsonProblem = Readonly<{ line?: number; column?: number }>;
export type ParsedJson = Readonly<{ value?: unknown; problem?: JsonProblem }>;

// The parser says "... at position 115 (line 1 column 116)" (in English): only the place is kept, the words are ours.
const PLACE = /line (\d+) column (\d+)/;
const POSITION = /position (\d+)/;
// "Unexpected end of JSON input": the text stops in the middle, so the place is its end.
const END = /end of JSON/;

function offsetOf(text: string, message: string): number | undefined {
  const position = POSITION.exec(message);
  if (position) return Number(position[1]);
  return END.test(message) ? text.length : undefined;
}

function placeOf(text: string, message: string): JsonProblem {
  const place = PLACE.exec(message);
  if (place) return { line: Number(place[1]), column: Number(place[2]) };
  const at = offsetOf(text, message);
  if (at === undefined) return {};
  const before = text.slice(0, at).split('\n');
  return { line: before.length, column: (before.at(-1)?.length ?? 0) + 1 };
}

/** The text as JSON, or where it stops being JSON (the window writes the message in the interface language). */
export function parseJson(text: string): ParsedJson {
  try {
    return { value: JSON.parse(text) as unknown };
  } catch (error) {
    return { problem: placeOf(text, (error as Error).message) };
  }
}
