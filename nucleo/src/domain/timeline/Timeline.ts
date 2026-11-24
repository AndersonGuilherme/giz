import { DomainError } from '../DomainError.ts';
import { Body } from '../character/Body.ts';
import { CharacterState } from '../character/CharacterState.ts';
import { Blink } from '../character/Blink.ts';
import type { CharacterId } from '../values/CharacterId.ts';
import { Fps, Frame } from '../values/Time.ts';
import { mouthInSegment, stateInSegment, poseStart, type InSegment } from './StateInSegment.ts';
import type { VideoProps, SegmentJson } from './VideoProps.ts';

// Shifts the breathing of each character (by its position in the cast) so they do not breathe together.
const PHASE_PER_CHARACTER = 1.7;
const body = new Body();

/** The built timeline (the video props): the state of each character in each frame. */
export class Timeline {
  readonly #props: VideoProps;

  private constructor(props: VideoProps) {
    this.#props = props;
  }

  static of(props: VideoProps): Timeline {
    return new Timeline(structuredClone(props));
  }

  stateOf(characterId: CharacterId, frame: Frame): CharacterState {
    const index = this.#segmentIndex(frame);
    const local = this.#local(characterId, index, frame);
    const state = stateInSegment(local);
    if (!state) throw new DomainError(`"${local.id}" está sem estado no quadro ${frame.value()} (só personagens com corpo têm estado)`);
    const mouth = mouthInSegment(local);
    const start = poseStart(this.#props.segments, index, local);
    const context = { pose: state.pose, poseStart: Frame.of(start), speaking: mouth.speaking, opening: mouth.opening, phase: this.#phase(local.id), fps: Fps.DEFAULT };
    const blink = Blink.for(local.id);
    return CharacterState.of({
      ...state, ...mouth, blink: blink.closureAt(frame, Fps.DEFAULT), body: body.offsetAt(frame, context),
    });
  }

  // The segment that contains the frame; after the end, the last one.
  #segmentIndex(frame: Frame): number {
    const segments = this.#props.segments;
    const index = segments.findIndex((segment) => frame.isBefore(Frame.of(segment.start + segment.totalDuration)));
    return index >= 0 ? index : segments.length - 1;
  }

  #local(characterId: CharacterId, index: number, frame: Frame): InSegment {
    const segment: SegmentJson | undefined = this.#props.segments[index];
    if (!segment) throw new DomainError('a linha do tempo não tem nenhum trecho');
    return { segment, id: characterId.text(), relative: frame.value() - segment.start };
  }

  #phase(id: string): number {
    const position = this.#props.cast.findIndex((character) => character.id === id);
    return Math.max(0, position) * PHASE_PER_CHARACTER;
  }
}
