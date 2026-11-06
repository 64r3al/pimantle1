import React from "react";

export type ArchiveLink = {
  puzzleType: "pimantle" | "semantle";
  puzzleIndex: number;
  started: boolean;
  solved: boolean;
  guesses: number;
};

function ArchiveTile({ link }: { link: ArchiveLink }) {
  const puzzleName = link.puzzleType === "pimantle" ? "Pimantle" : "Semantle";
  const progressLabel = link.solved
    ? `Solved · ${link.guesses} ${link.guesses === 1 ? "guess" : "guesses"}`
    : link.started
      ? `In progress · ${link.guesses} ${link.guesses === 1 ? "guess" : "guesses"}`
      : "Not started";

  return (
    <a
      href={`/?type=${link.puzzleType}&puzzle=${link.puzzleIndex}`}
      className={`archive-puzzle archive-puzzle-${link.solved ? "solved" : link.started ? "started" : "new"}`}
      aria-label={`${puzzleName} #${link.puzzleIndex}, ${progressLabel}`}
      data-progress={link.solved ? "solved" : link.started ? "in-progress" : "not-started"}
    >
      <span
        className={`tile-star ${link.solved ? "solved-star" : "unsolved-star"}`}
        aria-hidden="true"
      >
        {link.solved ? "★" : "☆"}
      </span>
      <span className="tile-title">
        {puzzleName} <span aria-hidden="true">#</span>{link.puzzleIndex}
      </span>
      <span className={`tile-status tile-status-${link.solved ? "solved" : link.started ? "started" : "new"}`}>
        {progressLabel}
      </span>
    </a>
  );
}

export default ArchiveTile;
