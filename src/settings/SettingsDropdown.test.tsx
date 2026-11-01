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
});
