import type { GizApi } from '../../../shared/GizApi.ts';
import { useTranslate } from '../../i18n.ts';
import { CastScreen } from '../cast/CastScreen.tsx';
import { EditorScreen } from '../editor/EditorScreen.tsx';
import { ScenariosScreen } from '../scenarios/ScenariosScreen.tsx';
import { VoicesScreen } from '../voices/VoicesScreen.tsx';

/** The stages of a project the person works on, one screen each (the video stage comes in its own screen later). */
export const WORK_STAGES = ['script', 'cast', 'scenarios', 'voices'] as const;
export type WorkStage = (typeof WORK_STAGES)[number];

type Props = Readonly<{ api: GizApi; folder: string; stage: WorkStage; onStage: (stage: WorkStage) => void }>;

const SCREENS = { script: EditorScreen, cast: CastScreen, scenarios: ScenariosScreen, voices: VoicesScreen } as const;

function StageTabs({ stage, onStage }: Readonly<{ stage: WorkStage; onStage: (stage: WorkStage) => void }>) {
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
export function ProjectScreen({ api, folder, stage, onStage }: Props) {
  const Screen = SCREENS[stage];
  return (
    <>
      <StageTabs stage={stage} onStage={onStage} />
      <Screen key={`${folder}:${stage}`} api={api} folder={folder} />
    </>
  );
}
