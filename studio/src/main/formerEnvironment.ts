// Imported first by main.ts, so it runs before anything reads the environment (STUDIO_PATHS included): a GIZ_*
// variable from before the rename to Gizzycera counts as its GIZZY_* name. The workers inherit the result.
import { formerEnvironment } from 'gizzycera-core/src/infrastructure/config/formerNames.ts';

Object.assign(process.env, formerEnvironment(process.env));
