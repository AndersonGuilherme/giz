/** The rig ids from before the rename to Gizzycera, each with its id today: a cast file written then still loads. */
const FORMER_RIG_IDS = new Map<string, string>([['giz', 'gizzy']]);

/** The rig's id today: a former id gives its new one; any other id is itself. */
export const currentRigId = (id: string): string => FORMER_RIG_IDS.get(id) ?? id;
