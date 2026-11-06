import React from "react";
import { render, screen } from "@testing-library/react";
import Solved from "./solved.component";

jest.mock("file-saver", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("merge-images", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("plotly.js-gl2d-dist-min", () => ({
  __esModule: true,
  default: {
    newPlot: jest.fn(),
    react: jest.fn(),
    toImage: jest.fn(),
    purge: jest.fn(),
  },
}));

jest.mock("react-countdown", () => ({
  __esModule: true,
  default: () => <span>12 hours</span>,
}));

jest.mock("react-toastify", () => {
  const toast = Object.assign(jest.fn(), {
    error: jest.fn(),
    info: jest.fn(),
    success: jest.fn(),
    warn: jest.fn(),
  });
  return { toast };
});

const makeProps = (isArchivePuzzle: boolean) => ({
  guesses: [],
  puzzleType: "pimantle" as const,
  currentPuzzle: "1",
  plotData: [{}, {}, {}] as any,
  defaultLayout: {},
  secret: { word: "harbour" } as any,
  setPlotData: jest.fn(),
  puzzleSolved: true,
  isArchivePuzzle,
  nextPuzzleTime: new Date("2026-11-07T00:00:00Z"),
});

describe("Solved", () => {
  test("does not promise a new daily puzzle countdown for an archive puzzle", () => {
    render(<Solved {...makeProps(true)} />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "This archive puzzle is complete."
    );
    expect(
      screen.queryByText(/Next daily puzzle in/)
    ).not.toBeInTheDocument();
  });

  test("shows the daily countdown after solving the current daily puzzle", () => {
    render(<Solved {...makeProps(false)} />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Next daily puzzle in 12 hours."
    );
  });

  test("uses clear action names for result sharing", () => {
    render(<Solved {...makeProps(true)} />);

    expect(screen.getByRole("button", { name: "Copy text" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy image" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download image" })
    ).toBeInTheDocument();
  });
});
