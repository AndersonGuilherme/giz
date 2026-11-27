import { useCallback } from 'react';
import { ASPECTS } from '../../../shared/contract.ts';
import type { GizApi } from '../../../shared/GizApi.ts';
import type { VideoDocument } from '../../../shared/video.ts';
import { useTranslate } from '../../i18n.ts';
import { useVideoDocument } from '../../state/useVideoDocument.ts';
import { ScreenHead } from '../common/ScreenHead.tsx';
import { Segmented } from '../common/Segmented.tsx';
import { FailurePanel } from '../FailurePanel.tsx';
import type { StageProps } from '../project/ProjectScreen.tsx';
import { MissingPanel } from './MissingPanel.tsx';
import { MontageFailure } from './MontageFailure.tsx';
import { PreviewPlayer } from './PreviewPlayer.tsx';
import { RenderCard } from './RenderCard.tsx';
import { VideoCheck } from './VideoCheck.tsx';

type Loaded = Readonly<{ api: GizApi; document: VideoDocument; load: (aspect?: VideoDocument['aspect']) => Promise<void> }> & Pick<StageProps, 'onStage'>;

function AspectChoice({ document, load }: Pick<Loaded, 'document' | 'load'>) {
  const translate = useTranslate();
  const name = (aspect: VideoDocument['aspect']) => translate(aspect === document.projectAspect ? 'video.aspectOwn' : 'video.aspectOther', { aspect });
  return <Segmented label={translate('video.aspect')} value={document.aspect} options={ASPECTS} name={name} testId="video-aspect" onChange={(aspect) => void load(aspect)} />;
}

function Stage({ api, document, load, onStage }: Loaded) {
  const reload = useCallback(() => void load(document.aspect), [load, document.aspect]);
  const preview = document.montage
    ? <PreviewPlayer key={`${document.aspect}:${JSON.stringify(document.montage.files)}`} montage={document.montage} lines={document.lines} />
    : document.failure && <MontageFailure failure={document.failure} onStage={onStage} onRetry={reload} />;
  return (
    <div className="video-body">
      <div className="video-main">{preview}</div>
      <aside className="video-side">
        <MissingPanel document={document} onStage={onStage} />
        <VideoCheck document={document} onLine={(lineId) => onStage('script', lineId)} />
        <section className="card"><RenderCard api={api} document={document} onRendered={reload} /></section>
      </aside>
    </div>
  );
}

/** The Video stage: the preview of the whole video ("montar" first), the check in the chosen aspect, what is missing and the render. */
export function VideoScreen({ api, folder, onStage }: StageProps) {
  const translate = useTranslate();
  const { document, failure, loading, load } = useVideoDocument(api, folder);
  if (!document) return failure ? <main className="board"><FailurePanel failure={failure} /></main> : <p className="hint">{translate('video.building')}</p>;
  return (
    <main className="board wide stage-screen video-screen" data-testid="video-screen" data-loading={loading}>
      <ScreenHead title={translate('video.title')} hint={translate('video.hint')} stages={document.stages}>
        <AspectChoice document={document} load={load} />
      </ScreenHead>
      {failure && <FailurePanel failure={failure} />}
      <Stage api={api} document={document} load={load} onStage={onStage} />
    </main>
  );
}
