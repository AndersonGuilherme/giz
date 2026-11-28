import type { KeyProvider } from '../../shared/accounts.ts';

/**
 * The plain key files the `gizzy` CLI reads (~/.config/gizzycera/<service>.key, mode 600): where the Studio keeps a key when
 * the system has no keychain (ruling S2), and where it finds the keys the person set up for the CLI.
 */
export interface KeyFiles {
  folder(): string;
  read(provider: KeyProvider): Promise<string | undefined>;
  write(provider: KeyProvider, key: string): Promise<void>;
  /** False when there was no file. */
  remove(provider: KeyProvider): Promise<boolean>;
}
