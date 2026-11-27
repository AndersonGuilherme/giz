import { Component, type ReactNode } from 'react';

type State = Readonly<{ error: Error | null }>;

/** A screen that breaks shows what broke instead of an empty window (React unmounts the whole tree otherwise). */
export class ErrorBoundary extends Component<Readonly<{ title: string; children: ReactNode }>, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <main className="board">
        <section className="card failure" role="alert" data-testid="screen-error">
          <h2>{this.props.title}</h2>
          <p>{error.message}</p>
        </section>
      </main>
    );
  }
}
