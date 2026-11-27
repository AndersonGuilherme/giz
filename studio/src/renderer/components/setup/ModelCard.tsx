import type { ModelStatus, SetupTask } from '../../../shared/setup.ts';
import { formatBytes } from '../../format.ts';
import { useTranslate } from '../../i18n.ts';
import { useSetup } from '../../state/SetupContext.ts';
import { jobOf } from '../../state/setupJobs.ts';
import { TaskBar, TaskFailure } from './TaskBar.tsx';

/** `resumable`: a stop pauses (Qwen, resumed from its .part files); otherwise it cancels and starts over (Whisper). */
type Props = Readonly<{ task: SetupTask; status: ModelStatus; freeBytes: number | null; resumable: boolean }>;

function DownloadButton({ task, status, freeBytes, resumable }: Props) {
  const translate = useTranslate();
  const { settings, jobs } = useSetup();
  const job = jobOf(jobs.jobs, task);
  if (job.status === 'running') return null;
  const size = formatBytes(status.bytes, settings.language);
  // A paused download needs only what it does not have yet.
  const tooBig = freeBytes !== null && freeBytes < status.bytes - status.onDiskBytes;
  return (
    <>
      <button type="button" className="chalk-button small" data-testid={`download-${task}`} disabled={tooBig} onClick={() => jobs.run(task)}>
        {translate(job.status === 'stopped' && resumable ? 'task.resume' : 'models.download')} · {size}
      </button>
      {tooBig && <span className="warning-text">{translate('models.notEnough', { size })}</span>}
    </>
  );
}

/** The download of one model: "Baixar" (or "Continuar download" after a pause), its bar with "Pausar", or "Baixado". */
export function ModelDownload(props: Props) {
  const translate = useTranslate();
  const { task, status } = props;
  const job = jobOf(useSetup().jobs.jobs, task);
  if (status.ready || job.status === 'done') return <span className="badge ok" data-testid={`ready-${task}`}>✔ {translate('models.ready')}</span>;
  return (
    <div className="download">
      <DownloadButton {...props} />
      <TaskBar task={task} stopLabel={props.resumable ? 'task.pause' : 'task.cancel'} />
      <TaskFailure task={task} />
    </div>
  );
}
