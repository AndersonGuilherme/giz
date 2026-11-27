import type { ProjectStateReader } from '../../src/application/ports/ProjectStateReader.ts';
import type { VideoFacts } from '../../src/domain/stages/ProjectStages.ts';

/** A project folder's extra files, set by the test. */
export class FakeProjectStateReader implements ProjectStateReader {
  idea = true;
  script = true;
  rendered: VideoFacts = { made: false, olderThanInputs: false };

  async hasIdea(): Promise<boolean> {
    return this.idea;
  }

  async hasScript(): Promise<boolean> {
    return this.script;
  }

  async video(): Promise<VideoFacts> {
    return this.rendered;
  }
}
