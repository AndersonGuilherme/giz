import type { GizzyApi } from '../../../shared/GizzyApi.ts';
import { useTranslate } from '../../i18n.ts';
import { draftProblems } from '../../idea/ideaDraft.ts';
import { useSetup } from '../../state/SetupContext.ts';
import { useIdeaWizard } from '../../state/useIdeaWizard.ts';
import { FailurePanel } from '../FailurePanel.tsx';
import { CastPicker } from './CastPicker.tsx';
import { GenerateDialog } from './GenerateDialog.tsx';
import { IdeaActions } from './IdeaActions.tsx';
import { IdeaForm } from './IdeaForm.tsx';
import { ScenePicker } from './ScenePicker.tsx';

type Props = Readonly<{ api: GizzyApi; onCreated: (folder: string) => void; onCancel: () => void }>;

function Top({ onCancel }: Readonly<{ onCancel: () => void }>) {
  const translate = useTranslate();
  return (
    <>
      <div className="screen-top">
        <h2>{translate('idea.title')}</h2>
        <button type="button" className="chalk-button quiet" data-testid="idea-cancel" onClick={onCancel}>{translate('common.cancel')}</button>
      </div>
      <p className="intro">{translate('idea.intro')}</p>
    </>
  );
}

/** The Idea stage: what the video is about, who is in it, then a script written by hand or by the text AI. */
export function NewProjectScreen({ api, onCreated, onCancel }: Props) {
  const { settings } = useSetup();
  const wizard = useIdeaWizard(api, settings.language, onCreated);
  const { draft, change } = wizard;
  const problems = draftProblems(draft);
  return (
    <main className="board idea-board" data-testid="new-project">
      <Top onCancel={onCancel} />
      <IdeaForm draft={draft} change={change} problems={problems} />
      <CastPicker draft={draft} change={change} presets={wizard.presets} portraits={wizard.portraits} invalid={problems.includes('cast')} />
      <ScenePicker draft={draft} change={change} presets={wizard.presets} />
      {wizard.failure && <FailurePanel failure={wizard.failure} />}
      <IdeaActions ready={problems.length === 0 && !wizard.busy} provider={settings.providers.text} onWrite={wizard.writeMyself} onGenerate={wizard.ai.estimate} />
      <GenerateDialog ai={wizard.ai} />
    </main>
  );
}
