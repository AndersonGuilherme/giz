import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { CharacterPreview, speechFromText, type PreviewSpeech } from 'giz-core/src/presentation/studio/index.ts';
import type { ParameterValue } from '../../../shared/cast.ts';
import { useTranslate } from '../../i18n.ts';
import { labelOf } from '../../labels.ts';

/** The poses and expressions the preview offers (core's lists, from the script vocabulary). */
export type Gestures = Readonly<{ poses: readonly string[]; expressions: readonly string[] }>;
type Props = Readonly<{
  id: string;
  rig: string;
  parameters: Readonly<Record<string, ParameterValue>>;
  expression: string;
  gestures: Gestures;
  /** The sentence it says; `speech` is its sample (audio and mouth), once heard; `said` changes on each new sample. */
  sentence: string;
  speech: PreviewSpeech | null;
  said: number;
}>;

const [WIDTH, HEIGHT] = [520, 640];
const ROOM = 45;

function Chips({ group, options, value, pick, testId }: Readonly<{ group: string; options: readonly string[]; value: string; pick: (option: string, event: SyntheticEvent) => void; testId: string }>) {
  const translate = useTranslate();
  return (
    <div className="chips small-chips" data-testid={testId}>
      {options.map((option) => <button key={option} type="button" className={`chip-button${option === value ? ' on' : ''}`} data-value={option} onClick={(event) => pick(option, event)}>{labelOf(translate, group, option)}</button>)}
    </div>
  );
}

type TriesProps = Readonly<{ gestures: Gestures; pose: string; expression: string; pickPose: (option: string, event: SyntheticEvent) => void; pickExpression: (option: string) => void }>;

function Tries({ gestures, pose, expression, pickPose, pickExpression }: TriesProps) {
  const translate = useTranslate();
  return (
    <>
      <h4>{translate('cast.tryPose')}</h4>
      <Chips group="pose" options={gestures.poses} value={pose} testId="preview-poses" pick={pickPose} />
      <h4>{translate('cast.tryExpression')}</h4>
      <Chips group="expression" options={gestures.expressions} value={expression} testId="preview-expressions" pick={(option) => pickExpression(option)} />
    </>
  );
}

// Plays from the start: the gesture of the pose happens once at the start, and the sentence is said again.
function usePlayer() {
  const player = useRef<PlayerRef>(null);
  const replay = (event?: SyntheticEvent) => {
    player.current?.seekTo(0);
    player.current?.play(event);
  };
  return { player, replay };
}

/** The live preview (a Remotion Player): the character breathing, blinking and saying its sentence, with poses and expressions to try. */
export function LivePreview({ id, rig, parameters, expression: initial, gestures, sentence, speech, said }: Props) {
  const translate = useTranslate();
  const [pose, setPose] = useState('explain');
  const [expression, setExpression] = useState(initial);
  const { player, replay } = usePlayer();
  const spoken = useMemo(() => speech ?? speechFromText(sentence), [speech, sentence]);
  useEffect(() => (said > 0 ? replay() : undefined), [said]);
  const inputProps = { id, rig, parameters, pose, expression, height: HEIGHT - 20, speech: spoken } as const;
  const frames = Math.max(90, spoken.envelope.length + ROOM);
  const drawing = <Player ref={player} component={CharacterPreview as never} inputProps={inputProps} durationInFrames={frames} compositionWidth={WIDTH} compositionHeight={HEIGHT} fps={30} loop autoPlay acknowledgeRemotionLicense style={{ width: '100%' }} />;
  return (
    <section className="live-preview card" data-testid="live-preview">
      <div className="player-frame">{drawing}</div>
      <button type="button" className="chalk-button" data-testid="preview-say" onClick={replay}>{translate('cast.say')}</button>
      <Tries gestures={gestures} pose={pose} expression={expression} pickPose={(option, event) => [setPose(option), replay(event)]} pickExpression={setExpression} />
    </section>
  );
}
