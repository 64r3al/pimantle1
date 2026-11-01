import React, { useEffect, useRef } from "react";
import {
  MotionPreference,
  SettingsDropdownProps,
} from "./settings.model";

function SettingsDropdown({
  isOpen,
  close,
  preferences,
  onChange,
}: SettingsDropdownProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const closeCallbackRef = useRef(close);
  closeCallbackRef.current = close;

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    if (!isOpen) {
      overlay.setAttribute("inert", "");
      return;
    }

    overlay.removeAttribute("inert");
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeCallbackRef.current();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = Array.from(
        overlay.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => element.getAttribute("aria-hidden") !== "true");

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen]);

  return (
    <div
      className={`archive-overlay settings-overlay ${isOpen ? "archive-open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      aria-hidden={!isOpen}
      ref={overlayRef}
    >
      <div className="archive-background" onClick={() => close()} />
      <section className="settings-container" aria-describedby="settings-description">
        <div className="settings-heading">
          <div>
            <span className="panel-kicker">Personalize your game</span>
            <h2 id="settings-title">Settings</h2>
            <p id="settings-description">
              Adjust the interface without changing puzzle data or saved progress.
            </p>
          </div>
          <button
            type="button"
            className="close-button"
            onClick={close}
            ref={closeButtonRef}
            aria-label="Close settings"
          >
            ×
          </button>
        </div>

        <div className="settings-section">
          <label className="settings-label" htmlFor="motion-preference">
            Animation intensity
          </label>
          <select
            id="motion-preference"
            value={preferences.motion}
            onChange={(event) =>
              onChange("motion", event.target.value as MotionPreference)
            }
          >
            <option value="system">Follow device preference</option>
            <option value="reduced">Reduced motion</option>
            <option value="off">Animations off</option>
          </select>
          <p className="settings-help">
            Reduced motion also respects your device's accessibility preference.
          </p>
        </div>

        <div className="settings-section settings-toggle-list">
          <label className="settings-toggle" htmlFor="map-effects">
            <span>
              <strong>Map activity effects</strong>
              <small>Show lightweight pulses for multiplayer guesses.</small>
            </span>
            <input
              id="map-effects"
              type="checkbox"
              checked={preferences.mapEffects}
              onChange={(event) => onChange("mapEffects", event.target.checked)}
            />
          </label>

          <label className="settings-toggle" htmlFor="high-contrast">
            <span>
              <strong>Higher contrast</strong>
              <small>Strengthen borders and heat-level separation.</small>
            </span>
            <input
              id="high-contrast"
              type="checkbox"
              checked={preferences.highContrast}
              onChange={(event) =>
                onChange("highContrast", event.target.checked)
              }
            />
          </label>

          <label className="settings-toggle" htmlFor="compact-mode">
            <span>
              <strong>Compact interface</strong>
              <small>Reduce panel spacing to leave more room for the map.</small>
            </span>
            <input
              id="compact-mode"
              type="checkbox"
              checked={preferences.compactMode}
              onChange={(event) => onChange("compactMode", event.target.checked)}
            />
          </label>
        </div>

        <div className="settings-footer">
          <button
            type="button"
            className="settings-reset"
            onClick={() => {
              onChange("motion", "system");
              onChange("mapEffects", true);
              onChange("highContrast", false);
              onChange("compactMode", false);
            }}
          >
            Restore defaults
          </button>
          <span>Preferences are saved on this device.</span>
        </div>
      </section>
    </div>
  );
}

export default SettingsDropdown;
