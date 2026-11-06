import React from "react";
import { render, screen } from "@testing-library/react";
import GuessEntry from "./GuessEntry";
import { Word } from "./guesses.model";

const makeGuess = (overrides: Partial<Word> = {}): Word => ({
  index: 1,
  rank: 42,
  word: "harbour",
  similarity: 0.73,
  frequency: 100,
  x: 0.12,
  y: -0.4,
  guessIndex: 3,
  ...overrides,
});

describe("GuessEntry", () => {
  test("exposes each guess as a named accessible group", () => {
    render(<GuessEntry guess={makeGuess()} />);

    expect(
      screen.getByRole("group", {
        name: "harbour, similarity 0.73, rank 42",
      })
    ).toBeInTheDocument();
    expect(screen.getByText("harbour")).toBeInTheDocument();
    expect(screen.getByText("0.73")).toBeInTheDocument();
  });

  test("announces a solved guess clearly", () => {
    render(<GuessEntry guess={makeGuess({ word: "answer", rank: 0 })} />);

    expect(
      screen.getByRole("group", {
        name: "answer, similarity 0.73, rank solved",
      })
    ).toBeInTheDocument();
  });

  test("identifies hint entries", () => {
    render(<GuessEntry guess={makeGuess({ isHint: true })} />);

    expect(screen.getByText("Hint")).toBeInTheDocument();
  });
});
