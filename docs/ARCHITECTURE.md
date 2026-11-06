# Pimantle Architecture

## Current application map

The current application is a React/TypeScript client.

| Responsibility | Current location |
|---|---|
| Application initialization and composition | `src/App.tsx` |
| Guess submission, hint flow and guess history | `src/guesses/` |
| Puzzle progress and legacy migration | `src/puzzle/puzzle.component.ts` |
| Puzzle and word data | `src/data/`, `public/secret_words/`, `public/semantle_words/` |
| Interactive graph | `src/plot/` |
| Archive UI | `src/archive/` |
| Victory and result sharing | `src/solved/` |
| Multiplayer client and event types | `src/MultiplayerBackground.tsx`, `src/SocketTypes.ts`, `src/server/` |
| Statistics | `src/stats/` |
| Settings | `src/settings/` |
| Global styling | `src/App.css`, `src/index.css` |

The current repository contains the client-side multiplayer integration; it does not contain the multiplayer server implementation.

## Target responsibility boundaries

The target architecture should separate concerns progressively:

- **Core game:** pure puzzle, scoring, ranking, hint and validation functions.
- **Features:** daily, practice, archive, guesses, map, settings, victory and multiplayer UI.
- **Infrastructure:** browser storage, HTTP/API clients, sockets and analytics.
- **UI system:** reusable controls, dialogs, feedback, tokens and themes.
- **Application shell:** routing, providers and page composition.

This is a destination, not a demand to move all files in one change.

## Data flow

A guess should flow through a predictable pipeline:

```text
Player input
    |
    v
Input normalization and validation
    |
    v
Game/puzzle lookup and scoring
    |
    v
Validated guess result
    |
    +--> Guess history
    +--> Map visualization
    +--> Statistics
    +--> Local progress persistence
    +--> Optional multiplayer event
```

The UI should not independently reimplement ranking rules.

## Protected invariants

Unless a separately reviewed engine/data change is approved:

1. Existing puzzle binary record format stays unchanged.
2. Existing word-list indexes retain their meaning.
3. Rank ordering and similarity values remain unchanged.
4. Existing localStorage keys remain readable.
5. Existing IndexedDB keys/schema remain readable.
6. Existing archive URLs continue to resolve.
7. Multiplayer event names and payload meanings remain compatible.
8. A theme or animation preference cannot influence game results.
9. Optional online features must not block local gameplay.
10. Failed migrations must not delete legacy source records.

## Storage model today

- IndexedDB through localForage stores guess progress.
- localStorage contains legacy progress keys and solved flags.
- Local UI preferences may be stored independently.
- The legacy migration is intentionally repeatable: existing valid IndexedDB records take precedence and legacy keys are not deleted by migration.

Future storage changes need versioned migrations and explicit data-retention rules.

## Puzzle data model today

The repository bundles puzzle binary files and a word list. The client loads a selected puzzle asset and interprets records using the word-list index.

The availability manifest currently describes bundled archive ranges. It is not a live daily schedule and must not be presented as one.

A future puzzle manifest should be versioned and include, at minimum:
- stable puzzle identifier,
- puzzle type and number,
- release timestamp,
- publication status,
- data version,
- asset reference,
- checksum.

The canonical source of daily availability and release time must be defined before implementing the new publishing service.

## External dependencies

- Multiplayer: configurable Socket.IO service; backend not included here.
- Analytics: inherited Google Analytics configuration in the HTML entry point; ownership and privacy configuration require review.
- Fonts and archive support iframe: third-party resources.
- Hosting/deployment: Vercel integration exists, but production settings must be inspected before changing domains or routes.

## Architecture change policy

Prefer extracting pure functions and introducing boundaries around current modules before replacing them. A large structural refactor should follow coverage, not precede it.
