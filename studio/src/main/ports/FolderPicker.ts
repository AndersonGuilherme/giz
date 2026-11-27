/** Asks the person for a folder (the system dialog); `null` when they cancel. */
export interface FolderPicker {
  pickFolder(): Promise<string | null>;
}
