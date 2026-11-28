import type { GizzyConfig } from '../composition/install.ts';
import type { GpuInfo } from '../composition/tools.ts';
import type { Prompter } from './prompts.ts';

/** What the setup steps share: the answers so far (`config`), the previous configuration and the found GPU. */
export type SetupContext = {
  readonly prompter: Prompter;
  readonly previous: GizzyConfig;
  readonly hasFile: boolean;
  /** --dry-run: asks with the defaults and shows the result, but writes, downloads and installs nothing. */
  readonly dryRun: boolean;
  config: GizzyConfig;
  gpu: GpuInfo | null;
};

export const TOTAL_STEPS = 7;
