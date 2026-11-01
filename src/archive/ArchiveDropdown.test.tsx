import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import ArchiveDropdown from "./ArchiveDropdown";

describe("ArchiveDropdown", () => {
  test("exposes an accessible dialog and focuses its close control", () => {
    render(
      <ArchiveDropdown
        isOpen={true}
        close={jest.fn()}
        archivePimantles={[]}
        archiveSemantles={[]}
      />
    );

    expect(
      screen.getByRole("dialog", { name: "Explore the archive" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close archive" })).toHaveFocus();
  });

  test("closes when Escape is pressed", () => {
    const close = jest.fn();
    render(
      <ArchiveDropdown
        isOpen={true}
        close={close}
        archivePimantles={[]}
        archiveSemantles={[]}
      />
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(close).toHaveBeenCalledTimes(1);
  });
});
