import {
  DEFAULT_UI_PREFERENCES,
  loadUiPreferences,
  saveUiPreferences,
} from "./settings.model";

describe("UI preferences", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("uses defaults when no preferences have been saved", () => {
    expect(loadUiPreferences()).toEqual(DEFAULT_UI_PREFERENCES);
  });

  test("persists and restores valid preferences", () => {
    const preferences = {
      motion: "reduced" as const,
      mapEffects: false,
      highContrast: true,
      compactMode: true,
    };

    saveUiPreferences(preferences);
    expect(loadUiPreferences()).toEqual(preferences);
  });

  test("falls back safely when stored JSON is invalid", () => {
    window.localStorage.setItem("pimantle-ui-preferences-v1", "{broken");
    expect(loadUiPreferences()).toEqual(DEFAULT_UI_PREFERENCES);
  });
});
