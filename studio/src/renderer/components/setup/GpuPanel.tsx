import type { GpuStatus } from '../../../shared/setup.ts';
import { formatBytes } from '../../format.ts';
import { useTranslate } from '../../i18n.ts';
import { useSetup } from '../../state/SetupContext.ts';
import { jobOf } from '../../state/setupJobs.ts';
import { Notice } from './Notice.tsx';
import { OptionCard } from './OptionCard.tsx';
import { TaskBar, TaskFailure } from './TaskBar.tsx';

function GpuCard({ status }: Readonly<{ status: GpuStatus }>) {
  const translate = useTranslate();
  const { gpu } = status;
  if (!gpu) return <Notice>{translate('gpu.none')}</Notice>;
  return (
    <div className="gpu-card" data-testid="gpu-card">
      <span className="gpu-chip" aria-hidden="true" />
      <div>
        <span className="folder-label">{translate('gpu.found')}</span>
        <strong>{gpu.name}</strong>
        <span className="muted">{translate('gpu.memory', { gigabytes: Math.round(gpu.memoryMiB / 1024), driver: gpu.driver })}</span>
      </div>
    </div>
  );
}

function DeviceChoice() {
  const translate = useTranslate();
  const { settings, actions } = useSetup();
  return (
    <>
      <Notice tone="ok">✔ {translate('gpu.ready')}</Notice>
      <h3>{translate('gpu.device')}</h3>
      <div className="options two" role="radiogroup" aria-label={translate('gpu.device')}>
        <OptionCard selected={settings.device === 'cuda'} onSelect={() => actions.update({ device: 'cuda' })} title={translate('gpu.useGpu')} />
        <OptionCard selected={settings.device === 'cpu'} onSelect={() => actions.update({ device: 'cpu' })} title={translate('gpu.useCpu')} />
      </div>
    </>
  );
}

function Install({ status }: Readonly<{ status: GpuStatus }>) {
  const translate = useTranslate();
  const { settings, jobs } = useSetup();
  const running = jobOf(jobs.jobs, 'gpu').status === 'running';
  return (
    <>
      <p className="muted">{translate('gpu.installSize', { size: formatBytes(status.bytes, settings.language) })}</p>
      {!running && <button type="button" className="chalk-button primary" data-testid="gpu-install" onClick={() => jobs.run('gpu')}>{translate('gpu.install')}</button>}
      <TaskBar task="gpu" stopLabel="task.cancel" />
      <TaskFailure task="gpu" />
    </>
  );
}

// What follows the card: the device choice once ready, the install while there is a card to prepare.
function NextStep({ status }: Readonly<{ status: GpuStatus }>) {
  if (!status.gpu) return null;
  if (status.ready) return <DeviceChoice />;
  return <Install status={status} />;
}

/** The graphics card: what was found and, on Linux with an NVIDIA card, the GPU support install with its progress. */
export function GpuPanel() {
  const translate = useTranslate();
  const status = useSetup().jobs.gpu;
  if (!status) return <p className="muted">{translate('gpu.checking')}</p>;
  return (
    <>
      <p className="intro">{translate('gpu.intro')}</p>
      {status.supported ? <GpuCard status={status} /> : <Notice>{translate('gpu.unsupported')}</Notice>}
      {status.supported && <NextStep status={status} />}
    </>
  );
}
