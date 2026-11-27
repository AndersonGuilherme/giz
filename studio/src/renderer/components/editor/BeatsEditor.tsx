import { useTranslate } from '../../i18n.ts';
import { fittedBeats, spanCount } from '../../editor/textSpans.ts';
import { Picker } from '../common/Picker.tsx';
import { BeatScene } from './BeatScene.tsx';
import { useLine } from './lineAccess.ts';

type Beat = Readonly<Record<string, unknown>>;
const beatsOf = (value: unknown): readonly Beat[] => (Array.isArray(value) ? (value as Beat[]) : []);
const textOf = (value: unknown) => (typeof value === 'string' ? value : undefined);

function BeatRow({ index, beat, at, change }: Readonly<{ index: number; beat: Beat; at: number; change: (beat: Beat) => void }>) {
  const translate = useTranslate();
  const { vocabulary } = useLine(index);
  const unset = translate('editor.unset');
  const field = (name: string) => (value: string | undefined) => change(value === undefined ? withoutKey(beat, name) : { ...beat, [name]: value });
  return (
    <li className="beat" data-testid={`beat-${index}-${at}`}>
      <span className="beat-number">{at + 1}</span>
      <Picker label={translate('editor.expression')} value={textOf(beat.expression)} options={vocabulary.expressions} group="expression" empty={unset} onChange={field('expression')} />
      <Picker label={translate('editor.pose')} value={textOf(beat.pose)} options={vocabulary.poses} group="pose" empty={unset} onChange={field('pose')} />
      <Picker label={translate('editor.sfx')} value={textOf(beat.sfx)} options={vocabulary.sounds} group="sfx" empty={unset} onChange={field('sfx')} />
      <BeatScene beat={beat} change={change} />
    </li>
  );
}

function withoutKey(beat: Beat, name: string): Beat {
  return Object.fromEntries(Object.entries(beat).filter(([key]) => key !== name));
}

/** One beat per `[span]` of the text (of the pronunciation when it has spans): what changes when the voice gets there. */
export function BeatsEditor({ index }: Readonly<{ index: number }>) {
  const translate = useTranslate();
  const { line, set, text } = useLine(index);
  const spans = spanCount(text('pronunciation') ?? line.text ?? '');
  const beats = beatsOf(line.beats);
  if (spans === 0 && beats.length === 0) return null;
  const change = (at: number) => (beat: Beat) => set('beats', beats.map((old, position) => (position === at ? beat : old)));
  return (
    <details className="fold beats" open>
      <summary>{translate('editor.beats', { beats: beats.length, spans })}</summary>
      {beats.length !== spans && <button type="button" className="chalk-button small" data-testid={`fit-beats-${index}`} onClick={() => set('beats', spans === 0 ? undefined : fittedBeats(beats, spans))}>{translate('editor.fitBeats', { spans })}</button>}
      <ol className="beat-list">{beats.map((beat, at) => <BeatRow key={at} index={index} beat={beat} at={at} change={change(at)} />)}</ol>
    </details>
  );
}
