import ArchiveTile, { ArchiveLink } from "./ArchiveLink";
import React, { useEffect, useRef, useState } from "react";

export type ArchiveDropdownProps = {
  isOpen: boolean;
  close: () => void;
  archivePimantles: ArchiveLink[];
  archiveSemantles: ArchiveLink[];
};

function ArchiveDropdown({
  isOpen,
  close,
  archivePimantles,
  archiveSemantles,
}: ArchiveDropdownProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const closeCallbackRef = useRef(close);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "in-progress" | "solved" | "not-started">("all");
  closeCallbackRef.current = close;

  const normalizedSearch = search.trim().toLowerCase().replace(/#/g, "");
  const matchesStatus = (puzzle: ArchiveLink) => {
    switch (statusFilter) {
      case "in-progress":
        return puzzle.started && !puzzle.solved;
      case "solved":
        return puzzle.solved;
      case "not-started":
        return !puzzle.started;
      default:
        return true;
    }
  };
  const filteredPimantles = archivePimantles.filter(
    (puzzle) =>
      `pimantle ${puzzle.puzzleIndex}`.includes(normalizedSearch) &&
      matchesStatus(puzzle)
  );
  const filteredSemantles = archiveSemantles.filter(
    (puzzle) =>
      `semantle ${puzzle.puzzleIndex}`.includes(normalizedSearch) &&
      matchesStatus(puzzle)
  );
  const hasActiveArchiveFilter = normalizedSearch.length > 0 || statusFilter !== "all";
  const emptyMessage = (type: "Pimantle" | "Semantle") =>
    statusFilter === "all"
      ? `No ${type} puzzles match that search.`
      : `No ${type} puzzles match the current filters.`;

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
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], iframe, [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const activeIndex = focusable.indexOf(
        document.activeElement as HTMLElement
      );
      if (event.shiftKey && activeIndex <= 0) {
        event.preventDefault();
        focusable[focusable.length - 1].focus();
      } else if (
        !event.shiftKey &&
        (activeIndex === -1 || activeIndex === focusable.length - 1)
      ) {
        event.preventDefault();
        focusable[0].focus();
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
      className={`archive-overlay ${isOpen ? "archive-open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="archive-title"
      aria-hidden={!isOpen}
      ref={overlayRef}
    >
      <div className="archive-background" onClick={() => close()} />
      <div className="archive-container">
        <h1 className="archive-dialog-title" id="archive-title">Explore the archive</h1>
        <button
          type="button"
          className="close-button"
          onClick={close}
          ref={closeButtonRef}
          aria-label="Close archive"
        >
          ×
        </button>
        <div className="archive-column">
          <div className="archive-search-controls">
            <label className="visually-hidden" htmlFor="archive-search">
              Search archived puzzles
            </label>
            <input
              id="archive-search"
              className="archive-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by puzzle number..."
              autoComplete="off"
            />
            <label className="visually-hidden" htmlFor="archive-status-filter">
              Filter archive by progress
            </label>
            <select
              id="archive-status-filter"
              className="archive-status-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as "all" | "in-progress" | "solved" | "not-started"
                )
              }
            >
              <option value="all">All puzzles</option>
              <option value="in-progress">In progress</option>
              <option value="solved">Solved</option>
              <option value="not-started">Not started</option>
            </select>
          </div>
          <h1 className="archive-heading">Today's puzzles</h1>
          <a href="/" className="todays-pimantle archive-puzzle">
            <div className="tile-title">Today's Pimantle</div>
          </a>
          <a
            href={"https://semantle.com/"}
            target={"_blank"}
            rel={"noreferrer"}
            className="todays-semantle archive-puzzle"
          >
            <div className="tile-title">Today's Semantle</div>
            <div className="semantle-footnote">(on semantle.com)</div>
          </a>

          <h1 className="archive-heading">Pimantle archive</h1>
          {filteredPimantles.map((puzzle) => (
            <ArchiveTile
              link={puzzle}
              key={`pimantle-tile-${puzzle.puzzleIndex}`}
            />
          ))}
          {hasActiveArchiveFilter && filteredPimantles.length === 0 && (
            <p className="archive-empty">{emptyMessage("Pimantle")}</p>
          )}
        </div>

        <div className="archive-column">
          <h1 className="archive-heading">Other things</h1>
          <h2 className="archive-subheading">Follow me</h2>
          <div className="social-panel">
            <a
              href="https://youtube.com/pimanrules"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                className="social-button"
                src="/socials/youtube.svg"
                alt="youtube"
              />
            </a>
            <a
              href="https://twitter.com/pimanrules"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                className="social-button"
                src="/socials/twitter.svg"
                alt="twitter"
              />
            </a>
          </div>
          <h2 className="archive-subheading">Source code</h2>
          <div className="social-panel">
            <a
              href="https://github.com/jsettlem/pimantle"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                className="social-button"
                src="/socials/github.svg"
                alt="github"
              />
            </a>
          </div>
          <h2 className="archive-subheading">(Unofficial) Communities</h2>
          <div className="social-panel">
            <a
              href="https://discord.gg/rc5pNWAA7P"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                className="social-button"
                src="/socials/discord.svg"
                alt="discord"
              />
            </a>
            <a
              href="https://reddit.com/r/pimantle"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                className="social-button"
                src="/socials/reddit.svg"
                alt="reddit"
              />
            </a>
          </div>
          <h2 className="archive-subheading">Other games</h2>
          <div className="social-panel">
            <a
              href="http://words.pimanrul.es"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                className="social-button"
                src="/socials/friendle.png"
                alt="friendle"
              />
            </a>
          </div>
          <h2 className="archive-subheading">Support me</h2>
          <iframe
            id="kofiframe"
            src="https://ko-fi.com/pimanrules/?hidefeed=true&widget=true&embed=true&preview=true"
            className="kofi-iframe"
            height="712"
            title="pimanrules"
          ></iframe>
          <h1 className="archive-heading">Semantle archive</h1>
          {filteredSemantles.map((puzzle) => (
            <ArchiveTile
              link={puzzle}
              key={`semantle-tile-${puzzle.puzzleIndex}`}
            />
          ))}
          {hasActiveArchiveFilter && filteredSemantles.length === 0 && (
            <p className="archive-empty">{emptyMessage("Semantle")}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ArchiveDropdown;
