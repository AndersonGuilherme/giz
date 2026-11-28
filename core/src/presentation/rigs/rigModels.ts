import { Gizzy } from './gizzy/Gizzy.tsx';
import { gizzyDefinition } from './gizzy/parameters.ts';
import { LiaStyle } from './lia-style/LiaStyle.tsx';
import { liaStyleDefinition } from './lia-style/parameters.ts';
import type { RigModel } from './RigModel.ts';
import { RigRegistry } from './rigRegistry.ts';

/** The rigs with their components, for the Remotion bundle only (Node cannot load `.tsx`). */
export const rigModels = RigRegistry.with<RigModel>([
  { ...gizzyDefinition, Component: Gizzy },
  { ...liaStyleDefinition, Component: LiaStyle },
]);
