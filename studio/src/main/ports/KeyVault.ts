/** Turns a key into its encrypted form (base64). `available` is false when the system offers no encryption. */
export interface Cipher {
  available(): boolean;
  encrypt(text: string): string;
}

/** The encrypted keys at rest, by provider name. */
export type SealedKeys = Readonly<Record<string, string>>;

export interface KeyVault {
  read(): Promise<SealedKeys>;
  write(keys: SealedKeys): Promise<void>;
}
