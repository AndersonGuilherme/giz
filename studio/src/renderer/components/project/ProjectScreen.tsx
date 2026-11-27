import type { ComponentType } from 'react';
import type { GizApi } from '../../../shared/GizApi.ts';
import { useTranslate } from '../../i18n.ts';
import { CastScreen } from '../cast/CastScreen.tsx';
import { EditorScreen } from '../editor/EditorScreen.tsx';
import { ScenariosScreen } from '../scenarios/ScenariosScreen.tsx';
import { VideoScreen } from '../video/VideoScreen.tsx';
import { VoicesScreen } from '../voices/VoicesScreen.tsx';

/** The stages of a project the person works on, one screen each. */
export const WORK_STAGES = ['script', 'cast', 'scenarios', 'voices', 'video'] as const;
export type WorkStage = (typeof WORK_STAGES)[number];

/** Goes to a stage; `focus` names a line to show there (the Script stage selects it). */
export type GoToStage = (stage: WorkStage, focus?: string) => void;
/** What every stage screen gets: the project, the line to show first (when one was named) and the way to another stage. */
export type StageProps = Readonly<{ api: GizApi; folder: string; focus?: string; onStage: GoToStage }>;

type Props = Readonly<{ api: GizApi; folder: string; stage: WorkStage; focus?: string; onStage: GoToStage }>;

const SCREENS: Readonly<Record<WorkStage, ComponentType<StageProps>>> = { script: EditorScreen, cast: CastScreen, scenarios: ScenariosScreen, voices: VoicesScreen, video: VideoScreen };

function StageTabs({ stage, onStage }: Readonly<{ stage: WorkStage; onStage: GoToStage }>) {
  const translate = useTranslate();
  return (
    <nav className="stage-tabs" aria-label={translate('stages.title')} data-testid="stage-tabs">
      {WORK_STAGES.map((each, index) => (
        <button key={each} type="button" className={each === stage ? 'on' : ''} aria-current={each === stage ? 'page' : undefined} data-testid={`tab-${each}`} onClick={() => onStage(each)}>
          <span className="tab-number">{index + 2}</span>{translate(`stage.${each}`)}
        </button>
      ))}
    </nav>
  );
}

/** A project: the tabs of its stages over the screen of the chosen one (each screen reads its files again when shown). */
export function ProjectScreen({ api, folder, stage, focus, onStage }: Props) {
  const Screen = SCREENS[stage];
  return (
    <>
      <StageTabs stage={stage} onStage={onStage} />
      <Screen key={`${folder}:${stage}:${focus ?? ''}`} api={api} folder={folder} focus={focus} onStage={onStage} />
    </>
  );
}
