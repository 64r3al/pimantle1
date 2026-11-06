export type MotionPreference = "system" | "reduced" | "off";

export type UiPreferences = {
  motion: MotionPreference;
  mapEffects: boolean;
  highContrast: boolean;
  compactMode: boolean;
};

export const DEFAULT_UI_PREFERENCES: UiPreferences = {
  motion: "system",
  mapEffects: true,
  highContrast: false,
  compactMode: false,
};

const STORAGE_KEY = "pimantle-ui-preferences-v1";

export function loadUiPreferences(): UiPreferences {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_UI_PREFERENCES;

    const parsed = JSON.parse(stored) as Partial<UiPreferences>;
    const motion: MotionPreference =
      parsed.motion === "reduced" || parsed.motion === "off"
        ? parsed.motion
        : "system";

    return {
      motion,
      mapEffects:
        typeof parsed.mapEffects === "boolean"
          ? parsed.mapEffects
          : DEFAULT_UI_PREFERENCES.mapEffects,
      highContrast:
        typeof parsed.highContrast === "boolean"
          ? parsed.highContrast
          : DEFAULT_UI_PREFERENCES.highContrast,
      compactMode:
        typeof parsed.compactMode === "boolean"
          ? parsed.compactMode
          : DEFAULT_UI_PREFERENCES.compactMode,
    };
  } catch {
    return DEFAULT_UI_PREFERENCES;
  }
}

export function saveUiPreferences(preferences: UiPreferences): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Preferences are optional; a storage restriction must not block gameplay.
  }
}

export type SettingsDropdownProps = {
  isOpen: boolean;
  close: () => void;
  preferences: UiPreferences;
  onChange: <K extends keyof UiPreferences>(
    key: K,
    value: UiPreferences[K]
  ) => void;
};
