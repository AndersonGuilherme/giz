import type { Session } from 'electron';

export type PermissionSession = Pick<Session, 'setPermissionRequestHandler' | 'setPermissionCheckHandler'>;

/**
 * Denies every web permission (camera, microphone, notifications, geolocation…) by default. When a screen needs one
 * (S4 records voices with the microphone), it is allowed here by name, for our window only.
 */
export function denyAllPermissions(session: PermissionSession): void {
  session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  session.setPermissionCheckHandler(() => false);
}
