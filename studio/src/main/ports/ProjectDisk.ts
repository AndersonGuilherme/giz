/** The project folders on disk, as the Studio reads, copies and writes them (core reads and checks them). */
export interface ProjectDisk {
  /** The folders directly inside `parent` (absolute paths); none when it does not exist. */
  folders(parent: string): Promise<readonly string[]>;
  exists(path: string): Promise<boolean>;
  /** A JSON file of the folder; throws a readable error when it is missing or not JSON. */
  readJson(folder: string, file: string): Promise<unknown>;
  /** Writes the JSON to a draft file next to it, then renames it into place: a crash never leaves half a file. */
  writeJson(folder: string, file: string, json: unknown): Promise<void>;
  /** The newest change of the folder's own files (not its rendered output), in milliseconds. */
  modified(folder: string): Promise<number>;
  /** Makes the folder (and its parents). */
  makeFolder(folder: string): Promise<void>;
  /** Removes the folder only when it is empty (a reserved folder nothing was written to). */
  removeEmptyFolder(folder: string): Promise<void>;
  /** Keeps a copy of the file next to it, as `<file>.bak` (nothing when there is no file). */
  backup(folder: string, file: string): Promise<void>;
  /** The file as text, or undefined when it does not exist. */
  readText(folder: string, file: string): Promise<string | undefined>;
  /** Copies the folder, without the top-level entries named in `skip`. */
  copy(from: string, to: string, skip: readonly string[]): Promise<void>;
}

/** The system trash (the person can bring a deleted project back from there). */
export interface Trash {
  trash(folder: string): Promise<void>;
}

/** The project folders opened from outside the projects folder, remembered between runs. */
export interface OpenedFolders {
  read(): Promise<readonly string[]>;
  write(folders: readonly string[]): Promise<void>;
}
