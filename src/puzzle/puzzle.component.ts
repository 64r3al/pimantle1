import localForage from "localforage";
import { toast } from "react-toastify";
import { PuzzleType, SavedPuzzleProgress } from "./puzzle.model";

function isSavedProgressList(value: unknown): value is SavedPuzzleProgress[] {
  return Array.isArray(value) && value.every(
    (entry) => entry !== null && typeof entry === "object" &&
      typeof (entry as SavedPuzzleProgress).word === "string" &&
      typeof (entry as SavedPuzzleProgress).guessIndex === "number" &&
      typeof (entry as SavedPuzzleProgress).isHint === "boolean"
  );
}

export function saveProgress(
  puzzleType: PuzzleType,
  puzzleNumber: string | number,
  progress: SavedPuzzleProgress[]
): Promise<void> {
  return localForage.setItem(`${puzzleType}-${puzzleNumber}-forage`, progress)
    .then(() => undefined)
    .catch(() => { toast.error("Error saving progress"); });
}

export async function loadProgress(
  puzzleType: PuzzleType,
  puzzleNumber: string | number
): Promise<SavedPuzzleProgress[] | undefined> {
  const result = await localForage.getItem<unknown>(
    `${puzzleType}-${puzzleNumber}-forage`
  );
  return isSavedProgressList(result) ? result : undefined;
}

export async function migrateLocalStorage(): Promise<void> {
  const migrationComplete = await localForage.getItem<boolean>("migrated");

  // Re-scan legacy keys even when the old marker exists. A previous version
  // marked migration complete before its asynchronous writes had finished.
  // Existing IndexedDB records take priority, making this repair idempotent.
  const migrationWrites: Promise<unknown>[] = [];

  for (let i = 0; i < 100; i++) {
    for (const puzzleType of ["pimantle", "semantle"] as const) {
      const legacyKey = `${puzzleType}-${i}-progress`;
      const puzzleProgress = localStorage.getItem(legacyKey);
      if (!puzzleProgress) continue;

      let parsedProgress: unknown;
      try {
        parsedProgress = JSON.parse(puzzleProgress);
      } catch (error) {
        toast.error(`Could not migrate saved progress for ${puzzleType} #${i}`);
        throw error;
      }

      if (!isSavedProgressList(parsedProgress)) {
        toast.error(`Saved progress for ${puzzleType} #${i} has an invalid format`);
        throw new Error(`Invalid legacy progress data: ${legacyKey}`);
      }

      const storageKey = `${puzzleType}-${i}-forage`;
      migrationWrites.push(
        localForage.getItem<unknown>(storageKey).then((existingProgress) => {
          if (!isSavedProgressList(existingProgress)) {
            return localForage.setItem(storageKey, parsedProgress);
          }
          return undefined;
        })
      );
    }
  }

  // Never mark migration complete until all pending IndexedDB writes finish.
  await Promise.all(migrationWrites);
  if (!migrationComplete) await localForage.setItem("migrated", true);
}

export function getPuzzleName(puzzleType: PuzzleType, currentPuzzle: string) {
  const puzzleName = puzzleType === "semantle" ? "Semantle" : "Pimantle";
  return `${puzzleName} #${currentPuzzle}`;
}

function Puzzle() {}

export default Puzzle;
