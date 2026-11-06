import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import ArchiveDropdown from "./ArchiveDropdown";

const pimantleArchive = [
  { puzzleType: "pimantle" as const, puzzleIndex: 1, started: false, solved: false, guesses: 0 },
  { puzzleType: "pimantle" as const, puzzleIndex: 2, started: true, solved: true, guesses: 18 },
  { puzzleType: "pimantle" as const, puzzleIndex: 5, started: false, solved: false, guesses: 0 },
  { puzzleType: "pimantle" as const, puzzleIndex: 7, started: true, solved: false, guesses: 31 },
];

const semantleArchive = [
  { puzzleType: "semantle" as const, puzzleIndex: 2, started: false, solved: false, guesses: 0 },
];

const renderArchive = (close = jest.fn()) =>
  render(
    <ArchiveDropdown
      isOpen={true}
      close={close}
      archivePimantles={pimantleArchive}
      archiveSemantles={semantleArchive}
    />
  );

describe("ArchiveDropdown", () => {
  test("exposes an accessible dialog and focuses its close control", () => {
    renderArchive();

    expect(
      screen.getByRole("dialog", { name: "Explore the archive" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close archive" })).toHaveFocus();
  });

  test("closes when Escape is pressed", () => {
    const close = jest.fn();
    renderArchive(close);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(close).toHaveBeenCalledTimes(1);
  });

  test("closes when the backdrop is activated", () => {
    const close = jest.fn();
    renderArchive(close);

    fireEvent.click(screen.getByRole("button", { name: "Close archive backdrop" }));
    expect(close).toHaveBeenCalledTimes(1);
  });

  test("filters archive entries by puzzle number and type", () => {
    renderArchive();

    fireEvent.change(screen.getByRole("searchbox", { name: "Search archived puzzles" }), {
      target: { value: "2" },
    });

    expect(screen.getByRole("link", { name: /Pimantle #2/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Semantle #2/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Pimantle #1/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Pimantle #5/ })).not.toBeInTheDocument();
  });

  test("shows an empty state when the search has no matches", () => {
    renderArchive();

    fireEvent.change(screen.getByRole("searchbox", { name: "Search archived puzzles" }), {
      target: { value: "9999" },
    });

    expect(screen.getByText("No Pimantle puzzles match this search.")).toBeInTheDocument();
    expect(screen.getByText("No Semantle puzzles match this search.")).toBeInTheDocument();
  });

  test("filters archive progress and combines the filter with puzzle search", () => {
    renderArchive();

    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search archived puzzles" }),
      { target: { value: "7" } }
    );
    fireEvent.change(
      screen.getByLabelText("Filter archive by progress"),
      { target: { value: "in-progress" } }
    );

    expect(screen.getByRole("link", { name: /Pimantle #7/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Pimantle #2/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Pimantle #1/ })).not.toBeInTheDocument();
    expect(screen.getByText("No Semantle puzzles match the selected filters.")).toBeInTheDocument();
  });

  test("filters solved and not-started archive entries", () => {
    renderArchive();

    fireEvent.change(
      screen.getByLabelText("Filter archive by progress"),
      { target: { value: "solved" } }
    );
    expect(screen.getByRole("link", { name: /Pimantle #2/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Pimantle #7/ })).not.toBeInTheDocument();

    fireEvent.change(
      screen.getByLabelText("Filter archive by progress"),
      { target: { value: "not-started" } }
    );
    expect(screen.getByRole("link", { name: /Pimantle #1/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Pimantle #2/ })).not.toBeInTheDocument();
  });

  test("clears all active archive filters", () => {
    renderArchive();

    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search archived puzzles" }),
      { target: { value: "7" } }
    );
    fireEvent.change(
      screen.getByLabelText("Filter archive by progress"),
      { target: { value: "in-progress" } }
    );
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(screen.getByRole("searchbox", { name: "Search archived puzzles" })).toHaveValue("");
    expect(screen.getByLabelText("Filter archive by progress")).toHaveValue("all");
    expect(screen.getByRole("link", { name: /Pimantle #1/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Pimantle #7/ })).toBeInTheDocument();
  });

  test("loads the Ko-fi embed only after the player opens support options", () => {
    renderArchive();

    expect(screen.queryByTitle("Support Pimantle on Ko-fi")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Support on Ko-fi/ }));
    expect(screen.getByTitle("Support Pimantle on Ko-fi")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Hide support options/ })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  });

  test("keeps keyboard focus inside the dialog", () => {
    renderArchive();

    const dialog = screen.getByRole("dialog", { name: "Explore the archive" });
    const closeButton = screen.getByRole("button", { name: "Close archive" });
    closeButton.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).not.toBe(document.body);
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });
});
