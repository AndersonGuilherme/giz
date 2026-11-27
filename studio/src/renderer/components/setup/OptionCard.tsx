import type { ReactNode } from 'react';

type Props = Readonly<{ selected: boolean; onSelect: () => void; title: string; detail?: ReactNode; badge?: string; testId?: string; children?: ReactNode }>;

/** A choice drawn as a card: a chalk outline, yellow when it is the chosen one. */
export function OptionCard({ selected, onSelect, title, detail, badge, testId, children }: Props) {
  return (
    <div className={`option${selected ? ' selected' : ''}`} data-testid={testId}>
      <button type="button" className="option-choose" role="radio" aria-checked={selected} onClick={onSelect}>
        <span className="option-dot" aria-hidden="true" />
        <span className="option-title">{title}</span>
        {badge && <span className="badge">{badge}</span>}
      </button>
      {detail && <div className="option-detail">{detail}</div>}
      {children}
    </div>
  );
}
