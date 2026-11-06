import localForage from "localforage";
import { migrateLocalStorage } from "./puzzle.component";

jest.mock("localforage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

const mockedGetItem = localForage.getItem as jest.Mock;
const mockedSetItem = localForage.setItem as jest.Mock;

const validProgress = [
  {
    word: "example",
    guessIndex: 1,
    isHint: false,
  },
];

describe("migrateLocalStorage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();

    mockedGetItem.mockImplementation(async (key: string) =>
      key === "migrated" ? false : undefined
    );
    mockedSetItem.mockResolvedValue(undefined);
  });

  test("migrates the full bundled puzzle ranges, including Pimantle #232 and Semantle #99", async () => {
    window.localStorage.setItem(
      "pimantle-232-progress",
      JSON.stringify(validProgress)
    );
    window.localStorage.setItem(
      "semantle-99-progress",
      JSON.stringify(validProgress)
    );

    await migrateLocalStorage();

    expect(mockedSetItem).toHaveBeenCalledWith(
      "pimantle-232-forage",
      validProgress
    );
    expect(mockedSetItem).toHaveBeenCalledWith(
      "semantle-99-forage",
      validProgress
    );
    expect(mockedSetItem).toHaveBeenLastCalledWith("migrated", true);
  });

  test("preserves valid IndexedDB progress instead of overwriting it", async () => {
    const indexedDbProgress = [
      {
        word: "existing",
        guessIndex: 4,
        isHint: true,
      },
    ];

    window.localStorage.setItem(
      "pimantle-232-progress",
      JSON.stringify(validProgress)
    );
    mockedGetItem.mockImplementation(async (key: string) => {
      if (key === "migrated") return true;
      if (key === "pimantle-232-forage") return indexedDbProgress;
      return undefined;
    });

    await migrateLocalStorage();

    expect(mockedSetItem).not.toHaveBeenCalledWith(
      "pimantle-232-forage",
      expect.anything()
    );
  });

  test("continues migrating valid records when another legacy record is malformed", async () => {
    window.localStorage.setItem("pimantle-232-progress", "{invalid-json");
    window.localStorage.setItem(
      "pimantle-231-progress",
      JSON.stringify(validProgress)
    );

    await expect(migrateLocalStorage()).resolves.toBeUndefined();

    expect(mockedSetItem).toHaveBeenCalledWith(
      "pimantle-231-forage",
      validProgress
    );
    // The malformed source is deliberately retained for inspection/recovery.
    expect(window.localStorage.getItem("pimantle-232-progress")).toBe(
      "{invalid-json"
    );
  });
});
