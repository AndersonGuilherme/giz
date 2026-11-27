import type { ReactNode } from 'react';

type Props = Readonly<{ tone?: 'info' | 'warning' | 'ok'; children: ReactNode; testId?: string }>;

/** A short note on the board: information, a warning to read, or a "done". */
export function Notice({ tone = 'info', children, testId }: Props) {
  return <p className={`notice ${tone}`} role={tone === 'warning' ? 'alert' : undefined} data-testid={testId}>{children}</p>;
}
