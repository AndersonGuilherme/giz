import type { ModelStatus, SetupTask } from '../../../shared/setup.ts';
import { formatBytes } from '../../format.ts';
import { useTranslate } from '../../i18n.ts';
import { useSetup } from '../../state/SetupContext.ts';
import { jobOf } from '../../state/setupJobs.ts';
import { TaskBar, TaskFailure } from './TaskBar.tsx';

type Props = Readonly<{ task: SetupTask; status: ModelStatus; freeBytes: number | null }>;

function DownloadButton({ task, status, freeBytes }: Props) {
  const translate = useTranslate();
  const { settings, jobs } = useSetup();
  const job = jobOf(jobs.jobs, task);
  if (job.status === 'running') return null;
  const size = formatBytes(status.bytes, settings.language);
  const tooBig = freeBytes !== null && freeBytes < status.bytes;
  return (
    <>
      <button type="button" className="chalk-button small" data-testid={`download-${task}`} disabled={tooBig} onClick={() => jobs.run(task)}>
        {translate(job.status === 'stopped' ? 'task.resume' : 'models.download')} · {size}
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
      <TaskBar task={task} stopLabel="task.pause" />
      <TaskFailure task={task} />
    </div>
  );
}
