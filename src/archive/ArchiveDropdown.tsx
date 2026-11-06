import React, { useEffect, useRef, useState } from "react";
import ArchiveTile, { ArchiveLink } from "./ArchiveLink";

type ArchiveStatus = "all" | "in-progress" | "solved" | "not-started";

export type ArchiveDropdownProps = {
  isOpen: boolean;
  close: () => void;
  archivePimantles: ArchiveLink[];
  archiveSemantles: ArchiveLink[];
};

const focusableSelector = [
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "a[href]",
  "iframe",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

function ArchiveDropdown({
  isOpen,
  close,
  archivePimantles,
  archiveSemantles,
}: ArchiveDropdownProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const closeCallbackRef = useRef(close);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ArchiveStatus>("all");
  const [showSupportEmbed, setShowSupportEmbed] = useState(false);

  closeCallbackRef.current = close;

  const normalizedSearch = search.trim().toLowerCase().replace(/#/g, "");
  const matchesStatus = (puzzle: ArchiveLink) => {
    switch (statusFilter) {
      case "in-progress":
        return puzzle.started && !puzzle.solved;
      case "solved":
        return puzzle.solved;
      case "not-started":
        return !puzzle.started && !puzzle.solved;
      default:
        return true;
    }
  };

  const filterArchive = (puzzles: ArchiveLink[], type: "pimantle" | "semantle") =>
    puzzles.filter((puzzle) => {
      const label = `${type} ${puzzle.puzzleIndex}`;
      return label.includes(normalizedSearch) && matchesStatus(puzzle);
    });

  const filteredPimantles = filterArchive(archivePimantles, "pimantle");
  const filteredSemantles = filterArchive(archiveSemantles, "semantle");
  const hasActiveArchiveFilter = normalizedSearch.length > 0 || statusFilter !== "all";
  const totalVisible = filteredPimantles.length + filteredSemantles.length;
  const totalAvailable = archivePimantles.length + archiveSemantles.length;

  useEffect(() => {
    const overlay = overlayRef.current;
    const dialog = dialogRef.current;
    if (!overlay || !dialog) return;

    if (!isOpen) {
      overlay.setAttribute("inert", "");
      return;
    }

    overlay.removeAttribute("inert");
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeCallbackRef.current();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(focusableSelector)
      ).filter(
        (element) =>
          element.tabIndex >= 0 &&
          !element.hasAttribute("hidden") &&
          element.getAttribute("aria-hidden") !== "true"
      );

      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
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
      document.body.style.overflow = previousBodyOverflow;
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [isOpen]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  const emptyMessage = (type: "Pimantle" | "Semantle", available: number) => {
    if (available === 0) return `No ${type} archive puzzles are available in this build.`;
    return statusFilter === "all"
      ? `No ${type} puzzles match this search.`
      : `No ${type} puzzles match the selected filters.`;
  };

  return (
    <div
      className={`archive-overlay ${isOpen ? "archive-open" : ""}`}
      aria-hidden={!isOpen}
      ref={overlayRef}
    >
      <button
        type="button"
        className="archive-background"
        onClick={close}
        aria-label="Close archive backdrop"
        tabIndex={-1}
      />

      <section
        className="archive-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="archive-title"
        aria-describedby="archive-description"
        ref={dialogRef}
        tabIndex={-1}
      >
        <header className="archive-topbar">
          <div className="archive-title-group">
            <span className="archive-eyebrow">PIMANTLE / LIBRARY</span>
            <h2 id="archive-title">Explore the archive</h2>
            <p id="archive-description">
              Jump into the current game or revisit a previous puzzle.
            </p>
          </div>
          <button
            type="button"
            className="close-button"
            onClick={close}
            ref={closeButtonRef}
            aria-label="Close archive"
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div className="archive-content-scroll">
          <section className="archive-today-section" aria-labelledby="archive-today-title">
            <div className="archive-section-heading">
              <div>
                <span className="archive-section-kicker">START PLAYING</span>
                <h3 id="archive-today-title">Quick access</h3>
              </div>
              <span className="archive-section-caption">Choose a game</span>
            </div>

            <div className="archive-today-grid">
              <a href="/" className="archive-today-card archive-today-card-primary">
                <span className="archive-today-icon" aria-hidden="true">P</span>
                <span className="archive-today-copy">
                  <strong>Open Pimantle</strong>
                  <small>Play the in-app puzzle</small>
                </span>
                <span className="archive-card-arrow" aria-hidden="true">↗</span>
              </a>
              <a
                href="https://semantle.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="archive-today-card"
              >
                <span className="archive-today-icon archive-today-icon-alt" aria-hidden="true">S</span>
                <span className="archive-today-copy">
                  <strong>Open Semantle</strong>
                  <small>Continue on semantle.com</small>
                </span>
                <span className="archive-card-arrow" aria-hidden="true">↗</span>
              </a>
            </div>
          </section>

          <section className="archive-browser" aria-label="Browse archived puzzles">
            <div className="archive-browser-heading">
              <div>
                <span className="archive-section-kicker">YOUR PUZZLE LIBRARY</span>
                <h3>Past puzzles</h3>
              </div>
              <span className="archive-results-count" aria-live="polite">
                {hasActiveArchiveFilter
                  ? `${totalVisible} of ${totalAvailable} shown`
                  : `${totalAvailable} available`}
              </span>
            </div>

            <div className="archive-toolbar">
              <div className="archive-search-wrap">
                <span className="archive-search-icon" aria-hidden="true">⌕</span>
                <label className="visually-hidden" htmlFor="archive-search">
                  Search archived puzzles
                </label>
                <input
                  id="archive-search"
                  className="archive-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by game or puzzle number"
                  autoComplete="off"
                />
                {search.length > 0 && (
                  <button
                    type="button"
                    className="archive-search-clear"
                    onClick={() => setSearch("")}
                    aria-label="Clear archive search"
                  >
                    ×
                  </button>
                )}
              </div>

              <label className="visually-hidden" htmlFor="archive-status-filter">
                Filter archive by progress
              </label>
              <select
                id="archive-status-filter"
                className="archive-status-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as ArchiveStatus)}
              >
                <option value="all">All progress</option>
                <option value="in-progress">In progress</option>
                <option value="solved">Solved</option>
                <option value="not-started">Not started</option>
              </select>

              {hasActiveArchiveFilter && (
                <button
                  type="button"
                  className="archive-clear-filters"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="archive-grid">
              <section className="archive-section" aria-labelledby="pimantle-archive-title">
                <div className="archive-section-heading archive-list-heading">
                  <h4 id="pimantle-archive-title">Pimantle</h4>
                  <span>{filteredPimantles.length}</span>
                </div>
                <div className="archive-list" aria-label="Pimantle archived puzzles">
                  {filteredPimantles.length > 0 ? (
                    filteredPimantles.map((puzzle) => (
                      <ArchiveTile
                        link={puzzle}
                        key={`pimantle-tile-${puzzle.puzzleIndex}`}
                      />
                    ))
                  ) : (
                    <p className="archive-empty">{emptyMessage("Pimantle", archivePimantles.length)}</p>
                  )}
                </div>
              </section>

              <section className="archive-section" aria-labelledby="semantle-archive-title">
                <div className="archive-section-heading archive-list-heading">
                  <h4 id="semantle-archive-title">Semantle</h4>
                  <span>{filteredSemantles.length}</span>
                </div>
                <div className="archive-list" aria-label="Semantle archived puzzles">
                  {filteredSemantles.length > 0 ? (
                    filteredSemantles.map((puzzle) => (
                      <ArchiveTile
                        link={puzzle}
                        key={`semantle-tile-${puzzle.puzzleIndex}`}
                      />
                    ))
                  ) : (
                    <p className="archive-empty">{emptyMessage("Semantle", archiveSemantles.length)}</p>
                  )}
                </div>
              </section>
            </div>
          </section>

          <section className="archive-resources" aria-labelledby="archive-resources-title">
            <div className="archive-resource-intro">
              <span className="archive-section-kicker">AROUND THE COMMUNITY</span>
              <h3 id="archive-resources-title">More from Pimantle</h3>
            </div>
            <div className="archive-resource-links">
              <a href="https://youtube.com/pimanrules" target="_blank" rel="noopener noreferrer">YouTube <span aria-hidden="true">↗</span></a>
              <a href="https://twitter.com/pimanrules" target="_blank" rel="noopener noreferrer">X / Twitter <span aria-hidden="true">↗</span></a>
              <a href="https://github.com/64r3al/pimantle1" target="_blank" rel="noopener noreferrer">Source code <span aria-hidden="true">↗</span></a>
              <a href="https://discord.gg/rc5pNWAA7P" target="_blank" rel="noopener noreferrer">Discord <span aria-hidden="true">↗</span></a>
              <a href="https://reddit.com/r/pimantle" target="_blank" rel="noopener noreferrer">Reddit <span aria-hidden="true">↗</span></a>
              <a href="https://words.pimanrul.es" target="_blank" rel="noopener noreferrer">Friendle <span aria-hidden="true">↗</span></a>
            </div>
          </section>

          <section className="archive-support" aria-labelledby="archive-support-title">
            <div className="archive-support-copy">
              <span className="archive-section-kicker">KEEP THE PROJECT GOING</span>
              <h3 id="archive-support-title">Enjoying Pimantle?</h3>
              <p>Support the original project and help keep the game available.</p>
            </div>
            <button
              type="button"
              className="archive-support-toggle"
              onClick={() => setShowSupportEmbed((visible) => !visible)}
              aria-expanded={showSupportEmbed}
              aria-controls="archive-support-embed"
            >
              {showSupportEmbed ? "Hide support options" : "Support on Ko-fi"}
              <span aria-hidden="true">{showSupportEmbed ? "−" : "↗"}</span>
            </button>
            {showSupportEmbed && (
              <iframe
                id="archive-support-embed"
                src="https://ko-fi.com/pimanrules/?hidefeed=true&widget=true&embed=true"
                className="kofi-iframe archive-support-iframe"
                title="Support Pimantle on Ko-fi"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

export default ArchiveDropdown;
