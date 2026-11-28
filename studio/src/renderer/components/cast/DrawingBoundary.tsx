import { Component, type ReactNode } from 'react';

type Props = Readonly<{ fallback: ReactNode; look: string; children: ReactNode }>;
type State = Readonly<{ failedFor: string | null }>;

/**
 * One character drawing that breaks shows `fallback` instead of taking the whole Cast screen down (React unmounts
 * everything above a throw without a boundary); `look` (the drawn parameters, as text) changing tries again.
 */
export class DrawingBoundary extends Component<Props, State> {
  state: State = { failedFor: null };

  static getDerivedStateFromError(): Partial<State> {
    return { failedFor: '' };
  }

  componentDidCatch(): void {
    this.setState({ failedFor: this.props.look });
  }

  render() {
    const { failedFor } = this.state;
    const failed = failedFor !== null && (failedFor === '' || failedFor === this.props.look);
    return failed ? this.props.fallback : this.props.children;
  }
}
