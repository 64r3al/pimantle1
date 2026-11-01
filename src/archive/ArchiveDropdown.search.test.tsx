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

  test("filters archive entries by puzzle number and type", () => {
    render(
      <ArchiveDropdown
        isOpen={true}
        close={jest.fn()}
        archivePimantles={pimantleArchive}
        archiveSemantles={semantleArchive}
      />
    );

    fireEvent.change(screen.getByRole("searchbox", { name: "Search archived puzzles" }), {
      target: { value: "2" },
    });

    expect(screen.getByRole("link", { name: /Pimantle #2/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Semantle #2/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Pimantle #1/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Pimantle #5/ })).not.toBeInTheDocument();
  });

  test("shows an empty state when the search has no matches", () => {
    render(
      <ArchiveDropdown
        isOpen={true}
        close={jest.fn()}
        archivePimantles={pimantleArchive}
        archiveSemantles={semantleArchive}
      />
    );

    fireEvent.change(screen.getByRole("searchbox", { name: "Search archived puzzles" }), {
      target: { value: "9999" },
    });

    expect(screen.getByText("No Pimantle puzzles match that search.")).toBeInTheDocument();
    expect(screen.getByText("No Semantle puzzles match that search.")).toBeInTheDocument();
  });

  test("filters archive progress and combines the filter with puzzle search", () => {
    render(
      <ArchiveDropdown
        isOpen={true}
        close={jest.fn()}
        archivePimantles={pimantleArchive}
        archiveSemantles={semantleArchive}
      />
    );

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
    expect(screen.getByText("No Semantle puzzles match the current filters.")).toBeInTheDocument();
  });

  test("filters solved and not-started archive entries", () => {
    render(
      <ArchiveDropdown
        isOpen={true}
        close={jest.fn()}
        archivePimantles={pimantleArchive}
        archiveSemantles={semantleArchive}
      />
    );

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

  test("returns keyboard focus to the archive when it escapes", () => {
    render(
      <ArchiveDropdown
        isOpen={true}
        close={jest.fn()}
        archivePimantles={pimantleArchive}
        archiveSemantles={semantleArchive}
      />
    );

    const outside = document.createElement("button");
    document.body.appendChild(outside);
    outside.focus();

    fireEvent.keyDown(document, { key: "Tab" });
    expect(screen.getByRole("button", { name: "Close archive" })).toHaveFocus();

    outside.remove();
  });
});
