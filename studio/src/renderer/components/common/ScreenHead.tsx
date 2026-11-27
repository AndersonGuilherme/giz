import type { ReactNode } from 'react';
import type { StageBrief } from '../../../shared/projects.ts';
import { StageBar } from './StageBar.tsx';

/** The top of a stage screen: its title and hint, the stages of the project and the screen's own buttons. */
export function ScreenHead({ title, hint, stages, children }: Readonly<{ title: string; hint?: string; stages: readonly StageBrief[]; children?: ReactNode }>) {
  return (
    <div className="stage-head">
      <div className="stage-title">
        <h2>{title}</h2>
        {hint && <p className="muted small">{hint}</p>}
      </div>
      <StageBar stages={stages} />
      {children && <div className="stage-head-actions">{children}</div>}
    </div>
  );
}
