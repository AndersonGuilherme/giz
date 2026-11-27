import type { Session } from 'electron';

export type PermissionSession = Pick<Session, 'setPermissionRequestHandler' | 'setPermissionCheckHandler'>;

/** Who may record: our own window (its webContents) showing our own page (`isAppUrl`). */
export type MicrophoneRules = Readonly<{ contents: () => unknown; isAppUrl: (url: string) => boolean }>;

type RequestDetails = Readonly<{ mediaTypes?: readonly string[]; requestingUrl?: string }>;
type CheckDetails = Readonly<{ mediaType?: string; requestingUrl?: string }>;

const ours = (contents: unknown, url: string | undefined, rules: MicrophoneRules) =>
  contents !== null && contents !== undefined && contents === rules.contents() && url !== undefined && rules.isAppUrl(url);

// The microphone and nothing more: a request that also asks for the camera (or for no type at all) is refused.
const onlyAudio = (types: readonly string[] | undefined) => types !== undefined && types.length > 0 && types.every((type) => type === 'audio');

/**
 * Denies every web permission (camera, notifications, geolocation, clipboard…) except one: the microphone, which the
 * Voices stage records with ("gravar minha voz"), and only for our own window showing our own page.
 */
export function allowOnlyOurMicrophone(session: PermissionSession, rules: MicrophoneRules): void {
  session.setPermissionRequestHandler((...[contents, permission, callback, details]) => {
    const { mediaTypes, requestingUrl } = (details ?? {}) as RequestDetails;
    callback(permission === 'media' && onlyAudio(mediaTypes) && ours(contents, requestingUrl, rules));
  });
  session.setPermissionCheckHandler((...[contents, permission, , details]) => {
    const { mediaType, requestingUrl } = (details ?? {}) as CheckDetails;
    return permission === 'media' && mediaType === 'audio' && ours(contents, requestingUrl, rules);
  });
}
