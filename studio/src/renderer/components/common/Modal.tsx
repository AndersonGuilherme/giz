import type { ReactNode } from 'react';

/** A panel over the board that only its own buttons close (a long task runs in it). */
export function Modal({ title, children, testId }: Readonly<{ title: string; children: ReactNode; testId?: string }>) {
  return (
    <div className="overlay" role="presentation">
      <div className="dialog card" role="dialog" aria-modal="true" aria-label={title} data-testid={testId}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}
