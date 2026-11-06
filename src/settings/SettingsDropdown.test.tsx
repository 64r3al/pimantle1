import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import SettingsDropdown from "./SettingsDropdown";
import { DEFAULT_UI_PREFERENCES } from "./settings.model";

describe("SettingsDropdown", () => {
  test("renders an accessible dialog and focuses its close button", () => {
    render(
      <SettingsDropdown
        isOpen={true}
        close={jest.fn()}
        preferences={DEFAULT_UI_PREFERENCES}
        onChange={jest.fn()}
      />
    );

    expect(
      screen.getByRole("dialog", { name: "Settings" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Close settings" })
    ).toHaveFocus();
    expect(document.body.style.overflow).toBe("hidden");
  });

  test("updates the motion preference", () => {
    const onChange = jest.fn();

    render(
      <SettingsDropdown
        isOpen={true}
        close={jest.fn()}
        preferences={DEFAULT_UI_PREFERENCES}
        onChange={onChange}
      />
    );

    fireEvent.change(screen.getByLabelText("Animation intensity"), {
      target: { value: "reduced" },
    });

    expect(onChange).toHaveBeenCalledWith("motion", "reduced");
  });

  test("closes when Escape is pressed", () => {
    const close = jest.fn();

    render(
      <SettingsDropdown
        isOpen={true}
        close={close}
        preferences={DEFAULT_UI_PREFERENCES}
        onChange={jest.fn()}
      />
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(close).toHaveBeenCalledTimes(1);
  });

  test("closes when the backdrop is activated", () => {
    const close = jest.fn();

    render(
      <SettingsDropdown
        isOpen={true}
        close={close}
        preferences={DEFAULT_UI_PREFERENCES}
        onChange={jest.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Close settings backdrop" })
    );
    expect(close).toHaveBeenCalledTimes(1);
  });

  test("wraps keyboard focus in both directions", () => {
    render(
      <SettingsDropdown
        isOpen={true}
        close={jest.fn()}
        preferences={DEFAULT_UI_PREFERENCES}
        onChange={jest.fn()}
      />
    );

    const closeButton = screen.getByRole("button", { name: "Close settings" });
    const resetButton = screen.getByRole("button", { name: "Restore defaults" });

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(resetButton).toHaveFocus();

    fireEvent.keyDown(document, { key: "Tab" });
    expect(closeButton).toHaveFocus();
  });

  test("returns focus to the dialog if it escapes", () => {
    render(
      <SettingsDropdown
        isOpen={true}
        close={jest.fn()}
        preferences={DEFAULT_UI_PREFERENCES}
        onChange={jest.fn()}
      />
    );

    const outside = document.createElement("button");
    document.body.appendChild(outside);
    outside.focus();

    fireEvent.keyDown(document, { key: "Tab" });
    expect(screen.getByRole("button", { name: "Close settings" })).toHaveFocus();

    outside.remove();
  });

  test("restores page scrolling when the dialog unmounts", () => {
    const { unmount } = render(
      <SettingsDropdown
        isOpen={true}
        close={jest.fn()}
        preferences={DEFAULT_UI_PREFERENCES}
        onChange={jest.fn()}
      />
    );

    unmount();
    expect(document.body.style.overflow).toBe("");
  });
});
