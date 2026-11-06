import localForage from "localforage";
import { toast } from "react-toastify";
import puzzleAvailability from "../data/puzzle_availability.json";
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
  let migrationComplete = false;
  let migrationHadErrors = false;

  try {
    migrationComplete =
      (await localForage.getItem<boolean>("migrated")) === true;
  } catch (error) {
    // Migration is best-effort: a storage problem must not prevent the puzzle
    // itself from loading. Legacy keys are re-scanned on the next startup.
    migrationHadErrors = true;
    console.warn("Could not read the saved-progress migration marker:", error);
  }

  // Re-scan legacy keys even when the old marker exists. A previous version
  // marked migration complete before its asynchronous writes had finished.
  // Existing IndexedDB records take priority, making this repair idempotent.
  // Use the same availability manifest as the archive so newer saved puzzles
  // are not silently omitted from migration.
  const migrationWrites: Promise<void>[] = [];

  for (const puzzleType of ["pimantle", "semantle"] as const) {
    const { min, max } = puzzleAvailability[puzzleType];

    for (let i = min; i <= max; i += 1) {
      const legacyKey = `${puzzleType}-${i}-progress`;
      let puzzleProgress: string | null;

      try {
        puzzleProgress = window.localStorage.getItem(legacyKey);
      } catch (error) {
        // Do not mark migration complete when browser storage is unavailable.
        console.warn("Could not access legacy localStorage progress:", error);
        toast.warn(
          "Browser storage is unavailable. Your legacy saves were not migrated."
        );
        return;
      }

      if (!puzzleProgress) continue;

      let parsedProgress: unknown;
      try {
        parsedProgress = JSON.parse(puzzleProgress);
      } catch (error) {
        migrationHadErrors = true;
        console.warn(`Could not parse legacy progress for ${puzzleType} #${i}:`, error);
        continue;
      }

      if (!isSavedProgressList(parsedProgress)) {
        migrationHadErrors = true;
        console.warn(`Legacy progress for ${puzzleType} #${i} has an invalid format.`);
        continue;
      }

      const storageKey = `${puzzleType}-${i}-forage`;
      migrationWrites.push(
        (async () => {
          try {
            const existingProgress = await localForage.getItem<unknown>(storageKey);
            if (!isSavedProgressList(existingProgress)) {
              await localForage.setItem(storageKey, parsedProgress);
            }
          } catch (error) {
            migrationHadErrors = true;
            console.warn(`Could not migrate saved progress for ${puzzleType} #${i}:`, error);
          }
        })()
      );
    }
  }

  // Wait for every attempted IndexedDB migration before writing the marker.
  // Failed/invalid legacy entries are left untouched and will be rechecked on
  // the next startup because the scan is intentionally idempotent.
  await Promise.all(migrationWrites);

  if (migrationHadErrors) {
    toast.warn(
      "Some saved progress could not be migrated. Existing legacy saves were kept and will be checked again."
    );
  }

  if (!migrationComplete) {
    try {
      await localForage.setItem("migrated", true);
    } catch (error) {
      // The next startup will retry because the marker was not persisted.
      console.warn("Could not save the migration marker:", error);
      toast.warn("Saved-progress migration could not be finalized and will be retried.");
    }
  }
}

export function getPuzzleName(puzzleType: PuzzleType, currentPuzzle: string) {
  const puzzleName = puzzleType === "semantle" ? "Semantle" : "Pimantle";
  return `${puzzleName} #${currentPuzzle}`;
}

function Puzzle() {}

export default Puzzle;
