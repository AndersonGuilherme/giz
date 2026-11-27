import { safeStorage } from 'electron';
import type { Cipher } from '../ports/KeyVault.ts';

/** Electron safeStorage: the system keychain (Keychain, DPAPI, libsecret/kwallet) encrypts the keys. */
export class SafeStorageCipher implements Cipher {
  available(): boolean {
    return safeStorage.isEncryptionAvailable();
  }

  encrypt(text: string): string {
    return safeStorage.encryptString(text).toString('base64');
  }

  decrypt(sealed: string): string {
    return safeStorage.decryptString(Buffer.from(sealed, 'base64'));
  }
}
