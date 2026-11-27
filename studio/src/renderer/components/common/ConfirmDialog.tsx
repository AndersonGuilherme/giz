import type { ReactNode } from 'react';
import { useTranslate } from '../../i18n.ts';

type Props = Readonly<{ title: string; children: ReactNode; confirm: string; danger?: boolean; onConfirm: () => void; onCancel: () => void }>;

/** A question over the board: cancel, or confirm (in red when it cannot be undone from the Studio). */
export function ConfirmDialog({ title, children, confirm, danger, onConfirm, onCancel }: Props) {
  const translate = useTranslate();
  return (
    <div className="overlay" role="presentation" onClick={onCancel}>
      <div className="dialog card" role="dialog" aria-modal="true" aria-label={title} data-testid="confirm-dialog" onClick={(event) => event.stopPropagation()}>
        <h2>{title}</h2>
        <div className="dialog-body">{children}</div>
        <div className="dialog-actions">
          <button type="button" className="chalk-button quiet" data-testid="confirm-no" onClick={onCancel}>{translate('common.cancel')}</button>
          <button type="button" className={`chalk-button ${danger ? 'danger' : 'primary'}`} data-testid="confirm-yes" onClick={onConfirm} autoFocus>{confirm}</button>
        </div>
      </div>
    </div>
  );
}
