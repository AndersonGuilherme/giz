import type { SetupTask } from '../../../shared/setup.ts';
import { formatBytes } from '../../format.ts';
import { useTranslate } from '../../i18n.ts';
import { useSetup } from '../../state/SetupContext.ts';
import { fractionOf, jobOf, type JobState } from '../../state/setupJobs.ts';

type Props = Readonly<{ task: SetupTask; stopLabel: 'task.cancel' | 'task.pause' }>;

function Bytes({ job }: Readonly<{ job: JobState }>) {
  const translate = useTranslate();
  const { settings } = useSetup();
  const progress = 'progress' in job ? job.progress : null;
  if (!progress) return <span>{translate('task.preparing')}</span>;
  if (progress.totalBytes === 0) return <span>{progress.label}</span>;
  const bytes = translate('task.bytes', { received: formatBytes(progress.receivedBytes, settings.language), total: formatBytes(progress.totalBytes, settings.language) });
  return <span><b>{progress.label}</b> · {bytes}</span>;
}

/** A running or paused task: its bar, what it is downloading, and the button that stops it. */
export function TaskBar({ task, stopLabel }: Props) {
  const translate = useTranslate();
  const { jobs } = useSetup();
  const job = jobOf(jobs.jobs, task);
  if (job.status !== 'running' && job.status !== 'stopped') return null;
  const fraction = fractionOf(job.progress);
  return (
    <div className="task" data-testid={`task-${task}`}>
      <progress className="chalk-progress" max={1} value={fraction ?? undefined} />
      <div className="task-line">
        <span className="task-status" aria-live="polite"><Bytes job={job} />{job.status === 'stopped' && <> · {translate('task.stopped')}</>}</span>
        {job.status === 'running' && <button type="button" className="chalk-button small" onClick={() => jobs.stop(task)}>{translate(stopLabel)}</button>}
      </div>
    </div>
  );
}

/** The failure line of a task, when its last run failed. */
export function TaskFailure({ task }: Readonly<{ task: SetupTask }>) {
  const translate = useTranslate();
  const job = jobOf(useSetup().jobs.jobs, task);
  if (job.status !== 'failed') return null;
  return <p className="notice warning" role="alert">{translate('task.failed', { message: job.failure.details[0] ?? job.failure.message })}</p>;
}
