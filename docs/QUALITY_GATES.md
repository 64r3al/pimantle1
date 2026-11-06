# Pimantle Quality Gates

## Required checks for every pull request

1. Locked dependency installation: `npm ci`
2. Automated tests: `npm test -- --watchAll=false`
3. Production build: `npm run build`
4. Review the diff for unintended changes to puzzle data, scoring, save keys and configuration.
5. Verify that any changed player-facing behavior has a corresponding test or a documented manual test.

The repository currently uses Create React App scripts. Dedicated type-check and lint scripts can be introduced after the build-system baseline is understood.

## Core invariants that need regression coverage

### Puzzle data and scoring
- Binary record size and endianness are validated.
- Word-list indexes resolve to valid records.
- Parsed record order and rank remain stable.
- Similarity values remain consistent.
- Malformed or missing puzzle data produces a recoverable error state.

### Guessing and hints
- Input is normalized consistently.
- Unknown words do not change the guess list.
- Duplicate guesses do not increment the count.
- Guess ordering remains correct in both display modes.
- Hint selection remains within the parsed dataset.
- Hints do not create duplicate guesses.
- Solving ends further guess submission.

### Progress and migration
- Saves survive a page refresh.
- Existing valid IndexedDB records take precedence over legacy localStorage.
- Pimantle migration covers every index declared by the availability manifest.
- Semantle migration covers every index declared by the availability manifest.
- A malformed legacy record does not prevent other valid records from migrating.
- A failed migration leaves original legacy data intact.
- Re-running migration is idempotent.

### Archive and release handling
- Only bundled archive entries are offered.
- Archive links resolve to the intended puzzle.
- Unavailable daily data is communicated honestly.
- The countdown corresponds to an authoritative release schedule, not a stale archive fallback.

### Multiplayer
- Offline gameplay remains available when the socket is unavailable.
- Disconnect and reconnect states are accurate.
- Incoming events are runtime-validated before use.
- Socket listeners are removed during cleanup.

### Accessibility and visual behavior
- Dialogs have accessible names.
- Keyboard focus is moved into and restored from dialogs.
- Escape closes dismissible dialogs.
- Focus cannot escape modal dialogs while open.
- Controls have accessible names and visible focus.
- Reduced-motion preferences are honored.
- Critical guess meaning is not conveyed by color alone.

## Manual browser matrix

At minimum, test:
- 320px mobile,
- 360px mobile,
- 390px mobile,
- 430px mobile,
- 768px tablet,
- 1024px desktop,
- 1440px desktop,
- 1920px desktop.

Also verify portrait/landscape, keyboard-only navigation, reduced motion, theme variants, puzzle loading failure, and slow/offline network behavior.

## Performance targets

Use the Core Web Vitals "good" thresholds as initial targets at the 75th percentile:
- LCP: 2.5 seconds or less.
- INP: 200 milliseconds or less.
- CLS: 0.1 or less.

Set JavaScript, asset and memory budgets only after the current app has been measured.

## Release gate

Do not merge a release candidate if:
- CI is failing or skipped,
- scoring/ranking regression tests fail,
- a storage migration can delete or overwrite valid player data,
- daily release information is inaccurate,
- production environment variables are unverified,
- a critical viewport or accessibility flow is broken,
- rollback is not available.

A successful build is necessary, not sufficient.
