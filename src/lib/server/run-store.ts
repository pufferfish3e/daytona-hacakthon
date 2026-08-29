import { FileRunStore } from "@/lib/store/file-run-store";
import { resolveRunDirectory } from "./env";

let cachedStore: FileRunStore | undefined;
let cachedDirectory: string | undefined;

export const getRunStore = (): FileRunStore => {
  const directory = resolveRunDirectory();
  if (cachedStore === undefined || cachedDirectory !== directory) {
    cachedStore = new FileRunStore(directory);
    cachedDirectory = directory;
  }
  return cachedStore;
};

export const resetRunStoreCache = (): void => {
  cachedStore = undefined;
  cachedDirectory = undefined;
};
