import type { Renderer } from '../../src/application/ports/Renderer.ts';
import type { VideoProps } from '../../src/domain/timeline/VideoProps.ts';

/** Records what it was asked to render and reports half and full progress. */
export class FakeRenderer implements Renderer {
  calls = 0;
  readonly outputs: string[] = [];
  readonly rendered: VideoProps[] = [];

  readonly log: string[];

  constructor(log: string[] = []) {
    this.log = log;
  }

  async render(props: VideoProps, output: string, onProgress: (fraction: number) => void): Promise<void> {
    this.calls++;
    this.log.push('render');
    this.outputs.push(output);
    this.rendered.push(props);
    onProgress(0.5);
    onProgress(1);
  }
}
